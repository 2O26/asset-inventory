import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner() {
  return (
    <svg className="spinner" viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>
  );
}