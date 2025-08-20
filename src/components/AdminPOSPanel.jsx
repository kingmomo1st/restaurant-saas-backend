import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminPOSPanel.css";

const AdminPOSPanel = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const role = user?.role;
  const canRetry = role === "admin" || role === "manager" || isSuperAdmin;
  const canCleanup = role === "admin" || isSuperAdmin;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/pos/logs?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error("❌ Error fetching POS logs:", err);
      setLogs([]);
      toast.error("Failed to fetch POS logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFranchise?._id && !isSuperAdmin) {
        params.append("franchiseId", selectedFranchise._id);
      }
      if (selectedLocation?._id) {
        params.append("locationId", selectedLocation._id);
      }
      params.append("days", "30");

      const response = await fetch(`/api/pos/stats?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("❌ Error fetching POS stats:", err);
    }
  };

  const retrySync = async (log) => {
    try {
      const response = await fetch("/api/pos/retry-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: log.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("POS sync retry successful!");
        fetchLogs();
        fetchStats();
      } else {
        toast.error(result.message || "Retry failed");
      }
    } catch (err) {
      console.error("❌ Retry error:", err);
      toast.error("Failed to retry POS sync");
    }
  };

  const cleanupOldLogs = async () => {
    if (!window.confirm(
      "Are you sure you want to clean up logs older than 90 days? This action cannot be undone."
    )) return;

    try {
      const response = await fetch("/api/pos/logs/cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToKeep: 90 }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      toast.success(`Cleaned up ${result.deletedCount} old log entries`);
      fetchLogs();
    } catch (err) {
      console.error("❌ Error cleaning up logs:", err);
      toast.error("Failed to clean up old logs");
    }
  };

  const exportCSV = () => {
    const rows = filteredLogs.map((log) => ({
      "Order ID": log.orderId || "N/A",
      User: log.userEmail || "Unknown",
      Total: `$${log.total?.toFixed(2) || "0.00"}`,
      Status: log.status || "unknown",
      "Synced At": log.syncedAt
        ? format(new Date(log.syncedAt), "yyyy-MM-dd HH:mm:ss")
        : "N/A",
      "Retry Count": log.retryCount || 0,
      "Error Message": log.errorMessage || "N/A",
      "Transaction ID": log.posResponse?.transactionId || "N/A",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `pos_sync_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedFranchise, selectedLocation, startDate, endDate, sortOrder]);

  useEffect(() => {
    let result = [...logs];

    if (searchTerm) {
      result = result.filter(
        (log) =>
          log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((log) => log.status === statusFilter);
    }

    setFilteredLogs(result);
  }, [logs, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="admin-pos-panel">
        <p>Loading POS sync logs…</p>
      </div>
    );
  }

  return (
    <div className="admin-pos-panel">
      <div className="pos-header">
        <h2>💳 POS Sync Management</h2>
        <div className="header-actions">
          <button onClick={fetchLogs} className="refresh-btn">🔄 Refresh</button>
          {canCleanup && (
            <button onClick={cleanupOldLogs} className="cleanup-btn">🧹 Cleanup Old Logs</button>
          )}
        </div>
      </div>

      {!selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view POS sync logs.</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="dashboard-metrics">
              <div className="metric-card"><strong>Total Syncs:</strong> {stats.totalSyncs}</div>
              <div className="metric-card success"><strong>Successful:</strong> {stats.successfulSyncs}</div>
              <div className="metric-card failed"><strong>Failed:</strong> {stats.failedSyncs}</div>
              <div className="metric-card rate"><strong>Success Rate:</strong> {stats.successRate}%</div>
              <div className="metric-card revenue"><strong>Revenue:</strong> ${stats.totalRevenue.toFixed(2)}</div>
              <div className="metric-card avg"><strong>Avg Order:</strong> ${stats.averageOrderValue}</div>
            </div>
          )}

          {stats?.recentFailures?.length > 0 && (
            <div className="recent-failures-alert">
              <h3>⚠️ Recent Sync Failures</h3>
              <div className="failure-list">
                {stats.recentFailures.map((failure, index) => (
                  <div key={index} className="failure-item">
                    <strong>Order {failure.orderId}</strong> - {failure.userEmail} - ${failure.total?.toFixed(2)}
                    <div className="failure-error">{failure.errorMessage}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pos-controls">
            <input
              type="text"
              placeholder="Search by email or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button onClick={exportCSV} className="export-btn">
              Export CSV ({filteredLogs.length})
            </button>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="no-logs">
              <h3>💳 No POS sync logs found</h3>
              <p>No sync logs match your current filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Synced</th>
                    <th>Retries</th>
                    <th>Transaction ID</th>
                    {canRetry && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={log.status === "failed" ? "failed-row" : ""}
                    >
                      <td>
                        <strong>{log.orderId || "N/A"}</strong>
                        {log.errorMessage && (
                          <div className="error-message" title={log.errorMessage}>
                            ⚠️ {log.errorMessage.slice(0, 30)}...
                          </div>
                        )}
                      </td>
                      <td><strong>{log.userEmail || "Unknown"}</strong></td>
                      <td><strong>${log.total?.toFixed(2) || "0.00"}</strong></td>
                      <td>
                        <span className={`status-badge status-${log.status}`}>
                          {log.status === "success" ? "✅ Success" : "❌ Failed"}
                        </span>
                      </td>
                      <td>
                        {log.syncedAt ? (
                          <>
                            <strong>{format(new Date(log.syncedAt), "MMM d, HH:mm")}</strong>
                            <div className="time-ago">
                              {formatDistanceToNow(new Date(log.syncedAt), { addSuffix: true })}
                            </div>
                          </>
                        ) : "—"}
                      </td>
                      <td>
                        {log.retryCount || 0}
                        {log.lastRetryAt && (
                          <div className="last-retry">
                            Last: {formatDistanceToNow(new Date(log.lastRetryAt), { addSuffix: true })}
                          </div>
                        )}
                      </td>
                      <td>
                        <code>{log.posResponse?.transactionId || "—"}</code>
                      </td>
                      {canRetry && (
                        <td>
                          {log.status === "failed" && (
                            <button
                              onClick={() => retrySync(log)}
                              className="retry-btn"
                              title="Retry POS Sync"
                            >
                              🔄 Retry
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPOSPanel;