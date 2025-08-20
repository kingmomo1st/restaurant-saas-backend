// /components/franchise2/HeroSalumeria.jsx
import React from "react";
import { Link } from "react-router-dom";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import "./css/HeroSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => {
  try {
    return source ? builder.image(source).url() : null;
  } catch (error) {
    console.warn("Error building image URL:", error);
    return null;
  }
};

const HeroSalumeria = ({ data, onLoadMore }) => {
  if (!data) {
    console.log("HeroSalumeria: No data provided");
    return null;
  }

  console.log("HeroSalumeria data:", data);

  const {
    backgroundImage,
    logoImage,
    tagline,
    ctaText,
    ctaLink,
    restaurantName,
    restaurantSubtitle,
  } = data;

  const handleCTAClick = () => {
    if (onLoadMore && typeof onLoadMore === "function") {
      onLoadMore("welcomeSalumeria");
      onLoadMore("navigationCardsSalumeria");
    }
  };

  const backgroundImageUrl = backgroundImage ? urlFor(backgroundImage) : null;
  const logoImageUrl = logoImage ? urlFor(logoImage) : null;

  return (
    <section
      className="salumeria-hero"
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="salumeria-hero-content">
        {/* Logo Section */}
        <div className="salumeria-logo-container">
          {/* Logo Image */}
          {logoImageUrl && (
            <div className="salumeria-logo-image">
              <img
                src={logoImageUrl}
                alt={restaurantName || "Restaurant Logo"}
                onError={(e) => {
                  console.error("Logo image failed to load:", e);
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Text Logo */}
          <div className="salumeria-main-logo">
            <span className="restaurant-name">
              {restaurantName || "MAMA LUCIA"}
            </span>
            {restaurantSubtitle && (
              <span className="restaurant-subtitle">{restaurantSubtitle}</span>
            )}
            <div className="logo-border"></div>
          </div>

          {/* Tagline */}
          {tagline && (
            <div className="salumeria-tagline-script">{tagline}</div>
          )}
        </div>

        {/* CTA Button */}
        {ctaText && (
          <div className="salumeria-cta-container">
            {ctaLink ? (
              <Link to={ctaLink} className="salumeria-cta-btn">
                {ctaText}
              </Link>
            ) : (
              <button
                className="salumeria-cta-btn"
                onClick={handleCTAClick}
                type="button"
              >
                {ctaText}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSalumeria;