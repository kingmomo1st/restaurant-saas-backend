import React from "react";
import {Link, useNavigate, useLocation} from "react-router-dom";
import "./css/Layout.css"
import { useAuth } from "./AuthContext";


function Layout ({children}){

    const {user , logout}= useAuth();
    const navigate= useNavigate();
    const location= useLocation();
    const isHomePage= location.pathname=== "/";

    async function handleLogout(){
        await logout();
        navigate("/");
    }

    return (
        <>
        <nav className="navbar">
            <div className="nav-inner">
            <div className="nav-brand" onClick={()=> navigate("/")}>
                Trattoria Bella
            </div>
            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/menu">Menu</Link>
                <Link to="/book-elegantly">Book a table</Link>
                <Link to="/gift-card"> Gift Cards</Link>
                <Link to="/giftcard/redeem">Redeem Gift Card</Link>

            </div>

            <div className="nav-auth">
                {user? (
                    <>
                        <span className="user-greeting"> Welcome, {user.email.split("@")[0]}</span>
                        <Link to="/dashboard" className="nav-link-btn"> Dashboard</Link>
                        <button onClick={handleLogout}>logout</button>
                    </>
                ):(
                    <Link to="/signin"> Sign In</Link>
                )}
            </div>
        </div>
    </nav>

    <main className={isHomePage ? "full-screen-main" : "layout-main"}>{children}</main>
        </>
    );
}

export default Layout