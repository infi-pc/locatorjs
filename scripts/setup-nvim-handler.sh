#!/bin/bash
#
# setup-nvim-handler.sh
# Registers an nvim:// URL scheme handler on macOS so that
# LocatorJS can open files directly in Neovim from the browser.
#
# Usage:
#   bash scripts/setup-nvim-handler.sh
#   bash scripts/setup-nvim-handler.sh --terminal=kitty
#   curl -fsSL https://raw.githubusercontent.com/infi-pc/locatorjs/master/scripts/setup-nvim-handler.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/infi-pc/locatorjs/master/scripts/setup-nvim-handler.sh | bash -s -- --terminal=kitty
#
# Options:
#   --terminal=<name>  Override auto-detection with a specific terminal.
#                      Valid values: ghostty, iterm, kitty, terminal
#
# What it does:
#   1. Detects nvim binary and terminal emulator (or uses --terminal override)
#   2. Creates ~/.local/bin/nvim-url-handler.sh  (Bash handler)
#   3. Creates ~/Applications/NvimURLHandler.app (AppleScript .app bundle)
#   4. Registers the nvim:// URL scheme via Info.plist + Launch Services
#

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()   { echo -e "${RED}[error]${NC} $*" >&2; }

# ── 1. Parse arguments ───────────────────────────────────────────────────────

VALID_TERMINALS="ghostty iterm kitty terminal"
USER_TERMINAL=""

for arg in "$@"; do
  case "$arg" in
    --terminal=*)
      USER_TERMINAL="${arg#*=}"
      if ! echo "$VALID_TERMINALS" | grep -qw "$USER_TERMINAL"; then
        err "Invalid terminal: $USER_TERMINAL"
        err "Valid values: $VALID_TERMINALS"
        exit 1
      fi
      ;;
    --help|-h)
      echo "Usage: setup-nvim-handler.sh [--terminal=<name>]"
      echo ""
      echo "Options:"
      echo "  --terminal=<name>  Override auto-detection with a specific terminal."
      echo "                     Valid values: $VALID_TERMINALS"
      exit 0
      ;;
    *)
      err "Unknown argument: $arg"
      err "Usage: setup-nvim-handler.sh [--terminal=<name>]"
      exit 1
      ;;
  esac
done

# ── 2. OS check ──────────────────────────────────────────────────────────────

if [[ "$(uname -s)" != "Darwin" ]]; then
  err "This script only supports macOS. Linux support is planned for a future release."
  exit 1
fi

info "macOS detected — $(sw_vers -productVersion)"

# ── 3. Detect nvim ───────────────────────────────────────────────────────────

NVIM_PATH="$(which nvim 2>/dev/null || true)"
if [[ -z "$NVIM_PATH" ]]; then
  err "nvim not found in PATH. Please install Neovim first:"
  err "  brew install neovim"
  exit 1
fi

ok "nvim found at $NVIM_PATH"

# ── 4. Detect terminal emulator ──────────────────────────────────────────────

detect_terminal() {
  # Prefer Ghostty > iTerm2 > Kitty > Terminal.app
  # Check both CLI in PATH and .app bundles in /Applications.
  if [[ -d "/Applications/Ghostty.app" ]]; then
    echo "ghostty"
  elif [[ -d "/Applications/iTerm.app" ]]; then
    echo "iterm"
  elif command -v kitty &>/dev/null || [[ -d "/Applications/kitty.app" ]]; then
    echo "kitty"
  else
    echo "terminal"
  fi
}

if [[ -n "$USER_TERMINAL" ]]; then
  TERMINAL_TYPE="$USER_TERMINAL"
  ok "Using user-specified terminal: $TERMINAL_TYPE"
else
  TERMINAL_TYPE="$(detect_terminal)"
  info "Auto-detected terminal: $TERMINAL_TYPE"
fi

# Resolve full path for CLI-based terminals.
# AppleScript's `do shell script` runs with a minimal PATH (/usr/bin:/bin:/usr/sbin:/sbin),
# so commands like `kitty` won't be found by name alone.
# We resolve the full path at setup time and bake it into the handler script.
resolve_terminal_bin() {
  # Try PATH first, then fall back to the CLI binary inside the .app bundle.
  case "$TERMINAL_TYPE" in
    kitty)
      which kitty 2>/dev/null \
        || echo "/Applications/kitty.app/Contents/MacOS/kitty"
      ;;
    *) echo "" ;;
  esac
}

