import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";

// Sections
import HeroSection from "./HeroSection";
import WelcomeSection from "./WelcomeSection";
import MenuSection from "./MenuSection";
import GallerySection from "./GallerySection";
import VibeSection from "./VibeSection";
import CustomSection from "./CustomSection";
import PrivateDining from "./PrivateDining";
import EventBookingSection from "./EventBookingSection";
import CateringSection from "./CateringSection";
import AmbianceSection from "./AmbianceSection";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch {
    return "/fallback.jpg";
  }
}

const Home = () => {
  const [homepageData, setHomepageData] = useState(null);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  useEffect(() => {
    const fetchCMS = async () => {
      if (!selectedLocation?._id) return;

      try {
        const data = await sanityClient.fetch(
          `*[_type == "homepage" && location._ref == $locId && hidden != true][0]{
            heroImage{
              asset->{
                _id,
                url
              },
              alt
            },
            wallpaperImage,
            sections[]{
              sectionRef->{
                ...,
                heroImage{
                  asset->{
                    _id,
                    url  
                  },
                  alt
                },
                italianVibeImages,
                privateDiningImages,
                menuCategories[]{
                  ...,
                  items[]->{
                    _id,
                    name,
                    description,
                    price,
                    priceGlass,
                    priceBottle,
                    sizes,
                    image,
                    category,
                    available
                  }
                }
              },
              order,
              visible
            }
          }`,
          { locId: selectedLocation._id }
        );
        console.log("✅ Fetched homepage data:", data);
        console.log("🏠 Homepage sections debug:", {
          sectionsCount: data?.sections?.length,
          sections: data?.sections?.map(s => ({
            type: s.sectionRef?._type,
            id: s.sectionRef?._id,
            heroImage: s.sectionRef?.heroImage,
            heroTitle: s.sectionRef?.heroTitle
          }))
        });
        setHomepageData(data || null);
      } catch (err) {
        console.error("❌ Failed to fetch homepage data:", err);
      }
    };

    fetchCMS();
  }, [selectedLocation]);

  useEffect(() => {
    if (homepageData?.sections?.length) {
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }
  }, [homepageData]);

  const renderSection = (section, i) => {
    if (!section?._type) return null;
  
    switch (section._type) {
      case "heroSection":
  return (
    <HeroSection
      key="hero"
      data={{
        ...section,
        // Use section's heroImage if it exists, otherwise fall back to homepage heroImage
        heroImage: section.heroImage || homepageData.heroImage
      }}
    />
  );
  
      case "welcomeSection":
        return <WelcomeSection key={i} data={section} />;
  
      case "menuSection":
        return <MenuSection key="menu" section={section} />;
  
      case "gallerySection":
        return <GallerySection key="gallery" data={section} />;
  
      case "vibeSection":
        return <VibeSection key="vibe" data={section} />;
  
      case "customSection":
        return <CustomSection key={section._key || i} data={section} />;
  
      case "privateDining":
        return <PrivateDining key={section._key || i} data={section} />;
  
      case "eventBooking":
        return <EventBookingSection key={section._key || i} data={section} />;
  
      case "ambianceSection":
        return <AmbianceSection key={section._key || i} data={section} />;
  
      case "cateringSection":
        return (
          <CateringSection
            key={section._key || i}
            data={section}
            selectedLocationId={selectedLocation?._id}
          />
        );
  
      default:
        console.warn("🟡 Unknown section type:", section._type);
        return null;
    }
  };

  if (!homepageData) {
    return (
      <p style={{ textAlign: "center", marginTop: "80px" }}>
        No homepage found for this location.
      </p>
    );
  }

  const wallpaperUrl = homepageData?.wallpaperImage
    ? urlFor(homepageData.wallpaperImage)
    : null;

  const filteredSections = homepageData.sections
    ?.filter((sec) => !!sec.sectionRef && sec.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  console.log("✅ Filtered Sections:", filteredSections?.map((s) => s.sectionRef?._type));

  return (
    <div
      className="homepage-wrapper"
      style={{
        backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {filteredSections?.map((sec, i) => renderSection(sec.sectionRef, i))}
    </div>
  );
};

export default Home;

