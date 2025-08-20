import React, { useEffect, useRef, useState } from "react";
import { firestore } from "../firebase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext";
import "./css/KitchenDashboard.css";

const KitchenDashboard = () => {
  const { user } = useAuth();
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const [authorized, setAuthorized] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [filter, setFilter] = useState(() => localStorage.getItem("kitchenOrderFilter") || "All");

  const bottomRef = useRef();
  const soundRef = useRef(null);
  const prevOrderIds = useRef(new Set());

  const role = user?.role;
  const canUpdateStatus = role === "admin" || role === "superAdmin" || role === "manager";

  useEffect(() => {
    const checkRole = async () => {
      const token = await user?.getIdTokenResult();
      setAuthorized(token?.claims?.kitchen === true);
    };
    if (user) checkRole();
  }, [user]);

  useEffect(() => {
    if (!selectedFranchise) return;

    const unsubscribe = firestore
      .collection("liveOrders")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        const fetched = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(order => {
            const franchiseMatch = order.franchiseId === selectedFranchise._id;
            const locationMatch = selectedLocation
              ? order.locationId === selectedLocation._id
              : true;
            return franchiseMatch && locationMatch;
          });

        const newIds = new Set(fetched.map(o => o.id));
        const isNew = [...newIds].some(id => !prevOrderIds.current.has(id));
        if (isNew && soundRef.current) {
          soundRef.current.play().catch(err => console.error("Sound error:", err));
        }

        prevOrderIds.current = newIds;
        setOrders(fetched);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      });

    return () => unsubscribe();
  }, [selectedFranchise, selectedLocation]);

  useEffect(() => {
    localStorage.setItem("kitchenOrderFilter", filter);
  }, [filter]);

  const handleChange = (id, newStatus) => {
    setStatusUpdates(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleUpdate = async (id) => {
    const newStatus = statusUpdates[id];
    if (!newStatus) return;

    try {
      await firestore.collection("liveOrders").doc(id).update({
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Status updated to "${newStatus}"`);
      setStatusUpdates(prev => ({ ...prev, [id]: undefined }));
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
  };

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);
  const metrics = {
    total: orders.length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  if (authorized === null) return <p>Checking access...</p>;
  if (!authorized) return <p>Access denied. Kitchen role only.</p>;
  if (!selectedFranchise) return <p>Please select a franchise to view kitchen orders.</p>;

  return (
    <div className="kitchen-live-orders">
      <h2>Kitchen Dashboard</h2>
      <audio ref={soundRef} src="/notification.mp3" preload="auto" />

      <div className="dashboard-metrics">
        <div><strong>Total:</strong> {metrics.total}</div>
        <div><strong>Preparing:</strong> {metrics.preparing}</div>
        <div><strong>Ready:</strong> {metrics.ready}</div>
        <div><strong>Delivered:</strong> {metrics.delivered}</div>
      </div>

      <div className="order-filter">
        <label>Filter by Status: </label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option>All</option>
          <option value="received">Received</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="kitchen-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>Status</th>
                <th>Placed</th>
                {canUpdateStatus && <th>Update</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <ul className="order-items">
                    {order.items?.map((item, i) => (
                    <li key={i}>{item.name} × {item.quantity}</li>
                      ))}
                    </ul>
                    {order.tableId && (
                    <p><strong>Table:</strong> {order.tableId}</p>
                      )}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.createdAt?.toDate
                      ? formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true })
                      : "—"}
                  </td>
                  {canUpdateStatus && (
                    <td>
                      <select
                        value={statusUpdates[order.id] || order.status}
                        onChange={(e) => handleChange(order.id, e.target.value)}
                      >
                        <option value="received">Received</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <button onClick={() => handleUpdate(order.id)}>Update</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr ref={bottomRef} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;