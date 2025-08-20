import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/HeroSection.css";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";
import { useLoadingState } from "../hooks/useLoadingState";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch {
    console.warn("[HeroSection] Invalid image source:", source);
    return null;
  }
}

const HeroSection = ({ data }) => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const sectionRef = useRef(null);
  const contextRef = useRef(null);

  const branding = selectedLocation?.branding || {};
  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const customGradient = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  console.log("🖼️ HeroSection Debug:", {
    data: data,
    fullDataObject: JSON.stringify(data, null, 2), // See everything
    heroImage: data?.heroImage,
    selectedLocation: selectedLocation?._id,
  });
  // Early exit if hidden or not for this location
  if (!data || data.hidden) return null;
  if (data.location?._ref && data.location._ref !== selectedLocation?._id) return null;

  const isLoaded = useLoadingState([
    data,
    selectedLocation,
    data.heroTitle,
    data.heroSubtitle
  ]);

  // Animations
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded) return;
    if (el.dataset.animated === "true") return;

    if (contextRef.current) {
      contextRef.current.revert();
    }

    contextRef.current = gsap.context(() => {
      const title = el.querySelector(".hero-title");
      const subtitle = el.querySelector(".hero-subtitle");
      const button = el.querySelector(".scroll-btn");
      if (!title || !subtitle) return;

      el.dataset.animated = "true";
      gsap.set([title, subtitle, button].filter(Boolean), { opacity: 0, y: 40 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      if (animationStyle === "fadeIn") {
        tl.to(title, { opacity: 1, y: 0, duration: 1.2 })
          .to(subtitle, { opacity: 1, y: 0, duration: 1.2 }, "-=0.8");
        if (button) {
          tl.to(button, { opacity: 1, y: 0, duration: 1 }, "-=0.6");
        }
      } else if (animationStyle === "slideLeft") {
        tl.fromTo(title, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 })
          .fromTo(subtitle, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 }, "-=0.9");
        if (button) {
          tl.fromTo(button, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1 }, "-=0.8");
        }
      } else if (animationStyle === "zoomBounce") {
        tl.fromTo(
          title,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "bounce.out" }
        ).fromTo(
          subtitle,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.1 },
          "-=1"
        );
        if (button) {
          tl.fromTo(
            button,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1 },
            "-=0.9"
          );
        }
      }
    }, el);
  }, [data, animationStyle, isLoaded]);

  useLayoutEffect(() => {
    return () => {
      if (contextRef.current) {
        contextRef.current.revert();
      }
    };
  }, []);

  const safeHeroUrl = data?.heroImage ? urlFor(data.heroImage) : null;
  console.log("🔗 Image URL:", safeHeroUrl); // ← ADD THIS DEBUG LINE HERE
  const backgroundUrl = safeHeroUrl || "/fallback.jpg";
  const gradientOverlay =
    customGradient || "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))";
  const finalBackground = `${gradientOverlay}, url(${backgroundUrl})`;

  return (
    <section
      ref={sectionRef}
      className={`hero ${themeClass}`}
      style={{
        backgroundImage: finalBackground,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily,
        opacity: isLoaded ? 1 : 0,
        transition: isLoaded ? "none" : "opacity 0.3s ease"
      }}
    >
      <div className="hero-content">
        <h1 className="hero-title">{data.heroTitle}</h1>
        <p className="hero-subtitle">{data.heroSubtitle}</p>
        {data.callToActionText && (
          <button
            className="scroll-btn"
            onClick={() => {
              const target = document.querySelector(".welcome-section");
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {data.callToActionText}
          </button>
        )}
      </div>
    </section>
  );
};

export default HeroSection;