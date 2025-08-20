import React, { useEffect, useState } from "react";
import sanityClient from "../sanity/sanityClient.ts";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/SuperAdminPanel.css";

const ManageFranchises = () => {
  const [franchises, setFranchises] = useState([]);
  const [newFranchise, setNewFranchise] = useState("");

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const data = await sanityClient.fetch(`*[_type == "franchise"] | order(title asc)`);
        setFranchises(data);
      } catch (err) {
        toast.error("Failed to fetch franchises.");
        console.error(err);
      }
    };
    fetchFranchises();
  }, []);

  const handleCreate = async () => {
    if (!newFranchise.trim()) {
      toast.warn("Franchise name cannot be empty.");
      return;
    }

    const doc = {
      _type: "franchise",
      _id: `franchise-${uuidv4()}`,
      title: newFranchise.trim(),
    };

    try {
      await sanityClient.createIfNotExists(doc);
      setFranchises((prev) => [...prev, doc]);
      setNewFranchise("");
      toast.success("Franchise created.");
    } catch (err) {
      toast.error("Failed to create franchise.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this franchise?")) return;

    try {
      await sanityClient.delete(id);
      setFranchises((prev) => prev.filter((f) => f._id !== id));
      toast.success("Franchise deleted.");
    } catch (err) {
      toast.error("Failed to delete franchise.");
      console.error(err);
    }
  };

  return (
    <div className="manage-franchises">
      <h3>Manage Franchises 🏢</h3>

      <div className="create-franchise">
        <input
          type="text"
          placeholder="New franchise name..."
          value={newFranchise}
          onChange={(e) => setNewFranchise(e.target.value)}
        />
        <button onClick={handleCreate}>Add Franchise</button>
      </div>

      <ul className="franchise-list">
        {franchises.map((f) => (
          <li key={f._id}>
            <span>{f.title}</span>
            <button onClick={() => handleDelete(f._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageFranchises;