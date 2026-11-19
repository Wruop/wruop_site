import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Work } from "@/components/Work";
import { Lab } from "@/components/Lab";
import { Icf } from "@/components/Icf";
import { AboutContact } from "@/components/AboutContact";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <div id="top" />
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Services />
        <Work />
        <Lab />
        <Icf />
        <AboutContact />
      </main>
      <Footer />
    </>
  );
}
