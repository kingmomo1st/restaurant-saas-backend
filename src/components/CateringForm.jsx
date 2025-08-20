import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import "./css/CateringForm.css";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch {
    return "/fallback.jpg";
  }
}

const fetchCateringContent = async () => {
  try {
    const data = await sanityClient.fetch(`*[_type == "cateringSection" && !hidden][0]`);
    return {
      wallpaper: data?.galleryImages?.[0] ? urlFor(data.galleryImages[0]) : null,
      title: data?.title || "Catering Inquiry",
      paragraphs: data?.paragraphs || [],
    };
  } catch (err) {
    console.error("Error fetching catering content:", err);
    return { wallpaper: null, title: "Catering Inquiry", paragraphs: [] };
  }
};

const CateringForm = () => {
  const navigate = useNavigate();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const [wallpaper, setWallpaper] = useState(null);
  const [title, setTitle] = useState("Catering Inquiry");
  const [paragraphs, setParagraphs] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guestCount: "",
    eventType: "",
    deliveryAddress: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: "",
  });

  useEffect(() => {
    fetchCateringContent().then(({ wallpaper, title, paragraphs }) => {
      setWallpaper(wallpaper);
      setTitle(title);
      setParagraphs(paragraphs);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert("Please select a location first.");
      return;
    }

    const datetime = new Date(`${formData.deliveryDate}T${formData.deliveryTime}`);

    const doc = {
      _type: "cateringEntry",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      guestCount: Number(formData.guestCount),
      eventType: formData.eventType,
      deliveryAddress: formData.deliveryAddress,
      deliveryDateTime: datetime,
      notes: formData.notes,
      status: "Pending",
      location: {
        _type: "reference",
        _ref: selectedLocation._id,
      },
    };

    try {
      await sanityClient.create(doc);
      alert("Catering request submitted!");

      setFormData({
        name: "", email: "", phone: "", guestCount: "", eventType: "",
        deliveryAddress: "", deliveryDate: "", deliveryTime: "", notes: ""
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Catering submission error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="catering-form-container"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h2>{title}</h2>
      {paragraphs.map((block, i) => (
        <p key={i}>{block.children?.[0]?.text || ""}</p>
      ))}

      {!selectedLocation ? (
        <p className="error-message">Please select a location to proceed.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {[
            { label: "Name", name: "name" },
            { label: "Email", name: "email", type: "email" },
            { label: "Phone", name: "phone", type: "tel" },
            { label: "Guest Count", name: "guestCount", type: "number" },
            { label: "Event Type", name: "eventType" },
            { label: "Delivery Address", name: "deliveryAddress" },
            { label: "Delivery Date", name: "deliveryDate", type: "date" },
            { label: "Delivery Time", name: "deliveryTime", type: "time" },
          ].map(({ label, name, type = "text" }) => (
            <div className="form-group" key={name}>
              <label>{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Anything else we should know?"
            />
          </div>

          <button type="submit" className="btn-submit">Submit Catering Request</button>
        </form>
      )}

      <button className="back-home-btn" onClick={() => navigate("/")}>
        ← Back to Home
      </button>
    </div>
  );
};

export default CateringForm;