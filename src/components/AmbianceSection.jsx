import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSelector } from "react-redux";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/ambiance.css";
import { useLoadingState } from "../hooks/useLoadingState";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => {
  try {
    return builder.image(source).url();
  } catch {
    return "/fallback.jpg";
  }
};

const AmbianceSection = ({ data }) => {
  const {
    title,
    ambianceImages,
    transitionStyle = "fade",
    duration = 3,
  } = data || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const slideRef = useRef(null);
  const sectionRef = useRef(null);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};
  const themeClass = branding.themeClass || "";
  const fontFamily = branding.fontFamily || "";

  // Coordinated loading state
  const isLoaded = useLoadingState([
    ambianceImages,
    selectedLocation,
    data,
  ]);

  // Slideshow interval
  useEffect(() => {
    if (!ambianceImages?.length || !isLoaded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ambianceImages.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [ambianceImages, duration, isLoaded]);

  // Image transition animation
  useEffect(() => {
    if (!slideRef.current || !isVisible) return;

    const img = slideRef.current;

    if (transitionStyle === "fade") {
      gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 1 });
    } else if (transitionStyle === "slide") {
      gsap.fromTo(img, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1 });
    } else if (transitionStyle === "zoom") {
      gsap.fromTo(img, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 });
    }
  }, [currentIndex, transitionStyle, isVisible]);

  // Section visibility observer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded]);

  if (!ambianceImages?.length) return null;

  return (
    <section
      ref={sectionRef}
      className={`ambiance-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{ fontFamily }}
    >
      <h2 className="ambiance-title">{title || "Our Ambiance"}</h2>
      <div className="ambiance-slideshow">
        <img
          ref={slideRef}
          src={urlFor(ambianceImages[currentIndex])}
          alt={`Ambiance ${currentIndex + 1}`}
          onError={(e) => {
            e.target.src = "/fallback.jpg";
            console.error(
              "[AmbianceSection] Image failed to load:",
              ambianceImages[currentIndex]
            );
          }}
        />
      </div>
    </section>
  );
};

export default AmbianceSection;