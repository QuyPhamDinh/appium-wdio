#!/usr/bin/env bash
set -euo pipefail

: "${IOS_UDID:?Boot the selected iOS simulator first}"
: "${IOS_PLATFORM_VERSION:?Set IOS_PLATFORM_VERSION to the simulator runtime version}"
: "${RUNNER_TEMP:?RUNNER_TEMP is required for WebDriverAgent build output}"
: "${GITHUB_ENV:?GITHUB_ENV is required to pass the build path to Appium}"

wda_manifest=$(node -p 'require.resolve("appium-webdriveragent/package.json", {
    paths: [require.resolve("appium-xcuitest-driver/package.json")]
})')
derived_data="$RUNNER_TEMP/wda-derived-data"

mkdir -p logs
if ! xcodebuild build-for-testing \
    -project "$(dirname "$wda_manifest")/WebDriverAgent.xcodeproj" \
    -scheme WebDriverAgentRunner \
    -destination "id=$IOS_UDID" \
    -derivedDataPath "$derived_data" \
    IPHONEOS_DEPLOYMENT_TARGET="$IOS_PLATFORM_VERSION" \
    GCC_TREAT_WARNINGS_AS_ERRORS=0 \
    COMPILER_INDEX_STORE_ENABLE=NO > logs/wda-build.log 2>&1; then
    tail -n 100 logs/wda-build.log >&2
    exit 1
fi
echo "WebDriverAgent build succeeded (full log saved to logs/wda-build.log)"

printf 'IOS_WDA_DERIVED_DATA_PATH=%s\n' "$derived_data" >> "$GITHUB_ENV"
