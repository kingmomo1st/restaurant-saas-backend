import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import Menu from "./components/Menu";
import CartPage from "./components/CartePage";
import { CartProvider } from './Context/CartContext';
import CartIcon from './components/CartIcon';
import SuccessPage from "./components/SuccessPage";
import AdminDashboard from './components/AdminDashboard';
import Layout from './components/Layout';
import OrderOnline from './components/OrderOnline';
import CheckoutPage from "./components/CheckoutPage";
import PrivateDiningForm from './components/PrivateDiningForm';
import ElegantTableBookingForm from './components/elegantTableBookingForm';
import BackgroundWrapper from './components/BackgroundWrapper';
import GiftCard from './components/GiftCard';
import RedeemGiftCard from './components/RedeemGiftCard';
import { Provider } from 'react-redux';
import store from "./redux/store";

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className='app-container'>
              <CartIcon />
              <Routes>
                <Route path='/' element={<Layout><Home /></Layout>} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/menu" element={
                  <BackgroundWrapper>
                    <Menu />
                  </BackgroundWrapper>
                } />

                <Route path="/book-elegantly" element={
                  <BackgroundWrapper>
                    <ElegantTableBookingForm />
                  </BackgroundWrapper>
                } />

                <Route path="/private-dining" element={
                  <BackgroundWrapper>
                    <PrivateDiningForm />
                  </BackgroundWrapper>
                } />

                <Route path="/cart" element={<CartPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/order-online" element={<OrderOnline />} />
                <Route path="/orderonline" element={<OrderOnline />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path='/gift-card' element={<GiftCard/>} />
                <Route path='/giftcard/redeem' element={<RedeemGiftCard/>} />

                <Route path="/admin" element={
                  <ProtectedRoute isAdminRoute={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;