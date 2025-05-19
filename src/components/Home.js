import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/Home.css";
import "./css/PrivateDining.css";
import { Link } from "react-router-dom";

import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";

import HeroSection from "./HeroSection.js";
import WelcomeSection from "./WelcomeSection.js";
import MenuSection from "./MenuSection.js";
import GallerySection from "./GallerySection.js";
import VibeSection from "./VibeSection.js";
import CustomSection from "./CustomSection.js";
import PrivateDining from "./PrivateDining.js";

gsap.registerPlugin(ScrollTrigger); // <-- Put this AFTER all imports

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const Home = () => {
  const [homepageData, setHomepageData] = useState(null);

  useEffect(() => {
    const fetchCMS = async () => {
      const data = await sanityClient.fetch(`*[_type == "homepage"][0]`);
      setHomepageData(data);
      console.log("CMS Data Fetched:", data); // okay to log here
    };
    fetchCMS();
  }, []);
  
  useEffect(() => {
    if (homepageData?.sections?.length) {
      setTimeout(() => {
        ScrollTrigger.refresh();  // Forces GSAP to detect all triggers
      }, 500); // Delay to let components mount
    }
  }, [homepageData]);

  const renderSection = (section) => {
    switch (section._type) {
      case "heroSection":
        return <HeroSection key="hero" data={section} />;
      case "welcomeSection":
        return <WelcomeSection key="welcome" data={section} />;
      case "menuSection":
        return <MenuSection key="menu" section={section} />;
      case "gallerySection":
        return <GallerySection key="gallery" />;
      case "vibeSection":
        return <VibeSection key="vibe" data={section} />;
      case "customSection":
        return <CustomSection key={section._key} data={section} />;
      case "privateDining":
        return <PrivateDining key={section._key} data={section} />;
      default:
        return null;
    }
  };

  return (
    <>
      {homepageData?.sections?.length > 0 ? (
        homepageData.sections.map((section) => renderSection(section))
      ) : (
        <p style={{ textAlign: "center", marginTop: "80px" }}>
          No sections to display yet.
        </p>
      )}

      <footer className="footer refined-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>Trattoria Bella</h3>
            <p>
              123 Roma Avenue
              <br />
              New York, NY
            </p>
          </div>
          <div className="footer-hours">
            <h4>Hours</h4>
            <p>Mon - Sun: 11:00am - 11:00pm</p>
          </div>
          <div className="footer-reservations">
            <h4>Reservations</h4>
            <p>
              info@trattoriabella.com
              <br />
              (212)-555-0199
            </p>
          </div>
          <div className="footer-events">
            <h4>Events</h4>
            <p>To request a private event, please contact us directly.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Trattoria Bella. All rights
            reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Home;