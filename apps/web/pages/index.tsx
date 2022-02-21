import Contribute from "../components/Contribute";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Installation from "../components/Installation";

export default function Home() {
  return (
    <>
      <Header></Header>
      <Hero></Hero>
      <Installation></Installation>
      <Contribute></Contribute>
      <Footer></Footer>
    </>
  );
}
