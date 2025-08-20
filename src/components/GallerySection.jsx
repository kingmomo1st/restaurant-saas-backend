import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import { useSelector } from "react-redux";
import "./css/gallery.css";
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

const GallerySection = ({ data }) => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [images, setImages] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};

  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  useEffect(() => {
    if (!data?.galleryImages?.length) return;
    const formatted = data.galleryImages.map((img, i) => ({
      url: urlFor(img),
      alt: img.alt || `Gallery Image ${i + 1}`,
    }));
    setImages(formatted);
  }, [data]);

  const isLoaded = useLoadingState([
    images,
    data?.galleryImages,
    selectedLocation
  ]);

  useEffect(() => {
    if (!isLoaded) return;

    const section = sectionRef.current;
    const title = titleRef.current;
    const grid = gridRef.current;

    if (!section || !title || !grid) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          const cards = grid.querySelectorAll(".gallery-card");
          if (!cards.length) return;

          gsap.set(section, { opacity: 0 });
          gsap.set(title, { opacity: 0, y: 40 });
          gsap.set(cards, { opacity: 0, y: 60 });

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });

          if (animationStyle === "fadeIn") {
            tl.to(section, { opacity: 1, duration: 0.6 })
              .to(title, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
              .to(cards, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15
              }, "-=0.6");
          } else if (animationStyle === "slideLeft") {
            gsap.set(title, { x: -100 });
            gsap.set(cards, { x: -80 });
            tl.to(section, { opacity: 1, duration: 0.6 })
              .to(title, { opacity: 1, x: 0, y: 0, duration: 0.8 }, "-=0.4")
              .to(cards, {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 0.8,
                stagger: 0.15
              }, "-=0.6");
          } else if (animationStyle === "zoomBounce") {
            gsap.set(title, { scale: 0.9 });
            gsap.set(cards, { scale: 0.85 });
            tl.to(section, { opacity: 1, duration: 0.6 })
              .to(title, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                ease: "back.out(1.7)"
              }, "-=0.4")
              .to(cards, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "back.out(1.7)"
              }, "-=0.6");
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isLoaded, animationStyle]);

  if (!isLoaded) return null;

  return (
    <section
      ref={sectionRef}
      className={`gallery-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{ background: bgStyle, fontFamily }}
    >
      <h2 ref={titleRef} className="gallery-title">
        {data?.galleryTitle || "Gallery"}
      </h2>

      {!images.length ? (
        <div className="gallery-placeholder">
          <p>No gallery images to display</p>
        </div>
      ) : (
        <div ref={gridRef} className="gallery-grid">
          {images.slice(0, 8).map((img, i) => (
            <div className="gallery-card" key={i}>
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                onError={(e) => (e.target.src = "/fallback.jpg")}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GallerySection;