TERMINAL_BIN="$(resolve_terminal_bin)"

# Verify CLI-based terminals are actually available
case "$TERMINAL_TYPE" in
  kitty)
    if [[ -z "$TERMINAL_BIN" ]] || [[ ! -x "$TERMINAL_BIN" ]]; then
      err "$TERMINAL_TYPE binary not found. Checked PATH and /Applications/${TERMINAL_TYPE}.app"
      exit 1
    fi
    ok "$TERMINAL_TYPE found at $TERMINAL_BIN"
    ;;
esac

# Build the terminal launch command used by the handler.
# All terminal commands are pure shell — no Apple Events.
# This avoids macOS Automation permission issues with osacompile apps.
build_terminal_cmd() {
  case "$TERMINAL_TYPE" in
    ghostty)
      cat <<'GHOSTTY_EOF'
open -na /Applications/Ghostty.app --args --quit-after-last-window-closed=true --window-save-state=never --command="$NVIM +${LINE:-1} $FILE_PATH"
GHOSTTY_EOF
      ;;
    iterm)
      cat <<'ITERM_EOF'
LOCATOR_BASE=$(mktemp /tmp/nvim-locator-XXXXXX)
LOCATOR_TMP="${LOCATOR_BASE}.command"
mv "$LOCATOR_BASE" "$LOCATOR_TMP"
cat > "$LOCATOR_TMP" <<CMDEOF
#!/bin/bash
rm -f "\$0"
"$NVIM" "+${LINE:-1}" "$FILE_PATH"
# iTerm2 opens .command files in a new tab within the same window.
# Do not close the tab/window to avoid disrupting other tabs.
CMDEOF
chmod +x "$LOCATOR_TMP"
open -a iTerm.app "$LOCATOR_TMP"
ITERM_EOF
      ;;
    kitty)
      cat <<EOF
$TERMINAL_BIN -o macos_quit_when_last_window_closed=yes "\$NVIM" "+\${LINE:-1}" "\$FILE_PATH" &
EOF
      ;;
    terminal)
      cat <<'TERMINAL_EOF'
LOCATOR_BASE=$(mktemp /tmp/nvim-locator-XXXXXX)
LOCATOR_TMP="${LOCATOR_BASE}.command"
mv "$LOCATOR_BASE" "$LOCATOR_TMP"
cat > "$LOCATOR_TMP" <<CMDEOF
#!/bin/bash
rm -f "\$0"
"$NVIM" "+${LINE:-1}" "$FILE_PATH"
# Close window after nvim exits; quit Terminal.app if no windows remain
( sleep 0.3 && osascript -e 'tell application "Terminal"
  close front window
  if (count of windows) = 0 then quit
end tell' ) &>/dev/null &
disown
exit 0
CMDEOF
chmod +x "$LOCATOR_TMP"
open "$LOCATOR_TMP"
TERMINAL_EOF
      ;;
  esac
}

TERMINAL_CMD="$(build_terminal_cmd)"

# ── 5. Create ~/.local/bin/nvim-url-handler.sh ───────────────────────────────

HANDLER_DIR="$HOME/.local/bin"
HANDLER_PATH="$HANDLER_DIR/nvim-url-handler.sh"

mkdir -p "$HANDLER_DIR"

cat > "$HANDLER_PATH" <<HANDLER
#!/bin/bash
# nvim-url-handler.sh — called by NvimURLHandler.app
# Args: \$1 = tmuxSession (may be empty), \$2 = filePath (with :line:col)

TMUX_SESSION_NAME="\$1"
FILE_PATH_WITH_POS="\$2"

# Parse file:line:col
FILE_PATH=\$(echo "\$FILE_PATH_WITH_POS" | sed 's/:[0-9]*:[0-9]*$//')
LINE=\$(echo "\$FILE_PATH_WITH_POS" | sed -n 's/.*:\([0-9]*\):[0-9]*$/\1/p')

NVIM="$NVIM_PATH"

