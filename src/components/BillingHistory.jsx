import React, { useEffect, useState } from "react";
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
  Pagination,
  Tooltip,
  Alert,
  Link,
} from "@mui/material";
import {
  Download,
  Refresh,
  Receipt,
  PictureAsPdf,
  AttachMoney,
  TrendingUp,
  CalendarToday,
  Assessment,
} from "@mui/icons-material";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import BillingSpendChart from "./BillingSpendChart";

const ITEMS_PER_PAGE = 10;

const BillingHistory = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [metrics, setMetrics] = useState({
    totalSpent: 0,
    totalInvoices: 0,
    avgInvoiceAmount: 0,
    lastPayment: null,
    currentMonthSpent: 0,
  });

  const fetchInvoices = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/subscription/invoices/${user.email}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data);
      setFilteredInvoices(data);
      calculateMetrics(data);
      toast.success("Billing history loaded successfully");
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data) => {
    const totalSpent = data.reduce((sum, i) => sum + i.amount_paid, 0);
    const totalInvoices = data.length;
    const avgInvoiceAmount = totalInvoices > 0 ? totalSpent / totalInvoices : 0;

    const sorted = [...data].sort((a, b) => b.created - a.created);
    const lastPayment = sorted[0] || null;

    const monthStart = startOfMonth(new Date()).getTime() / 1000;
    const monthEnd = endOfMonth(new Date()).getTime() / 1000;

    const currentMonthSpent = data
      .filter(i => i.created >= monthStart && i.created <= monthEnd)
      .reduce((sum, i) => sum + i.amount_paid, 0);

    setMetrics({
      totalSpent,
      totalInvoices,
      avgInvoiceAmount,
      lastPayment,
      currentMonthSpent,
    });
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.email]);

  const applyFilters = () => {
    let result = [...invoices];
    if (planFilter !== "All") {
      result = result.filter(i => i.plan_nickname === planFilter);
    }
    if (statusFilter !== "All") {
      result = result.filter(i => i.status === statusFilter);
    }
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start).getTime() / 1000;
      const end = new Date(dateRange.end).getTime() / 1000;
      result = result.filter(i => i.created >= start && i.created <= end);
    }
    setFilteredInvoices(result);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
  }, [planFilter, statusFilter, dateRange, invoices]);

  const handleQuickDateFilter = (months) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);
    setDateRange({
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    });
  };

  const clearFilters = () => {
    setPlanFilter("All");
    setStatusFilter("All");
    setDateRange({ start: "", end: "" });
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Plan",
      "Billing Period",
      "Amount",
      "Status",
      "Receipt URL",
      "PDF URL",
    ];
    const rows = filteredInvoices.map(i => [
      formatDate(i.created),
      i.plan_nickname || "—",
      `${formatDate(i.billing_period_start)} to ${formatDate(i.billing_period_end)}`,
      (i.amount_paid / 100).toFixed(2),
      i.status,
      i.hosted_invoice_url || "",
      i.invoice_pdf || "",
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billing_history_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Billing history exported successfully");
  };

  const formatDate = (timestamp) =>
    timestamp ? format(new Date(timestamp * 1000), "MMM dd, yyyy") : "—";

  const formatCurrency = (cents) =>
    `$${(cents / 100).toFixed(2)}`;

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "success";
      case "open": return "warning";
      case "void": return "error";
      case "draft": return "info";
      default: return "default";
    }
  };

  const getPlanColor = (plan) => {
    switch (plan?.toLowerCase()) {
      case "starter": return "info";
      case "pro": return "primary";
      case "elite": return "secondary";
      default: return "default";
    }
  };

  const getCurrentPageData = () => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  };

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const uniquePlans = [...new Set(invoices.map(i => i.plan_nickname).filter(Boolean))];
  const uniqueStatuses = [...new Set(invoices.map(i => i.status))];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>💳 Billing History</Typography>

      {/* Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <MetricCard icon={<AttachMoney color="primary" />} label="Total Spent" value={formatCurrency(metrics.totalSpent)} />
        <MetricCard icon={<Receipt color="success" />} label="Total Invoices" value={metrics.totalInvoices} />
        <MetricCard icon={<TrendingUp color="info" />} label="Avg Invoice" value={formatCurrency(metrics.avgInvoiceAmount)} />
        <MetricCard icon={<CalendarToday color="warning" />} label="This Month" value={formatCurrency(metrics.currentMonthSpent)} />
      </Grid>
            {/* Billing Chart */}
            <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📊 Spending Overview</Typography>
          <BillingSpendChart />
        </CardContent>
      </Card>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              label="Plan"
            >
              <MenuItem value="All">All Plans</MenuItem>
              {uniquePlans.map((plan, i) => (
                <MenuItem key={i} value={plan}>{plan}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="All">All Status</MenuItem>
              {uniqueStatuses.map((status, i) => (
                <MenuItem key={i} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="From Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="To Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" size="small" onClick={() => handleQuickDateFilter(1)}>Last Month</Button>
            <Button variant="outlined" size="small" onClick={() => handleQuickDateFilter(3)}>3 Months</Button>
            <Button variant="outlined" size="small" onClick={() => handleQuickDateFilter(12)}>1 Year</Button>
            <Button variant="outlined" size="small" onClick={clearFilters}>Clear</Button>
          </Box>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3}>
        <Button variant="outlined" onClick={fetchInvoices} startIcon={<Refresh />}>
          Refresh
        </Button>
        <Button
          variant="outlined"
          onClick={exportToCSV}
          startIcon={<Download />}
          disabled={filteredInvoices.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {getCurrentPageData().length} of {filteredInvoices.length} invoices
        {filteredInvoices.length !== invoices.length && ` (filtered from ${invoices.length})`}
      </Typography>

      {/* Last Payment Alert */}
      {metrics.lastPayment && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Last Payment:</strong> {formatCurrency(metrics.lastPayment.amount_paid)} on {formatDate(metrics.lastPayment.created)} for {metrics.lastPayment.plan_nickname || "subscription"}
        </Alert>
      )}

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Billing Period</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getCurrentPageData().map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{formatDate(invoice.created)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.plan_nickname || "—"}
                    color={getPlanColor(invoice.plan_nickname)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {formatDate(invoice.billing_period_start)} → {formatDate(invoice.billing_period_end)}
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">
                    {formatCurrency(invoice.amount_paid)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {invoice.hosted_invoice_url && (
                      <Tooltip title="View Receipt">
                        <IconButton
                          size="small"
                          component={Link}
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Receipt />
                        </IconButton>
                      </Tooltip>
                    )}
                    {invoice.invoice_pdf && (
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          component={Link}
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <PictureAsPdf />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {filteredInvoices.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Assessment sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No invoices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {invoices.length === 0
              ? "You don't have any billing history yet."
              : "Try adjusting your filters to see more results."}
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, val) => setCurrentPage(val)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          {icon}
          <Box ml={2}>
            <Typography variant="h6">{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Grid>
);

export default BillingHistory;