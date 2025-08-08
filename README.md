# Smarty (Cordova)

This project packages the Smarty web app as a true Android app with background timers/alarms using **local notifications**.

## Build (one-time setup)
1. Install Node.js, Java JDK 11+, and Android Studio (SDK + platform tools).
2. `npm i -g cordova`
3. In this folder: `npm i`
4. Add Android platform: `cordova platform add android`
5. Fetch plugins (already declared in `config.xml`): `cordova prepare`

## Build APK
- Debug: `cordova build android`
- The APK/AAB will be under `platforms/android/`

## How it works
- When you set a timer or add an alarm, the app schedules a **local notification** for the exact trigger time. Android will deliver it even if the app is in background or killed.
- Foreground chime sound continues to work when the app is open.
