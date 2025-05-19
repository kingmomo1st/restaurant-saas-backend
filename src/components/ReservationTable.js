import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteReservation, fetchReservations, updateReservation } from "../redux/reservationSlice";
import moment from "moment";

const ReservationTable = () => {
  const dispatch = useDispatch();
  const { reservations } = useSelector((state) => state.reservations);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", date: "" });

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  const handleEdit = (reservation) => {
    setEditingId(reservation.id);
    setEditFormData({
      name: reservation.name || "",
      email: reservation.email || "",
      date: reservation.date || "",
    });
  };

  const handleSave = () => {
    dispatch(updateReservation({ ...editFormData, id: editingId }));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (!Array.isArray(reservations)) return <p>No reservations found.</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Date</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation.id}>
            {editingId === reservation.id ? (
              <>
                <td><input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} /></td>
                <td><input value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} /></td>
                <td><input type="date" value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} /></td>
                <td>
                  <button className="save-btn" onClick={handleSave}>Save</button>
                  <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                </td>
              </>
            ) : (
              <>
                <td>{reservation.name}</td>
                <td>{reservation.email}</td>
                <td>{reservation.date ? moment(reservation.date).format("MMMM Do YYYY, h:mm A") : "N/A"}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(reservation)}>Edit</button>
                  <button className="cancel-btn" onClick={() => dispatch(deleteReservation(reservation.id))}>Delete</button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ReservationTable;