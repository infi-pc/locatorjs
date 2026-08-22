#!/usr/bin/env bash
#
# Derive every dev-server port from one base, so parallel Conductor workspaces
# stop fighting over 3342-3353.
#
# Source it, don't execute it -- it only exports:
#
#   . ./scripts/dev-ports.sh && pnpm dev
#   PORT=45000 . ./scripts/dev-ports.sh && pnpm dev
#
# Every consumer (test-apps/*/package.json, apps/*/package.json,
# apps/playwright/tests/consts.ts, playwright.config.ts) reads these with the
# historical port as its default, so NOT sourcing this file leaves behaviour
# exactly as it was.
#
# Offsets are fixed so a given app always lands at the same slot in the block.

export PORT="${PORT:-3342}"

export PORT_WEB=$((PORT + 0))         # apps/web                    (was 3342)
export PORT_REACT=$((PORT + 1))       # vite-react-project          (was 3343)
export PORT_UI_LAB=$((PORT + 2))      # apps/ui-lab                 (was 3344)
export PORT_SOLID=$((PORT + 3))       # vite-solid-project          (was 3345)
export PORT_PREACT=$((PORT + 4))      # vite-preact-project         (was 3346)
export PORT_SVELTE=$((PORT + 5))      # vite-svelte-project         (was 3347)
export PORT_REACT_CLEAN=$((PORT + 6)) # vite-react-clean-project    (was 3348)
export PORT_SVELTE_CLEAN=$((PORT + 7)) # vite-svelte-clean-project  (was 3349)
export PORT_VUE=$((PORT + 8))         # vite-vue-project            (was 3350)
export PORT_NEXT_14=$((PORT + 9))     # next-14                     (was 3351)
export PORT_NEXT_16=$((PORT + 10))    # next-16                     (was 3352)
export PORT_NEXT_16_TURBO=$((PORT + 11)) # next-16-turbopack        (was 3353)
