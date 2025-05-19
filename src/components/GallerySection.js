import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/gallery.css";
import decor1 from "../components/picture2.0/ItalianArt1.jpg";
import decor2 from "../components/picture2.0/ItalianArt2.jpg";
import decor3 from "../components/picture2.0/ItalianArt3.jpg";
import decor4 from "../components/picture2.0/ItalianArt4.jpg";
import decor5 from "../components/picture2.0/ItalianArt5.jpg";

gsap.registerPlugin(ScrollTrigger);

const galleryImages = [
  { url: decor1, alt: "Italian Decor", caption: "Warm Interior — Rome" },
  { url: decor2, alt: "Fine Italian view", caption: "Tuscan Charm" },
  { url: decor3, alt: "Pasta Scene", caption: "Pasta & Wine — Florence" },
  { url: decor4, alt: "Elegant Italian decor", caption: "Golden Hour Vibes" },
  { url: decor5, alt: "Italian Dining Room", caption: "Trattoria Ambiance" },
];

const GallerySection = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    requestAnimationFrame(() => {
      const images = sectionRef.current.querySelectorAll("img");

      if (!images.length) return;

      const ctx = gsap.context(() => {
        gsap.set(images, { opacity: 0, y: 30 });

        gsap.to(images, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          },
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: "power2.out",
        });
      }, sectionRef);

      ScrollTrigger.refresh();

      return () => ctx.revert();
    });
  }, []);

  return (
    <section className="gallery-section show-now" ref={sectionRef}>
      <h2 className="gallery-heading">A Taste of Italy</h2>
      <div className="gallery-item">
        {galleryImages.map((img, index) => (
          <img
            key={index}
            src={img.url}
            alt={img.alt}
            className={index === currentImage ? "active" : ""}
          />
        ))}
        <div className="gallery-caption">
          {galleryImages[currentImage].caption}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;