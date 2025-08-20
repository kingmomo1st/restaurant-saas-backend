import React from "react";
import { urlFor } from "../components/utils/imageHelper";
import { PortableText } from "@portabletext/react";
import "./css/WelcomeSalumeria.css";

const WelcomeSalumeria = ({ data }) => {
  if (!data) return null;

  const { heading, body, image, layout } = data;

  const renderImage = () =>
    image ? (
      <div className="welcome-image">
        <img src={urlFor(image)} alt="Welcome Visual" />
      </div>
    ) : null;

  return (
    <section className={`welcome-salumeria layout-${layout}`}>
      <div className="welcome-content">
        {heading && <h2 className="welcome-heading">{heading}</h2>}
        {body && <p className="welcome-body">{body}</p>}
      </div>

      {layout !== "center" && renderImage()}
    </section>
  );
};

export default WelcomeSalumeria;