package __PACKAGE__

import android.app.Activity
import android.app.Notification
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneOffset
import java.time.LocalDate
import java.util.PriorityQueue
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** Read-only extraction of the previous BugBaas Health Connect adapter.
 * No raw records leave this module and it never creates GPS fixes or rewards.
 */
class BugBaasAdventureSyncModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val requestCode = 43026
  private val permissions = setOf(HealthPermission.getReadPermission(StepsRecord::class), HealthPermission.getReadPermission(DistanceRecord::class))
  private val permissionContract = PermissionController.createRequestPermissionResultContract()
  @Volatile private var permissionPromise: Promise? = null
  private val listener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, code: Int, resultCode: Int, data: Intent?) {
      if (code != requestCode) return
      val waiting = permissionPromise ?: return
      permissionPromise = null
      try { waiting.resolve(permissionContract.parseResult(resultCode, data).containsAll(permissions)) }
      catch (_: Exception) { waiting.resolve(false) }
    }
  }
  init { context.addActivityEventListener(listener) }
  override fun getName() = "BugBaasAdventureSync"
  override fun invalidate() {
    context.removeActivityEventListener(listener)
    permissionPromise?.resolve(false); permissionPromise = null
    scope.cancel(); super.invalidate()
  }
  private fun available() = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
  private fun unavailable(reason: String): WritableMap = Arguments.createMap().apply { putBoolean("available", false); putString("reason", reason) }

  /** Update only our existing location notification; never start or restart GPS. */
  @ReactMethod
  fun updateAutoCatchNotification(text: String, promise: Promise) {
    context.runOnUiQueueThread {
      try {
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager == null) { promise.resolve(false); return@runOnUiQueueThread }
        val active = manager.activeNotifications.filter {
          it.packageName == context.packageName &&
            it.notification.channelId?.endsWith(":bugbaas-autocatch-location-v1") == true &&
            (it.notification.flags and Notification.FLAG_FOREGROUND_SERVICE) != 0
        }
        for (entry in active) {
          val updated = Notification.Builder.recoverBuilder(context, entry.notification)
            .setContentTitle(text.take(80)).setContentText(null).setStyle(null)
            .setShowWhen(false).setOnlyAlertOnce(true).build()
          manager.notify(entry.tag, entry.id, updated)
        }
        promise.resolve(active.isNotEmpty())
      } catch (_: Exception) { promise.resolve(false) }
    }
  }

  @ReactMethod
  fun requestPermissions(promise: Promise) {
    if (!available()) { promise.resolve(false); return }
    scope.launch {
      try {
        val client = HealthConnectClient.getOrCreate(context)
        if (client.permissionController.getGrantedPermissions().containsAll(permissions)) { promise.resolve(true); return@launch }
        context.runOnUiQueueThread {
          val activity = context.currentActivity
          if (activity == null || permissionPromise != null) { promise.resolve(false); return@runOnUiQueueThread }
          try {
            permissionPromise = promise
            if (Build.VERSION.SDK_INT >= 34) {
              val permissionActivity = activity as? PermissionAwareActivity ?: throw IllegalStateException("Activity cannot request health permissions")
              permissionActivity.requestPermissions(permissions.toTypedArray(), requestCode, PermissionListener { code, requested, grants ->
                if (code != requestCode) false else {
                  val waiting = permissionPromise; permissionPromise = null
                  waiting?.resolve(permissions.all { permission ->
                    val index = requested.indexOf(permission)
                    index >= 0 && grants.getOrNull(index) == PackageManager.PERMISSION_GRANTED
                  })
                  true
                }
              })
            } else activity.startActivityForResult(permissionContract.createIntent(context, permissions), requestCode)
          } catch (_: Exception) { permissionPromise = null; promise.resolve(false) }
        }
      } catch (_: Exception) { promise.resolve(false) }
    }
  }

  @ReactMethod
  fun readSnapshot(promise: Promise) { readDays(0.0, promise) }

  @ReactMethod
  fun readSnapshots(since: Double, promise: Promise) { readDays(since, promise) }

  private fun readDays(since: Double, promise: Promise) {
    if (!available()) { promise.resolve(unavailable("unavailable")); return }
    scope.launch {
      try {
        val client = HealthConnectClient.getOrCreate(context)
        if (!client.permissionController.getGrantedPermissions().containsAll(permissions)) { promise.resolve(unavailable("permission")); return@launch }
        val end = Instant.now()
        val today = end.atOffset(ZoneOffset.UTC).toLocalDate()
        // One look-back day catches late provider uploads; never read pre-link history on first connect.
        var date = if (since.isFinite() && since > 0) Instant.ofEpochMilli(since.toLong()).atOffset(ZoneOffset.UTC).toLocalDate().minusDays(1).coerceAtLeast(today.minusDays(30)).coerceAtMost(today) else today
        val snapshots = Arguments.createArray(); var latest: DaySnapshot? = null
        while (!date.isAfter(today)) {
          // Default permission covers the last 30 * 24 hours, not an earlier UTC midnight.
          val start = maxOf(date.atStartOfDay().toInstant(ZoneOffset.UTC), end.minusSeconds(30L * 86400))
          val stop = if (date == today) end else date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
          latest = readDay(client, date, start, stop)
          snapshots.pushMap(latest.toMap(end)); date = date.plusDays(1)
        }
        promise.resolve(Arguments.createMap().apply { putBoolean("available", true); putMap("snapshot", latest!!.toMap(end)); putArray("snapshots", snapshots) })
      } catch (_: SecurityException) { promise.resolve(unavailable("permission")) }
      catch (_: Exception) { promise.resolve(unavailable("error")) }
    }
  }

  private data class DaySnapshot(val day: LocalDate, val steps: Long, val meters: Double, val measured: Boolean) {
    fun toMap(at: Instant): WritableMap = Arguments.createMap().apply {
      putString("dayUTC", day.toString()); putString("source", "health-connect"); putString("distanceBasis", if (measured) "measured" else "steps")
      putDouble("capturedAt", at.toEpochMilli().toDouble()); putDouble("steps", steps.toDouble()); putDouble("meters", meters)
    }
  }

  private suspend fun readDay(client: HealthConnectClient, date: LocalDate, start: Instant, end: Instant): DaySnapshot {
    val stepRows = readSteps(client, start, end).distinctBy { it.metadata.id }
    val distanceRows = readDistances(client, start, end).distinctBy { it.metadata.id }
    val steps = stepRows.filter { it.metadata.recordingMethod != Metadata.RECORDING_METHOD_MANUAL_ENTRY }
    val distances = distanceRows.filter { it.metadata.recordingMethod != Metadata.RECORDING_METHOD_MANUAL_ENTRY }
    // Health Connect applies the user's phone/watch/Fit priority and overlap deduplication.
    val total = client.aggregate(AggregateRequest(metrics = setOf(StepsRecord.COUNT_TOTAL, DistanceRecord.DISTANCE_TOTAL), timeRangeFilter = TimeRangeFilter.between(start, end)))
    val count = floor(if (steps.size == stepRows.size) (total[StepsRecord.COUNT_TOTAL] ?: 0L).toDouble() else conservativeTotal(steps.map { Window(it.startTime.toEpochMilli(), it.endTime.toEpochMilli(), it.count.toDouble()) }, start.toEpochMilli(), end.toEpochMilli())).toLong().coerceAtLeast(0)
    // Manual entries must never create game rewards, even on a source that also writes automatic data.
    val distance = if (distances.size == distanceRows.size) total[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0 else conservativeTotal(distances.map { Window(it.startTime.toEpochMilli(), it.endTime.toEpochMilli(), it.distance.inMeters) }, start.toEpochMilli(), end.toEpochMilli())
    val measured = distances.isNotEmpty()
    // Prefer real provider kilometres. A stride estimate is only a labelled fallback when no distance exists.
    val meters = floor(if (measured) min(distance, count * 1.15) else count * 0.72).coerceAtLeast(0.0)
    return DaySnapshot(date, count, meters, measured)
  }

  private suspend fun readSteps(client: HealthConnectClient, start: Instant, end: Instant): List<StepsRecord> {
    val rows = mutableListOf<StepsRecord>(); var token: String? = null
    do {
      val page = client.readRecords(ReadRecordsRequest(StepsRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end), pageSize = 1000, pageToken = token))
      rows.addAll(page.records); token = page.pageToken
      check(rows.size <= 30000) { "Too many daily health records" }
    } while (!token.isNullOrEmpty())
    return rows
  }
  private suspend fun readDistances(client: HealthConnectClient, start: Instant, end: Instant): List<DistanceRecord> {
    val rows = mutableListOf<DistanceRecord>(); var token: String? = null
    do {
      val page = client.readRecords(ReadRecordsRequest(DistanceRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end), pageSize = 1000, pageToken = token))
      rows.addAll(page.records); token = page.pageToken
      check(rows.size <= 30000) { "Too many daily health records" }
    } while (!token.isNullOrEmpty())
    return rows
  }
  private data class Window(val start: Long, val end: Long, val value: Double)
  private data class Rate(val start: Long, val end: Long, val value: Double)
  /** Integrate the largest density in overlapping records, not their sum. */
  private fun conservativeTotal(input: List<Window>, start: Long, end: Long): Double {
    val rows = input.filter { it.end > it.start && it.value.isFinite() && it.value >= 0 && it.end > start && it.start < end }.map {
      Rate(max(start, it.start), min(end, it.end), it.value / (it.end - it.start))
    }.sortedBy { it.start }
    if (rows.isEmpty()) return 0.0
    val bounds = rows.flatMap { listOf(it.start, it.end) }.distinct().sorted()
    val active = PriorityQueue<Rate>(compareByDescending<Rate> { it.value })
    var index = 0; var total = 0.0
    for (i in 0 until bounds.lastIndex) {
      val at = bounds[i]
      while (index < rows.size && rows[index].start <= at) { active.add(rows[index]); index++ }
      while (active.peek()?.let { it.end <= at } == true) active.poll()
      total += (active.peek()?.value ?: 0.0) * (bounds[i + 1] - at)
    }
    return total
  }
}
