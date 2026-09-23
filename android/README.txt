DUET ANDROID KEYBOARD

Build
  cd android
  ./gradlew assembleDebug

The installable APK is:
  app/build/outputs/apk/debug/app-debug.apk

Install
  adb install -r app/build/outputs/apk/debug/app-debug.apk

On the phone
  1. Open Duet Keyboard
  2. Tap Enable Duet Keyboard and turn the Duet switch on
  3. Tap Choose Duet as keyboard (or the keyboard icon in any text field)
  4. Flick both thumbs, then lift to write

This is a native InputMethodService. The web lab remains the design and
practice surface; this module is the phone-testable keyboard.

The previous Duet-debug.apk in the repo root was truncated (~21 KB of a zip)
so Android rejected it as a corrupt package. This Gradle project now produces
a complete, debug-signed APK.
