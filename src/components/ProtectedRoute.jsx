import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import React, { useEffect, useState } from "react";


function ProtectedRoute({children, isAdminRoute=false}){
    const {user,loading,isAdmin}= useAuth();
    const [checkingAdmin, setCheckingAdmin]= useState(true)


    useEffect(()=>{
        if (user){
            setCheckingAdmin(false);
        }else {
            setCheckingAdmin(false);
        }
    },[user]);

if(loading || checkingAdmin){
    return <p> Loading ...</p>;
}

if(!user){
    console.log("User is not logged in");
    return <Navigate to="/signin" />
}

if(isAdminRoute && !isAdmin){
    console.log("User is not an admin, redirecting to dashboard");
    return <Navigate to="/dashboard" />
}
        

    return children;
}

export default ProtectedRoute;