# Duet Keyboard

A keyless Android keyboard. Flick or tap both pads, then lift to write one exact character or letter pair.

## Install

Download **[Duet-0.3.0-debug.apk](https://github.com/jihvijhojhviihogyuvi/duet-keyboard/releases/latest)**.

1. Install the APK (allow this source if Android asks).
2. Open **Duet Keyboard** → **Enable Duet Keyboard**.
3. Choose Duet from the keyboard picker.
4. Each petal is labeled. Snap one pad, then the other — the highlight is what will be written.
5. Space, backspace, and return are bottom keys. Hold them to repeat.

## 0.3.0

- Labeled petals (letter groups, then the six exact characters once one side is chosen)
- Snap + highlight for the pending chord
- Holdable space, backspace, and return
- Taps stick until the other pad completes the chord

## Build

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
