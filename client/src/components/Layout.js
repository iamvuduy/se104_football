import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  const location = useLocation();

  const fluidLayoutPaths = [
    '/register-team',
    '/teams', 
    '/admin/users',
    '/admin/schedules',
  ];

  const useFluidLayout = fluidLayoutPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <Navbar />
      {useFluidLayout ? (
        <Outlet />
      ) : (
        <div className="container mt-4">
          <Outlet />
        </div>
      )}
    </>
  );
};

export default Layout;
