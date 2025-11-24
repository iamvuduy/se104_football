import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  const location = useLocation();

  // Pages that don't need Bootstrap container wrapper
  const noContainerPaths = [
    "/",
    "/register-team",
    "/teams",
    "/team-leaderboard",
    "/top-scorer-leaderboard",
    "/player-leaderboard",
    "/player-lookup",
    "/match-results",
    "/record-result",
    "/admin/users",
    "/admin/schedules",
    "/admin/tournament-settings",
    "/login",
    "/register",
  ];

  const useNoContainer = noContainerPaths.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + "/")
  );

  return (
    <>
      <Navbar />
      {useNoContainer ? (
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
