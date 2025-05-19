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
    if (!sectionRef.current) return;

    const el = sectionRef.current;
    const images = el.querySelectorAll("img");
    const paragraphs = el.querySelectorAll("p");
    const title = el.querySelector(".section-heading");
    const button = el.querySelector(".btn-outline");

    const allElements = [
      title,
      ...paragraphs,
      ...(button ? [button] : []),
      ...images
    ].filter(Boolean); // Remove null/undefined

    if (!allElements.length) return;

    const ctx = gsap.context(() => {
      gsap.set(allElements, { opacity: 0, y: 40 });

      gsap.to(allElements, {
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
        },
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power2.out",
      });
    }, el);

    return () => ctx.revert();
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