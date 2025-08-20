import React from "react";
import { Link } from "react-router-dom";
import "./css/NavbarSalumeria.css";

const NavbarSalumeria = ({ logoUrl, navLinks = [] }) => {
  // Default links if none are passed in
  const defaultLinks = [
    { title: "Home", href: "/" },
    { title: "About", href: "/#about" }, // Scroll to About on same page
    { title: "Menu", href: "/menu" },
    { title: "Gallery", href: "/gallery" },
    { title: "Private Dining", href: "/private-dining" },
    { title: "Gift Cards", href: "/giftcards" },
  ];

  const linksToUse = navLinks.length > 0 ? navLinks : defaultLinks;

  return (
    <nav className="navbar-salumeria">
      <div className="navbar-container">
        {logoUrl && (
          <Link to="/" className="navbar-logo">
            <img src={logoUrl} alt="Logo" />
          </Link>
        )}

        <ul className="navbar-links">
          {linksToUse.map((link, index) => {
            const isInternal = link.href.startsWith("/") && !link.href.includes("#");

            return (
              <li key={index}>
                {isInternal ? (
                  <Link to={link.href} className="navbar-link">
                    {link.title}
                  </Link>
                ) : (
                  <a href={link.href} className="navbar-link">
                    {link.title}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default NavbarSalumeria;