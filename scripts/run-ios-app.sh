#!/usr/bin/env bash
set -euo pipefail

IOS_DEVICE_NAME="${IOS_DEVICE_NAME:-iPhone 16 Pro}"
IOS_PLATFORM_VERSION="${IOS_PLATFORM_VERSION:-18.2}"

resolve_simulator() {
    xcrun simctl list devices available --json | node -e '
        const { devices } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
        const { IOS_DEVICE_NAME: model, IOS_PLATFORM_VERSION: version, IOS_UDID: requestedUdid } = process.env;

        if (requestedUdid) {
            for (const list of Object.values(devices)) {
                const match = list.find((device) => device.isAvailable && device.udid === requestedUdid);
                if (match) {
                    process.stdout.write(`${match.udid}\t${match.state}\t${match.name}`);
                    process.exit(0);
                }
            }
            console.error(`No available simulator found with UDID ${requestedUdid}`);
            process.exit(1);
        }

        const runtime = `com.apple.CoreSimulator.SimRuntime.iOS-${version.replaceAll(".", "-")}`;
        const candidates = (devices[runtime] ?? []).filter((device) => device.isAvailable && device.name === model);
        const simulator = candidates.find((device) => device.state === "Booted") ?? candidates[0];
        if (!simulator) {
            console.error(`No available ${model} simulator on iOS ${version}`);
            process.exit(1);
        }
        process.stdout.write(`${simulator.udid}\t${simulator.state}\t${simulator.name}`);
    '
}

sim_info=$(
    IOS_DEVICE_NAME="$IOS_DEVICE_NAME" \
    IOS_PLATFORM_VERSION="$IOS_PLATFORM_VERSION" \
    IOS_UDID="${IOS_UDID:-}" \
    resolve_simulator
)
IFS=$'\t' read -r simulator_udid simulator_state simulator_name <<< "$sim_info"

if [[ "$simulator_state" == "Booted" ]]; then
    echo "Simulator already started: $simulator_name on iOS $IOS_PLATFORM_VERSION ($simulator_udid)"
    xcrun simctl bootstatus "$simulator_udid"
else
    echo "Simulator is $simulator_state. Starting $simulator_name on iOS $IOS_PLATFORM_VERSION ($simulator_udid)..."
    xcrun simctl bootstatus "$simulator_udid" -b
fi

export IOS_DEVICE_NAME IOS_PLATFORM_VERSION
export IOS_UDID="$simulator_udid"

if (( $# > 0 )); then
    npm run ios.app -- "$@"
else
    npm run ios.app
fi
