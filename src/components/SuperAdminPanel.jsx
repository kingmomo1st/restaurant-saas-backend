// src/components/SuperAdminPanel.jsx
import React, { useState } from "react";
import ManageFranchises from "./ManageFranchises";
import ManageLocations from "./ManageLocations";
import FranchiseAnalytics from "./FranchiseAnalytics";
import RoleManagerPanel from "./RoleManagerPanel";
import "./css/SuperAdminPanel.css";

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState("franchises");

  const tabs = [
    {
      id: "franchises",
      label: "Manage Franchises",
      icon: "🏢",
      component: <ManageFranchises />,
    },
    {
      id: "locations",
      label: "Manage Locations",
      icon: "📍",
      component: <ManageLocations />,
    },
    {
      id: "analytics",
      label: "Franchise Analytics",
      icon: "📊",
      component: <FranchiseAnalytics />,
    },
    {
      id: "roles",
      label: "User Roles",
      icon: "👥",
      component: <RoleManagerPanel />,
    },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="super-admin-panel">
      <div className="super-admin-header">
        <h2>🛡️ Super Admin Dashboard</h2>
        <div className="admin-badge">
          <span>SUPER ADMIN</span>
        </div>
      </div>

      <div className="super-admin-nav">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="super-admin-content">
        <div className="content-header">
          <h3>
            <span className="content-icon">{activeTabData?.icon}</span>
            {activeTabData?.label}
          </h3>
          <div className="content-breadcrumb">
            Super Admin → {activeTabData?.label}
          </div>
        </div>

        <div className="content-body">
          {activeTabData?.component}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPanel;