import Contribute from "../components/Contribute";
import Footer from "../components/Footer";
import GetExtension from "../components/GetExtension";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Installation from "../components/Installation";
import Subscribe from "../components/Subscribe";
import Why from "../components/Why";

export default function Home() {
  return (
    <>
      <Header></Header>
      <Hero></Hero>
      <Why></Why>
      <GetExtension></GetExtension>
      <Installation></Installation>
      <Contribute></Contribute>
      <Subscribe></Subscribe>
      <Footer></Footer>
    </>
  );
}
