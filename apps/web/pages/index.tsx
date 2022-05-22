import Contribute from "../components/Contribute";
import Footer from "../components/Footer";
import GetExtension from "../components/GetExtension";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Installation from "../components/Installation";
import Subscribe from "../components/Subscribe";

export default function Home() {
  return (
    <>
      <Header></Header>
      <Hero></Hero>
      <GetExtension></GetExtension>
      <Installation></Installation>
      <Contribute></Contribute>
      <Subscribe></Subscribe>
      <Footer></Footer>
    </>
  );
}
