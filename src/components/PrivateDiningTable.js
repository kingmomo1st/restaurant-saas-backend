import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPrivateDining, deletePrivateDining, updatePrivateDining } from "../redux/privateDiningSlice";
import moment from "moment";

const PrivateDiningTable = () => {
  const dispatch = useDispatch();
  const { privateDining } = useSelector((state) => state.privateDining);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", eventNature: "", date: "", referral: "", notes: "",
  });

  useEffect(() => {
    dispatch(fetchPrivateDining());
  }, [dispatch]);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "", email: item.email || "", phone: item.phone || "",
      eventNature: item.eventNature || "", date: item.date || "",
      referral: item.referral || "", notes: item.notes || "",
    });
  };

  const handleSave = () => {
    dispatch(updatePrivateDining({ ...formData, id: editingId }));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (!Array.isArray(privateDining)) return <p>No private dining data found.</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Phone</th><th>Event</th>
          <th>Date</th><th>Referral</th><th>Notes</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {privateDining.map((item) => (
          <tr key={item.id}>
            {editingId === item.id ? (
              <>
                <td><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></td>
                <td><input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></td>
                <td><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></td>
                <td><input value={formData.eventNature} onChange={(e) => setFormData({ ...formData, eventNature: e.target.value })} /></td>
                <td><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></td>
                <td><input value={formData.referral} onChange={(e) => setFormData({ ...formData, referral: e.target.value })} /></td>
                <td><input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></td>
                <td>
                  <button className="save-btn" onClick={handleSave}>Save</button>
                  <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                </td>
              </>
            ) : (
              <>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>{item.eventNature}</td>
                <td>{item.date ? moment(item.date).format("MMMM Do YYYY, h:mm A") : "N/A"}</td>
                <td>{item.referral}</td>
                <td>{item.notes}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="cancel-btn" onClick={() => dispatch(deletePrivateDining(item.id))}>Delete</button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PrivateDiningTable;