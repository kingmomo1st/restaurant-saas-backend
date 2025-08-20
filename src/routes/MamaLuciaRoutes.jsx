// src/routes/MamaLuciaRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomeSalumeria from "../franchise2/HomeSalumeria";
import WelcomeSalumeria from "../franchise2/WelcomeSalumeria";
import CheckoutPage from "../franchise2/CheckoutPage"
import OrderOnlineSalumeria from "../franchise2/OrderOnlineSalumeria";
import SuccessPageSalumeria from "../franchise2/SuccessPageSalumeria";
import ErrorPageSalumeria from "../franchise2/ErrorPageSalumeria";



const MamaLuciaRoutes = () => {
  return (
    <Routes>
      {/* Main Routes */}
      <Route path="/" element={<HomeSalumeria />} />
      <Route path="/home" element={<HomeSalumeria />} />
      <Route path="/menu" element={<HomeSalumeria />} />
      <Route path="/order" element={<HomeSalumeria />} />
      <Route path="/giftcards" element={<HomeSalumeria />} />
      <Route path="/gallery" element={<HomeSalumeria />} />
      <Route path="/custom" element={<HomeSalumeria />} />
      <Route path="/promo" element={<HomeSalumeria />} />
      <Route path="/private-dining" element={<HomeSalumeria />} />
      <Route path="/reservations" element={<HomeSalumeria />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-online" element={<OrderOnlineSalumeria/>}/>
      <Route path="/success" element={<SuccessPageSalumeria />} />
      <Route path="/error" element={<ErrorPageSalumeria />} />

      {/* Deep link fallbacks */}
      <Route path="/about" element={<HomeSalumeria />} />
      <Route path="/giftcard" element={<HomeSalumeria />} />
      <Route path="/hero" element={<HomeSalumeria />} />
      <Route path="/navigationcards" element={<HomeSalumeria />} />
      <Route path="/newsletter" element={<HomeSalumeria />} />
      <Route path="/orderonline" element={<HomeSalumeria />} />
      <Route path="/promocode" element={<HomeSalumeria />} />
      <Route path="/redeemgiftcard" element={<HomeSalumeria />} />
      <Route path="/reservation" element={<HomeSalumeria />} />

      {/* Dev test route */}
      <Route path="/welcome" element={<WelcomeSalumeria />} />
    </Routes>
  );
};

export default MamaLuciaRoutes;