import Image, { StaticImageData } from "next/image";
import React from "react";
import articlePreview from "../public/article-preview.png";
import medium from "../public/medium.png";

function ReadMore() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Read more
        </h3>
        <p className="text-center">Get more info on other sites.</p>
        <div className="flex flex-col items-center justify-center gap-4 p-4 mt-4 sm:flex-row">
          <ArticleCard
            link="https://dev.to/michael_vp/introducing-locatorjs-click-on-react-component-to-get-to-its-code-2oj0"
            imageSrc={articlePreview}
            title="Introducing LocatorJS: Click on React Component to get to its code."
            by="by Michael Musil on Dev.to"
            description={`
            LocatorJS is a Chrome Extension that lets me click on a component that
            I see on my locally running app and open its code in my VSCode. With
            just one simple click.
            `}
          />
          <ArticleCard
            link="https://medium.com/@infi.cz/how-i-increased-my-react-development-productivity-by-8-6420c42f4022"
            imageSrc={medium}
            title="How I increased my React development productivity by “8%?”"
            by="by Michael Musil on Medium"
            description={`
            I am a full-stack/React dev, and I like to explore and build
            various dev tooling to improve my productivity. Recently, I was
            trying to solve one simple problem
            `}
          />
        </div>
      </div>
    </section>
  );
}

export default ReadMore;

function ArticleCard({
  link,
  imageSrc,
  title,
  by,
  description,
}: {
  link: string;
  imageSrc: string | StaticImageData;
  title: string;
  by: string;
  description: string;
}) {
  return (
    <a
      href={link}
      className="overflow-hidden transition-shadow shadow-xl bg-slate-50 xl:w-1/4 md:w-1/2 rounded-xl hover:shadow-2xl max-w-[400px]"
    >
      <Image
        className="object-cover object-center w-full h-40 mb-6 rounded"
        src={imageSrc}
        alt="content"
        width="400"
        height="200"
      />
      <div className="p-6 ">
        <h2 className="text-lg font-medium text-gray-900 underline title-font">
          {title}
        </h2>
        <h3 className="mb-4 text-xs font-medium text-gray-500">{by}</h3>
        <p className="text-base leading-relaxed">{description}</p>
      </div>
    </a>
  );
}
