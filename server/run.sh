#!/usr/bin/env bash
# Compile (skipped when nothing changed) → launch the JVM directly, bypassing bootJar/bootRun.
#
#   ./run.sh                                  start with the local profile
#   ./run.sh --spring.profiles.active=prod    choose a profile
#   ./run.sh --server.port=9000               any other Spring args are passed through
#   FORCE_BUILD=1 ./run.sh                    ignore change detection and always compile
#   NO_WATCH=1 ./run.sh                       do not start the background continuous compile
set -euo pipefail

cd "$(dirname "$0")"

MAIN_CLASS="com.abcworld.yongdrive.YongDriveApplicationKt"
RUN_DIR=".run"
CP_ARGS="$RUN_DIR/cp.args"
STAMP="$RUN_DIR/build.stamp"

mkdir -p "$RUN_DIR"

# Load AUTH_PASSWORD etc. from .env if present (one KEY=VALUE per line).
if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

# --- 1. Compile -------------------------------------------------------------
# Skip Gradle entirely when sources and build config are unchanged since the last build.
BUILD_FILES=(build.gradle.kts settings.gradle.kts gradle.properties gradle/wrapper/gradle-wrapper.properties)
needs_build=1
if [[ -z "${FORCE_BUILD:-}" && -f "$STAMP" && -d build/classes/kotlin/main ]]; then
    if [[ -z "$(find src "${BUILD_FILES[@]}" -newer "$STAMP" -print -quit 2>/dev/null)" ]]; then
        needs_build=0
    fi
fi

if (( needs_build )); then
    echo "==> compiling"
    ./gradlew --configuration-cache -q classes
    touch "$STAMP"
else
    echo "==> up to date, skipping gradle"
fi

# --- 2. Classpath -----------------------------------------------------------
# Re-resolve dependencies only when the build config changes (one extra Gradle call).
# cp.args holds absolute paths, so also rebuild it when the project folder has moved.
needs_cp=0
if [[ ! -f "$CP_ARGS" ]] || ! grep -qF "$PWD/build/" "$CP_ARGS"; then
    needs_cp=1
else
    for f in "${BUILD_FILES[@]}"; do
        if [[ -f "$f" && "$f" -nt "$CP_ARGS" ]]; then
            needs_cp=1
        fi
    done
fi
if (( needs_cp )); then
    echo "==> resolving classpath"
    cp="$(./gradlew -q printRuntimeClasspath | tail -1)"
    printf -- '-cp "%s"\n' "$cp" > "$CP_ARGS"
fi

# --- 3. Preflight checks ----------------------------------------------------
if [[ -z "${AUTH_PASSWORD:-}" ]]; then
    echo "!!! AUTH_PASSWORD is empty — every login will fail." >&2
    echo "    Put AUTH_PASSWORD=<BCrypt hash> in .env or pass it as an environment variable." >&2
fi
if ! (exec 3<>/dev/tcp/127.0.0.1/6379) 2>/dev/null; then
    echo "!!! No Redis on localhost:6379 — sessions and cache will not work." >&2
fi

# --- 4. Run -----------------------------------------------------------------
# Default to the local profile unless one was passed as an argument.
args=("$@")
if [[ ! " $* " == *"--spring.profiles.active="* ]]; then
    args+=("--spring.profiles.active=${PROFILE:-local}")
fi

# DevTools (developmentOnly) restarts the app whenever build/classes changes, so keep a
# continuous compile running next to it. It shares the terminal, so compile errors show up here.
if [[ -z "${NO_WATCH:-}" ]]; then
    echo "==> starting continuous compile (DevTools restarts the app on change)"
    ./gradlew --configuration-cache -q -t classes &
    watch_pid=$!
    trap 'kill "$watch_pid" 2>/dev/null || true' EXIT
fi

java \
    --enable-native-access=ALL-UNNAMED \
    "@$CP_ARGS" \
    "$MAIN_CLASS" \
    "${args[@]}"
