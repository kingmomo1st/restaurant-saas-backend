import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const CustomSection = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    setTimeout(() => {
      const ctx = gsap.context(() => {
        const elements = el.querySelectorAll("h2, p, img");

        gsap.set(elements, { opacity: 0, y: 40 });

        gsap.to(elements, {
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

      ScrollTrigger.refresh();

      return () => ctx.revert();
    }, 100);
  }, [data]);

  return (
    <section
      ref={sectionRef}
      className={`custom-section custom-section-${data._key}`}
    >
      <div className="custom-wrapper">
        <h2>{data.title}</h2>
        <PortableText value={data.content} />

        {Array.isArray(data.images) && data.images.length > 0 && (
          <div className="custom-images">
            {data.images.map((img, i) => (
              <img
                key={i}
                src={img ? urlFor(img).url() : "/fallback.jpg"}
                alt={`Custom image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomSection;