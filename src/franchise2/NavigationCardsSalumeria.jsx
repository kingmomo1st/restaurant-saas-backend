import React from "react";
import { Link } from "react-router-dom";
import { urlFor } from "../components/utils/imageHelper";
import "./css/NavigationCardsSalumeria.css";

const NavigationCardsSalumeria = ({ data }) => {
  if (!data || !data.cards || data.cards.length === 0) return null;

  return (
    <section className="salumeria-navigation-cards">
      <div className="nav-cards-container">
        {data.cards.map((card, idx) => (
          <Link to={card.link || "#"} className="nav-card" key={idx}>
            {card.image && (
              <div
                className="nav-card-image"
                style={{
                  backgroundImage: `url(${urlFor(card.image)})`,
                }}
              />
            )}
            <div className="nav-card-title">{card.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NavigationCardsSalumeria;