export function StepIcon({ no }: { no: number | string }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mb-5 text-xl text-indigo-500 bg-indigo-100 rounded-full">
      {no}
    </div>
  );
}
