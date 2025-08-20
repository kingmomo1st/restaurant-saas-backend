import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedFranchise } from "../redux/franchiseSlice";
import { setSelectedLocation } from "../redux/locationSlice";
import { getFranchises } from "../sanity/utils/getFranchises";
import FranchiseSelector from "./FranchiseSelector";

// Layout Components
import Layout from "./Layout"; // First franchise
import LayoutSalumeria from "../franchise2/LayoutSalumeria"; // Second franchise

// Route Sets
import RomaCucinaRoutes from "../routes/RomaCucinaRoutes";
import MamaLuciaRoutes from "../routes/MamaLuciaRoutes";

const FranchiseRouter = () => {
  const dispatch = useDispatch();
  const selectedFranchise = useSelector((state) => state.franchise.selectedFranchise);
  const [showSelector, setShowSelector] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const {isSuperAdmin}= useAuth();

  useEffect(() => {
    const initializeFranchises = async () => {
      if (initialized) return;

      try {
        console.log("🚀 FranchiseRouter initializing...");
        const data = await getFranchises();
        console.log("📦 FranchiseRouter got data:", data);

        const payload = [
          {
            _id: "fallback1",
            title: "Roma Cucina",
            franchiseTitle: "Roma Cucina",
            slug: { current: "roma-cucina" },
            locations: [
              {
                _id: "2d61d79d-ef5f-498e-97e4-0224ac4841b7",
                title: "Roma Cucina Main",
                slug: { current: "roma-cucina-main" },
              },
            ],
          },
          {
            _id: "fallback2",
            title: "Mama Lucia UWS",
            franchiseTitle: "Mama Lucia UWS",
            slug: { current: "mama-lucia-uws" },
            locations: [
              {
                _id: "44594aa6-5d2e-430e-aa98-21e942e3b2ea",
                title: "Mama Lucia UWS",
                slug: { current: "mama-lucia-uws" },
              },
            ],
          },
        ];

        if (payload.length > 0) {
          // Smart auto-selection based on user role
          if (!isSuperAdmin && payload.length === 1) {
            // Franchise owner with only one franchise - auto-select it
            const userFranchise = payload[0];
            const defaultLocation = userFranchise.locations?.[0];
            
            console.log("🏢 Auto-selecting franchise for franchise owner:", userFranchise.title);
            dispatch(setSelectedFranchise(userFranchise));
            if (defaultLocation) {
              dispatch(setSelectedLocation(defaultLocation));
            }
          } else {
            // Super admin or multiple franchises - let them choose manually
            console.log("🏢 Multiple franchises available, waiting for manual selection");
            console.log("📦 Available franchises:", payload.map(f => f.title));
          }
          
          setInitialized(true);
        }
      } catch (err) {
        console.error("❌ FranchiseRouter initialization failed:", err);
      }
    };

    initializeFranchises();
  }, [dispatch, initialized]);

  const slug = selectedFranchise?.slug?.current?.toLowerCase();
  const franchiseTitle = selectedFranchise?.franchiseTitle?.toLowerCase();

  const isMamaLucia =
    slug === "mama-lucia-uws" ||
    slug === "mama-lucia-group" ||
    franchiseTitle?.includes("mama lucia");

  const renderSwitcherButton = () => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowSelector(!showSelector);
      }}
      style={{
        position: "fixed",
        top: "80px",
        right: "15px",
        zIndex: 1001,
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        fontSize: "14px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.6,
        transition: "opacity 0.3s ease",
      }}
      onMouseEnter={(e) => (e.target.style.opacity = "1")}
      onMouseLeave={(e) => (e.target.style.opacity = "0.6")}
      title="Switch Location"
    >
      🏢
    </button>
  );

  const renderFranchiseSelector = () => (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "130px",
        right: "15px",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "2px solid #007bff",
        minWidth: "250px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <strong>Switch Location</strong>
        <button
          onClick={() => setShowSelector(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>
      </div>
      <FranchiseSelector onSelect={() => setShowSelector(false)} />
    </div>
  );

  return isMamaLucia ? (
    <div onClick={() => setShowSelector(false)}>
      {renderSwitcherButton()}
      {showSelector && renderFranchiseSelector()}
      <LayoutSalumeria>
        <MamaLuciaRoutes />
      </LayoutSalumeria>
    </div>
  ) : (
    <div onClick={() => setShowSelector(false)}>
      {renderSwitcherButton()}
      {showSelector && renderFranchiseSelector()}
      <Layout>
        <RomaCucinaRoutes />
      </Layout>
    </div>
  );
};

export default FranchiseRouter;