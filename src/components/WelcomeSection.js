import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const WelcomeSection = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const h2 = sectionRef.current.querySelector(".welcome-text h2");
    const ps = sectionRef.current.querySelectorAll(".welcome-text p");
    const buttons = sectionRef.current.querySelectorAll(".btn-group .btn");

    if (!h2 || ps.length === 0 || buttons.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set([h2, ...ps, ...buttons], { opacity: 0, y: 40 });

      gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      })
        .to(h2, { opacity: 1, y: 0, duration: 1 })
        .to(ps, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, "-=0.5")
        .to(buttons, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2 }, "-=0.4");
    }, sectionRef);

    return () => ctx.revert();
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