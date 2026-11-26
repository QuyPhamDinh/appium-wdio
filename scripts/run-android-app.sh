#!/usr/bin/env bash
set -euo pipefail

ANDROID_SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
ANDROID_AVD_NAME="${ANDROID_AVD_NAME:-Pixel_10}"
ANDROID_DEVICE_NAME="${ANDROID_DEVICE_NAME:-${ANDROID_AVD_NAME//_/ }}"
REQUESTED_UDID="${ANDROID_UDID:-}"
ANDROID_UDID="${ANDROID_UDID:-emulator-5554}"
BOOT_TIMEOUT_SECONDS="${ANDROID_BOOT_TIMEOUT_SECONDS:-180}"

resolve_binary() {
    local name="$1"
    local fallback="$2"
    if command -v "$name" >/dev/null 2>&1; then
        command -v "$name"
        return 0
    fi
    if [[ -x "$fallback" ]]; then
        printf '%s\n' "$fallback"
        return 0
    fi
    echo "Could not find $name on PATH or at $fallback" >&2
    return 1
}

adb_bin=$(resolve_binary adb "$ANDROID_SDK_DIR/platform-tools/adb")
emulator_bin=$(resolve_binary emulator "$ANDROID_SDK_DIR/emulator/emulator")

is_device_online() {
    local serial="$1"
    "$adb_bin" devices | awk -v serial="$serial" '$1 == serial && $2 == "device" { found = 1 } END { exit !found }'
}

find_running_emulator() {
    "$adb_bin" devices | awk '$1 ~ /^emulator-[0-9]+$/ && $2 == "device" { print $1; exit }'
}

wait_for_boot() {
    local serial="$1"
    local emulator_pid="${2:-}"
    local deadline=$((SECONDS + BOOT_TIMEOUT_SECONDS))
    local boot_completed focus

    while (( SECONDS < deadline )); do
        if [[ -n "$emulator_pid" ]] && ! kill -0 "$emulator_pid" 2>/dev/null; then
            echo "Android emulator process exited unexpectedly. Check logs/android-emulator.log." >&2
            return 1
        fi

        if is_device_online "$serial"; then
            boot_completed=$("$adb_bin" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
            if [[ "$boot_completed" == "1" ]]; then
                focus=$("$adb_bin" -s "$serial" shell dumpsys window 2>/dev/null | grep 'mCurrentFocus=' || true)
                if [[ "$focus" == *'Application Not Responding:'* ]]; then
                    echo "Android emulator $serial has an ANR dialog: $focus" >&2
                    return 1
                fi
                if [[ "$focus" == *'mCurrentFocus=Window{'* ]]; then
                    echo "Android emulator $serial is ready."
                    return 0
                fi
            fi
        fi
        sleep 2
    done

    echo "Timed out after ${BOOT_TIMEOUT_SECONDS}s waiting for Android emulator $serial to finish booting." >&2
    return 1
}

"$adb_bin" start-server >/dev/null

if is_device_online "$ANDROID_UDID"; then
    echo "Emulator already started: $ANDROID_UDID"
elif [[ -z "$REQUESTED_UDID" ]] && running_emulator=$(find_running_emulator) && [[ -n "$running_emulator" ]]; then
    ANDROID_UDID="$running_emulator"
    echo "Emulator already started: $ANDROID_UDID"
else
    if ! "$emulator_bin" -list-avds | grep -Fxq "$ANDROID_AVD_NAME"; then
        echo "AVD '$ANDROID_AVD_NAME' not found. Available AVDs:" >&2
        "$emulator_bin" -list-avds >&2
        exit 1
    fi

    if [[ "$ANDROID_UDID" =~ ^emulator-([0-9]+)$ ]]; then
        emulator_port="${BASH_REMATCH[1]}"
    else
        echo "Cannot start a non-emulator UDID ($ANDROID_UDID). Start/connect the device first." >&2
        exit 1
    fi

    mkdir -p logs
    echo "Starting Android emulator '$ANDROID_AVD_NAME' on $ANDROID_UDID..."
    "$emulator_bin" -avd "$ANDROID_AVD_NAME" -port "$emulator_port" -no-snapshot-save > logs/android-emulator.log 2>&1 &
    emulator_pid=$!
    wait_for_boot "$ANDROID_UDID" "$emulator_pid"
fi

if [[ -z "${ANDROID_PLATFORM_VERSION:-}" ]]; then
    ANDROID_PLATFORM_VERSION=$("$adb_bin" -s "$ANDROID_UDID" shell getprop ro.build.version.release | tr -d '\r')
fi

export ANDROID_DEVICE_NAME ANDROID_PLATFORM_VERSION ANDROID_UDID

if (( $# > 0 )); then
    npm run android.app -- "$@"
else
    npm run android.app
fi
