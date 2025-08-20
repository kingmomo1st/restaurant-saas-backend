import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/WelcomeSection.css";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { PortableText } from "@portabletext/react";
import { useLoadingState } from "../hooks/useLoadingState";

gsap.registerPlugin(ScrollTrigger);

const WelcomeSection = ({ data }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};

  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";
  const animationStyle = branding.animationStyle || "fadeIn";

  const isCorrectLocation = !data?.location || data.location._ref === selectedLocation?._id;

  const isLoaded = useLoadingState([
    data?.welcomeTitle,
    selectedLocation,
    isCorrectLocation
  ]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          setTimeout(() => {
            const heading = el.querySelector("h2");
            const paragraph = el.querySelector(".welcome-description");
            const buttons = el.querySelectorAll(".btn");

            const elements = [heading, paragraph, ...buttons].filter(Boolean);
            if (elements.length === 0) return;

            gsap.set(elements, { opacity: 0, y: 50 });

            const anim = {
              fadeIn: {
                opacity: 1,
                y: 0,
                duration: 1.3,
                stagger: 0.2,
                ease: "power3.out"
              },
              slideLeft: {
                from: { x: -100, opacity: 0 },
                to: { x: 0, opacity: 1, duration: 1.3, stagger: 0.2, ease: "power3.out" }
              },
              zoomBounce: {
                from: { scale: 0.9, opacity: 0 },
                to: { scale: 1, opacity: 1, duration: 1.2, stagger: 0.2, ease: "back.out(1.7)" }
              }
            }[animationStyle];

            if (anim?.from) {
              gsap.fromTo(elements, anim.from, anim.to);
            } else if (anim) {
              gsap.to(elements, anim);
            }
          }, 100);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, isLoaded]);

  if (!data?.title || !isCorrectLocation) return null;

  return (
    <section
      ref={sectionRef}
      className={`welcome-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{ background: bgStyle, fontFamily }}
    >
      <div className="welcome-text">
        <h2>{data.title}</h2>

        {Array.isArray(data?.description) && (
          <div className="welcome-description">
            <PortableText value={data.description} />
          </div>
        )}

        <div className="btn-group">
          {(data?.welcomeButtons || []).map((btn, i) => (
            <Link key={i} to={btn.link} className="btn">
              {btn.text}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;