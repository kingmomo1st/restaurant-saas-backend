import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/Home.css";

gsap.registerPlugin(ScrollTrigger);

const HeroSection = ({ data }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const el = sectionRef.current;
      const title = el.querySelector(".hero-title");
      const subtitle = el.querySelector(".hero-subtitle");
      const button = el.querySelector(".scroll-btn");

      if (!title || !subtitle || !button) return;

      gsap.set([title, subtitle, button], { opacity: 0, y: 40 });
      console.log("Animating HeroSection", {title , subtitle, button});

      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
        },
        defaults: { ease: "power4.out" },
      })
        .to(title, { opacity: 1, y: 0, duration: 1.2 })
        .to(subtitle, { opacity: 1, y: 0, duration: 1.2 }, "-=0.8")
        .to(button, { opacity: 1, y: 0, duration: 1 }, "-=0.6");

      ScrollTrigger.refresh(); // ensure triggers are recalculated
    }, sectionRef);

    return () => ctx.revert();
  }, [data]);

  return (
    <section
      className="hero"
      ref={sectionRef}
      style={{
        backgroundImage: data?.heroImage?.asset?.url
          ? `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${data.heroImage.asset.url}')`
          : "url('/fallback.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="hero-content">
        <h1 className="hero-title">{data.heroTitle}</h1>
        <p className="hero-subtitle">{data.heroSubtitle}</p>
        {data.heroCtaText && (
          <button
            className="scroll-btn"
            onClick={() =>
              document.querySelector(".welcome-section")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {data.heroCtaText}
          </button>
        )}
      </div>
    </section>
  );
};

export default HeroSection;