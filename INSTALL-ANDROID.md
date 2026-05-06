# Android Install

## First-Time Setup

Prepare the local Android toolchain once:

```powershell
.\scripts\setup-android-tooling.ps1
```

## Build APK

```powershell
.\scripts\build-android-apk.ps1
```

APK output:

- [app-debug.apk](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/android/app/build/outputs/apk/debug/app-debug.apk)

## Install To Your Phone

### Method 1: Direct APK Install

1. Build the APK.
2. Copy [app-debug.apk](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/android/app/build/outputs/apk/debug/app-debug.apk) to your phone.
3. On Android, allow installs from the app you used to open the file.
4. Open the APK on the phone and install it.

### Method 2: USB Install With ADB

1. On Android, enable Developer Options.
2. Enable USB debugging.
3. Connect the phone by USB.
4. Approve the debugging prompt on the phone.
5. Run:

```powershell
.\scripts\install-android-apk.ps1
```

## Add Future Systems

Register another system without editing code manually:

```powershell
.\scripts\register-system.ps1 `
  --name "Example System" `
  --owner takatsusora-hash `
  --repos git-orbit-mobile,genesis-core_v1 `
  --tags "live,mapped" `
  --summary "Example summary"
```

If the system needs a hand-authored module map, start from:

- [system-template.yml](C:/Users/it11ataniguchi/Documents/New%20project/git-orbit-mobile/config/systems/system-template.yml)

Then rebuild the APK again:

```powershell
.\scripts\setup-android-tooling.ps1
.\scripts\build-android-apk.ps1
```
