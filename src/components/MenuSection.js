import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const MenuSection = ({ section }) => {
  const sectionRef = useRef();

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    requestAnimationFrame(() => {
      const el = sectionRef.current;
      const cards = el.querySelectorAll(".menu-category-card");

      if (!cards.length) return;

      const ctx = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 30 });

        gsap.to(cards, {
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
    });
  }, []);

  return (
    <section className="menu-selection-section" ref={sectionRef}>
      <h2>{section.menuSectionTitle}</h2>
      <div className="menu-categories">
        {section.menuCategories?.map((item, i) => (
          <div key={i} className="menu-category-card">
            <img
              src={item.image ? urlFor(item.image).url() : "/fallback.jpg"}
              alt={item.title || `Menu category ${i + 1}`}
            />
            <div className="menu-card-content">
              <h3>{item.title}</h3>
              <Link to={item.link} className="menu-category-btn">
                View {item.title?.split(" ")[0]}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MenuSection;