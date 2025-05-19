import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import ReservationTable from "./ReservationTable";
import PrivateDiningTable from "./PrivateDiningTable";
import AdminDashboardNavbar from "./AdminDashboardNavbar";
import "./css/AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [giftcards, setGiftcards] = useState([]);
  const [currentTab, setCurrentTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(firestore, "users");
      const snapshot = await getDocs(usersRef);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(fetched);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGiftcards = async () => {
      const ref = collection(firestore, "giftcards");
      const snapshot = await getDocs(ref);
      const cards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(0),
      }));
      setGiftcards(cards);
    };
    fetchGiftcards();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const filteredGiftcards = giftcards
    .filter(card =>
      card.recipientEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(card => (filterStatus === "All" ? true : card.status === filterStatus))
    .sort((a, b) => {
      if (sortField === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else {
        return sortOrder === "asc"
          ? a.createdAt - b.createdAt
          : b.createdAt - a.createdAt;
      }
    });

  const exportGiftcardsToCSV = () => {
    const headers = ["Sender", "Recipient", "Email", "Amount", "Status", "Date"];
    const rows = filteredGiftcards.map(card => [
      card.senderName,
      card.recipientName,
      card.recipientEmail,
      `$${card.amount.toFixed(2)}`,
      card.status,
      new Date(card.createdAt).toLocaleDateString(),
    ]);
    const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "giftcards.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRecent = (date) => {
    const now = new Date();
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  };

  return (
    <div className="admin-dashboard">
      <AdminDashboardNavbar />
      <h1>Admin Dashboard</h1>

      <div className="tab-buttons">
        <button onClick={() => setCurrentTab("users")} className={currentTab === "users" ? "active" : ""}>Loyal Users</button>
        <button onClick={() => setCurrentTab("reservations")} className={currentTab === "reservations" ? "active" : ""}>Reservations</button>
        <button onClick={() => setCurrentTab("privateDining")} className={currentTab === "privateDining" ? "active" : ""}>Private Dining</button>
        <button onClick={() => setCurrentTab("giftcards")} className={currentTab === "giftcards" ? "active" : ""}>Gift Cards</button>
      </div>

      {currentTab === "users" && (
        <>
          <h2>Loyal Users Summary</h2>
          <div className="dashboard-stats">
            <div>Total Users: {users.length}</div>
            <div>Total Points: {users.reduce((sum, u) => sum + (u.points || 0), 0)}</div>
            <div>Total Orders: {users.reduce((sum, u) => sum + (u.purchaseHistory?.length || 0), 0)}</div>
          </div>

          <div className="search-export-row">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={exportGiftcardsToCSV}>Export CSV</button>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Points</th>
                  <th>Total Orders</th>
                  <th>Latest Purchase</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className={user.points >= 100 ? "vip-row" : ""}>
                    <td>{user.email}</td>
                    <td>{user.points}</td>
                    <td>{user.purchaseHistory?.length || 0}</td>
                    <td>
                      {user.purchaseHistory?.length > 0
                        ? new Date(user.purchaseHistory[user.purchaseHistory.length - 1].date).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={currentPage === index + 1 ? "active" : ""}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {currentTab === "reservations" && <ReservationTable />}
      {currentTab === "privateDining" && <PrivateDiningTable />}

      {currentTab === "giftcards" && (
        <>
          <h2>Gift Card Submissions</h2>
          <div className="giftcard-filters">
            <input
              type="text"
              placeholder="Search by recipient email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
              <option value="createdAt">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button onClick={exportGiftcardsToCSV}>Export CSV</button>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredGiftcards.map(card => (
                  <tr
                    key={card.id}
                    className={
                      card.redeemed
                        ? "redeemed-row"
                        : isRecent(card.createdAt)
                        ? "vip-row"
                        : ""
                    }
                  >
                    <td>{card.senderName}</td>
                    <td>{card.recipientName}</td>
                    <td>{card.recipientEmail}</td>
                    <td>${card.amount?.toFixed(2)}</td>
                    <td>{card.status}</td>
                    <td>{card.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;