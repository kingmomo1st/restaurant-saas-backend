import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { firestore } from "../firebase";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Download,
  Refresh,
  Cancel,
  PlayArrow,
  Visibility,
  AttachMoney,
  TrendingUp,
  People,
  Business,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import "./css/AdminActiveSubscriptions.css";

const AdminActiveSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState({
    totalActive: 0,
    totalRevenue: 0,
    avgRevenuePerSub: 0,
    topPlan: "",
    cancelledThisMonth: 0,
  });

  const { user } = useAuth();
  const itemsPerPage = 10;

  // Fetch subscriptions
  useEffect(() => {
    let q = query(
      collection(firestore, "subscriptions"),
      orderBy("createdAt", "desc")
    );

    if (user?.role === "manager" && user.locationId) {
      q = query(
        collection(firestore, "subscriptions"),
        where("locationId", "==", user.locationId),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allSubs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubscriptions(allSubs);
        calculateMetrics(allSubs);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching subscriptions:", err);
        toast.error("Failed to load subscriptions");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate metrics
  const calculateMetrics = (subs) => {
    const activeSubs = subs.filter((sub) => sub.status === "active");
    const planCounts = {};
    let totalRevenue = 0;

    activeSubs.forEach((sub) => {
      const plan = sub.plan || "Basic";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
      const planRevenue = {
        starter: 29,
        pro: 49,
        elite: 99,
        basic: 19,
      };
      totalRevenue += planRevenue[plan.toLowerCase()] || 0;
    });

    const topPlan = Object.keys(planCounts).reduce(
      (a, b) => (planCounts[a] > planCounts[b] ? a : b),
      "None"
    );

    const cancelledThisMonth = subs.filter((sub) => {
      const cancelDate =
        sub.cancelledAt?.toDate?.() || new Date(sub.cancelledAt);
      const thisMonth = new Date();
      return (
        cancelDate &&
        cancelDate.getMonth() === thisMonth.getMonth() &&
        cancelDate.getFullYear() === thisMonth.getFullYear()
      );
    }).length;

    setMetrics({
      totalActive: activeSubs.length,
      totalRevenue,
      avgRevenuePerSub:
        activeSubs.length > 0 ? totalRevenue / activeSubs.length : 0,
      topPlan,
      cancelledThisMonth,
    });
  };

  // Filter subscriptions
  useEffect(() => {
    let filtered = subscriptions;

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.locationId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }
    if (planFilter !== "all") {
      filtered = filtered.filter((sub) => sub.plan === planFilter);
    }
    if (locationFilter !== "all") {
      filtered = filtered.filter((sub) => sub.locationId === locationFilter);
    }

    setFilteredSubscriptions(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setPage(1);
  }, [subscriptions, searchTerm, statusFilter, planFilter, locationFilter]);

  const getCurrentPageData = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSubscriptions.slice(startIndex, endIndex);
  };

  // Cancel subscription
  const handleCancelSubscription = async (subscriptionId) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      if (!response.ok) throw new Error("Failed to cancel subscription");
      toast.success("Subscription cancelled successfully");
      setShowCancelDialog(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Resume subscription
  const handleResumeSubscription = async (subscriptionId) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/subscription/resume-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      if (!response.ok) throw new Error("Failed to resume subscription");
      toast.success("Subscription resumed successfully");
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast.error("Failed to resume subscription");
    } finally {
      setActionLoading(false);
    }
  };
    // Export CSV
    const exportToCSV = () => {
      const csvData = filteredSubscriptions.map((sub) => ({
        ID: sub.id,
        "Customer Email": sub.customerEmail || "N/A",
        "User ID": sub.userId || "N/A",
        Plan: sub.plan || "Basic",
        Status: sub.status,
        "Location ID": sub.locationId,
        "Created At": sub.createdAt
          ? format(sub.createdAt.toDate(), "yyyy-MM-dd HH:mm:ss")
          : "N/A",
        "Period End": sub.current_period_end
          ? format(new Date(sub.current_period_end * 1000), "yyyy-MM-dd")
          : "N/A",
        "Cancel at Period End": sub.cancel_at_period_end ? "Yes" : "No",
      }));
  
      const csvContent = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) => Object.values(row).join(",")),
      ].join("\n");
  
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscriptions_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  
    // Status color
    const getStatusColor = (status) => {
      switch (status) {
        case "active":
          return "success";
        case "canceled":
          return "error";
        case "past_due":
          return "warning";
        case "incomplete":
          return "info";
        default:
          return "default";
      }
    };
  
    // Plan color
    const getPlanColor = (plan) => {
      switch (plan?.toLowerCase()) {
        case "starter":
          return "info";
        case "pro":
          return "primary";
        case "elite":
          return "secondary";
        default:
          return "default";
      }
    };
  
    const uniqueLocations = [...new Set(subscriptions.map((sub) => sub.locationId))];
    const uniquePlans = [...new Set(subscriptions.map((sub) => sub.plan))];
  
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      );
    }
  
    return (
      <div className="admin-subscriptions">
        <div className="subscriptions-header">
          <h2>💳 Subscription Management</h2>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
  
        {/* Metrics */}
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="metric-icon"><People /></div>
            <div>
              <strong>Active Subscriptions</strong>
              <div>{metrics.totalActive}</div>
            </div>
          </div>
          <div className="metric-card revenue">
            <div className="metric-icon"><AttachMoney /></div>
            <div>
              <strong>Total Revenue</strong>
              <div>${metrics.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
          <div className="metric-card average">
            <div className="metric-icon"><TrendingUp /></div>
            <div>
              <strong>Avg Revenue/Sub</strong>
              <div>${metrics.avgRevenuePerSub.toFixed(2)}</div>
            </div>
          </div>
          <div className="metric-card plan">
            <div className="metric-icon"><Business /></div>
            <div>
              <strong>Top Plan</strong>
              <div>{metrics.topPlan}</div>
            </div>
          </div>
          <div className="metric-card cancelled">
            <div className="metric-icon"><Cancel /></div>
            <div>
              <strong>Cancelled This Month</strong>
              <div>{metrics.cancelledThisMonth}</div>
            </div>
          </div>
        </div>
  
        {/* Filters */}
        <div className="subscription-controls">
          <TextField
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search /> }}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
              <MenuItem value="past_due">Past Due</MenuItem>
              <MenuItem value="incomplete">Incomplete</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniquePlans.map((plan) => (
                <MenuItem key={plan} value={plan}>{plan}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Location</InputLabel>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueLocations.map((loc) => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportToCSV}
          >
            Export CSV ({filteredSubscriptions.length})
          </Button>
        </div>
  
        {/* Subscriptions Table */}
        {filteredSubscriptions.length === 0 ? (
          <div className="no-subscriptions">
            <h3>💳 No subscriptions found</h3>
            <p>No subscriptions match your current filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Period End</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getCurrentPageData().map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <strong>{sub.customerEmail || "N/A"}</strong>
                          <div>ID: {sub.userId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.plan || "Basic"}
                          color={getPlanColor(sub.plan)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.status}
                          color={getStatusColor(sub.status)}
                        />
                      </TableCell>
                      <TableCell>{sub.locationId || "N/A"}</TableCell>
                      <TableCell>
                        {sub.createdAt
                          ? format(sub.createdAt.toDate(), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end
                          ? format(new Date(sub.current_period_end * 1000), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {sub.status === "active" && (
                          <Tooltip title="Cancel Subscription">
                            <IconButton
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowCancelDialog(true);
                              }}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        )}
                        {sub.status === "canceled" && (
                          <Tooltip title="Resume Subscription">
                            <IconButton
                              onClick={() => handleResumeSubscription(sub.id)}
                              disabled={actionLoading}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
  
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              sx={{ mt: 2 }}
            />
          </div>
        )}
  
        {/* Details Dialog */}
        <Dialog
          open={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Subscription Details</DialogTitle>
          <DialogContent>
            {selectedSubscription && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <strong>Customer Email:</strong> {selectedSubscription.customerEmail || "N/A"}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>User ID:</strong> {selectedSubscription.userId}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Plan:</strong> {selectedSubscription.plan || "Basic"}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Status:</strong> {selectedSubscription.status}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Location:</strong> {selectedSubscription.locationId}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Cancel at Period End:</strong>{" "}
                  {selectedSubscription.cancel_at_period_end ? "Yes" : "No"}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Created:</strong>{" "}
                  {selectedSubscription.createdAt
                    ? format(selectedSubscription.createdAt.toDate(), "MMM d, yyyy HH:mm")
                    : "N/A"}
                </Grid>
                <Grid item xs={12} md={6}>
                  <strong>Period End:</strong>{" "}
                  {selectedSubscription.current_period_end
                    ? format(new Date(selectedSubscription.current_period_end * 1000), "MMM d, yyyy")
                    : "N/A"}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
  
        {/* Cancel Confirmation */}
        <Dialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
        >
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to cancel this subscription? This cannot be undone.
            </Alert>
            {selectedSubscription && (
              <Typography>
                Customer: {selectedSubscription.customerEmail}<br />
                Plan: {selectedSubscription.plan}<br />
                Location: {selectedSubscription.locationId}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCancelDialog(false)}>Keep Active</Button>
            <Button
              onClick={() => handleCancelSubscription(selectedSubscription?.id)}
              color="error"
              disabled={actionLoading}
            >
              {actionLoading ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };
  
  export default AdminActiveSubscriptions;