import { LinkProps } from "../types/types";
import { DEFAULT_LAYER, Targets } from "@locator/shared";
import { LayeredOptionsEditor, LayerTabConfig } from "@locator/ui";
import { useOptions } from "../functions/optionsStore";
import { AdapterId, HREF_TARGET } from "../consts";
import { buildLink } from "../functions/buildLink";

export function WelcomeScreen(props: {
  originalLinkProps: LinkProps | null;
  targets: Targets;
  onClose: () => void;
  adapterId?: AdapterId;
  portalMount: HTMLDivElement;
}) {
  const options = useOptions();
  const tabs = (): LayerTabConfig[] => [
    {
      layer: "user-origin",
      label: "This origin",
      values: options.layers()["user-origin"] ?? {},
      write: options.setUserOrigin,
      note: "Adjust this origin until the test link opens the correct source file.",
    },
    {
      layer: "user-extension",
      label: "Extension",
      values: options.layers()["user-extension"] ?? {},
    },
    { layer: "team", label: "Team", values: options.layers().team ?? {} },
    {
      layer: "default",
      label: "Defaults",
      values: options.layers().default ?? DEFAULT_LAYER,
    },
  ];

  const currentLink = () => {
    const eff = options.effective();
    return props.originalLinkProps
      ? buildLink(
          props.originalLinkProps,
          props.targets,
          options,
          eff.targetTemplate ?? eff.targetId
        )
      : undefined;
  };

  return (
    <div class="bg-white p-4 rounded-xl border-2 border-red-500 shadow-xl cursor-auto pointer-events-auto z-10 max-w-xl max-h-full overflow-auto">
      <div class="mt-2 mb-4">
        <h1 class="text-2xl font-bold">Welcome to Locator!</h1>
        <span class="text-sm">
          Before using Locator, let's try links in your project and fix them if
          needed.
        </span>
      </div>
      <LayeredOptionsEditor
        tabs={tabs()}
        effective={options.effective()}
        provenance={options.provenance()}
        targets={options.allTargets()}
        defaultId="user-origin"
        portalMount={props.portalMount}
      />

      <div class="mt-4 flex gap-2 justify-between items-center">
        <div class="text-sm text-gray-600" />
        <div class="flex gap-2">
          <a
            href={currentLink()}
            target={options.effective().hrefTarget || HREF_TARGET}
            class="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded"
          >
            Test link
          </a>
          <button
            onClick={() => {
              options.setUiState({ welcomeScreenDismissed: true });
              props.onClose();
            }}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
