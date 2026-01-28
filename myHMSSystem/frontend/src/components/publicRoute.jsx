import React from "react";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (token && user.role) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return children;
}
