import Contribute from "../blocks/Contribute";
import Footer from "../blocks/Footer";
import GetExtension from "../blocks/GetExtension";
import Header from "../blocks/Header";
import Hero from "../blocks/Hero";
import ReadMore from "../blocks/ReadMore";
import SetupLinks from "../blocks/SetupLinks";
import Subscribe from "../blocks/Subscribe";
import Why from "../blocks/Why";

export default function Home() {
  return (
    <>
      <Header></Header>
      <Hero></Hero>
      <Why></Why>
      <GetExtension></GetExtension>
      {/* <Installation></Installation> */}
      <SetupLinks></SetupLinks>
      <Contribute></Contribute>
      <Subscribe></Subscribe>
      {/* <Faq></Faq> */}

      <ReadMore></ReadMore>
      <Footer></Footer>
    </>
  );
}
