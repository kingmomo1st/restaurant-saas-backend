import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import sanityClient from "../sanity/sanityClient";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaLinkedinIn,
  FaTiktok,
} from "react-icons/fa";
import useBranding from "../services/useBranding";
import "./css/Footer.css";

const iconMap = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  twitter: FaTwitter,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  tiktok: FaTiktok,
};

const Footer = () => {
  const [footerData, setFooterData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const branding = useBranding();

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const locationId = selectedLocation?._id;

        // 🔥 UPDATED: Fetch from CMS tabs instead of old "footer" type
        const [contactInfo, socialLinks, footerContent, businessSettings, siteSettings] = await Promise.all([
          // Contact Information (from CMS Contact tab)
          sanityClient.fetch(
            `*[_type == "contactInfo"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{
              phoneNumber,
              email,
              address,
              hoursDisplay
            }`
          ),

          // Social Media Links (from CMS Social Media Links tab)
          sanityClient.fetch(
            `*[_type == "socialMediaLinks"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{
              facebook,
              instagram,
              twitter,
              tiktok,
              youtube,
              linkedin,
              googleBusiness
            }`
          ),

          // Footer Content (from CMS Footer Content tab)
          sanityClient.fetch(
            `*[_type == "footerContent"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{
              copyrightText,
              privacyPolicyLink,
              termsOfServiceLink,
              aboutUsLink,
              additionalLinks,
              footerMessage
            }`
          ),

          // Business Settings
          sanityClient.fetch(
            `*[_type == "businessSettings"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{
              businessHours
            }`
          ),

          // Site Settings
          sanityClient.fetch(`*[_type == "siteSetting"][0]{whiteLabelEnabled}`)
        ]);

        console.log("🦶 Footer CMS Data:", { contactInfo, socialLinks, footerContent, businessSettings });

    // 🔥 NEW: Transform CMS data into footer format
    const transformedFooterData = {
      restaurantName: selectedLocation?.title || "Restaurant Name",
      address: contactInfo?.address || "Address unavailable",
      reservationPhone: contactInfo?.phoneNumber || null,
      reservationEmail: contactInfo?.email || null,
      hours: contactInfo?.hoursDisplay ? [contactInfo.hoursDisplay] : [],
      
      // Transform social links from object to array
      socialLinks: socialLinks ? Object.entries(socialLinks)
        .filter(([key, value]) => value && key !== '_id' && key !== '_type')
        .map(([platform, url]) => ({ platform, url })) : [],
        
      footerNote: footerContent?.footerMessage || footerContent?.copyrightText || null,
      additionalLinks: footerContent?.additionalLinks || [],
      
      // Business hours transformation
      businessHours: businessSettings?.businessHours || null,
      
      // Default values
      reservationButtonText: "Book a Table",
      reservationButtonLink: "/book-elegantly",
      privateEventText: "To request a private event, please fill out the inquiry form.",
      privateEventButtonText: "Inquire Now", 
      privateEventButtonLink: "/private-dining",
      backgroundColor: "#111"
    };

    setFooterData(transformedFooterData);
    setSiteSettings(siteSettings || {});
    
  } catch (err) {
    console.error("❌ Footer fetch failed:", err);
    
    // 🔥 NEW: Fallback data structure
    setFooterData({
      restaurantName: selectedLocation?.title || "Restaurant Name",
      address: "Address unavailable",
      hours: [],
      socialLinks: [],
      footerNote: null,
      additionalLinks: [],
      reservationButtonText: "Book a Table",
      reservationButtonLink: "/book-elegantly",
      privateEventText: "To request a private event, please fill out the inquiry form.",
      privateEventButtonText: "Inquire Now",
      privateEventButtonLink: "/private-dining",
      backgroundColor: "#111"
    });
  }
};

if (selectedLocation?._id) {
  fetchFooterData();
}


}, [selectedLocation]);

if (!footerData) return null;

const whiteLabel = siteSettings?.whiteLabelEnabled;

const {
  restaurantName = whiteLabel ? branding.siteName : "Trattoria Bella",
  address = "Address unavailable",
  hours = [],
  reservationEmail,
  reservationPhone,
  reservationButtonText = "Book a Table",
  reservationButtonLink = "/book-elegantly",
  privateEventText = "To request a private event, please fill out the inquiry form.",
  privateEventButtonText = "Inquire Now",
  privateEventButtonLink = "/private-dining",
  socialLinks = whiteLabel ? branding.socialLinks || [] : footerData.socialLinks || [],
  footerNote = whiteLabel ? branding.footerText : footerData.footerNote,
  additionalLinks = [],
  backgroundColor = whiteLabel
    ? branding.colors?.primary || "#111"
    : footerData.backgroundColor || "#111",
  businessHours
} = footerData;

// 🔥 NEW: Format business hours for display
const formatBusinessHours = () => {
  if (!businessHours) return hours;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.map(day => {
    const dayData = businessHours[day];
    if (!dayData || dayData.closed) {
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`;
    }
    return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayData.open} - ${dayData.close}`;
  });
};

const displayHours = formatBusinessHours();

return (
  <footer
    className="restaurant-footer"
    style={{
      backgroundColor: backgroundColor,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "#fdf6ed",
    }}
  >
<div className="footer-content">
<div className="footer-column">
<h3 className="footer-title">{restaurantName}</h3>
<p>{address}</p>


      {/* 🔥 UPDATED: Social links from CMS */}
      {socialLinks.length > 0 && (
        <div className="footer-socials">
          {socialLinks.map((link, i) => {
            const Icon = iconMap[link.platform?.toLowerCase()];
            return Icon && link.url ? (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.platform}
              >
                <Icon />
              </a>
            ) : null;
          })}
        </div>
      )}
    </div>

    {/* 🔥 UPDATED: Hours from CMS business settings */}
    {displayHours.length > 0 && (
      <div className="footer-column">
        <h4>Hours</h4>
        {displayHours.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    )}

    {/* 🔥 UPDATED: Contact info from CMS */}
    {(reservationEmail || reservationPhone) && (
      <div className="footer-column">
        <h4>Reservations</h4>
        {reservationPhone && <p>📞 {reservationPhone}</p>}
        {reservationEmail && <p>📧 {reservationEmail}</p>}
        <Link to={reservationButtonLink} className="footer-btn">
          {reservationButtonText}
        </Link>
      </div>
    )}

    {privateEventText && (
      <div className="footer-column">
        <h4>Private Dining</h4>
        <p>{privateEventText}</p>
        <Link to={privateEventButtonLink} className="footer-btn">
          {privateEventButtonText}
        </Link>
      </div>
    )}

    {/* 🔥 NEW: Additional links from CMS */}
    {additionalLinks && additionalLinks.length > 0 && (
      <div className="footer-column">
        <h4>Links</h4>
        {additionalLinks.map((link, idx) => (
          <Link key={idx} to={link.url} className="footer-link">
            {link.text}
          </Link>
        ))}
      </div>
    )}
  </div>

  {/* 🔥 UPDATED: Footer message from CMS */}
  {footerNote && (
    <div
      style={{
        marginTop: "40px",
        textAlign: "center",
        fontSize: "12px",
        opacity: 0.8,
      }}
    >
      {footerNote}
    </div>
  )}
</footer>


);
};

export default Footer;