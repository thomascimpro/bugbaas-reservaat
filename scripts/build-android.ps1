param(
    [Parameter(Mandatory=$true)][string]$ApiUrl,
    [Parameter(Mandatory=$true)][string]$SigningJson,
    [string]$BuildRoot = (Join-Path $env:USERPROFILE 'bb'),
    [string]$OutputApk = ''
)
$ErrorActionPreference='Stop'
$sourceRoot=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (!$OutputApk) {
    $version=(Get-Content -LiteralPath (Join-Path $sourceRoot 'app.json') -Raw | ConvertFrom-Json).expo.version
    $OutputApk=Join-Path $sourceRoot "..\BugBaas-Reservaat-$version.apk"
}
$apiEndpoint = $null
if (![Uri]::TryCreate($ApiUrl, [UriKind]::Absolute, [ref]$apiEndpoint) -or
    $apiEndpoint.Scheme -ne 'https' -or !$apiEndpoint.Host -or $apiEndpoint.UserInfo -or
    $apiEndpoint.AbsolutePath -ne '/' -or $apiEndpoint.Query -or $apiEndpoint.Fragment) {
    throw 'A root HTTPS game server URL without credentials, query or fragment is required for a release APK.'
}
$ApiUrl = $apiEndpoint.GetLeftPart([UriPartial]::Authority)
try {
    $gameInfo = Invoke-RestMethod -Uri "$ApiUrl/api/game/info" -TimeoutSec 15 -ErrorAction Stop
} catch {
    throw 'The HTTPS game server could not be checked. No APK was built.'
}
if ($gameInfo.rules -ne 'bugbaas-field-league-1') {
    throw 'The game server uses an incompatible ruleset. Expected bugbaas-field-league-1; no APK was built.'
}
$signing=Get-Content -LiteralPath $SigningJson -Raw | ConvertFrom-Json
if (!(Test-Path -LiteralPath $signing.path)) { throw 'Release keystore is missing.' }
$buildPath=[IO.Path]::GetFullPath($BuildRoot)
$marker=Join-Path $buildPath '.bugbaas-build.json'
if (Test-Path -LiteralPath $buildPath) {
    if (!(Test-Path -LiteralPath $marker) -or (Get-Content -LiteralPath $marker -Raw | ConvertFrom-Json).source -ne $sourceRoot) { throw 'Build directory is not owned by this app.' }
} else {
    New-Item -ItemType Directory -Path $buildPath | Out-Null
    @{source=$sourceRoot} | ConvertTo-Json | Set-Content -LiteralPath $marker
}
foreach ($name in @('App.tsx','package.json','package-lock.json','app.json','tsconfig.json','babel.config.js','google-services.json')) { Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination $buildPath -Force }
foreach ($name in @('assets','game','src','plugins')) { Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination $buildPath -Recurse -Force }
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$javaTemp=Join-Path $env:USERPROFILE '.codex\bugbaas-javatmp'
New-Item -ItemType Directory -Path $javaTemp -Force | Out-Null
$env:JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=$javaTemp"
$env:NODE_ENV='production'
$env:EXPO_PUBLIC_GAME_API_URL=$ApiUrl.TrimEnd('/')
$env:BUGBAAS_KEYSTORE_PATH=$signing.path
$env:BUGBAAS_KEYSTORE_PASSWORD=$signing.password
$env:BUGBAAS_KEY_ALIAS=$signing.alias
$env:BUGBAAS_KEY_PASSWORD=$signing.password
Push-Location $buildPath
try {
    npm install --ignore-scripts --no-audit --no-fund --prefer-offline
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    npm run android:prepare
    if ($LASTEXITCODE -ne 0) { throw 'Android generation failed.' }
    Push-Location android
    try {
        # Gradle retains removed Metro resources and does not track EXPO_PUBLIC_*
        # changes. Clean only these owned, generated outputs before rebundling.
        $generatedRoot=[IO.Path]::GetFullPath((Join-Path $buildPath 'android\app\build\generated'))
        foreach ($relative in @('assets\createBundleReleaseJsAndAssets','res\createBundleReleaseJsAndAssets')) {
            $generatedOutput=[IO.Path]::GetFullPath((Join-Path $generatedRoot $relative))
            if (!$generatedOutput.StartsWith($generatedRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Generated cleanup escaped the build directory.' }
            if (Test-Path -LiteralPath $generatedOutput) {
                $ancestor=Get-Item -LiteralPath $generatedOutput
                while ($ancestor -and $ancestor.FullName -ne $buildPath) {
                    if ($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Generated cleanup cannot follow a directory link.' }
                    $ancestor=$ancestor.Parent
                }
                if (!$ancestor) { throw 'Generated cleanup has no owned build parent.' }
                Remove-Item -LiteralPath $generatedOutput -Recurse -Force
            }
        }
        .\gradlew.bat :app:assembleRelease --no-daemon --max-workers=2 '-PreactNativeArchitectures=arm64-v8a,x86_64'
        if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
        $archive=[IO.Compression.ZipFile]::OpenRead((Join-Path $buildPath 'android\app\build\outputs\apk\release\app-release.apk'))
        try {
            $entry=$archive.GetEntry('assets/index.android.bundle')
            if (!$entry) { throw 'The release APK has no game bundle.' }
            $reader=[IO.StreamReader]::new($entry.Open(),[Text.Encoding]::UTF8)
            try { $bundledText=$reader.ReadToEnd() } finally { $reader.Dispose() }
            if (!$bundledText.Contains($ApiUrl)) { throw 'The APK does not contain the checked server URL. No release artifact was copied.' }
        } finally { $archive.Dispose() }
        Copy-Item -LiteralPath 'app\build\outputs\apk\release\app-release.apk' -Destination $OutputApk -Force
        Get-FileHash -LiteralPath $OutputApk -Algorithm SHA256
    } finally { Pop-Location }
} finally {
    Pop-Location
    foreach ($name in @('BUGBAAS_KEYSTORE_PATH','BUGBAAS_KEYSTORE_PASSWORD','BUGBAAS_KEY_ALIAS','BUGBAAS_KEY_PASSWORD')) { [Environment]::SetEnvironmentVariable($name,$null,'Process') }
}
