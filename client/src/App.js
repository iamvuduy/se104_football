import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./components/Home";
import TeamRegistration from "./components/TeamRegistration";
import TeamList from "./components/TeamList";
import TeamDetails from "./components/TeamDetails";
import EditTeam from "./components/EditTeam";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import UserManagement from "./components/UserManagement";
import ScheduleManagement from "./components/ScheduleManagement";
import RecordMatchResult from "./components/RecordMatchResult";
import TeamLeaderboard from "./components/TeamLeaderboard";
import TopScorerLeaderboard from "./components/TopScorerLeaderboard";
import PlayerLookup from "./components/PlayerLookup";
import TournamentSettings from "./components/TournamentSettings";
import MatchResults from "./components/MatchResults";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/register-team" element={<TeamRegistration />} />
              <Route path="/teams" element={<TeamList />} />
              <Route path="/teams/:id" element={<TeamDetails />} />
              <Route path="/teams/:id/edit" element={<EditTeam />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/schedules" element={<ScheduleManagement />} />
              <Route path="/record-result" element={<RecordMatchResult />} />
              <Route path="/team-leaderboard" element={<TeamLeaderboard />} />
              <Route
                path="/top-scorer-leaderboard"
                element={<TopScorerLeaderboard />}
              />
              <Route path="/player-lookup" element={<PlayerLookup />} />
              <Route path="/match-results" element={<MatchResults />} />
              <Route
                path="/admin/tournament-settings"
                element={<TournamentSettings />}
              />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
