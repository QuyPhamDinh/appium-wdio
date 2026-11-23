#!/usr/bin/env bash
set -euo pipefail

biometric_spec=tests/specs/app.biometric.login.spec.ts
case "${1:-}" in
    app) spec_filter=(--exclude "$biometric_spec") ;;
    biometrics) spec_filter=(--spec "$biometric_spec") ;;
    *) echo 'Expected app or biometrics' >&2; exit 2 ;;
esac

status=0
npm run android.app -- "${spec_filter[@]}" || status=$?
if (( status != 0 )); then
    mkdir -p logs/android-device
    timeout 10s adb shell dumpsys activity activities > logs/android-device/activities.txt || true
    timeout 10s adb shell dumpsys window > logs/android-device/windows.txt || true
    timeout 10s adb exec-out screencap -p > logs/android-device/screen.png || true
    timeout 10s adb shell uiautomator dump /sdcard/ci-window.xml >/dev/null &&
        timeout 10s adb shell cat /sdcard/ci-window.xml > logs/android-device/hierarchy.xml || true
    timeout 10s adb logcat -d -t 500 > logs/android-device/logcat.txt || true
fi
exit "$status"
