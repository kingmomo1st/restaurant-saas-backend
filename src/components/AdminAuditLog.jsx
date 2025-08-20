import React, { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";
import Papa from "papaparse";
import "./css/AdminAuditLog.css";

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState("all");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();

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

      if (dateRange !== "all") {
        const now = new Date();
        let startDate;
        switch (dateRange) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = null;
        }
        if (startDate) {
          params.append("startDate", startDate.toISOString());
        }
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log(`✅ Audit Logs: Fetched ${data.length} logs`);
      setLogs(data);
    } catch (err) {
      console.error("❌ Error fetching audit logs:", err);
      setLogs([]);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const createAuditLog = async (action, description, targetId = null) => {
    try {
      const logData = {
        action,
        description,
        targetId,
        actor: user?.email || "System",
        actorId: user?.uid || null,
        franchiseId: selectedFranchise?._id || null,
        locationId: selectedLocation?._id || null,
        franchiseName: selectedFranchise?.title || null,
        locationName: selectedLocation?.title || null,
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      fetchLogs();
    } catch (err) {
      console.error("❌ Error creating audit log:", err);
    }
  };

  const clearOldLogs = async () => {
    if (!window.confirm("Are you sure you want to clear logs older than 90 days? This action cannot be undone.")) return;

    try {
      const response = await fetch("/api/audit-logs/cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToKeep: 90 }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      toast.success(`Deleted ${result.deletedCount} old log entries`);
      await createAuditLog("CLEANUP", `Cleaned up ${result.deletedCount} audit log entries older than 90 days`);
      fetchLogs();
    } catch (err) {
      console.error("❌ Error clearing old logs:", err);
      toast.error("Failed to clear old logs");
    }
  };

  const exportCSV = () => {
    const rows = filteredLogs.map((log) => ({
      Date: log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "—",
      Action: log.action || "Unknown",
      Description: log.description || "—",
      Actor: log.actor || "System",
      "Target ID": log.targetId || "—",
      Franchise: log.franchiseName || "—",
      Location: log.locationName || "—",
      "IP Address": log.ipAddress || "—",
      "User Agent": log.userAgent || "—",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    createAuditLog("EXPORT", `Exported ${filteredLogs.length} audit log entries to CSV`);
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedFranchise, selectedLocation, dateRange]);

  useEffect(() => {
    let result = [...logs];

    if (searchTerm) {
      result = result.filter(
        (log) =>
          log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.actor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAction !== "All") {
      result = result.filter((log) => log.action === filterAction);
    }

    if (filterUser !== "All") {
      result = result.filter((log) => log.actor === filterUser);
    }

    result.sort((a, b) => {
      const aDate = new Date(a.timestamp || 0);
      const bDate = new Date(b.timestamp || 0);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

    setFilteredLogs(result);
  }, [logs, searchTerm, filterAction, filterUser, sortOrder]);

  const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))].sort();
  const uniqueUsers = [...new Set(logs.map((log) => log.actor).filter(Boolean))].sort();

  const metrics = {
    total: logs.length,
    today: logs.filter((log) => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: logs.filter((log) => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return logDate >= weekAgo;
    }).length,
    errors: logs.filter((log) => log.action?.includes("ERROR") || log.action?.includes("FAILED")).length,
  };

  if (loading) {
    return (
      <div className="admin-audit-log">
        <p>Loading audit logs…</p>
      </div>
    );
  }

  return (
    <div className="admin-audit-log">
      <div className="audit-header">
        <h2>🕵️ Audit Log</h2>
        <div className="header-actions">
          <button onClick={fetchLogs} className="refresh-btn">🔄 Refresh</button>
          {isSuperAdmin && (
            <button onClick={clearOldLogs} className="cleanup-btn">🧹 Cleanup Old Logs</button>
          )}
        </div>
      </div>

      {!isSuperAdmin && !selectedFranchise ? (
        <div className="no-franchise-selected">
          <h3>🏢 Select a Franchise</h3>
          <p>Please select a franchise to view audit logs.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-metrics">
            <div className="metric-card"><strong>Total Logs:</strong> {metrics.total}</div>
            <div className="metric-card today"><strong>Today:</strong> {metrics.today}</div>
            <div className="metric-card week"><strong>This Week:</strong> {metrics.thisWeek}</div>
            <div className="metric-card errors"><strong>Errors:</strong> {metrics.errors}</div>
          </div>

          <div className="audit-controls">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="All">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="All">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
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
              <h3>📋 No audit logs found</h3>
              <p>No logs match your current filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Location</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className={log.action?.includes("ERROR") ? "error-row" : ""}>
                      <td>
                        <div>
                          <strong>{log.timestamp ? format(new Date(log.timestamp), "MMM d, HH:mm") : "—"}</strong>
                          <div className="time-ago">
                            {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "—"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge action-${log.action?.toLowerCase().replace(/[^a-z]/g, "")}`}>
                          {log.action || "UNKNOWN"}
                        </span>
                      </td>
                      <td>{log.description || "—"}</td>
                      <td>{log.actor || "System"}</td>
                      <td>{log.targetId || "—"}</td>
                      <td>
                        {log.franchiseName || "—"}
                        {log.locationName && <div>{log.locationName}</div>}
                      </td>
                      <td>{log.ipAddress || "—"}</td>
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

export default AdminAuditLog;