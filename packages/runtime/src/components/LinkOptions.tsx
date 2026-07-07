import { Targets } from "@locator/shared";
import { buildLink } from "../functions/buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { ProjectLinkForm } from "./ProjectLinkForm";
import { useOptions } from "../functions/optionsStore";
import { TransformLinkForm } from "./TransformLinkForm";
import { TmuxSessionForm } from "./TmuxSessionForm";
import { NvimSetupGuide } from "./NvimSetupGuide";
import { AdapterId, HREF_TARGET } from "../consts";
import { LinkProps } from "../types/types";
import { LinkHrefTarget } from "./LinkHrefTarget";

export function LinkOptions(props: {
  linkProps: LinkProps | null;
  adapterId?: AdapterId;
  targets: Targets;
}) {
  const options = useOptions();

  function selectedTarget() {
    const eff = options.effective();
    return eff.targetTemplate ?? eff.targetId;
  }
  function selectTarget(val: string | undefined) {
    if (!val) {
      options.setUserOrigin({
        targetId: undefined,
        targetTemplate: undefined,
      });
      return;
    }
    if (val.includes("://")) {
      options.setUserOrigin({ targetTemplate: val, targetId: undefined });
    } else {
      options.setUserOrigin({ targetId: val, targetTemplate: undefined });
    }
  }

  const isNvimTarget = () => {
    const target = selectedTarget();
    return (
      target === "nvim" ||
      (typeof target === "string" && target.includes("nvim://"))
    );
  };

  const currentLink = () =>
    props.linkProps
      ? buildLink(props.linkProps, props.targets, options, selectedTarget())
      : undefined;

  return (
    <div>
      <ProjectLinkForm
        value={options.effective().projectPath}
        onChange={function (newValue) {
          options.setUserOrigin({ projectPath: newValue });
        }}
      />

      <TransformLinkForm
        value={options.effective().replacePath}
        onChange={(newValue) => {
          options.setUserOrigin({ replacePath: newValue });
        }}
      />

      <EditorLinkForm
        targets={props.targets}
        selectedTarget={selectedTarget()}
        selectTarget={selectTarget}
      />

      {isNvimTarget() && (
        <TmuxSessionForm
          value={options.effective().tmuxSession}
          onChange={(newValue) => {
            options.setUserOrigin({ tmuxSession: newValue });
          }}
          onTemplateSwitch={(useCustom, tmuxSession) => {
            if (useCustom) {
              selectTarget(
                `nvim://file/\${projectPath}\${filePath}:\${line}:\${column}?tmux-session=\${tmuxSession}`
              );
            } else {
              selectTarget("nvim");
            }
          }}
        />
      )}

      {isNvimTarget() && <NvimSetupGuide />}

      <LinkHrefTarget
        value={options.effective().hrefTarget}
        onChange={(newValue) => {
          options.setUserOrigin({ hrefTarget: newValue });
        }}
      />

      <div class="mt-4">
        <div class="text-sm flex flex-col bg-green-50 text-green-800 p-4 -mx-4 rounded whitespace-pre-wrap break-all">
          <label for="email" class="block text-xs  text-green-700">
            Link preview:
          </label>
          {currentLink() ? (
            <a
              href={currentLink()}
              target={options.effective().hrefTarget || HREF_TARGET}
              class="hover:underline"
            >
              {currentLink()}
            </a>
          ) : (
            "To test the link, try to hover over some element."
          )}
        </div>
      </div>
    </div>
  );
}
