import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const WelcomeSection = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    setTimeout(() => {
      const ctx = gsap.context(() => {
        const container = el.querySelector(".welcome-container");
        const elements = container?.querySelectorAll("h2, p, .btn");

        if (elements) {
          gsap.set(elements, { opacity: 0, y: 30 });

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
        }
      }, el);

      ScrollTrigger.refresh();

      return () => ctx.revert();
    }, 100);
  }, []);

  return (
    <section className="welcome-section" ref={sectionRef}>
      <div className="welcome-text">
        <div className="welcome-container">
          <h2>{data.welcomeTitle}</h2>
          {data.welcomeParagraphs?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="btn-group">
            {data.welcomeButtons?.map((btn, i) => (
              <a key={i} href={btn.link} className="btn">
                {btn.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;