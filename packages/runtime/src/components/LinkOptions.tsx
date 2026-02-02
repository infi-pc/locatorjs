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
    return options.getOptions().templateOrTemplateId;
  }
  function selectTarget(val: string | undefined) {
    options.setOptions({ templateOrTemplateId: val });
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
        value={options.getOptions().projectPath}
        onChange={function (newValue) {
          options.setOptions({ projectPath: newValue });
        }}
      />

      <TransformLinkForm
        value={options.getOptions().replacePath}
        onChange={(newValue) => {
          options.setOptions({ replacePath: newValue });
        }}
      />

      <EditorLinkForm
        targets={props.targets}
        selectedTarget={selectedTarget()}
        selectTarget={selectTarget}
      />

      {isNvimTarget() && (
        <TmuxSessionForm
          value={options.getOptions().tmuxSession}
          onChange={(newValue) => {
            options.setOptions({ tmuxSession: newValue });
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
        value={options.getOptions().hrefTarget}
        onChange={(newValue) => {
          options.setOptions({ hrefTarget: newValue });
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
              target={options.getOptions().hrefTarget || HREF_TARGET}
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
