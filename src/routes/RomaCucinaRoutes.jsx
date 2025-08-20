// src/routes/RomaCucinaRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import "../components/css/RomaCucinaTypography.css";



import Home from "../components/Home";
import SignUp from "../components/SignUp";
import SignIn from "../components/SignIn";
import Dashboard from "../components/Dashboard";
import Menu from "../components/Menu";
import CartPage from "../components/CartePage";
import SuccessPage from "../components/SuccessPage";
import ErrorPage from "../components/ErrorPage";
import OrderOnline from "../components/OrderOnline";
import CheckoutPage from "../components/CheckoutPage";
import PrivateDiningForm from "../components/PrivateDiningForm";
import ElegantTableBookingForm from "../components/elegantTableBookingForm";
import GiftCard from "../components/GiftCard";
import RedeemGiftCard from "../components/RedeemGiftCard";
import CateringForm from "../components/CateringForm";
import BackgroundWrapper from "../components/BackgroundWrapper";
import ProtectedRoute from "../components/ProtectedRoute";
import ForgotPassword from "../components/ForgotPassword";

// 🎯 Full-width wrapper component
const FullWidthWrapper = ({ children }) => (
  <div className="full-width-page">{children}</div>
);

const RomaCucinaRoutes = () => {
  return (
    
    <div className="roma-cucina-app" data-franchise="roma-cucina">
    <Routes>
      {/* 🎯 FULL-WIDTH PAGES */}
      <Route
        path="/"
        element={
          <FullWidthWrapper>
            <Home />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/order-online"
        element={
          <FullWidthWrapper>
            <OrderOnline />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/menu"
        element={
          <FullWidthWrapper>
            <BackgroundWrapper>
              <Menu />
            </BackgroundWrapper>
          </FullWidthWrapper>
        }
      />
      <Route
        path="/book-elegantly"
        element={
          <FullWidthWrapper>
            <BackgroundWrapper>
              <ElegantTableBookingForm />
            </BackgroundWrapper>
          </FullWidthWrapper>
        }
      />
      <Route
        path="/private-dining"
        element={
          <FullWidthWrapper>
            <BackgroundWrapper>
              <PrivateDiningForm />
            </BackgroundWrapper>
          </FullWidthWrapper>
        }
      />
      <Route
        path="/catering-request"
        element={
          <FullWidthWrapper>
            <CateringForm />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/cart"
        element={
          <FullWidthWrapper>
            <CartPage />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/success"
        element={
          <FullWidthWrapper>
            <SuccessPage />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/error"
        element={
          <FullWidthWrapper>
            <ErrorPage />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/gift-card"
        element={
          <FullWidthWrapper>
            <GiftCard />
          </FullWidthWrapper>
        }
      />
      <Route
        path="/giftcard-redeem"
        element={
          <FullWidthWrapper>
            <RedeemGiftCard />
          </FullWidthWrapper>
        }
      />

      {/* 🎯 CONSTRAINED PAGES (no wrapper) */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword/>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/checkout" element={<CheckoutPage />} />
    </Routes>
    </div>
  );
};

export default RomaCucinaRoutes;