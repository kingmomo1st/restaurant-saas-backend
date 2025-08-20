import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminEventTable.css";

const AdminEventTable = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    status: "upcoming",
    visibleOnHomepage: true,
    notes: "",
    eventType: "special",
    capacity: 50,
    ticketPrice: 0,
  });

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;

  const canEdit = role === "admin" || role === "manager" || isSuperAdmin;
  const canDelete = role === "admin" || isSuperAdmin;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log(`✅ Events: Fetched ${data.length} events`);
      setEvents(data);
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      setEvents([]);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.date) {
      toast.error("Title and date are required");
      return;
    }
    try {
      const eventData = {
        ...formData,
        franchiseId: selectedFranchise?._id,
        locationId: selectedLocation?._id,
        createdBy: user?.email || "Unknown",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Event created successfully");
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("❌ Error creating event:", err);
      toast.error("Failed to create event");
    }
  };

  const handleUpdate = async () => {
    if (!formData.title.trim() || !formData.date) {
      toast.error("Title and date are required");
      return;
    }
    try {
      const response = await fetch(`/api/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updatedBy: user?.email || "Unknown",
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Event updated successfully");
      setEditingId(null);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error("❌ Error updating event:", err);
      toast.error("Failed to update event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (err) {
      console.error("❌ Error deleting event:", err);
      toast.error("Failed to delete event");
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date ? event.date.slice(0, 16) : "",
      status: event.status || "upcoming",
      visibleOnHomepage: event.visibleOnHomepage ?? true,
      notes: event.notes || "",
      eventType: event.eventType || "special",
      capacity: event.capacity || 50,
      ticketPrice: event.ticketPrice || 0,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      status: "upcoming",
      visibleOnHomepage: true,
      notes: "",
      eventType: "special",
      capacity: 50,
      ticketPrice: 0,
    });
    setEditingId(null);
  };

  const exportCSV = () => {
    const rows = filteredEvents.map((event) => ({
      Title: event.title || "Untitled",
      Description: event.description || "",
      Date: event.date ? format(new Date(event.date), "yyyy-MM-dd HH:mm") : "",
      Status: event.status || "upcoming",
      Type: event.eventType || "special",
      Capacity: event.capacity || 0,
      Price: `$${event.ticketPrice || 0}`,
      Visible: event.visibleOnHomepage ? "Yes" : "No",
      Notes: event.notes || "",
      Created: event.createdAt ? format(new Date(event.createdAt), "yyyy-MM-dd HH:mm") : "",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `events_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedFranchise, selectedLocation]);

  useEffect(() => {
    let result = [...events];
    if (searchTerm) {
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "All") {
      result = result.filter((event) => event.status === filterStatus);
    }
    result.sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt || 0);
      const bDate = new Date(b.date || b.createdAt || 0);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });
    setFilteredEvents(result);
  }, [events, searchTerm, filterStatus, sortOrder]);

  const metrics = {
    total: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    ongoing: events.filter((e) => e.status === "ongoing").length,
    completed: events.filter((e) => e.status === "completed").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="admin-event-table">
        <p>Loading events…</p>
      </div>
    );
  }

  return (
    <div className="admin-event-table">
      {/* Rest of your JSX remains unchanged */}
      {/* (If you want me to reformat the full return block, just paste it again) */}
    </div>
  );
};

export default AdminEventTable;