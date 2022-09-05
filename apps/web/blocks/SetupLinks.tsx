import Image from "next/image";
import { SetupLink } from "./SetupLink";

export default function SetupLinks() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Setup
        </h3>
        <p className="text-center">Select your framework</p>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <SetupLink
            icon={
              <Image
                src="/logos/react.png"
                alt="React"
                width={100}
                height={85}
              />
            }
            title={
              <span>
                React <span className="text-gray-600"> (data-id approach)</span>
              </span>
            }
            text={
              <span className="text-xs">
                <b>Compared to devtools approach:</b> <br />
                Works with all React projects that use Babel. <br />
                It can be used also in production-like environments. <br />
                Contains additional support for styled-components.
              </span>
            }
            id="react-data-id"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/react.png"
                alt="React"
                width={100}
                height={85}
              />
            }
            title={
              <span>
                React{" "}
                <span className="text-gray-600"> (devtools approach)</span>
              </span>
            }
            text={
              <span className="text-xs">
                <b>Compared to data-id approach:</b> <br />
                Works with modern React dev stacks like Vite, Next.js, or Create
                React App. <br />
                If you use the Browser extension, you don{"'"}t need to install
                any packages. <br />
                You might need to have React DevTools to make it working
                properly.
              </span>
            }
            id="react"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/solidjs.svg"
                alt="SolidJS"
                width={100}
                height={100}
              />
            }
            title="SolidJS"
            id="solidjs"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/preact.png"
                alt="Preact"
                width={100}
                height={100}
              />
            }
            title="Preact"
            id="preact"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/svelte.png"
                alt="Svelte"
                width={85}
                height={100}
              />
            }
            title="Svelte"
            id="svelte"
            experimental
          />
          <SetupLink
            icon={
              <Image src="/logos/vue.svg" alt="Vue" width={85} height={100} />
            }
            title="Vue"
            id="vue"
            experimental
          />
        </div>
      </div>
    </section>
  );
}
