# Duet Keyboard

A keyless Android keyboard. Flick both thumbs, then lift to write one exact character or letter pair. No dictionary. No guessing.

## Install the APK

Download **[Duet-0.2.0-debug.apk](https://github.com/jihvijhojhviihogyuvi/duet-keyboard/releases/latest)** (debug-signed).

1. On your phone, allow install from this source if Android asks.
2. Open **Duet Keyboard**.
3. Tap **Enable Duet Keyboard** and turn the Duet switch on. Android will warn that this is an input method — that is expected.
4. Tap **Choose Duet as keyboard**, or pick Duet from the keyboard icon in any text field.
5. Flick both thumbs, then lift to write.

Duet never uses the network. It only sends the characters you play into the focused field.

### Why the old APK would not install

`Duet-debug.apk` in the repo was a **truncated zip** (~21 KB of a corrupt archive). Android rejected it as a damaged package. This project now builds a complete, v2-signed APK with Gradle.

## Build from source

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Requires JDK 17 and Android SDK 34. The web lab in this repo is the design and practice surface; `android/` is the phone-testable InputMethodService.
