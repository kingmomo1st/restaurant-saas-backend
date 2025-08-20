import React, { useEffect, useState, useRef } from "react";
import sanityClient from "../sanity/sanityClient";
import { urlFor } from "../components/utils/imageHelper";
import { useSelector } from "react-redux";
import { PortableText } from "@portabletext/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/privateDiningSalumeria.css";

gsap.registerPlugin(ScrollTrigger);

const PrivateDiningSalumeria = ({ data: propData }) => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const [data, setData] = useState(propData || null);
  const [isLoading, setIsLoading] = useState(!propData);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sectionRef = useRef(null);
  const bannerRef = useRef(null);
  const contentRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!propData) {
      const fetchContent = async () => {
        setIsLoading(true);
        if (!selectedLocation?._id) {
          setIsLoading(false);
          return;
        }

        try {
          const res = await sanityClient.fetch(
            `*[_type == "privateDiningSalumeria" && location._ref == $locId && visible == true][0]{
              ...,
              wallpaperImage{ ..., asset-> }
            }`,
            { locId: selectedLocation._id }
          );
          setData(res);
        } catch (err) {
          console.error("Failed to fetch private dining data:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [selectedLocation, propData]);

  useEffect(() => {
    if (data && sectionRef.current) {
      const section = sectionRef.current;
      const banner = bannerRef.current;
      const content = contentRef.current;
      const cards = cardsRef.current;

      gsap.set([banner, content, cards], { opacity: 0, y: 50 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(banner, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to(content, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
        .to(cards, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3");

      return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
  }, [data]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedLocation?._id) {
      alert("Please select a location first.");
      return;
    }
  
    const formData = new FormData(e.target);
    const privateDiningData = {
      customerName: formData.get("name"),
      customerEmail: formData.get("email"),
      customerPhone: formData.get("phone"),
      eventDate: formData.get("date"),
      eventTime: formData.get("time"),
      numberOfGuests: parseInt(formData.get("guests")),
      eventType: formData.get("eventType"),
      specialRequests: formData.get("specialRequests"),
      timestamp: new Date().toISOString(),
      locationId: selectedLocation._id,
      franchiseId: selectedLocation.franchise?._ref || selectedLocation._id,
      status: "pending",
      type: "private-dining"
    };
  
    try {
      const response = await fetch("/api/private-dining", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(privateDiningData),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit private dining request.");
      }
  
      alert("Private dining request submitted successfully! We'll contact you soon to discuss details.");
      console.log("Private dining request created:", result);
  
      setIsFormOpen(false);
      e.target.reset();
  
    } catch (error) {
      console.error("Private dining submission error:", error);
      alert("Failed to submit request. Please try again or call us directly.");
    }
  };
  return (
    <section className="private-dining-salumeria" id="private-dining" ref={sectionRef}>
      {/* Banner */}
      <div className="private-dining-banner" ref={bannerRef}>
        {data?.wallpaperImage && (
          <div
            className="banner-background"
            style={{ backgroundImage: `url(${urlFor(data.wallpaperImage)})` }}
          />
        )}
        <div className="banner-overlay">
          <div className="banner-content">
            <h1 className="banner-title">{data?.title || "Private Dining"}</h1>
            {data?.subtitle && <p className="banner-subtitle">{data.subtitle}</p>}
            <button className="cta-button" onClick={() => setIsFormOpen(true)}>
              {data?.ctaText || "Request Private Event"}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      {data?.menuOptions?.length > 0 && (
        <div className="menu-options-section" ref={cardsRef}>
          <div className="content-wrapper">
            <h3>Menu Options</h3>
            <div className="menu-cards">
              {data.menuOptions.map((menu, i) => (
                <div key={i} className="menu-card">
                  <h4>{menu.title}</h4>
                  <p>{menu.description}</p>
                  {menu.priceRange && <span className="price-range">{menu.priceRange}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="form-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsFormOpen(false)}>×</button>
            <h2>Request Private Event</h2>
            <form onSubmit={handleFormSubmit} className="private-dining-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Preferred Date *</label>
                  <input type="date" id="date" name="date" required />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Preferred Time *</label>
                  <input type="time" id="time" name="time" required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="guests">Number of Guests *</label>
                <select id="guests" name="guests" required>
                  <option value="">Select number of guests</option>
                  {[...Array(50)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} guest{i !== 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="event-type">Event Type</label>
                <select id="event-type" name="eventType">
                  <option value="">Select event type</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="business">Business Meeting</option>
                  <option value="celebration">Celebration</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="special-requests">Special Requests</label>
                <textarea
                  id="special-requests"
                  name="specialRequests"
                  rows="4"
                  placeholder="Any dietary restrictions, special accommodations, or other requests..."
                ></textarea>
              </div>
              <button type="submit" className="submit-button">
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default PrivateDiningSalumeria;