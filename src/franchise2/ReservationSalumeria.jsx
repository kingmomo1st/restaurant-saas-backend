import React, { useEffect, useState, useRef } from "react";
import sanityClient from "../sanity/sanityClient";
import { urlFor } from "../components/utils/imageHelper";
import { useSelector } from "react-redux";
import { PortableText } from "@portabletext/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/ReservationSalumeria.css";

gsap.registerPlugin(ScrollTrigger);

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const ReservationSalumeria = ({ data: propData }) => {
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const [data, setData] = useState(propData || null);
  const [isLoading, setIsLoading] = useState(!propData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState("");

  const sectionRef = useRef(null);
  const bannerRef = useRef(null);
  const contentRef = useRef(null);
  const optionsRef = useRef(null);

  useEffect(() => {
    console.log("🔍 ReservationSalumeria - Starting fetch check:", {
      propData,
      selectedLocation: selectedLocation?._id,
      hasSelectedLocation: !!selectedLocation?._id,
    });

    if (!propData) {
      const fetchContent = async () => {
        setIsLoading(true);
        if (!selectedLocation?._id) {
          console.log("❌ No selected location, stopping fetch");
          setIsLoading(false);
          return;
        }

        try {
          console.log("🚀 Fetching reservation data for location:", selectedLocation._id);
          const res = await sanityClient.fetch(
            `*[_type == "reservationSalumeria" && location._ref == $locId && visible == true][0]{
              ...,
              backgroundImage{ ..., asset-> }
            }`,
            { locId: selectedLocation._id }
          );
          console.log("📊 Sanity response:", res);
          setData(res);
        } catch (err) {
          console.error("❌ Failed to fetch reservation data:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchContent();
    }
  }, [selectedLocation, propData]);

  useEffect(() => {
    if (data && sectionRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      if (bannerRef.current) {
        gsap.set(bannerRef.current, { opacity: 0, y: 30 });
        tl.to(bannerRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }

      if (contentRef.current) {
        gsap.set(contentRef.current, { opacity: 0, y: 30 });
        tl.to(contentRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.3");
      }

      if (optionsRef.current) {
        gsap.set(optionsRef.current, { opacity: 0, y: 30 });
        tl.to(optionsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.2");
      }

      return () => ScrollTrigger.getAll().forEach((t) => t.kill());
    }
  }, [data]);

  const handleReservationSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation?._id) {
      alert("Please select a location first.");
      return;
    }

    const formData = new FormData(e.target);
    const reservationData = {
      customerName: formData.get("customerName"),
      customerEmail: formData.get("customerEmail"),
      customerPhone: formData.get("customerPhone"),
      reservationDate: formData.get("reservationDate"),
      reservationTime: formData.get("reservationTime"),
      partySize: parseInt(formData.get("partySize")),
      occasion: formData.get("occasion"),
      specialRequests: formData.get("specialRequests"),
      timestamp: new Date().toISOString(),
      locationId: selectedLocation._id,
      franchiseId: selectedLocation.franchise?._ref || selectedLocation._id,
      status: "pending",
      type: "regular-reservation",
    };

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create reservation.");

      alert("Reservation request submitted successfully! We'll contact you soon to confirm.");
      setIsFormOpen(false);
      setSelectedDate("");
      setSelectedTime("");
      setPartySize("");
      e.target.reset();
    } catch (error) {
      console.error("Reservation submission error:", error);
      alert("Failed to submit reservation. Please try again or call us directly.");
    }
  };

  if (isLoading || !data) {
    console.log("⏳ Showing loading state:", {
      isLoading,
      hasData: !!data,
      selectedLocation: selectedLocation?._id,
    });

    return (
      <div
        style={{
          height: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          color: "#666",
          fontFamily: '"Libre Baskerville", serif',
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
          Loading reservation information…
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#999",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          Debug Info:<br />
          isLoading: {isLoading.toString()}<br />
          hasData: {(!!data).toString()}<br />
          locationId: {selectedLocation?._id || "none"}<br />
          propData: {propData ? "provided" : "null"}
        </div>
      </div>
    );
  }

  console.log("✅ Reservation component rendering with data:", data);

  return (
    <section className="salumeria-reservation-section" id="reservations" ref={sectionRef}>
      <div className="reservation-banner" ref={bannerRef}>
        {data?.backgroundImage && (
          <div
            className="banner-background"
            style={{ backgroundImage: `url(${urlFor(data.backgroundImage)})` }}
          />
        )}
        <div className="banner-overlay">
          <div className="banner-content">
            <h1 className="banner-title">{data?.title || "Reservations"}</h1>
            {data?.subtitle && <p className="banner-subtitle">{data.subtitle}</p>}
            <button className="reservation-cta-button" onClick={() => setIsFormOpen(true)}>
              Reserve Now
            </button>
          </div>
        </div>
      </div>

      <div className="reservation-content" ref={contentRef}>
        <div className="content-wrapper">
          {data?.description && (
            <div className="description-section">
              <PortableText value={data.description} />
            </div>
          )}
          {data?.operatingHours?.length > 0 && (
            <div className="hours-section">
              <h3>Operating Hours</h3>
              <div className="hours-grid">
                {data.operatingHours.map((item, idx) => (
                  <div key={idx} className="hours-item">
                    <strong>{item?.day}:</strong> <span>{item?.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {data?.reservationOptions?.length > 0 && (
        <div className="reservation-options-section" ref={optionsRef}>
          <div className="content-wrapper">
            <h3>Reservation Options</h3>
            <div className="options-grid">
              {data.reservationOptions.map((option, i) => (
                <div key={i} className="option-card">
                  <h4>{option?.title}</h4>
                  <p>{option?.description}</p>
                  {option?.maxPartySize && (
                    <p className="max-party">
                      <strong>Max Party Size:</strong> {option.maxPartySize} guests
                    </p>
                  )}
                  {option?.timeSlots?.length > 0 && (
                    <div className="time-slots">
                      <strong>Available Times:</strong>
                      <div className="slots">
                        {option.timeSlots.map((slot, j) => (
                          <span key={j} className="time-slot">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="option-button" onClick={() => setIsFormOpen(true)}>
                    Book This Option
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data?.reservationPolicies?.length > 0 && (
        <div className="policies-section">
          <div className="content-wrapper">
            <h3>Reservation Policies</h3>
            <ul className="policies-list">
              {data.reservationPolicies.map((policy, i) => (
                <li key={i}>{policy}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="form-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsFormOpen(false)}>×</button>
            <h2>Make a Reservation</h2>
            <form onSubmit={handleReservationSubmit} className="reservation-form">
              <div className="form-group">
                <label htmlFor="customer-name">Full Name *</label>
                <input type="text" id="customer-name" name="customerName" required />
              </div>

              <div className="form-group">
                <label htmlFor="customer-email">Email *</label>
                <input type="email" id="customer-email" name="customerEmail" required />
              </div>

              <div className="form-group">
                <label htmlFor="customer-phone">Phone Number *</label>
                <input type="tel" id="customer-phone" name="customerPhone" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reservation-date">Date *</label>
                  <input
                    type="date"
                    id="reservation-date"
                    name="reservationDate"
                    min={getTodayDate()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reservation-time">Time *</label>
                  <select
                    id="reservation-time"
                    name="reservationTime"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select time</option>
                    {[
                      "17:00", "17:30", "18:00", "18:30",
                      "19:00", "19:30", "20:00", "20:30",
                      "21:00", "21:30",
                    ].map((time) => (
                      <option key={time} value={time}>
                        {new Date(`1970-01-01T${time}:00`).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="party-size">Party Size *</label>
                <select
                  id="party-size"
                  name="partySize"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  required
                >
                  <option value="">Select party size</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} guest{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="occasion">Special Occasion</label>
                <select id="occasion" name="occasion">
                  <option value="">Select occasion (optional)</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="date-night">Date Night</option>
                  <option value="business">Business Dinner</option>
                  <option value="celebration">Celebration</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="special-requests">Special Requests</label>
                <textarea
                  id="special-requests"
                  name="specialRequests"
                  rows="3"
                  placeholder="Dietary restrictions, seating preferences, etc..."
                />
              </div>

              <button type="submit" className="submit-button">
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReservationSalumeria;