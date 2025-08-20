import React, { useState, useEffect } from "react";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient";
import "./css/GallerySalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => {
  try {
    return builder.image(source).url();
  } catch {
    return "/fallback.jpg";
  }
};

const GallerySalumeria = ({ data }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!data || !data.images || data.images.length === 0) return null;

  const {
    sectionTitle = "Our Atmosphere",
    images,
    layoutStyle = "slideshow",
    showInstagramHandle = false,
    instagramHandle,
    showRestaurantName = true,
    restaurantName = "Restaurant Name",
    restaurantTagline = "Fine Dining",
    address = "123 Main St, City, State 12345",
    phone = "(555) 123-4567",
    socialLinks = {}
  } = data;

  // Auto-advance slideshow
  useEffect(() => {
    if (layoutStyle === "slideshow" && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [images.length, layoutStyle]);

  return (
    <section className={`salumeria-gallery-section ${layoutStyle === "grid" ? "grid-layout" : ""}`}>
      {layoutStyle === "grid" ? (
        <>
          <h2 className="salumeria-gallery-title">{sectionTitle}</h2>
          <div className="salumeria-gallery-grid">
            {images.map((img, i) => (
              <img
                key={i}
                src={urlFor(img)}
                alt={img.alt || `Gallery image ${i + 1}`}
                className="salumeria-gallery-image"
              />
            ))}
          </div>
        </>
      ) : (
        <div className="salumeria-slideshow-container">
          <div className="salumeria-content-overlay">
            {showInstagramHandle && instagramHandle && (
              <span className="instagram-handle">{instagramHandle}</span>
            )}
            {showRestaurantName && (
              <div className="restaurant-branding">
                <h1 className="restaurant-name">{restaurantName}</h1>
                {restaurantTagline && (
                  <p className="restaurant-tagline">{restaurantTagline}</p>
                )}
              </div>
            )}
          </div>

          <div className="salumeria-social-icons">
            {Object.entries(socialLinks).map(([platform, url]) =>
              url ? (
                <a
                  key={platform}
                  href={url}
                  className="social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`fab fa-${platform}`}></i>
                </a>
              ) : null
            )}
          </div>

          <div className="salumeria-slideshow-wrapper">
            {images.map((img, i) => (
              <div
                key={i}
                className={`salumeria-slide ${i === currentImageIndex ? "active" : ""}`}
              >
                <img
                  src={urlFor(img)}
                  alt={img.alt || `Gallery image ${i + 1}`}
                  className="salumeria-slideshow-image"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySalumeria;