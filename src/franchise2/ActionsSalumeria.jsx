import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { urlFor } from "../components/utils/imageHelper";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./css/ActionsSalumeria.css";

gsap.registerPlugin(ScrollTrigger);

const ActionsSalumeria = ({ data }) => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const circularImageRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonsRef = useRef(null);
  const infoBarRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const circularImage = circularImageRef.current;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const buttons = buttonsRef.current;
    

    if (!section) return;

    gsap.set([circularImage, title, description, buttons], {
      opacity: 0,
      y: 30,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(circularImage, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
      .to(title, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.4")
      .to(description, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.3")
      .to(buttons, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2")

    const handleImageHover = () => {
      gsap.to(circularImage, { scale: 1.02, duration: 0.3, ease: "power2.out" });
    };

    const handleImageLeave = () => {
      gsap.to(circularImage, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    circularImage?.addEventListener("mouseenter", handleImageHover);
    circularImage?.addEventListener("mouseleave", handleImageLeave);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      circularImage?.removeEventListener("mouseenter", handleImageHover);
      circularImage?.removeEventListener("mouseleave", handleImageLeave);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      if (window.location.pathname !== "/reservations" && sectionId === "reservations") {
        navigate("/reservations");
        setTimeout(() => {
          const targetElement = document.getElementById(sectionId);
          targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else if (window.location.pathname !== "/private-dining" && sectionId === "private-dining") {
        navigate("/private-dining");
        setTimeout(() => {
          const targetElement = document.getElementById(sectionId);
          targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      if (sectionId === "reservations") navigate("/reservations");
      else if (sectionId === "private-dining") navigate("/private-dining");
    }
  };

  const handleReservationClick = (e) => {
    e.preventDefault();
    scrollToSection("reservations");
  };

  const handlePrivateDiningClick = (e) => {
    e.preventDefault();
    scrollToSection("private-dining");
  };

  if (!data) return null;

  const {
    sectionTitle = "Reserve a Table",
    description = "We accept reservations and walk-ins. Book a table below or give us a call at 212-877-4800.",
    circularImage,
    reservationButtonText = "Find a Table",
    orderButtonText = "Private Dining",
    phoneNumber = "212-877-4800",
    restaurantLocation = "283 Amsterdam Ave, New York, NY 10023",
  } = data;

  return (
    <section className="actions-salumeria-section" ref={sectionRef}>
      <div className="actions-container">
        <div className="actions-content">
          {/* Left side - Circular Image */}
          <div className="actions-image-side">
            <div className="circular-image-container" ref={circularImageRef}>
              {circularImage && (
                <img
                  src={urlFor(circularImage)}
                  alt="Restaurant atmosphere"
                  className="circular-image"
                />
              )}
            </div>
          </div>

          {/* Right side - Content */}
          <div className="actions-text-side">
            <h2 className="actions-title" ref={titleRef}>
              {sectionTitle}
            </h2>
            <p className="actions-description" ref={descriptionRef}>
              {description}
            </p>
            <div className="actions-buttons" ref={buttonsRef}>
              <button onClick={handleReservationClick} className="action-btn primary-btn">
                {reservationButtonText}
              </button>
              <button onClick={handlePrivateDiningClick} className="action-btn secondary-btn">
                {orderButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActionsSalumeria;