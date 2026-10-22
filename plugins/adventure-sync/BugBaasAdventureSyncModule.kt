package __PACKAGE__

import android.app.Activity
import android.content.Intent
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneOffset
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
            activity.startActivityForResult(permissionContract.createIntent(context, permissions), requestCode)
          } catch (_: Exception) { permissionPromise = null; promise.resolve(false) }
        }
      } catch (_: Exception) { promise.resolve(false) }
    }
  }

  @ReactMethod
  fun readSnapshot(promise: Promise) {
    if (!available()) { promise.resolve(unavailable("unavailable")); return }
    scope.launch {
      try {
        val client = HealthConnectClient.getOrCreate(context)
        if (!client.permissionController.getGrantedPermissions().containsAll(permissions)) { promise.resolve(unavailable("permission")); return@launch }
        val end = Instant.now()
        val day = end.atOffset(ZoneOffset.UTC).toLocalDate()
        val start = day.atStartOfDay().toInstant(ZoneOffset.UTC)
        val steps = readSteps(client, start, end).filter { it.metadata.recordingMethod != Metadata.RECORDING_METHOD_MANUAL_ENTRY }.distinctBy { it.metadata.id }
        val byOrigin = steps.groupBy { it.metadata.dataOrigin.packageName }.mapValues { (_, records) ->
          conservativeTotal(records.map { Window(it.startTime.toEpochMilli(), it.endTime.toEpochMilli(), it.count.toDouble()) }, start.toEpochMilli(), end.toEpochMilli())
        }
        // Never add a phone, watch and Google Fit copy of the same steps together.
        val origin = byOrigin.maxByOrNull { it.value }?.key
        val count = floor(origin?.let { byOrigin[it] } ?: 0.0).toLong().coerceAtLeast(0)
        val distances = if (count > 0) readDistances(client, start, end).filter { it.metadata.recordingMethod != Metadata.RECORDING_METHOD_MANUAL_ENTRY && it.metadata.dataOrigin.packageName == origin }.distinctBy { it.metadata.id } else emptyList()
        val distance = conservativeTotal(distances.map { Window(it.startTime.toEpochMilli(), it.endTime.toEpochMilli(), it.distance.inMeters) }, start.toEpochMilli(), end.toEpochMilli())
        // Conservative, step-backed estimate inherited from the original app.
        // Cycling/car distance alone can never create walking progress.
        val meters = floor(max(count * 0.72, min(distance, count * 1.15))).coerceAtLeast(0.0)
        val snapshot = Arguments.createMap().apply {
          putString("dayUTC", day.toString()); putString("source", "health-connect")
          putDouble("capturedAt", end.toEpochMilli().toDouble()); putDouble("steps", count.toDouble()); putDouble("meters", meters)
        }
        promise.resolve(Arguments.createMap().apply { putBoolean("available", true); putMap("snapshot", snapshot) })
      } catch (_: SecurityException) { promise.resolve(unavailable("permission")) }
      catch (_: Exception) { promise.resolve(unavailable("error")) }
    }
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
