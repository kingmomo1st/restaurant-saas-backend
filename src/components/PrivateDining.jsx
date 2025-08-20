import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/PrivateDining.css";
import { useSelector } from "react-redux";
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

const PrivateDining = ({ data }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};
  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  const isLoaded = useLoadingState([
    data,
    data?.title,
    selectedLocation
  ]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          setTimeout(() => {
            const targets = el.querySelectorAll("h2, p, a, img");
            if (!targets.length) return;

            gsap.set(targets, { opacity: 0 });

            const animProps = {
              opacity: 1,
              y: 0,
              stagger: 0.15,
              ease: "power3.out",
            };

            if (animationStyle === "fadeIn") {
              gsap.to(targets, { ...animProps, duration: 1.3 });
            } else if (animationStyle === "slideLeft") {
              gsap.fromTo(
                targets,
                { x: -100, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 1.2,
                  stagger: 0.15,
                  ease: "power3.out"
                }
              );
            } else if (animationStyle === "zoomBounce") {
              gsap.fromTo(
                targets,
                { scale: 0.85, opacity: 0 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 1.4,
                  stagger: 0.15,
                  ease: "bounce.out"
                }
              );
            }
          }, 100);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, isLoaded]);

  if (!data) return null;

  return (
    <section
      className={`private-dining-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      ref={sectionRef}
      style={{ background: bgStyle, fontFamily }}
    >
      <h2 className="section-heading">{data.title}</h2>

      {(data.paragraphs || []).map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {data.buttonText && data.buttonLink && (
        <div className="inquire-now-btn-container">
          <Link to={data.buttonLink} className="btn-outline">
            {data.buttonText}
          </Link>
        </div>
      )}

      {Array.isArray(data.galleryImages) && data.galleryImages.length > 0 && (
        <div className="image-gallery">
          {data.galleryImages.map((img, i) => (
            <img
              key={i}
              src={img ? urlFor(img) : "/fallback.jpg"}
              alt={`Private Dining ${i + 1}`}
              onError={(e) => {
                e.target.src = "/fallback.jpg";
                console.error("[PrivateDining] Failed to load image:", img);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PrivateDining;