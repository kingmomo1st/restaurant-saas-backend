import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import { useSelector } from "react-redux";
import { useLoadingState } from "../hooks/useLoadingState";
import "./css/CustomSection.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch (err) {
    console.error("[CustomSection] Image error:", err);
    return "/fallback.jpg";
  }
}

const CustomSection = ({ data, selectedLocationId }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};
  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  const currentLocationId = selectedLocationId || selectedLocation?._id;

  const shouldRender =
    !data?.hidden &&
    (!data?.location?._ref || data.location._ref === currentLocationId) &&
    (data?.title || data?.content || data?.images?.length);

  console.log("[CustomSection Debug]", {
    hasData: !!data,
    isHidden: data?.hidden,
    dataLocationRef: data?.location?._ref,
    currentLocationId,
    hasTitle: !!data?.title,
    hasContent: !!data?.content,
    hasImages: data?.images?.length,
    shouldRender,
  });

  const isLoaded = useLoadingState([shouldRender, data, selectedLocation]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded || !shouldRender) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          setTimeout(() => {
            const elements = el.querySelectorAll("h2, p, img");
            if (elements.length === 0) return;

            gsap.set(elements, { opacity: 0, y: 40 });

            if (animationStyle === "fadeIn") {
              gsap.to(elements, {
                opacity: 1,
                y: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out",
              });
            } else if (animationStyle === "slideLeft") {
              gsap.fromTo(
                elements,
                { x: -100, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 1,
                  stagger: 0.2,
                  ease: "power3.out",
                }
              );
            } else if (animationStyle === "zoomBounce") {
              gsap.fromTo(
                elements,
                { scale: 0.85, opacity: 0 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 1.4,
                  stagger: 0.15,
                  ease: "bounce.out",
                }
              );
            }
          }, 100);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, isLoaded, shouldRender]);

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      className={`custom-section custom-section-${data._key || "block"} ${themeClass} ${
        isVisible ? "visible" : "hidden"
      }`}
      style={{ background: bgStyle, fontFamily }}
    >
      <div className="custom-wrapper">
        {data.title && <h2>{data.title}</h2>}
        {data.content && <PortableText value={data.content} />}
        {Array.isArray(data.images) && data.images.length > 0 && (
          <div className="custom-images">
            {data.images.map((img, i) => (
              <img
                key={i}
                src={urlFor(img)}
                alt={`Custom image ${i + 1}`}
                onError={(e) => {
                  e.target.src = "/fallback.jpg";
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomSection;