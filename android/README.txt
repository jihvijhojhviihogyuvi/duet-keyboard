DUET ANDROID KEYBOARD

Open this android/ folder in Android Studio.
Run: ./gradlew assembleDebug
Install: adb install app/build/outputs/apk/debug/app-debug.apk

On the phone, open Duet Keyboard and tap Enable Duet Keyboard. Then choose Duet from the keyboard picker in any text field.

This is a native InputMethodService prototype. The web lab remains the design and practice surface; this module is the phone-testable keyboard.
