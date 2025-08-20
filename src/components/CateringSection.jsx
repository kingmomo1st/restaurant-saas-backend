import React, { useEffect, useRef, useState } from "react";
import { PortableText } from "@portabletext/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import { useSelector } from "react-redux";
import "./css/CateringSection.css";
import { useLoadingState } from "../hooks/useLoadingState";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch (err) {
    console.error("[CateringSection] Image error:", err);
    return "/fallback.jpg";
  }
}

const CateringSection = ({ data }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};

  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";
  const animationStyle = branding.animationStyle || "fadeIn";

  // Location filtering
  const shouldRender =
    data &&
    !data.hidden &&
    (!data.location?._ref || data.location._ref === selectedLocation?._id);

  // Coordinated loading state
  const isLoaded = useLoadingState([
    shouldRender,
    data,
    selectedLocation
  ]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded || !shouldRender) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          const items = el.querySelectorAll(
            "h2, p, .catering-images img, .catering-btn"
          );
          if (items.length === 0) return;

          gsap.set(items, { opacity: 0, y: 30 });

          if (animationStyle === "fadeIn") {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 1.1,
              stagger: 0.2,
              ease: "power3.out",
            });
          } else if (animationStyle === "slideLeft") {
            gsap.fromTo(
              items,
              { x: -50, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 1.1,
                stagger: 0.2,
                ease: "power3.out",
              }
            );
          } else if (animationStyle === "zoomBounce") {
            gsap.fromTo(
              items,
              { scale: 0.9, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 1.2,
                stagger: 0.2,
                ease: "back.out(1.7)",
              }
            );
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded, animationStyle, shouldRender]);

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      className={`catering-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{ background: bgStyle, fontFamily }}
    >
      <div className="catering-wrapper">
        {data.title && <h2>{data.title}</h2>}

        {data.paragraphs && <PortableText value={data.paragraphs} />}

        {Array.isArray(data.galleryImages) && data.galleryImages.length > 0 && (
          <div className="catering-images">
            {data.galleryImages.map((img, i) => (
              <img
                key={i}
                src={urlFor(img)}
                alt={`Catering ${i + 1}`}
                onError={(e) => {
                  e.target.src = "/fallback.jpg";
                  console.error("[CateringSection] Image failed to load:", img);
                }}
              />
            ))}
          </div>
        )}

        {data.buttonText && data.buttonLink && (
          <a href={data.buttonLink} className="catering-btn">
            {data.buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

export default CateringSection;