import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import { useSelector } from "react-redux";
import "./css/VibeSection.css";
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

const VibeSection = ({ data }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const sectionLocationId = String(data?.location?._ref || "");
  const currentLocationId = String(selectedLocation?._id || "");

  const animationStyle = selectedLocation?.branding?.animationStyle || "fadeIn";
  const themeClass = selectedLocation?.branding?.themeClass || "";
  const bgStyle = selectedLocation?.branding?.backgroundGradient || "";
  const fontFamily = selectedLocation?.branding?.fontFamily || "";

  useEffect(() => {
    const isNotHidden = data?.hidden !== true;
    const locationMatches = !sectionLocationId || sectionLocationId === currentLocationId;
    const hasImages = Array.isArray(data?.italianVibeImages) && data.italianVibeImages.length > 0;
    setShouldRender(isNotHidden && locationMatches && hasImages);
  }, [data, sectionLocationId, currentLocationId]);

  const isLoaded = useLoadingState([
    shouldRender,
    data?.italianVibeImages,
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

          setTimeout(() => {
            const images = el.querySelectorAll("img");
            if (!images.length) return;

            gsap.set(images, { opacity: 0 });

            const anim = {
              fadeIn: {
                opacity: 1,
                y: 0,
                duration: 1.3,
                stagger: 0.15,
                ease: "power3.out"
              },
              slideLeft: {
                from: { x: -100, opacity: 0 },
                to: {
                  x: 0,
                  opacity: 1,
                  duration: 1.2,
                  stagger: 0.15,
                  ease: "power3.out"
                }
              },
              zoomBounce: {
                from: { scale: 0.8, opacity: 0 },
                to: {
                  scale: 1,
                  opacity: 1,
                  duration: 1.3,
                  stagger: 0.1,
                  ease: "back.out(1.7)"
                }
              }
            }[animationStyle];

            if (anim?.from) {
              gsap.fromTo(images, anim.from, anim.to);
            } else if (anim) {
              gsap.to(images, anim);
            }
          }, 100);
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, isLoaded, shouldRender]);

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      className={`italian-vibe-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{ background: bgStyle, fontFamily }}
    >
      {data.sectionTitle && (
        <h2 className="vibe-title">{data.sectionTitle}</h2>
      )}

      <div className="vibe-grid">
        {data.italianVibeImages.map((img, i) => (
          <img
            key={i}
            src={img ? urlFor(img) : "/fallback.jpg"}
            alt={`Italian Vibe ${i + 1}`}
            loading="lazy"
            onError={(e) => {
              e.target.src = "/fallback.jpg";
              console.error("[VibeSection] Failed to load image:", img);
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default VibeSection;