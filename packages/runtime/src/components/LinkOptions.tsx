import { Targets } from "@locator/shared";
import { buildLink } from "../functions/buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { ProjectLinkForm } from "./ProjectLinkForm";
import { useOptions } from "../functions/optionsStore";
import { TransformLinkForm } from "./TransformLinkForm";
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
