import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./css/PrivateDiningForm.css";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source).url();
}

// 🔥 UPDATED: Fetch BOTH content AND settings from CMS
const fetchPrivateDiningData = async (locationId) => {
  try {
    const data = await sanityClient.fetch(
      `*[_type == "privateDiningPage"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{ wallpaperImage, heading, subtext, packageDescription, minimumPartySize, maximumPartySize, advanceNotice }`
    );

    console.log("🥂 Private Dining CMS Data:", data);

    return {
      wallpaper: data?.wallpaperImage ? urlFor(data.wallpaperImage) : null,
      heading: data?.heading || "Private Dining Inquiry",
      subtext: data?.subtext || "",
      // 🔥 NEW: CMS Settings
      packageDescription: data?.packageDescription || "",
      minimumPartySize: data?.minimumPartySize || 8,
      maximumPartySize: data?.maximumPartySize || 50,
      advanceNotice: data?.advanceNotice || 7
    };

  } catch (err) {
    console.error("Error fetching private dining CMS data:", err);
    return {
      wallpaper: null,
      heading: "Private Dining Inquiry",
      subtext: "",
      packageDescription: "",
      minimumPartySize: 8,
      maximumPartySize: 50,
      advanceNotice: 7
    };
  }
};

const PrivateDiningForm = () => {
  const navigate = useNavigate();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  // Existing state
  const [wallpaper, setWallpaper] = useState(null);
  const [heading, setHeading] = useState("Private Dining Inquiry");
  const [subtext, setSubtext] = useState("");

  // 🔥 NEW: CMS Settings state
  const [packageDescription, setPackageDescription] = useState("");
  const [minimumPartySize, setMinimumPartySize] = useState(8);
  const [maximumPartySize, setMaximumPartySize] = useState(50);
  const [advanceNotice, setAdvanceNotice] = useState(7);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    occasion: "",
    eventDuration: "",
    eventNature: "",
    additionalDetails: "",
    referral: ""
  });

// 🔥 UPDATED: Fetch data when location changes
useEffect(() => {
const loadPrivateDiningData = async () => {
const data = await fetchPrivateDiningData(selectedLocation?._id);


  setWallpaper(data.wallpaper);
  setHeading(data.heading);
  setSubtext(data.subtext);
  
  // 🔥 NEW: Set CMS settings
  setPackageDescription(data.packageDescription);
  setMinimumPartySize(data.minimumPartySize);
  setMaximumPartySize(data.maximumPartySize);
  setAdvanceNotice(data.advanceNotice);
};

loadPrivateDiningData();


}, [selectedLocation]);

