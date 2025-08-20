import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import "./css/FooterSalumeria.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const FooterSalumeria = () => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const [footerData, setFooterData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchFooter = async () => {
      setIsLoading(true);
      if (!selectedLocation?._id) {
        setIsLoading(false);
        return;
      }

      try {
        const query = `*[_type == "footerSalumeria" && location._ref == $locId][0]`;
        const data = await sanityClient.fetch(query, { locId: selectedLocation._id });
        setFooterData(data);
      } catch (error) {
        console.error("Footer fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFooter();
  }, [selectedLocation]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
  
    if (!email) return;
  
    if (!selectedLocation?._id) {
      alert("Please select a location first");
      return;
    }
  
    setIsSubscribing(true);
  
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          locationId: selectedLocation._id,
          franchiseId: selectedLocation.franchise?._ref || selectedLocation._id,
          source: "footer-newsletter",
          subscribedAt: new Date().toISOString(),
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to subscribe to newsletter");
      }
  
      alert(footerData.successMessage || "Thank you for subscribing! Check your email for confirmation.");
      setEmail("");
      console.log("Newsletter subscription successful:", result);
      
    } catch (error) {
      console.error("Newsletter subscription error:", error);
  
      if (error.message.includes("already subscribed")) {
        alert("You're already subscribed to our newsletter!");
      } else {
        alert("Something went wrong. Please try again or contact us directly.");
      }
  
    } finally {
      setIsSubscribing(false);
    }
  };
  
  if (isLoading) return <div className="footer-loading">Loading footer…</div>;
  if (!footerData || !footerData.visible) return null;

  console.log("FooterSalumeria rendering at:", new Date().getTime());

  return (
    <>
      {/* Main Footer */}
      <footer className="footer-salumeria-main">
        <div className="footer-container">
          {/* Left: Navigation */}
          <div className="footer-column footer-nav">
            <h3 className="footer-heading">{footerData.leftColumnTitle || "Menu"}</h3>
            <ul className="footer-nav-list">
              {footerData.navigationLinks?.map((link, idx) => (
                <li key={idx}>
                  <a href={link.url || "#"} className="footer-nav-link">
                    {link.title}
                  </a>
                </li>
              ))}
              {!footerData.navigationLinks && (
                <>
                  <li><a href="/menu" className="footer-nav-link">{footerData.menuLinkText || "Menu"}</a></li>
                  <li><a href="/reservations" className="footer-nav-link">{footerData.reservationLinkText || "Reserve a Table"}</a></li>
                  <li><a href="/gift-cards" className="footer-nav-link">{footerData.giftCardLinkText || "Gift Cards"}</a></li>
                  <li><a href="/jobs" className="footer-nav-link">{footerData.jobsLinkText || "Jobs"}</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Center: Newsletter */}
          <div className="footer-column footer-newsletter">
            <h3 className="footer-heading">{footerData.newsletterTitle || "Join & Get Updates on Special Events"}</h3>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="newsletter-input-group">
                <label htmlFor="newsletter-email" className="newsletter-label">
                  {footerData.emailLabel || "Email"} *
                </label>
                <input
                  type="email"
                  id="newsletter-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-input"
                  placeholder={footerData.emailPlaceholder || "Enter your email"}
                  required
                />
              </div>
              <button
                type="submit"
                className="newsletter-button"
                disabled={isSubscribing}
              >
                {isSubscribing
                  ? footerData.subscribingText || "Subscribing..."
                  : footerData.buttonText || "Subscribe"}
              </button>
            </form>
          </div>

          {/* Right: Hours */}
          <div className="footer-column footer-hours">
            <h3 className="footer-heading">{footerData.hoursTitle || "Opening Hours"}</h3>
            <div className="hours-info">
              {footerData.locationName && <h4 className="location-name">{footerData.locationName}</h4>}
              {footerData.locationSubtitle && <p className="location-subtitle">{footerData.locationSubtitle}</p>}
              <div className="hours-list">
                {footerData.hours?.map((hourLine, idx) => (
                  <p key={idx} className="hours-item">{hourLine}</p>
                ))}
                {!footerData.hours && (
                  <>
                    <p className="hours-item">{footerData.defaultHours1 || "Monday - Friday: 12pm - 10pm"}</p>
                    <p className="hours-item">{footerData.defaultHours2 || "Saturday - Sunday: 11am - 10pm"}</p>
                    <p className="hours-item">{footerData.defaultHours3 || "Weekend Brunch: 11am - 4pm"}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Bar */}
      <div className="footer-salumeria-bottom">
        <div className="footer-bottom-container">
          {/* Left: Social Icons */}
          <div className="footer-bottom-left">
            {footerData.socialLinks?.slice(0, 2).map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                aria-label={link.platform}
              >
                <span className="social-text">{link.platform}</span>
              </a>
            ))}
          </div>

          {/* Center: Logo */}
          <div className="footer-logo-center">
            {footerData.logoImage ? (
              <div className="footer-logo-with-text">
                <img
                  src={urlFor(footerData.logoImage)}
                  alt={footerData.restaurantName || "Restaurant Logo"}
                  className="footer-logo-image"
                />
                <div className="footer-main-logo">
                  <span className="footer-restaurant-name">
                    {footerData.restaurantName || "RESTAURANT"}
                  </span>
                  {footerData.restaurantSubtitle && (
                    <span className="footer-restaurant-subtitle">
                      {footerData.restaurantSubtitle}
                    </span>
                  )}
                  <div className="footer-logo-border" />
                </div>
              </div>
            ) : (
              <div className="footer-main-logo">
                <span className="footer-restaurant-name">
                  {footerData.restaurantName || "RESTAURANT"}
                </span>
                {footerData.restaurantSubtitle && (
                  <span className="footer-restaurant-subtitle">
                    {footerData.restaurantSubtitle}
                  </span>
                )}
                <div className="footer-logo-border" />
              </div>
            )}
          </div>

          {/* Right: Address & Phone */}
          <div className="footer-bottom-right">
            <span className="bottom-address">{footerData.bottomAddress || footerData.address}</span>
            <span className="bottom-divider">|</span>
            <span className="bottom-phone">{footerData.bottomPhone || footerData.phoneNumber}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FooterSalumeria;