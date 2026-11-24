#!/usr/bin/env bash
set -euo pipefail

: "${IOS_DEVICE_NAME:?Set IOS_DEVICE_NAME to the simulator model}"
: "${IOS_PLATFORM_VERSION:?Set IOS_PLATFORM_VERSION to the simulator runtime version}"
: "${GITHUB_ENV:?GITHUB_ENV is required to pass the simulator UDID to Appium}"

simulator_udid=$(xcrun simctl list devices available --json | node -e '
    const { devices } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
    const { IOS_DEVICE_NAME: model, IOS_PLATFORM_VERSION: version } = process.env;
    const runtime = "com.apple.CoreSimulator.SimRuntime.iOS-" + version.replaceAll(".", "-");
    const candidates = (devices[runtime] ?? []).filter(device => device.isAvailable && device.name === model);
    const simulator = candidates.find(device => device.state === "Booted") ?? candidates[0];
    if (!simulator) {
        console.error(`No available ${model} simulator on iOS ${version}`);
        process.exit(1);
    }
    process.stdout.write(simulator.udid);
')

echo "Waiting for $IOS_DEVICE_NAME on iOS $IOS_PLATFORM_VERSION ($simulator_udid)"
xcrun simctl bootstatus "$simulator_udid" -b
printf 'IOS_UDID=%s\n' "$simulator_udid" >> "$GITHUB_ENV"
