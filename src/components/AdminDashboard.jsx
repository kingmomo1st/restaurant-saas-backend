import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { hasAccess } from "./utils/hasAccess.js";

// Theme Wrapper
import AdminThemeWrapper from "./AdminThemeWrapper";

// Components
import FranchiseSelector from "./FranchiseSelector";
import AdminDashboardNavbar from "./AdminDashboardNavbar.jsx";
import AnalyticsPanel from "./AnalyticsPanel.jsx";
import AdminPromoCodes from "./AdminPromoCodes.jsx";
import AdminReviewPanel from "./AdminReviewPanel.jsx";
import AdminCalendar from "./AdminCalendar.jsx";
import AdminEventTable from "./AdminEventTable.jsx";
import SubscriptionTab from "./SubscriptionTab.jsx";
import SuperAdminBillingHistory from "./SuperAdminBillingHistory.jsx";
import AdminActiveSubscriptions from "./AdminActiveSubscriptions.jsx";
import SuperAdminPanel from "./SuperAdminPanel.jsx";
import AdminAuditLog from "./AdminAuditLog.jsx";
import AbandonedCarts from "./AbandonedCarts.jsx";
import ReservationTable from "./ReservationTable.jsx";
import PrivateDiningTable from "./PrivateDiningTable.jsx";
import SubscriptionSummary from "./SubscriptionSummary";
import BillingHistory from "./BillingHistory";
import OrdersTable from "./OrdersTable.jsx";
import AdminLiveOrders from "./AdminLiveOrders.jsx";
import CustomerSegmentationDashboard from "./CustomerSegmentationDashboard.jsx";
import CMSBuilder from "./CMSBuilder.jsx"; // Import the CMS Builder
import "./css/AdminDashboard.css";

const TABS = [
  { key: "analytics", label: "Analytics", feature: "analytics" },
  { key: "customers", label: "Customer Insights", feature: "analytics" },
  { key: "orders", label: "Orders", feature: "orders" },
  { key: "liveOrders", label: "Live Orders", feature: "orders" },
  { key: "events", label: "Events", feature: "events" },
  { key: "reviews", label: "Reviews", feature: "reviews" },
  { key: "calendar", label: "Calendar", feature: "calendar" },
  { key: "abandoned", label: "Abandoned Carts", feature: "abandonedCarts" },
  { key: "reservations", label: "Reservations", feature: "cmsReservations" },
  { key: "privateDining", label: "Private Dining", feature: "privateDining" },
  { key: "subscription", label: "Subscribe", alwaysShow: true },
  { key: "subscriptions", label: "Active Subs", alwaysShow: true },
  { key: "billing", label: "Billing", alwaysShow: true },
];

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState("analytics");

  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const { isSuperAdmin, user } = useAuth();
  const subscriptionPlan = user?.subscriptionPlan || "Free";

  return (
    <AdminThemeWrapper>
      <div className="admin-dashboard">
        <AdminDashboardNavbar />

        <div className="franchise-selector-wrapper">
          <FranchiseSelector />
          {selectedFranchise && (
            <div className="selected-franchise-tag">
              Viewing: <strong>{selectedFranchise.title}</strong>
              {selectedLocation && <span> - {selectedLocation.title}</span>}
            </div>
          )}
        </div>

        <SubscriptionSummary />
        <BillingHistory />

        {hasAccess(subscriptionPlan, "promoCodes") && <AdminPromoCodes />}

        <h1>Admin Dashboard</h1>

        <div className="access-info">
          <p>
            <strong>Plan:</strong> {subscriptionPlan}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || "guest"}
          </p>
        </div>

        <div className="tab-buttons">
          {TABS.map((tab) => {
            const has = tab.alwaysShow || hasAccess(subscriptionPlan, tab.feature);
            return (
              <button
                key={tab.key}
                className={currentTab === tab.key ? "active" : ""}
                onClick={() => has && setCurrentTab(tab.key)}
                title={!has ? "🔒 Upgrade Required" : ""}
                style={{
                  opacity: has ? 1 : 0.5,
                  cursor: has ? "pointer" : "not-allowed",
                }}
              >
                {tab.label}
              </button>
            );
          })}

{(isSuperAdmin || user?.role === 'admin') && (
  <button
    onClick={() => setCurrentTab("cms")}
    className={currentTab === "cms" ? "active" : ""}
  >
    🧠 CMS Builder
  </button>
)}

{/* Super Admin only features */}
{isSuperAdmin && (
  <>
    <button
      onClick={() => setCurrentTab("audit")}
      className={currentTab === "audit" ? "active" : ""}
    >
      Audit Log
    </button>
    <button
      onClick={() => setCurrentTab("super")}
      className={currentTab === "super" ? "active" : ""}
    >
      Super Admin
    </button>
  </>
)}
        </div>

        {currentTab === "analytics" && hasAccess(subscriptionPlan, "analytics") && (
          <AnalyticsPanel />
        )}
        {currentTab === "customers" && hasAccess(subscriptionPlan, "analytics") && (
          <CustomerSegmentationDashboard />
        )}
        {currentTab === "events" && hasAccess(subscriptionPlan, "events") && (
          <AdminEventTable />
        )}
        {currentTab === "orders" && hasAccess(subscriptionPlan, "orders") && (
          <OrdersTable />
        )}
        {currentTab === "liveOrders" && hasAccess(subscriptionPlan, "orders") && (
          <AdminLiveOrders />
        )}
        {currentTab === "reviews" && hasAccess(subscriptionPlan, "reviews") && (
          <AdminReviewPanel />
        )}
        {currentTab === "calendar" && hasAccess(subscriptionPlan, "calendar") && (
          <AdminCalendar />
        )}
        {currentTab === "subscription" && <SubscriptionTab />}
        {currentTab === "subscriptions" && <AdminActiveSubscriptions />}
        {currentTab === "billing" && <SuperAdminBillingHistory />}
        {currentTab === "abandoned" && hasAccess(subscriptionPlan, "abandonedCarts") && (
          <AbandonedCarts />
        )}
        {currentTab === "reservations" && hasAccess(subscriptionPlan, "cmsReservations") && (
          <ReservationTable />
        )}
        {currentTab === "privateDining" && hasAccess(subscriptionPlan, "privateDining") && (
          <PrivateDiningTable />
        )}
        {currentTab === "cms" && (isSuperAdmin || user?.role==="admin")&& <CMSBuilder />}
        {currentTab === "audit" && isSuperAdmin && <AdminAuditLog />}
        {currentTab === "super" && isSuperAdmin && <SuperAdminPanel />}
      </div>
    </AdminThemeWrapper>
  );
};

export default AdminDashboard;
