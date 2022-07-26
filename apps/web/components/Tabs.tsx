import { useRouter } from "next/router";
import { ReactNode } from "react";

export function Tabs({
  items,
  queryId,
}: {
  items: { title: string; content: ReactNode }[];
  queryId: string;
}) {
  // const [selected, setSelected] = useState(items[0]);
  const router = useRouter();
  const selectedKey = router.query[queryId];
  const selected =
    items.filter(({ title }) => title === selectedKey)[0] || items[0];
  function setSelected(newSelected: string) {
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          [queryId]: newSelected,
        },
      },
      undefined,
      { scroll: false }
    );
  }
  const selectedItem = items.filter(({ title }) => selected.title === title)[0];
  return (
    <>
      <div className="mt-4 mb-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {items.map((item, index) => (
            <li className="mr-1" key={index}>
              <a
                className={
                  item.title === selected.title
                    ? "inline-block p-2 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500"
                    : "inline-block p-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 cursor-pointer"
                }
                onClick={() => {
                  setSelected(item.title);
                }}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {selectedItem.content}
    </>
  );
}
