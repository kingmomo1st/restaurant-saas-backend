import React from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "./AuthContext"
import "./css/AdminNavbar.css";

const AdminNavbar= ()=> {
    const {logout}= useAuth();
    const navigate= useNavigate();


const handleLogout= async ()=> {
    await logout ();
    navigate ("/");
};

return (
    <nav className="admin-navbar">
        <div className="admin-navbar-inner">
            <div className="admin-brand" onClick={()=> navigate("/")}>
                Trattoria Bella Admin
            </div>
            <div className="admin-nav-links">
                <Link to="/"> Home</Link>
                <Link to="/menu"> Menu</Link>
                <Link to="/admin"> Dashboard</Link>
                <button className="admin-logout-btn" onClick={handleLogout}> Logout</button>
            </div>
        </div>
    </nav>
);
};

export default AdminNavbar;