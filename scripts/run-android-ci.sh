#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
    app) suite_command=(npm run android.app.ci) ;;
    biometrics) suite_command=(npm run android.app -- --spec tests/specs/app.biometric.login.spec.ts) ;;
    *) echo 'Expected app or biometrics' >&2; exit 2 ;;
esac

android_serial=${ANDROID_UDID:-emulator-5554}

android_adb() {
    timeout 10s adb -s "$android_serial" "$@"
}

wait_for_emulator() {
    local attempt focus
    for ((attempt = 1; attempt <= 6; attempt++)); do
        if focus=$(android_adb shell dumpsys window | grep 'mCurrentFocus='); then
            if [[ "$focus" == *'Application Not Responding:'* ]]; then
                echo '::error::Android emulator is blocked by an app-not-responding dialog before WebdriverIO startup.' >&2
                echo "$focus" >&2
                return 1
            fi
            if [[ "$focus" == *'mCurrentFocus=Window{'* ]]; then
                echo "Android emulator $android_serial is ready."
                return 0
            fi
        fi
        sleep 2
    done
    echo "::error::Android emulator $android_serial did not report a focused window before WebdriverIO startup." >&2
    return 1
}

status=0
wait_for_emulator || status=$?
if (( status == 0 )); then
    "${suite_command[@]}" || status=$?
fi
if (( status != 0 )); then
    mkdir -p logs/android-device
    android_adb shell dumpsys activity activities > logs/android-device/activities.txt || true
    android_adb shell dumpsys window > logs/android-device/windows.txt || true
    android_adb exec-out screencap -p > logs/android-device/screen.png || true
    if android_adb shell uiautomator dump /sdcard/ci-window.xml >/dev/null; then
        android_adb shell cat /sdcard/ci-window.xml > logs/android-device/hierarchy.xml || true
    fi
    android_adb logcat -d -t 500 > logs/android-device/logcat.txt || true
fi
exit "$status"
