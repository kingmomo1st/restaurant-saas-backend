import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { CartProvider } from './Context/CartContext';
import { Provider } from 'react-redux';
import store from './redux/store';


import FranchiseRouter from './components/FranchiseRouter';
import RedirectOnLogin from './components/RedirectOnLogin';

import AdminDashboard from './components/AdminDashboard';
import KitchenDashboard from './components/KitchenDashboard';
import CMSBuilder from './components/CMSBuilder';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <RedirectOnLogin />
            <div className="app-container">
              <Routes>
                {/* ✅ Let FranchiseRouter control layout */}
                <Route path="/*" element={<FranchiseRouter />} />

                {/* 🔐 Backend-only routes */}
                <Route path="/kitchen" element={<KitchenDashboard />} />
                <Route path="/builder" element={<CMSBuilder />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute isAdminRoute={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;