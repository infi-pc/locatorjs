import { Targets } from "@locator/shared";
import { buildLink } from "../functions/buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { ProjectLinkForm } from "./ProjectLinkForm";
import { useOptions } from "../functions/optionsStore";
import { TransformLinkForm } from "./TransformLinkForm";
import { AdapterId } from "../consts";
import { LinkProps } from "../types/types";
import { goToLinkProps } from "../functions/goTo";

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
      : "try to hover over some element to see the link";

  const projectPath = () => options.getOptions().projectPath;

  const correctedProjectPath = () => projectPath();
  // const correctedProjectPath = (): string => {
  //   let pp = projectPath();
  //   if (pp.at(-1) !== "/" && pp.at(-1) !== "\\") {
  //     pp += "/";
  //   }
  //   return pp;
  // };

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

      <div class="mt-2">
        <div class="text-sm flex flex-col bg-green-50 text-green-800 p-4 -mx-4 rounded whitespace-pre-wrap break-all">
          <label for="email" class="block text-xs  text-green-700">
            Link preview:
          </label>
          <a href={currentLink()} target="_blank" class="hover:underline">
            {currentLink()}
          </a>

          <div class="flex justify-end mt-2">
            {props.linkProps && (
              <button
                onClick={() => {
                  options.setOptions({
                    templateOrTemplateId: selectedTarget(),
                  });
                  const newProjectPath = correctedProjectPath();
                  if (newProjectPath) {
                    options.setOptions({ projectPath: newProjectPath });
                  }
                  goToLinkProps(props.linkProps!, props.targets, options);
                }}
                class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex gap-1 items-center"
              >
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"
                  />
                </svg>{" "}
                Test link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
