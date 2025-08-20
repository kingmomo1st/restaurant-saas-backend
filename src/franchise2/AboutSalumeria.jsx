// /components/franchise2/AboutSalumeria.jsx
import React, { useEffect, useRef } from "react";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import "./css/AboutSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => {
  try {
    return builder.image(source).url();
  } catch {
    return "";
  }
};

const AboutSalumeria = ({ data }) => {
  const sectionRef = useRef(null);
  const leftSideRef = useRef(null);
  const rightSideRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!sectionRef.current) return;

          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          const scrollProgress = Math.max(
            0,
            Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.7))
          );

          if (leftSideRef.current) {
            const leftX = (1 - scrollProgress) * -60;
            const leftY = (1 - scrollProgress) * 40;
            const leftScale = 0.9 + scrollProgress * 0.1;
            leftSideRef.current.style.transform = `translateX(${leftX}px) translateY(${leftY}px) scale(${leftScale})`;
            leftSideRef.current.style.opacity = scrollProgress;
          }

          if (rightSideRef.current) {
            const rightX = (1 - scrollProgress) * 60;
            const rightY = (1 - scrollProgress) * 40;
            const rightScale = 0.85 + scrollProgress * 0.15;
            rightSideRef.current.style.transform = `translateX(${rightX}px) translateY(${rightY}px) scale(${rightScale})`;
            rightSideRef.current.style.opacity = scrollProgress;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderContent = (content) => {
    if (!content || !Array.isArray(content)) return null;

    return content.map((block, i) => {
      if (block._type === "block") {
        return (
          <p key={i}>
            {block.children?.map((child, j) => {
              let text = child.text || "";

              if (child.marks && child.marks.length > 0) {
                child.marks.forEach((mark) => {
                  switch (mark) {
                    case "strong":
                      text = <strong key={`${i}-${j}-strong`}>{text}</strong>;
                      break;
                    case "em":
                      text = <em key={`${i}-${j}-em`}>{text}</em>;
                      break;
                    default:
                      break;
                  }
                });
              }

              return <span key={j}>{text}</span>;
            }) || ""}
          </p>
        );
      }

      return null;
    });
  };

  if (!data) {
    console.log("AboutSalumeria: No data provided");
    return null;
  }

  const {
    title,
    content,
    image,
    imagePosition = "right",
    backgroundColor,
  } = data;

  console.log("AboutSalumeria data:", { title, content, image, imagePosition });

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section
      className={`about-salumeria-section image-${imagePosition}`}
      ref={sectionRef}
      style={sectionStyle}
    >
      <div className="about-split-container">
        <div className="about-left-side" ref={leftSideRef}>
          {title && <h2 className="about-title">{title}</h2>}
          {content && (
            <div className="about-text">{renderContent(content)}</div>
          )}
        </div>

        <div className="about-right-side" ref={rightSideRef}>
          {image && (
            <div className="about-image">
              <img
                src={urlFor(image)}
                alt={title || "About"}
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutSalumeria;