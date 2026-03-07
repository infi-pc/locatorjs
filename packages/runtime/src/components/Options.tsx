import { cleanOptions, Targets } from "@locator/shared";
import { createMemo, createSignal, createEffect } from "solid-js";
import { bannerClasses } from "../functions/bannerClasses";
import { isExtension } from "../functions/isExtension";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { useOptions } from "../functions/optionsStore";
import { AdapterId } from "../consts";
import { LinkOptions } from "./LinkOptions";
import { getElementInfo, getElementInfoAsync } from "../adapters/getElementInfo";
import { LinkProps } from "../types/types";
import { setDebugMode } from "../adapters/react/debug";

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: AdapterId;
  currentElement: HTMLElement | null;
}) {
  const options = useOptions();

  // Synchronously fetched linkProps
  const syncLinkProps = createMemo(() =>
    props.currentElement
      ? getElementInfo(props.currentElement, props.adapterId)?.thisElement
          .link || null
      : null
  );

  // Async fetched linkProps (for Turbopack jsxDEV source)
  const [asyncLinkProps, setAsyncLinkProps] = createSignal<LinkProps | null>(null);

  // When currentElement changes and sync fails, try async
  createEffect(() => {
    const element = props.currentElement;
    const syncResult = syncLinkProps();

    // If sync succeeded, use sync result directly
    if (syncResult) {
      setAsyncLinkProps(null);
      return;
    }

    // Sync failed, try async
    if (element) {
      getElementInfoAsync(element, props.adapterId)
        .then((elInfo) => {
          // Ensure element is still the current element
          if (props.currentElement === element) {
            setAsyncLinkProps(elInfo?.thisElement.link || null);
          }
        })
        .catch(() => {
          // Async resolution failed — leave as null
        });
    } else {
      setAsyncLinkProps(null);
    }
  });

  // Prefer sync result, fallback to async result
  const elLinkProps = () => syncLinkProps() || asyncLinkProps();

  // Debug mode state
  const [debugEnabled, setDebugEnabled] = createSignal(
    options.getOptions().debugMode ?? false
  );

  // Sync debug state on init
  createEffect(() => {
    setDebugMode(debugEnabled());
  });

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newValue = !debugEnabled();
    setDebugEnabled(newValue);
    options.setOptions({ debugMode: newValue });
  };

  return (
    <div
      class={bannerClasses() + " w-[560px] max-w-full"}
      style={{
        "max-height": "calc(100vh - 32px)",
        "overflow-y": "auto",
        "overflow-x": "hidden",
        "overscroll-behavior": "contain",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div class="p-1">
        <div class="flex justify-between items-center">
          <LogoIcon />
          <OptionsCloseButton onClick={() => props.onClose()} />
        </div>

        <LinkOptions
          linkProps={elLinkProps()}
          adapterId={props.adapterId}
          targets={props.targets}
        />

        <div class="flex items-center gap-2 mt-4 mb-2">
          <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
            <div
              class={`relative w-9 h-5 rounded-full transition-colors ${
                debugEnabled() ? "bg-blue-500" : "bg-slate-300"
              }`}
              onClick={toggleDebugMode}
            >
              <div
                class={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  debugEnabled() ? "translate-x-4 left-0.5" : "left-0.5"
                }`}
              />
            </div>
            <span>Debug Mode</span>
          </label>
          <span class="text-[10px] text-slate-400">
            {debugEnabled() ? "(view location logs in console)" : ""}
          </span>
        </div>

        <div class="flex gap-2 justify-between mt-2">
          <button
            class="bg-slate-100 py-1 px-2 rounded hover:bg-slate-300 active:bg-slate-200 cursor-pointer text-xs"
            onClick={() => {
              cleanOptions();
              setDebugEnabled(false);
              props.onClose();
            }}
          >
            Reset settings
          </button>
          <button
            class="bg-red-50 py-1 px-2 rounded hover:bg-red-200 active:bg-red-100 cursor-pointer text-xs text-red-800 flex gap-1"
            onClick={() => {
              if (isExtension()) {
                options.setOptions({ disabled: true });
                props.onClose();
              } else {
                props.showDisableDialog();
              }
            }}
          >
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
              />
            </svg>{" "}
            Disable Locator
          </button>
        </div>
      </div>
    </div>
  );
}
