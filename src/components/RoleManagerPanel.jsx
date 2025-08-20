import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import { toast } from "react-toastify";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import "./css/RoleManagerPanel.css";

const RoleManagerPanel = () => {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const locationsSnapshot = await getDocs(collection(firestore, "locations"));

      const userData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const locationData = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || "Unnamed",
      }));

      setUsers(userData);
      setLocations(locationData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(firestore, "users", userId), { role: newRole });
      setUsers(prev =>
        prev.map(user => (user.id === userId ? { ...user, role: newRole } : user))
      );
      toast.success(`Role updated to "${newRole}"`);
    } catch (err) {
      toast.error("Failed to update role");
      console.error(err);
    }
  };

  const handleLocationChange = async (userId, newLocationId) => {
    try {
      await updateDoc(doc(firestore, "users", userId), { locationId: newLocationId });
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, locationId: newLocationId } : user
        )
      );
      toast.success("Location updated");
    } catch (err) {
      toast.error("Failed to update location");
      console.error(err);
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="role-manager-panel">
      <h2>Manage User Roles & Location Access</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Change Role</th>
            <th>Assigned Location</th>
            <th>Change Location</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.firstName || "—"}</td>
              <td>{user.email}</td>
              <td>{user.role || "N/A"}</td>
              <td>
                <select
                  value={user.role || ""}
                  onChange={e => handleRoleChange(user.id, e.target.value)}
                >
                  <option value="">—</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </td>
              <td>
                {locations.find(loc => loc.id === user.locationId)?.title || "—"}
              </td>
              <td>
                <select
                  value={user.locationId || ""}
                  onChange={e => handleLocationChange(user.id, e.target.value)}
                >
                  <option value="">None</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.title}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleManagerPanel;