import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/PrivateDining.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const PrivateDining = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    setTimeout(() => {
      const ctx = gsap.context(() => {
        const elements = el.querySelectorAll("h2, p, a, img");

        gsap.set(elements, { opacity: 0, y: 40 });

        gsap.to(elements, {
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
    <section className="private-dining-section" ref={sectionRef}>
      <div className="private-dining-container">
        <h2 className="section-heading">{data.title}</h2>

        {Array.isArray(data.paragraphs) &&
          data.paragraphs.map((p, i) => <p key={i}>{p}</p>)}

        {data.buttonText && data.buttonLink && (
          <div className="inquire-now-btn-container">
            <Link to={data.buttonLink} className="btn-outline">
              {data.buttonText}
            </Link>
          </div>
        )}

        <div className="image-gallery">
          {Array.isArray(data.galleryImages) &&
            data.galleryImages.map((img, i) => (
              <img
                key={i}
                src={img ? urlFor(img).url() : "/fallback.jpg"}
                alt={`Private Dining ${i + 1}`}
              />
            ))}
        </div>
      </div>
    </section>
  );
};

export default PrivateDining;