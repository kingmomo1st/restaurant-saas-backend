// /components/franchise2/ElegantMenuSalumeria.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../sanity/sanityClient";
import "./css/ElegantMenuSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const ElegantMenuSalumeria = ({ data }) => {
  const [currentView, setCurrentView] = useState("landing");

  if (!data) return null;

  const defaultNavButtons = [
    { buttonText: "← back home", buttonLink: "/", buttonType: "link" },
    { buttonText: "download PDF", buttonLink: "#", buttonType: "pdf-toggle" },
    { buttonText: "online ordering", buttonLink: "/order", buttonType: "link" },
  ];

  const navButtons = data.navigationButtons?.length > 0
    ? data.navigationButtons
    : defaultNavButtons;

  const handlePDFOpen = (pdfFile) => {
    if (pdfFile?.asset?.url) {
      window.open(pdfFile.asset.url, "_blank");
    }
  };

  return (
    <div className="elegant-menu-container">
      {data.backgroundImage && (
        <div
          className="elegant-menu-background"
          style={{ backgroundImage: `url(${urlFor(data.backgroundImage)})` }}
        />
      )}

      <div className="elegant-menu-nav">
        {currentView === "landing" ? (
          navButtons.map((button, idx) =>
            button.buttonType === "pdf-toggle" ? (
              <button
                key={idx}
                className="nav-button"
                onClick={() => setCurrentView("categories")}
              >
                {button.buttonText}
              </button>
            ) : (
              <Link key={idx} to={button.buttonLink} className="nav-button">
                {button.buttonText}
              </Link>
            )
          )
        ) : (
          <button className="nav-button" onClick={() => setCurrentView("landing")}>
            ← back to menu
          </button>
        )}
      </div>

      <div className="elegant-menu-content">
        {currentView === "landing" ? (
          <>
            <h1 className="elegant-menu-title">{data.title || "Menu"}</h1>
            {data.navigationNotice && (
              <p className="elegant-menu-notice">{data.navigationNotice}</p>
            )}

            <div className="elegant-menu-sections">
              {data.staticMenuSections?.map((section, idx) => (
                <div key={idx} className="elegant-menu-section">
                  <h2 className="section-title">{section.categoryTitle}</h2>
                  <div className="section-items">
                    {section.items?.map((item, itemIdx) => (
                      <div key={itemIdx} className="elegant-menu-item">
                        <div className="item-header">
                          <h3 className="item-name">{item.name}</h3>
                          {item.price && (
                            <span className="item-price">${item.price}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="item-description">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="elegant-menu-title">Menus</h1>
            <div className="pdf-categories-grid">
              {data.pdfMenuCategories
                ?.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((category, idx) => (
                  <button
                    key={idx}
                    className="pdf-category-button"
                    onClick={() => handlePDFOpen(category.pdfFile)}
                    title={category.description || category.title}
                  >
                    {category.title}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ElegantMenuSalumeria;