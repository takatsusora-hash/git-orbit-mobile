$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = Join-Path $root ".tooling\jdk\jdk-17.0.19+10\bin\java.exe"
$jdkHome = Join-Path $root ".tooling\jdk\jdk-17.0.19+10"
$androidSdk = Join-Path $root ".tooling\android-sdk"
$gradle = Join-Path $root ".tooling\gradle\gradle-8.7\bin\gradle.bat"
$runtimeNode = "C:\Users\it11ataniguchi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not (Test-Path $runtimeNode)) {
  throw "Bundled node runtime was not found: $runtimeNode"
}

if (-not (Test-Path $gradle)) {
  throw "Gradle tooling was not found. Set up .tooling first."
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = (Join-Path $root "tools") + ";C:\Program Files\GitHub CLI;C:\Program Files\Git\cmd;" + $env:Path

Push-Location $root
try {
  & $runtimeNode "scripts\build-android-assets.mjs"
  & $gradle -p ".\android" assembleDebug
} finally {
  Pop-Location
}
