import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedFranchise } from "../redux/franchiseSlice";
import { setSelectedLocation } from "../redux/locationSlice";

const FranchiseSelector = ({ onSelect }) => {
  const dispatch = useDispatch();
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const franchises = [
    {
      _id: "fallback1",
      title: "Roma Cucina",
      franchiseTitle: "Roma Cucina",
      slug: { current: "roma-cucina" },
      locations: [
        {
          _id: "2d61d79d-ef5f-498e-97e4-0224ac4841b7",
          title: "Roma Cucina Main",
        },
      ],
    },
    {
      _id: "fallback2",
      title: "Mama Lucia UWS",
      franchiseTitle: "Mama Lucia UWS",
      slug: { current: "mama-lucia-uws" },
      locations: [
        {
          _id: "44594aa6-5d2e-430e-aa98-21e942e3b2ea",
          title: "Mama Lucia UWS",
        },
      ],
    },
  ];

  const handleChange = (e) => {
    const selected = franchises.find((f) => f._id === e.target.value);
    if (!selected) return;

    console.log("🔄 Switching to:", selected.title);
    dispatch(setSelectedFranchise(selected));
    dispatch(setSelectedLocation(selected.locations[0]));

    if (onSelect) setTimeout(() => onSelect(), 100);
  };

  return (
    <div className="franchise-selector">
      <label htmlFor="franchise-select">Select Location:</label>
      <select
        id="franchise-select"
        value={selectedFranchise?._id || ""}
        onChange={handleChange}
      >
        <option value="" disabled>
          Choose a location…
        </option>
        {franchises.map((f) => (
          <option key={f._id} value={f._id}>
            {f.franchiseTitle}
          </option>
        ))}
      </select>

      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
        <div>📍 Current: {selectedLocation?.title || "None"}</div>
        <div>🆔 ID: {selectedLocation?._id || "None"}</div>
      </div>
    </div>
  );
};

export default FranchiseSelector;