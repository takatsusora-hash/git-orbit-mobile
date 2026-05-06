$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$toolingRoot = Join-Path $root ".tooling"
$downloadsRoot = Join-Path $toolingRoot "downloads"
$jdkRoot = Join-Path $toolingRoot "jdk"
$gradleRoot = Join-Path $toolingRoot "gradle"
$androidSdk = Join-Path $toolingRoot "android-sdk"
$cmdlineToolsRoot = Join-Path $androidSdk "cmdline-tools"
$cmdlineLatest = Join-Path $cmdlineToolsRoot "latest"

$jdkVersion = "jdk-17.0.19+10"
$gradleVersion = "gradle-8.7"
$androidBuildTools = "35.0.0"
$androidPlatform = "android-35"

$jdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.19%2B10/OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip"
$gradleUrl = "https://services.gradle.org/distributions/gradle-8.7-bin.zip"
$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"

function Ensure-Directory($path) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

function Download-File($url, $destination) {
  if (Test-Path $destination) {
    return
  }

  Invoke-WebRequest -Uri $url -OutFile $destination
}

function Expand-Zip($archive, $destination) {
  if (Test-Path $destination) {
    return
  }

  Ensure-Directory $destination
  Expand-Archive -Path $archive -DestinationPath $destination -Force
}

Ensure-Directory $toolingRoot
Ensure-Directory $downloadsRoot
Ensure-Directory $jdkRoot
Ensure-Directory $gradleRoot
Ensure-Directory $androidSdk

$jdkArchive = Join-Path $downloadsRoot "OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip"
$gradleArchive = Join-Path $downloadsRoot "gradle-8.7-bin.zip"
$cmdlineArchive = Join-Path $downloadsRoot "commandlinetools-win.zip"
$cmdlineExtract = Join-Path $downloadsRoot "cmdline-tools-extract"

Download-File $jdkUrl $jdkArchive
Download-File $gradleUrl $gradleArchive
Download-File $cmdlineToolsUrl $cmdlineArchive

Expand-Zip $jdkArchive $jdkRoot
Expand-Zip $gradleArchive $gradleRoot

if (-not (Test-Path $cmdlineLatest)) {
  if (Test-Path $cmdlineExtract) {
    Remove-Item -Recurse -Force $cmdlineExtract
  }

  Expand-Archive -Path $cmdlineArchive -DestinationPath $cmdlineExtract -Force
  Ensure-Directory $cmdlineToolsRoot
  Move-Item -Path (Join-Path $cmdlineExtract "cmdline-tools") -Destination $cmdlineLatest
}

$javaHome = Join-Path $jdkRoot $jdkVersion
$gradleBin = Join-Path $gradleRoot "$gradleVersion\bin\gradle.bat"
$sdkManager = Join-Path $cmdlineLatest "bin\sdkmanager.bat"

if (-not (Test-Path $javaHome)) {
  throw "JDK extraction failed: $javaHome"
}

if (-not (Test-Path $gradleBin)) {
  throw "Gradle extraction failed: $gradleBin"
}

if (-not (Test-Path $sdkManager)) {
  throw "Android cmdline-tools extraction failed: $sdkManager"
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$($cmdlineLatest)\bin;$androidSdk\platform-tools;$javaHome\bin;$env:Path"

$licenseInput = ((1..40) | ForEach-Object { "y" }) -join [Environment]::NewLine
$licenseInput | & $sdkManager --sdk_root=$androidSdk --licenses | Out-Null
& $sdkManager --sdk_root=$androidSdk "platform-tools" "platforms;$androidPlatform" "build-tools;$androidBuildTools"

Write-Host "Android tooling is ready."
Write-Host "JAVA_HOME=$javaHome"
Write-Host "ANDROID_SDK_ROOT=$androidSdk"
