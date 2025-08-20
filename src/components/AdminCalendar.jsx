import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import sanityClient from "../sanity/sanityClient.ts";
import "./css/AdminCalendar.css";
import {logAction} from "./utils/logAction.js"

const statusColors = {
  Upcoming: "#2a9d8f",
  Completed: "#adb5bd",
  Cancelled: "#e76f51",
  "Sold Out": "#f4a261",
};

const statusOptions = ["Upcoming", "Completed", "Cancelled", "Sold Out"];

const AdminCalendar = () => {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await sanityClient.fetch(`*[_type == "eventBooking"]`);
      const mapped = data.map((event) => ({
        id: event._id,
        title: event.eventTitle,
        start: event.eventDate,
        status: event.status,
        backgroundColor: statusColors[event.status] || "#999",
        borderColor: statusColors[event.status] || "#999",
        extendedProps: {
          description: event.description,
          imageUrl: event.image?.asset?.url || "",
          notes: event.internalNotes || "",
        },
      }));
      setAllEvents(mapped);
      setEvents(mapped);
    };
    fetchEvents();
  }, []);

  const handleEventClick = (info) => {
    setModalData({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      ...info.event.extendedProps,
      status: info.event.extendedProps.status || info.event.backgroundColor,
    });
  };

  const handleEventDrop = async (info) => {
    try {
      await sanityClient.patch(info.event.id).set({ eventDate: info.event.start }).commit();
      alert("Event date updated.");
    } catch (err) {
      console.error("Failed to update event date:", err);
      info.revert();
    }
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  useEffect(() => {
    if (selectedStatuses.length === 0) {
      setEvents([]);
    } else {
      setEvents(allEvents.filter((ev) => selectedStatuses.includes(ev.status)));
    }
  }, [selectedStatuses, allEvents]);

  const handleModalChange = (field, value) => {
    setModalData((prev) => ({ ...prev, [field]: value }));
  };

  const saveModalChanges = async () => {
    try {
      await sanityClient.patch(modalData.id).set({
        eventTitle: modalData.title,
        status: modalData.status,
        internalNotes: modalData.notes,
      }).commit();

      setModalData(null);
      window.location.reload(); // refresh for now (you can optimize later)
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };

  return (
    <div className="admin-calendar-container">
      <h2>Event Calendar</h2>

      <div className="calendar-controls">
        <span>Status Filters:</span>
        {statusOptions.map((status) => (
          <label key={status} className="calendar-filter">
            <input
              type="checkbox"
              checked={selectedStatuses.includes(status)}
              onChange={() => handleStatusFilterChange(status)}
            />
            {status}
          </label>
        ))}
        <button className="calendar-clear" onClick={() => setSelectedStatuses([])}>Clear All</button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        editable={true}
        height="auto"
      />

      {modalData && (
        <div className="calendar-modal-overlay" onClick={() => setModalData(null)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Event</h3>
            <label>Title:</label>
            <input
              value={modalData.title}
              onChange={(e) => handleModalChange("title", e.target.value)}
            />

            <label>Status:</label>
            <select
              value={modalData.status}
              onChange={(e) => handleModalChange("status", e.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <label>Internal Notes:</label>
            <textarea
              value={modalData.notes}
              onChange={(e) => handleModalChange("notes", e.target.value)}
            />

            {modalData.imageUrl && (
              <div className="calendar-image-preview">
                <img src={modalData.imageUrl} alt="Event" />
              </div>
            )}

            <button onClick={saveModalChanges}>Save</button>
            <button className="calendar-close" onClick={() => setModalData(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;