// NEW useEffect for full-page wallpaper
useEffect(() => {
  if (wallpaper) {
    // Apply to body for true full-page coverage
    document.body.style.backgroundImage = `url(${wallpaper})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  }
  
  return () => {
    // Clean up when leaving page
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  };
}, [wallpaper]);

// 🔥 NEW: Calculate minimum date based on advance notice
const getMinDate = () => {
const minDate = new Date();
minDate.setDate(minDate.getDate() + advanceNotice);
return minDate.toISOString().split("T")[0]; // Format for date input
};

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({...prev, [name]: value }));
};

const handleSubmit = async (e) => {
e.preventDefault();


if (!selectedLocation) {
  alert("Please select a location before submitting.");
  return;
}

// 🔥 NEW: Validate party size against CMS settings
const guestCount = Number(formData.guests);
if (guestCount < minimumPartySize) {
  alert(`Minimum party size is ${minimumPartySize} guests for private dining.`);
  return;
}

if (guestCount > maximumPartySize) {
  alert(`Maximum party size is ${maximumPartySize} guests for private dining.`);
  return;
}

// 🔥 NEW: Validate advance notice
const selectedDate = new Date(formData.date);
const today = new Date();
const daysDifference = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

if (daysDifference < advanceNotice) {
  alert(`Private dining requests require at least ${advanceNotice} days advance notice.`);
  return;
}

try {
  const combinedDate = new Date(`${formData.date}T${formData.time}`);

  const apiData = {
    requesterName: formData.name,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    date: combinedDate.toISOString(),
    partySize: guestCount,
    guests: guestCount,
    occasion: formData.occasion,
    eventDuration: formData.eventDuration,
    eventNature: formData.eventNature,
    referral: formData.referral,
    notes: formData.additionalDetails,
    status: "pending",
    locationId: selectedLocation._id,
    franchiseId: selectedLocation.franchise?._id || "fallback1",
    // 🔥 NEW: Include CMS settings for reference
    minimumPartySize,
    maximumPartySize,
    advanceNoticeRequired: advanceNotice
  };

  console.log("🥂 Submitting private dining request with CMS validation:", apiData);

  const response = await fetch("/api/private-dining", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apiData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Submission failed");
  }

  console.log("✅ Private dining request submitted:", result);
  alert("Private dining inquiry submitted successfully! You'll receive a confirmation email shortly.");

  setFormData({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: "",
    occasion: "",
    eventDuration: "",
    eventNature: "",
    additionalDetails: "",
    referral: "",
  });

  setTimeout(() => navigate("/success?type=private-dining"), 2000);
} catch (error) {
  console.error("❌ Submission error:", error);
  alert(`Something went wrong: ${error.message}. Please try again.`);
}


};

return (
<div
className="private-dining-form-container">
<h2>{heading}</h2>
{subtext && <p className="private-dining-subtext">{subtext}</p>}


  {/* 🔥 NEW: Show package description from CMS */}
  {packageDescription && (
    <div className="package-info" style={{
      backgroundColor: "rgba(255,255,255,0.95)",
      padding: "20px",
      borderRadius: "8px",
      margin: "20px 0",
      lineHeight: "1.6"
    }}>
      <h3>🍽️ Private Dining Package</h3>
      <p>{packageDescription}</p>
    </div>
  )}

  {/* 🔥 NEW: Show CMS requirements */}
  <div className="dining-requirements" style={{
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: "15px",
    borderRadius: "6px",
    margin: "15px 0",
    fontSize: "14px"
  }}>
    <h4>📋 Requirements:</h4>
    <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
      <li>Party size: {minimumPartySize} - {maximumPartySize} guests</li>
      <li>Advance notice: {advanceNotice} days minimum</li>
      <li>Location: {selectedLocation?.title || "Please select location"}</li>
    </ul>
  </div>

  {!selectedLocation ? (
    <p className="error-message" style={{ textAlign: "center", color: "#b03a2e" }}>
      Please select a restaurant location to proceed.
    </p>
  ) : (
    <form onSubmit={handleSubmit}>
      {[
        { label: "Name", name: "name" },
        { label: "Email", name: "email", type: "email" },
        { label: "Phone", name: "phone", type: "tel" },
        { 
          label: "Date", 
          name: "date", 
          type: "date",
          min: getMinDate() // 🔥 NEW: CMS-controlled minimum date
        },
        { label: "Time", name: "time", type: "time" },
        { 
          label: "Guests", 
          name: "guests", 
          type: "number",
          min: minimumPartySize, // 🔥 NEW: CMS-controlled minimum
          max: maximumPartySize  // 🔥 NEW: CMS-controlled maximum
        },
        { label: "Occasion", name: "occasion" },
        { label: "Duration", name: "eventDuration" },
        { label: "Nature of Event", name: "eventNature" },
        { label: "Referral Source", name: "referral" },
      ].map(({ label, name, type = "text", min, max }) => (
        <div className="form-group" key={name}>
          <label>
            {label}
            {/* 🔥 NEW: Show requirements for guests field */}
            {name === "guests" && (
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>
                {" "}({min}-{max} guests)
              </span>
            )}
            {/* 🔥 NEW: Show advance notice for date field */}
            {name === "date" && (
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>
                {" "}(minimum {advanceNotice} days advance)
              </span>
            )}
          </label>
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            min={min}
            max={max}
            required
          />
        </div>
      ))}

      <div className="form-group">
        <label>Additional Details</label>
        <textarea
          name="additionalDetails"
          value={formData.additionalDetails}
          onChange={handleChange}
          placeholder="Let us know anything important about your event..."
        />
      </div>

      <button type="submit" className="btn-submit">
        Submit Inquiry
      </button>
    </form>
  )}

  <button className="back-home-btn" onClick={() => navigate("/")}>
    ← Back to Home
  </button>
</div>


);
};

export default PrivateDiningForm;