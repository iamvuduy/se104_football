import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Outlet /> {/* Child routes will render here */}
      </div>
    </>
  );
};

export default Layout;
