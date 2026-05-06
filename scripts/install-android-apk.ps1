$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$adb = Join-Path $root ".tooling\android-sdk\platform-tools\adb.exe"
$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $adb)) {
  throw "adb was not found. Run .\scripts\setup-android-tooling.ps1 first."
}

if (-not (Test-Path $apk)) {
  throw "APK was not found. Build the APK first."
}

$deviceLines = (& $adb devices) | Where-Object { $_ -match "device$" }
if (-not $deviceLines) {
  throw "No Android device was detected. Connect the phone, approve USB debugging, then rerun this script."
}

& $adb install -r $apk
