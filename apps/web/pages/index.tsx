import Contribute from "../components/Contribute";
import Faq from "../components/Faq";
import Footer from "../components/Footer";
import GetExtension from "../components/GetExtension";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Installation from "../components/Installation";
import ReadMore from "../components/ReadMore";
import SetupLinks from "../components/SetupLinks";
import Subscribe from "../components/Subscribe";
import Why from "../components/Why";

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
