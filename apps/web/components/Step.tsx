import { ReactNode } from "react";
import { StepIcon } from "./StepIcon";

export function Step({
  no,
  title,
  children,
}: {
  no: number | string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4 mb-4">
      <StepIcon no={no} />
      <div className="flex-grow-0 mt-2 overflow-hidden">
        <h2 className="mb-3 text-lg font-medium text-gray-900 title-font">
          {title}
        </h2>
        <div>{children}</div>
      </div>
    </div>
  );
}
