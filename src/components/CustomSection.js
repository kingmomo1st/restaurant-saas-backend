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
    if (!sectionRef.current) return;

    requestAnimationFrame(() => {
      const images = sectionRef.current.querySelectorAll("img");
      const title = sectionRef.current.querySelector("h2");
      const blocks = sectionRef.current.querySelectorAll("p");

      const ctx = gsap.context(() => {
        gsap.set([title, ...blocks, ...images], { opacity: 0, y: 30 });

        gsap.to([title, ...blocks, ...images], {
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