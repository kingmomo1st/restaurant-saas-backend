import React, { useEffect, useState } from "react";
import sanityClient from "../sanity/sanityClient.ts";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/SuperAdminPanel.css";

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [newLocation, setNewLocation] = useState({ title: "", franchiseId: "" });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await sanityClient.fetch(
          `*[_type == "location"]{_id, title, franchise->{_id, title}} | order(title asc)`
        );
        setLocations(data);
      } catch (err) {
        toast.error("Failed to fetch locations.");
        console.error(err);
      }
    };

    const fetchFranchises = async () => {
      try {
        const data = await sanityClient.fetch(`*[_type == "franchise"] | order(title asc)`);
        setFranchises(data);
      } catch (err) {
        toast.error("Failed to fetch franchises.");
        console.error(err);
      }
    };

    fetchLocations();
    fetchFranchises();
  }, []);

  const handleCreate = async () => {
    const { title, franchiseId } = newLocation;
    if (!title.trim() || !franchiseId) {
      toast.warn("Please enter location name and select a franchise.");
      return;
    }

    const doc = {
      _type: "location",
      _id: `location-${uuidv4()}`,
      title: title.trim(),
      franchise: { _type: "reference", _ref: franchiseId },
    };

    try {
      await sanityClient.createIfNotExists(doc);
      const franchise = franchises.find(f => f._id === franchiseId);
      setLocations((prev) => [...prev, { ...doc, franchise }]);
      setNewLocation({ title: "", franchiseId: "" });
      toast.success("Location added successfully.");
    } catch (err) {
      toast.error("Failed to create location.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;

    try {
      await sanityClient.delete(id);
      setLocations((prev) => prev.filter((l) => l._id !== id));
      toast.success("Location deleted.");
    } catch (err) {
      toast.error("Failed to delete location.");
      console.error(err);
    }
  };

  return (
    <div className="manage-locations">
      <h3>Manage Locations 📍</h3>

      <div className="create-location">
        <input
          type="text"
          placeholder="New location name..."
          value={newLocation.title}
          onChange={(e) => setNewLocation((prev) => ({ ...prev, title: e.target.value }))}
        />
        <select
          value={newLocation.franchiseId}
          onChange={(e) => setNewLocation((prev) => ({ ...prev, franchiseId: e.target.value }))}
        >
          <option value="">Select Franchise</option>
          {franchises.map((f) => (
            <option key={f._id} value={f._id}>
              {f.title}
            </option>
          ))}
        </select>
        <button onClick={handleCreate}>Add Location</button>
      </div>

      <ul className="location-list">
        {locations.map((l) => (
          <li key={l._id}>
            <span>
              {l.title} <em>({l.franchise?.title || "No Franchise"})</em>
            </span>
            <button onClick={() => handleDelete(l._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageLocations;