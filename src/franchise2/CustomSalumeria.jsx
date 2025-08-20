import React from "react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../components/utils/imageHelper";
import "./css/CustomSalumeria.css";

const CustomSalumeria = ({ data }) => {
  if (!data) return null;

  const {
    title,
    subtitle,
    body,
    image,
    imageAlignment = "right",
    backgroundColor = "#fff",
    textColor = "#000",
  } = data;

  const isImageLeft = imageAlignment === "left";

  return (
    <section
      className="custom-salumeria-section"
      style={{ backgroundColor, color: textColor }}
    >
      <div
        className={`custom-salumeria-content ${
          isImageLeft ? "image-left" : "image-right"
        }`}
      >
        {image && (
          <div className="custom-salumeria-image">
            <img src={urlFor(image)} alt={title || "Custom"} />
          </div>
        )}
        <div className="custom-salumeria-text">
          {title && <h2>{title}</h2>}
          {subtitle && <h4>{subtitle}</h4>}
          {body && <PortableText value={body} />}
        </div>
      </div>
    </section>
  );
};

export default CustomSalumeria;