open_in_new_terminal() {
    $TERMINAL_CMD
}

# Try tmux session first — send to existing nvim instance via socket
if [ -n "\$TMUX_SESSION_NAME" ]; then
    SOCKET="/tmp/nvim-\$TMUX_SESSION_NAME"
    if [ -e "\$SOCKET" ]; then
        \$NVIM --server "\$SOCKET" --remote "\$FILE_PATH" 2>/dev/null
        if [ \$? -eq 0 ]; then
            \$NVIM --server "\$SOCKET" --remote-send ":\${LINE:-1}<CR>zz" 2>/dev/null
            exit 0
        fi
    fi
fi

# Fallback: open in new terminal window
open_in_new_terminal
HANDLER

chmod +x "$HANDLER_PATH"
ok "Created $HANDLER_PATH"

# ── 6. Create NvimURLHandler.app via osacompile ──────────────────────────────

APP_DIR="$HOME/Applications"
APP_PATH="$APP_DIR/NvimURLHandler.app"
PLIST="$APP_PATH/Contents/Info.plist"

mkdir -p "$APP_DIR"

# Kill existing handler process and remove previous version
if [[ -d "$APP_PATH" ]]; then
  pkill -f "NvimURLHandler.app" 2>/dev/null || true
  sleep 0.5
  warn "Removing existing $APP_PATH"
  rm -rf "$APP_PATH"
fi

# AppleScript source — only handles URL parsing and delegates to bash handler.
# No Apple Events are used; the bash handler opens the terminal directly
# via shell commands, avoiding macOS Automation permission issues.
APPLESCRIPT_SRC=$(cat <<'APPLESCRIPT'
on open location schemeUrl
    set oldDelims to AppleScript's text item delimiters
    try
        set AppleScript's text item delimiters to {"nvim://file/"}
        set pathWithQuery to item 2 of the text items of schemeUrl

        set AppleScript's text item delimiters to {"?"}
        set filePath to item 1 of the text items of pathWithQuery

        set tmuxSession to ""
        if (count of text items of pathWithQuery) > 1 then
            set queryPart to item 2 of the text items of pathWithQuery
            set AppleScript's text item delimiters to {"tmux-session="}
            if (count of text items of queryPart) > 1 then
                set tmuxSession to item 2 of the text items of queryPart
                set AppleScript's text item delimiters to {"&"}
                set tmuxSession to item 1 of the text items of tmuxSession
            end if
        end if

        set AppleScript's text item delimiters to oldDelims

        do shell script "/bin/bash " & quoted form of (POSIX path of (path to home folder)) & ".local/bin/nvim-url-handler.sh " & quoted form of tmuxSession & " " & quoted form of filePath
    on error errMsg
        set AppleScript's text item delimiters to oldDelims
        display alert "LocatorJS nvim handler error" message errMsg
    end try
end open location
APPLESCRIPT
)

# Compile AppleScript to .app bundle
echo "$APPLESCRIPT_SRC" | osacompile -o "$APP_PATH"
ok "Created $APP_PATH"

# ── 7. Register nvim:// URL scheme in Info.plist ─────────────────────────────

/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string 'Nvim URL Scheme'" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string nvim" "$PLIST" 2>/dev/null || true

# Set a proper bundle identifier
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string com.locatorjs.nvim-handler" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.locatorjs.nvim-handler" "$PLIST"

ok "Registered nvim:// URL scheme in Info.plist"

# ── 8. Register with Launch Services ─────────────────────────────────────────

# Opening the app once triggers Launch Services registration
open "$APP_PATH"
sleep 1

ok "Registered NvimURLHandler.app with Launch Services"

# ── 9. Verify ────────────────────────────────────────────────────────────────

echo ""
info "Setup complete! Testing with a sample URL..."
echo ""
echo -e "  ${CYAN}open \"nvim://file/\$HOME/.zshrc:1:1\"${NC}"
echo ""
info "If Neovim opens your .zshrc file, the handler is working correctly."
echo ""
info "Files created:"
echo "  - $APP_PATH  (URL scheme handler app)"
echo "  - $HANDLER_PATH  (Bash handler script)"
echo ""
info "To uninstall, remove these files and restart your browser."
