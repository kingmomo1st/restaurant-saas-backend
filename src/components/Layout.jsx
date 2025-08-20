import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./css/Layout.css";
import { useAuth } from "./AuthContext";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import LocationSelector from "./LocationSelector";
import Footer from "./Footer";
import CartIcon from "./CartIcon.jsx"
import useBranding from "../services/useBranding";
import FranchiseSelector from "./FranchiseSelector.jsx";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source).url();
}

function Layout({ children }) {
  console.log("Layout Component rendering for franchise 1");

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const branding = useBranding();

  const [navData, setNavData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [seoSettings, setSeoSettings] = useState(null);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Detect route change to hide footer briefly
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nav, site, seo] = await Promise.all([
          sanityClient.fetch(`*[_type == "navbar"][0]`),
          sanityClient.fetch(`*[_type == "siteSetting"][0]`),
          // 🔥 Fetch SEO settings from CMS
          sanityClient.fetch(`*[_type == "seoSettings"][0]{
            metaTitle,
            metaDescription,
            keywords,
            googleAnalyticsId,
            facebookPixelId,
            structuredData
          }`)
        ]);
        
        setNavData(nav);
        setSiteSettings(site);
        setSeoSettings(seo);

        console.log("🔍 SEO Settings loaded:", seo);

        // Dynamic favicon
        const favicon =
          site?.whiteLabelEnabled && branding?.faviconPath
            ? branding.faviconPath
            : site?.favicon
            ? urlFor(site.favicon)
            : null;

        if (favicon) {
          const link =
            document.querySelector("link[rel*='icon']") ||
            document.createElement("link");
          link.type = "image/x-icon";
          link.rel = "shortcut icon";
          link.href = favicon;
          document.head.appendChild(link);
        }

        // Dynamic CSS variables
        const root = document.documentElement;

        if (branding) {
          if (branding.primaryColor)
            root.style.setProperty("--primary-color", branding.primaryColor);
          if (branding.secondaryColor)
            root.style.setProperty("--secondary-color", branding.secondaryColor);
          if (branding.fontFamily)
            root.style.setProperty("--font-family", branding.fontFamily);
          if (branding.buttonStyle)
            root.style.setProperty("--button-style", branding.buttonStyle);
        }

        const styles = site?.styleOverrides || {};
        if (styles.primaryColor)
          root.style.setProperty("--primary-color", styles.primaryColor);
        if (styles.secondaryColor)
          root.style.setProperty("--secondary-color", styles.secondaryColor);
        if (styles.backgroundColor)
          root.style.setProperty("--background-color", styles.backgroundColor);
        if (styles.fontFamily)
          root.style.setProperty("--font-family", styles.fontFamily);
        if (styles.buttonRadius)
          root.style.setProperty("--button-radius", styles.buttonRadius);

      } catch (err) {
        console.error("Layout fetch error:", err);
      } finally {
        setLayoutLoaded(true);
      }
    };

    fetchData();
  }, [branding]);

  // 🔥 UPDATE SEO META TAGS (React 19 Compatible)
  useEffect(() => {
    if (!seoSettings && !siteSettings) return;

    // Dynamic page title
    const getPageTitle = () => {
      const baseTitle = seoSettings?.metaTitle || 
        (siteSettings?.whiteLabelEnabled && branding?.siteName) || 
        siteSettings?.siteName || 
        "Restaurant";
      
      switch (location.pathname) {
        case "/":
          return baseTitle;
        case "/menu":
          return `Menu - ${baseTitle}`;
        case "/book-elegantly":
          return `Reservations - ${baseTitle}`;
        case "/private-dining":
          return `Private Dining - ${baseTitle}`;
        case "/order-online":
          return `Order Online - ${baseTitle}`;
        default:
          return baseTitle;
      }
    };

    const getPageDescription = () => {
      const baseDescription = seoSettings?.metaDescription || "Authentic Italian dining experience with fresh ingredients and traditional recipes.";
      
      switch (location.pathname) {
        case "/menu":
          return "Explore our authentic Italian menu featuring fresh pasta, wood-fired pizzas, and traditional dishes.";
        case "/book-elegantly":
          return "Reserve your table for an unforgettable Italian dining experience.";
        case "/private-dining":
          return "Host your special event with our private dining options and customized menus.";
        case "/order-online":
          return "Order authentic Italian food online for pickup or delivery.";
        default:
          return baseDescription;
      }
    };

    // 🔥 UPDATE DOCUMENT TITLE
    document.title = getPageTitle();

    // 🔥 UPDATE META DESCRIPTION
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = getPageDescription();

    // 🔥 UPDATE META KEYWORDS
    if (seoSettings?.keywords?.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = seoSettings.keywords.join(', ');
    }

    // 🔥 UPDATE OPEN GRAPH TAGS
    const updateMetaTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    updateMetaTag('og:title', getPageTitle());
    updateMetaTag('og:description', getPageDescription());
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', window.location.href);

    // 🔥 ADD STRUCTURED DATA
    if (seoSettings?.structuredData) {
      let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.type = 'application/ld+json';
        document.head.appendChild(structuredDataScript);
      }
      
      structuredDataScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": siteSettings?.siteName || "Restaurant",
        "description": getPageDescription(),
        "url": window.location.origin,
        "servesCuisine": "Italian",
        "priceRange": "$$"
      });
    }

  }, [seoSettings, siteSettings, branding, location.pathname]);

  // 🔥 GOOGLE ANALYTICS
  useEffect(() => {
    if (seoSettings?.googleAnalyticsId) {
      console.log("📊 Loading Google Analytics:", seoSettings.googleAnalyticsId);
      
      // Add Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalyticsId}`;
      document.head.appendChild(script);

      // Initialize GA
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', seoSettings.googleAnalyticsId);
    }
  }, [seoSettings]);

  // 🔥 FACEBOOK PIXEL
  useEffect(() => {
    if (seoSettings?.facebookPixelId) {
      console.log("📘 Loading Facebook Pixel:", seoSettings.facebookPixelId);
      
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', seoSettings.facebookPixelId);
      window.fbq('track', 'PageView');
    }
  }, [seoSettings]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayLogo = () => {
    if (siteSettings?.whiteLabelEnabled && branding?.logoPath) {
      return <img src={branding.logoPath} alt="Logo" style={{ height: "40px" }} />;
    }
    if (navData?.logoImage) {
      return <img src={urlFor(navData.logoImage)} alt="Logo" style={{ height: "40px" }} />;
    }
    if (siteSettings?.logo) {
      return <img src={urlFor(siteSettings.logo)} alt="Logo" style={{ height: "40px" }} />;
    }
    return siteSettings?.siteName || navData?.logoText || "Trattoria Bella";
  };

  return (
    <>
      <CartIcon/>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate("/")}>
            {displayLogo()}
          </div>

          <div className="nav-links">
            {navData?.navLinks?.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className={link.highlight ? "nav-link-btn highlight" : ""}
              >
                {link.label}
              </Link>
            ))}

            <div className="nav-location-dropdown">
              <span className="dropdown-label">Locations ▾</span>
              <div className="dropdown-content">
                <LocationSelector />
              </div>
            </div>

            {navData?.ctaButton?.text && navData?.ctaButton?.link && (
              <Link to={navData.ctaButton.link} className="nav-link-btn">
                {navData.ctaButton.text}
              </Link>
            )}
          </div>

          <div className="nav-auth">
            {user ? (
              <>
                <span className="user-greeting">
                  Welcome, {user.email.split("@")[0]}
                </span>
                <Link to="/dashboard" className="nav-link-btn">
                  Dashboard
                </Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link to="/signin">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      {/* 🎯 Main content - full-width handled by route wrappers */}
      <main className={isHomePage ? "full-screen-main" : "layout-main"}>
        {children}
      </main>

      {/* 🎯 Footer outside main container for full width */}
      {!isNavigating && (navData || siteSettings) && <Footer />}
    </>
  );
}

export default Layout;
