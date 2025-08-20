import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Dashboard,
  People,
  Restaurant,
  Analytics,
  Settings,
  Logout,
  Home,
  AccountCircle,
  NotificationsActive,
  AdminPanelSettings,
  SupervisorAccount,
  ManageAccounts,
  Work,
  ExpandMore,
  Receipt,
  Event,
  LocalOffer,
  Star,
  TableRestaurant,
  PointOfSale,
  History,
  CreditCard,
  Assessment,
} from "@mui/icons-material";
import { useAuth } from "./AuthContext";

const AdminNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const [billingMenuAnchor, setBillingMenuAnchor] = useState(null);

  const role = user?.role;
  const isSuperAdmin = role === "superAdmin";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isStaff = role === "staff";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getRoleInfo = () => {
    if (isSuperAdmin) return { label: "Super Admin", icon: <AdminPanelSettings />, color: "error" };
    if (isAdmin) return { label: "Admin", icon: <SupervisorAccount />, color: "primary" };
    if (isManager) return { label: "Manager", icon: <ManageAccounts />, color: "secondary" };
    if (isStaff) return { label: "Staff", icon: <Work />, color: "info" };
    return { label: "Guest", icon: <AccountCircle />, color: "default" };
  };

  const roleInfo = getRoleInfo();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDashboardMenuAnchor(null);
    setBillingMenuAnchor(null);
  };

  const isActivePath = (path) => location.pathname === path;

  const getDashboardMenuItems = () => {
    const baseItems = [
      { path: "/admin", label: "Main Dashboard", icon: <Dashboard /> },
      { path: "/admin/analytics", label: "Analytics Panel", icon: <Analytics /> },
      { path: "/admin/events", label: "Event Management", icon: <Event /> },
      { path: "/admin/audit-logs", label: "Audit Logs", icon: <History /> },
    ];

    const customerItems = [
      { path: "/admin/loyal-users", label: "Loyal Customers", icon: <Star /> },
      { path: "/admin/reservations", label: "Reservations", icon: <TableRestaurant /> },
      { path: "/admin/private-dining", label: "Private Dining", icon: <Restaurant /> },
    ];

    const businessItems = [
      { path: "/admin/pos", label: "POS Management", icon: <PointOfSale /> },
      { path: "/admin/promo-codes", label: "Promo Codes", icon: <LocalOffer /> },
      { path: "/admin/rewards", label: "Rewards Panel", icon: <Star /> },
    ];

    if (isSuperAdmin) {
      return [
        ...baseItems,
        ...customerItems,
        ...businessItems,
        { path: "/admin/reward-redemptions", label: "Reward Redemptions", icon: <Receipt /> },
        { path: "/admin/reward-tiers", label: "Reward Tiers", icon: <Assessment /> },
        { path: "/admin/subscriptions", label: "All Subscriptions", icon: <CreditCard /> },
        { path: "/admin/super-billing", label: "Super Admin Billing", icon: <AdminPanelSettings /> },
      ];
    }
    if (isAdmin) {
      return [
        ...baseItems,
        ...customerItems,
        ...businessItems,
        { path: "/admin/subscriptions", label: "Subscriptions", icon: <CreditCard /> },
      ];
    }
    if (isManager) {
      return [
        { path: "/admin", label: "Dashboard", icon: <Dashboard /> },
        { path: "/admin/reservations", label: "Reservations", icon: <TableRestaurant /> },
        { path: "/admin/events", label: "Events", icon: <Event /> },
        { path: "/admin/pos", label: "POS Panel", icon: <PointOfSale /> },
      ];
    }
    if (isStaff) {
      return [
        { path: "/admin", label: "Dashboard", icon: <Dashboard /> },
        { path: "/admin/reservations", label: "Reservations", icon: <TableRestaurant /> },
        { path: "/admin/pos", label: "POS Panel", icon: <PointOfSale /> },
      ];
    }
    return [];
  };

  const getBillingMenuItems = () => {
    const items = [{ path: "/billing-history", label: "My Billing History", icon: <Receipt /> }];
    if (isSuperAdmin) {
      items.push(
        { path: "/admin/super-billing", label: "Super Admin Billing", icon: <AdminPanelSettings /> },
        { path: "/admin/subscriptions", label: "All Subscriptions", icon: <CreditCard /> }
      );
    }
    if (isAdmin) {
      items.push({ path: "/admin/subscriptions", label: "Subscriptions", icon: <CreditCard /> });
    }
    return items;
  };

  const dashboardItems = getDashboardMenuItems();
  const billingItems = getBillingMenuItems();

  return (
    <AppBar position="static" sx={{ bgcolor: "primary.main", boxShadow: 3 }}>
      <Toolbar>
        {/* Brand */}
        <Box
          display="flex"
          alignItems="center"
          sx={{ cursor: "pointer", flexGrow: 0, mr: 4 }}
          onClick={() => navigate("/")}
        >
          <Restaurant sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            Trattoria Bella
          </Typography>
          <Chip
            icon={roleInfo.icon}
            label={roleInfo.label}
            color={roleInfo.color}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            component={Link}
            to="/"
            sx={{
              fontWeight: isActivePath("/") ? "bold" : "normal",
              bgcolor: isActivePath("/") ? "rgba(255,255,255,0.1)" : "transparent",
            }}
          >
            Home
          </Button>
          {(isSuperAdmin || isAdmin || isManager || isStaff) && (
            <Button
              color="inherit"
              startIcon={<Restaurant />}
              component={Link}
              to="/menu"
              sx={{
                fontWeight: isActivePath("/menu") ? "bold" : "normal",
                bgcolor: isActivePath("/menu") ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              Menu
            </Button>
          )}
          {dashboardItems.length > 0 && (
            <Button
              color="inherit"
              startIcon={<Dashboard />}
              endIcon={<ExpandMore />}
              onClick={(e) => setDashboardMenuAnchor(e.currentTarget)}
              sx={{
                fontWeight: location.pathname.startsWith("/admin") ? "bold" : "normal",
                bgcolor: location.pathname.startsWith("/admin") ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              Dashboard
            </Button>
          )}
          {billingItems.length > 0 && (
            <Button
              color="inherit"
              startIcon={<CreditCard />}
              endIcon={<ExpandMore />}
              onClick={(e) => setBillingMenuAnchor(e.currentTarget)}
              sx={{
                fontWeight:
                  location.pathname.includes("billing") ||
                  location.pathname.includes("subscription")
                    ? "bold"
                    : "normal",
                bgcolor:
                  location.pathname.includes("billing") ||
                  location.pathname.includes("subscription")
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
              }}
            >
              Billing
            </Button>
          )}
          {(isSuperAdmin || isAdmin) && (
            <Button
              color="inherit"
              startIcon={<People />}
              component={Link}
              to="/admin-users"
              sx={{
                fontWeight: isActivePath("/admin-users") ? "bold" : "normal",
                bgcolor: isActivePath("/admin-users") ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              Users
            </Button>
          )}
        </Box>
                {/* User Profile & Notifications */}
                <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsActive />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Dashboard Menu */}
        <Menu
          anchorEl={dashboardMenuAnchor}
          open={Boolean(dashboardMenuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { minWidth: 250, mt: 1 } }}
        >
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: "text.secondary" }}
          >
            Dashboard Sections
          </Typography>
          <Divider />
          {dashboardItems.map((item) => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleMenuClose}
              selected={isActivePath(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </Menu>

        {/* Billing Menu */}
        <Menu
          anchorEl={billingMenuAnchor}
          open={Boolean(billingMenuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { minWidth: 250, mt: 1 } }}
        >
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: "text.secondary" }}
          >
            Billing & Subscriptions
          </Typography>
          <Divider />
          {billingItems.map((item) => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleMenuClose}
              selected={isActivePath(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </MenuItem>
          ))}
        </Menu>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ sx: { minWidth: 200, mt: 1 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{user?.email}</Typography>
            <Typography variant="caption" color="text.secondary">
              {roleInfo.label}
            </Typography>
          </Box>
          <Divider />
          <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
            <ListItemIcon>
              <AccountCircle />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavbar;