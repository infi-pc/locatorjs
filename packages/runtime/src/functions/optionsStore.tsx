import { createSignal } from "solid-js";

export type ProjectOptions = {
  projectPath?: string;
  templateOrTemplateId?: string;
  adapterId?: string;
  replacePath?: {
    from: string;
    to: string;
  };
  disabled?: boolean;
};

const [signalOptions, setSignalOptions] = createSignal(getStoredOptions());

export function setOptions(newOptions: Partial<ProjectOptions>) {
  const savedOptions = getStoredOptions();
  const optionsToSave = { ...savedOptions, ...newOptions };
  localStorage.setItem("LOCATOR_OPTIONS", JSON.stringify(optionsToSave));
  setSignalOptions(optionsToSave);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.enableLocator = () => {
  setOptions({ disabled: false });
  return "Locator enabled";
};

export const getOptions = signalOptions;

function getStoredOptions() {
  const options: ProjectOptions = {};
  const storedOptions = localStorage.getItem("LOCATOR_OPTIONS");
  if (storedOptions) {
    const parsedOptions = JSON.parse(storedOptions);
    if (typeof parsedOptions.projectPath === "string") {
      options.projectPath = parsedOptions.projectPath;
    }
    if (typeof parsedOptions.templateOrTemplateId === "string") {
      options.templateOrTemplateId = parsedOptions.templateOrTemplateId;
    }
    if (typeof parsedOptions.adapterId === "string") {
      options.adapterId = parsedOptions.adapterId;
    }
    // FIXME add replacePath
    if (typeof parsedOptions.disabled === "boolean") {
      options.disabled = parsedOptions.disabled;
    }
  }

  return options;
}

export function cleanOptions() {
  localStorage.removeItem("LOCATOR_OPTIONS");
}
