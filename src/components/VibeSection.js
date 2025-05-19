import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const VibeSection = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    setTimeout(() => {
      const ctx = gsap.context(() => {
        const images = el.querySelectorAll("img");

        gsap.set(images, { opacity: 0, y: 40 });

        gsap.to(images, {
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
    <section className="italian-vibe-section" ref={sectionRef}>
      <div className="vibe-grid">
        {data?.italianVibeImages?.map((img, i) => (
          <img key={i} src={urlFor(img).url()} alt={`Italian Vibe ${i + 1}`} />
        ))}
      </div>
    </section>
  );
};

export default VibeSection;