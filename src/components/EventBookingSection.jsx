import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient.ts";
import { useLoadingState } from "../hooks/useLoadingState";
import "./css/EventBookingSection.css";

gsap.registerPlugin(ScrollTrigger);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).width(800).url();
  } catch {
    return "/fallback.jpg";
  }
}

const EventBookingSection = ({ data = {} }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = selectedLocation?.branding || {};

  const animationStyle = branding.animationStyle || "fadeIn";
  const themeClass = branding.themeClass || "";
  const bgStyle = branding.backgroundGradient || "";
  const fontFamily = branding.fontFamily || "";

  console.log("[EventBookingSection] Render Debug:", {
    hasEventTitle: !!data?.eventTitle,
    data,
    isVisible,
  });

  const isLoaded = useLoadingState([
    data,
    data?.eventTitle,
    selectedLocation,
  ]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();

          setTimeout(() => {
            const card = el.querySelector(".event-card");
            if (!card) return;

            gsap.set(card, { opacity: 0, y: 50 });

            if (animationStyle === "fadeIn") {
              gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: "power3.out",
              });
            } else if (animationStyle === "slideLeft") {
              gsap.fromTo(
                card,
                { x: -80, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 1.1,
                  ease: "power3.out",
                }
              );
            } else if (animationStyle === "zoomBounce") {
              gsap.fromTo(
                card,
                { scale: 0.9, opacity: 0 },
                {
                  scale: 1,
                  opacity: 1,
                  duration: 1.2,
                  ease: "back.out(1.7)",
                }
              );
            }
          }, 100);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStyle, isLoaded]);

  if (!data?.eventTitle) {
    console.log("[EventBookingSection] No eventTitle - skipping render");
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={`event-booking-section ${themeClass} ${isVisible ? "visible" : "hidden"}`}
      style={{
        backgroundImage: "none",
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "120px 0",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          content: "",
          position: "absolute",
          inset: 0,
          background: `radial-gradient(
            ellipse 80% 60% at 50% 50%,
            rgba(245, 235, 220, 1) 20%,
            rgba(245, 235, 220, 0.98) 40%,
            rgba(245, 235, 220, 0.85) 60%,
            rgba(245, 235, 220, 0.4) 80%,
            transparent 100%
          )`,
          boxShadow: "inset 0 0 400px rgba(0, 0, 0, 0.02)",
          zIndex: -1,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          padding: "0 40px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2.5rem",
            color: "#8B0000",
            fontWeight: 700,
            fontFamily: "var(--heading-font, 'Playfair Display', serif)",
            marginBottom: "50px",
          }}
        >
          Upcoming Event
        </h2>

        <div
          className="event-card"
          style={{
            backgroundColor: "transparent",
            border: "none",
            boxShadow: "none",
            borderRadius: 0,
            overflow: "visible",
            textAlign: "center",
          }}
        >
          {data.image && (
            <img
              src={urlFor(data.image)}
              alt={data.eventTitle}
              className="event-image"
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "300px",
                objectFit: "cover",
                borderRadius: "12px",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.12)",
                marginBottom: "30px",
              }}
              onError={(e) => {
                e.target.src = "/fallback.jpg";
                console.error("[EventBookingSection] Failed to load image:", data.image);
              }}
            />
          )}

          <div className="event-content" style={{ padding: 0 }}>
            <h3
              style={{
                fontSize: "2rem",
                color: "#8B0000",
                marginBottom: "20px",
                fontFamily: "var(--heading-font, 'Playfair Display', serif)",
                fontWeight: 700,
              }}
            >
              {data.eventTitle}
            </h3>

            <p
              className="event-date"
              style={{
                fontSize: "18px",
                color: "#8B0000",
                marginBottom: "25px",
                fontWeight: 400,
                fontFamily: "var(--body-font, 'Lato', sans-serif)",
              }}
            >
              📅 {new Date(data.eventDate).toLocaleString()}
            </p>

            {data.description && (
              <p
                style={{
                  fontSize: "18px",
                  color: "#8B0000",
                  lineHeight: "1.8",
                  marginBottom: "30px",
                  maxWidth: "700px",
                  margin: "0 auto 30px",
                  fontFamily: "var(--body-font, 'Lato', sans-serif)",
                }}
              >
                {data.description}
              </p>
            )}

            {data.status && (
              <p
                className={`status-tag ${data.status.toLowerCase()}`}
                style={{
                  display: "inline-block",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: 300,
                  backgroundColor: "#8B0000",
                  color: "white",
                  fontFamily: "var(--body-font, 'Lato', sans-serif)",
                  border: "none",
                  cursor: "default",
                }}
              >
                {data.status}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventBookingSection;