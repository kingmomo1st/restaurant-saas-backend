import { useLayoutEffect, useRef, useState } from "react";
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

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    setTimeout(() => {
      const ctx = gsap.context(() => {
        const items = el.querySelectorAll(".gallery-heading, .gallery-item img, .gallery-caption");

        gsap.set(items, { opacity: 0, y: 40 });

        gsap.to(items, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.2,
          ease: "power2.out",
        });
      }, el);

      ScrollTrigger.refresh();

      return () => ctx.revert();
    }, 100);
  }, []);

  return (
    <section className="gallery-section" ref={sectionRef}>
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