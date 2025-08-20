import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import sanityClient from "../sanity/sanityClient";
import "./css/HomeSalumeria.css";

// Homepage Sections
import HeroSalumeria from "./HeroSalumeria";
import AboutSalumeria from "./AboutSalumeria";
import ReservationSalumeria from "./ReservationSalumeria";
import NavigationCardsSalumeria from "./NavigationCardsSalumeria";
import ActionsSalumeria from "./ActionsSalumeria";

// Navbar-only Sections
import ElegantMenuSalumeria from "./ElegantMenuSalumeria";
import OrderOnlineSalumeria from "./OrderOnlineSalumeria";
import GiftCardSalumeria from "./GiftCardSalumeria";
import RedeemGiftCardSalumeria from "./RedeemGiftCardSalumeria";
import GallerySalumeria from "./GallerySalumeria";
import CustomSalumeria from "./CustomSalumeria";
import PromoCodeSalumeria from "./PromoCodeSalumeria";
import PrivateDiningSalumeria from "./PrivateDiningSalumeria";

// ✅ Path map
const getViewFromPath = (path) => ({
  "/": "home",
  "/home": "home",
  "/menu": "menu",
  "/order": "order",
  "/giftcards": "giftcards",
  "/gallery": "gallery",
  "/custom": "custom",
  "/promo": "promo",
  "/private-dining": "privateDining",
  "/reservations": "reservations",
  "/about": "about",
  "/giftcard": "giftcards",
  "/hero": "hero",
  "/navigationcards": "navigation",
  "/orderonline": "order",
  "/promocode": "promo",
  "/redeemgiftcard": "giftcards",
  "/reservation": "reservations",
}[path.toLowerCase()] || "home");

const HomeSalumeria = () => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const location = useLocation();
  const navigate = useNavigate();

  const [homepageData, setHomepageData] = useState(null);
  const [sectionData, setSectionData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home");
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    setCurrentView(getViewFromPath(location.pathname));
  }, [location.pathname]);

  const fetchAllData = useCallback(async () => {
    if (!selectedLocation?._id) {
      setDebugInfo({ error: "No selected location" });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const homepage = await sanityClient.fetch(
        `*[_type == "homepageSalumeria" && location._ref == $locId && hidden != true][0]{
          _id,
          wallpaperImage,
          sections[]{
            sectionRef->{ _type, _id, ... },
            order,
            visible
          }
        }`,
        { locId: selectedLocation._id }
      );

      if (!homepage) {
        setDebugInfo({ error: "No homepage found", selectedLocationId: selectedLocation._id });
        setHomepageData(null);
        setIsLoading(false);
        return;
      }

      const sections = (homepage.sections || [])
        .filter((s) => s.sectionRef && s.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s) => s.sectionRef);

      setHomepageData({ ...homepage, sections });

      const safeFetch = async (query, params = {}) => {
        try {
          return await sanityClient.fetch(query, params);
        } catch {
          return null;
        }
      };

      const [elegantMenu, giftCard, redeemGiftCard, gallery, custom] = await Promise.all([
        safeFetch(`*[_type == "elegantMenuSalumeria" && location._ref == $locId][0]`, {
          locId: selectedLocation._id,
        }),
        safeFetch(`*[_type == "giftCardSalumeria" && location._ref == $locId][0]`, {
          locId: selectedLocation._id,
        }),
        safeFetch(`*[_type == "redeemGiftCardSalumeria" && location._ref == $locId][0]`, {
          locId: selectedLocation._id,
        }),
        safeFetch(`*[_type == "gallerySalumeria"][0]`),
        safeFetch(`*[_type == "customSalumeria"][0]`),
      ]);

      
      const navigationCards = sections.find((s) => s._type === "navigationCardsSalumeria") || null;

      setSectionData({
        elegantMenu,
        giftCard,
        redeemGiftCard,
        gallery,
        custom,
        navigationCards,
      });

      setDebugInfo({ success: true, sectionsCount: sections.length });
    } catch (err) {
      console.error("❌ Data fetch error:", err);
      setDebugInfo({ error: err.message });
      setHomepageData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation?._id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const renderHomeSections = () => {
    const sections = homepageData?.sections || [];
    if (!sections.length) {
      return (
        <div className="no-sections">
          <h2>No sections configured</h2>
          <p>Please add sections in Sanity CMS</p>
        </div>
      );
    }

    return sections.map((section, i) => {
      const { _type: type } = section;
      switch (type) {
        case "heroSalumeria":
          return <HeroSalumeria key={i} data={section} />;
        case "aboutSalumeria":
          return <AboutSalumeria key={i} data={section} />;
        case "navigationCardsSalumeria":
          return <NavigationCardsSalumeria key={i} data={section} />;
        case "reservationSalumeria":
          return <ReservationSalumeria key={i} data={section} />;
        case "actionsSalumeria":
          return <ActionsSalumeria key={i} data={section} />;
        case "privateDiningSalumeria":
          return <PrivateDiningSalumeria key={i} data={section} />;
        case "gallerySalumeria":
          return <GallerySalumeria key={i} data={section} />;
        case "customSalumeria":
          return <CustomSalumeria key={i} data={section} />;
        case "elegantMenuSalumeria":
          return null
        default:
          return (
            <div key={i} className="unknown-section">
              <p>Unknown section: {type}</p>
            </div>
          );
      }
    });
  };

  const renderContent = () => {
    if (!homepageData && currentView === "home") {
      return (
        <div className="no-data">
          <h2>No homepage data found</h2>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        return renderHomeSections();
      case "menu":
        return sectionData.elegantMenu ? (
          <ElegantMenuSalumeria data={sectionData.elegantMenu} />
        ) : (
          <div className="no-menu">No menu data found.</div>
        );
      case "order":
        return <OrderOnlineSalumeria />;
      case "giftcards":
        return (
          <>
            {sectionData.giftCard && <GiftCardSalumeria data={sectionData.giftCard} />}
            {sectionData.redeemGiftCard && <RedeemGiftCardSalumeria data={sectionData.redeemGiftCard} />}
          </>
        );
      case "gallery":
        return sectionData.gallery ? <GallerySalumeria data={sectionData.gallery} /> : <div>No gallery</div>;
      case "custom":
        return sectionData.custom ? <CustomSalumeria data={sectionData.custom} /> : <div>No custom section</div>;
      case "promo":
        return (
          <div className="promo-page-container">
            <h1>Promo Codes</h1>
            <PromoCodeSalumeria />
          </div>
        );
      case "privateDining":
        return <PrivateDiningSalumeria />;
      case "reservations":
        return <ReservationSalumeria />;
      default:
        navigate("/");
        return null;
    }
  };

  if (isLoading) return <div className="loading">Loading…</div>;

  return <div className={`salumeria-homepage view-${currentView}`}>{renderContent()}</div>;
};

export default HomeSalumeria;