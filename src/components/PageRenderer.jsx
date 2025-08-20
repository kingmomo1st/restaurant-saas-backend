// src/components/PageRenderer.jsx
import React from "react";
import { PortableText } from "@portabletext/react";
import HeroSection from "./HeroSection";
import MenuSection from "./MenuSection";
import GallerySection from "./GallerySection";
import CustomSection from "./CustomSection";
import VibeSection from "./VibeSection";
import PrivateDining from "./PrivateDining";
import EventBookingSection from "./EventBookingSection";
import WelcomeSection from "./WelcomeSection";


const COMPONENT_MAP = {
  heroSection: HeroSection,
  menuSection: MenuSection,
  gallerySection: GallerySection,
  customSection: CustomSection,
  vibeSection: VibeSection,
  privateDining: PrivateDining,
  eventBookingSection: EventBookingSection,
  welcomeSection: WelcomeSection,
  
};

const PageRenderer = ({ sections }) => {
  if (!sections || !Array.isArray(sections)) return null;

  return (
    <>
      {sections.map((section, index) => {
        const Component = COMPONENT_MAP[section._type];
        if (!Component) return null;
        return <Component key={section._key || index} {...section} />;
      })}
    </>
  );
};

export default PageRenderer;