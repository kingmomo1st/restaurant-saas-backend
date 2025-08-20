import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import "./css/MenuSection.css";
import { useLoadingState } from "../hooks/useLoadingState";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch {
    return "/fallback.jpg";
  }
}

const MenuSection = ({ section }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};

  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  useEffect(() => {
    const initializeMenuData = async () => {
      // Use static section data if available
      if (section?.menuCategories?.length > 0) {
        const firstCategory = section.menuCategories[0];
        if (firstCategory?.items?.length > 0 && firstCategory.items[0]?.name) {
          setMenuData(section);
          setLoading(false);
          return;
        }
      }

      if (!selectedLocation?._id) {
        setLoading(false);
        return;
      }

      try {
        const query = `*[_type == "menuSection" && location._ref == "${selectedLocation._id}"][0]{
          _id,
          menuSectionTitle,
          menuCategories[]{
            _key,
            title,
            image,
            wallpaperImage,
            items[]->{
              _id,
              name,
              description,
              category,
              image,
              sizes,
              price,
              priceGlass,
              priceBottle,
              available
            }
          }
        }`;

        const result = await sanityClient.fetch(query);
        if (result) {
          setMenuData(result);
        }
      } catch (error) {
        console.error("❌ Error fetching menu data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeMenuData();
  }, [section, selectedLocation]);

  // Coordinated loading state
  const isLoaded = useLoadingState([
    menuData,
    !loading,
    selectedLocation
  ]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && menuData && isLoaded) {
          setIsVisible(true);
          observer.disconnect();

          setTimeout(() => {
            const cards = el.querySelectorAll(".menu-card");
            if (cards.length === 0) return;

            gsap.set(cards, { opacity: 0 });

            const anim = {
              fadeIn: {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power3.out"
              },
              slideLeft: {
                from: { x: -80, opacity: 0 },
                to: { x: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" }
              },
              zoomBounce: {
                from: { scale: 0.85, opacity: 0 },
                to: { scale: 1, opacity: 1, duration: 0.8, stagger: 0.15, ease: "bounce.out" }
              }
            }[animationStyle];

            if (anim?.from) {
              gsap.fromTo(cards, anim.from, anim.to);
            } else if (anim) {
              gsap.to(cards, anim);
            }

            ScrollTrigger.refresh();
          }, 100);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, loading, menuData, isLoaded]);

  // Loading state
  if (loading) {
    return (
      <section className="menu-selection-section loading">
        <h2>Loading Menu…</h2>
        <div className="menu-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="menu-card skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No data state
  if (!menuData || !menuData.menuCategories?.length) {
    return (
      <section className="menu-selection-section">
        <h2>Our Menu</h2>
        <p style={{ textAlign: "center", padding: "2rem" }}>
          No menu available for this location.
        </p>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`menu-selection-section ${isVisible ? "show" : "hide"} ${themeClass}`}
      style={{ background: bgStyle, fontFamily }}
    >
      <h2 className="section-title">{menuData.menuSectionTitle || "Our Menu"}</h2>
      <div className="menu-grid">
        {menuData.menuCategories.map((cat, index) => (
          <Link
            to={`/menu?category=${encodeURIComponent(cat.title)}`}
            key={cat._key || index}
            className="menu-card"
          >
            <div className="menu-image">
              <img
                src={cat.image ? urlFor(cat.image) : "/fallback.jpg"}
                alt={cat.title || "Menu category"}
                onError={(e) => (e.target.src = "/fallback.jpg")}
              />
            </div>
            <h3 className="menu-title">{cat.title}</h3>
            <div className="menu-card-footer">
              <p className="view-menu-btn">View Menu →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MenuSection;