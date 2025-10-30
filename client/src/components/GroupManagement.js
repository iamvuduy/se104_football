import React, { useState, useEffect, useCallback } from "react";
import { FaPencilAlt, FaTrash, FaSyncAlt } from "react-icons/fa";
import "./GroupManagement.css";

// Define colors for the group headers
const groupColors = [
  "#343a40", // Black
  "#007bff", // Blue
  "#28a745", // Green
  "#dc3545", // Red
  "#6f42c1", // Purple
  "#fd7e14", // Orange
  "#20c997", // Teal
  "#e83e8c", // Pink
  "#6610f2", // Indigo
  "#17a2b8", // Info
  "#d9480f", // Dark Orange
  "#087f5b", // Dark Teal
  "#b40848", // Dark Pink
  "#5f3dc4", // Dark Purple
  "#004085", // Darker Blue
  "#c82333", // Darker Red
  "#1e7e34", // Darker Green
  "#543800", // Dark Yellow
];

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [unassignedTeams, setUnassignedTeams] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedOverZone, setDraggedOverZone] = useState(null);
  const [teamSearch, setTeamSearch] = useState("");

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      setLoading(true);
      const groupsResponse = await fetch("/api/groups", { headers });
      const teamsResponse = await fetch("/api/teams?unassigned=true", {
        headers,
      });

      if (!groupsResponse.ok || !teamsResponse.ok) {
        throw new Error("Failed to fetch data.");
      }

      const groupsData = await groupsResponse.json();
      const teamsData = await teamsResponse.json();

      setGroups(groupsData.groups || []);
      setUnassignedTeams(teamsData.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApiCall = async (url, options) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "An API error occurred");
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const result = await handleApiCall("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name: newGroupName }),
    });
    if (result) {
      setNewGroupName("");
      fetchData();
    }
  };

  const handleUpdateGroup = async (groupId) => {
    if (!editingGroupName.trim()) return;
    const result = await handleApiCall(`/api/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ name: editingGroupName }),
    });
    if (result) {
      setEditingGroupId(null);
      setEditingGroupName("");
      fetchData();
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      const result = await handleApiCall(`/api/groups/${groupId}`, {
        method: "DELETE",
      });
      if (result) fetchData();
    }
  };

  const handleDragStart = (e, team, sourceGroupId) => {
    e.dataTransfer.setData("teamId", team.id);
    e.dataTransfer.setData("sourceGroupId", sourceGroupId);
  };

  const handleDragOver = (e, targetZoneId) => {
    e.preventDefault();
    setDraggedOverZone(targetZoneId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOverZone(null);
  };

  const handleDrop = async (e, targetGroupId) => {
    e.preventDefault();
    setDraggedOverZone(null);

    const teamId = e.dataTransfer.getData("teamId");
    const sourceGroupId = e.dataTransfer.getData("sourceGroupId");

    if (String(sourceGroupId) === String(targetGroupId)) return;

    const movedTeam =
      sourceGroupId === "null"
        ? unassignedTeams.find((t) => t.id == teamId)
        : groups
            .find((g) => g.id == sourceGroupId)
            ?.teams.find((t) => t.id == teamId);

    if (!movedTeam) return;

    if (sourceGroupId === "null") {
      setUnassignedTeams((prev) => prev.filter((t) => t.id != teamId));
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id == sourceGroupId
            ? { ...g, teams: g.teams.filter((t) => t.id != teamId) }
            : g
        )
      );
    }

    if (targetGroupId === null) {
      setUnassignedTeams((prev) => [...prev, movedTeam]);
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id == targetGroupId ? { ...g, teams: [...g.teams, movedTeam] } : g
        )
      );
    }

    const result = await handleApiCall("/api/groups/assign-team", {
      method: "POST",
      body: JSON.stringify({
        teamId: parseInt(teamId),
        groupId: targetGroupId,
      }),
    });

    if (!result) {
      fetchData();
    }
  };

  const assignedTeamsCount = groups.reduce(
    (total, group) => total + (group.teams?.length || 0),
    0
  );
  const totalTeams = assignedTeamsCount + unassignedTeams.length;
  const assignmentRatio = totalTeams
    ? Math.round((assignedTeamsCount / totalTeams) * 100)
    : 0;
  const filteredUnassignedTeams = unassignedTeams.filter((team) =>
    team.name?.toLowerCase().includes(teamSearch.toLowerCase())
  );

  if (loading)
    return (
      <div className="text-center mt-5">
        <h5>Loading group data...</h5>
      </div>
    );

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="group-management-page">
      {error && (
        <div
          className="alert alert-danger gm-alert"
          onClick={() => setError(null)}
        >
          {error} (click to dismiss)
        </div>
      )}

      <header className="gm-header">
        <div className="gm-heading">
          <h1>Group Management</h1>
          <p>
            Arrange tournament groups and assign teams quickly with drag &amp;
            drop. Changes are saved instantly.
          </p>
        </div>
        <div className="gm-stats-grid">
          <div className="gm-stat-card">
            <span className="gm-stat-label">Active Groups</span>
            <span className="gm-stat-value">{groups.length}</span>
            <span className="gm-stat-sub">
              Keep groups balanced for fair matchups.
            </span>
          </div>
          <div className="gm-stat-card">
            <span className="gm-stat-label">Assigned Teams</span>
            <span className="gm-stat-value">{assignedTeamsCount}</span>
            <span className="gm-stat-sub">
              {unassignedTeams.length} teams waiting for assignment.
            </span>
          </div>
          <div className="gm-stat-card">
            <span className="gm-stat-label">Assignment Progress</span>
            <span className="gm-stat-value">{assignmentRatio}%</span>
            <div className="gm-progress">
              <div
                className="gm-progress-fill"
                style={{ width: `${assignmentRatio}%` }}
              />
            </div>
            <span className="gm-stat-sub">Progress updates automatically.</span>
          </div>
        </div>
      </header>

      <div className="gm-layout">
        <aside className="gm-sidebar">
          <section className="gm-card">
            <div className="gm-card-head">
              <h2 className="gm-card-title">Create New Group</h2>
              <span className="gm-card-meta">
                Name groups clearly for easy tracking.
              </span>
            </div>
            <form onSubmit={handleCreateGroup} className="gm-form">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
              <button type="submit" className="gm-primary-btn">
                Create Group
              </button>
            </form>
            <div className="gm-card-note">
              Tip: Drag a team card onto a group to assign it instantly.
            </div>
          </section>

          <section
            className={`gm-card gm-teams-card ${
              draggedOverZone === null ? "is-drop-target" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <div className="gm-card-head">
              <div>
                <h2 className="gm-card-title">Unassigned Teams</h2>
                <span className="gm-card-meta">
                  Drop a card here to clear its group.
                </span>
              </div>
              <span className="gm-counter">{unassignedTeams.length}</span>
            </div>

            <div className="gm-team-search">
              <input
                type="search"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search team name"
              />
            </div>

            <div className="gm-team-list">
              {filteredUnassignedTeams.length > 0 ? (
                filteredUnassignedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="gm-team-pill"
                    draggable
                    onDragStart={(e) => handleDragStart(e, team, "null")}
                  >
                    {team.name}
                  </div>
                ))
              ) : (
                <div className="gm-team-empty">
                  {teamSearch
                    ? "No teams match your search."
                    : "All teams are assigned."}
                </div>
              )}
            </div>
          </section>
        </aside>

        <main className="gm-main">
          <section className="gm-card gm-board-card">
            <div className="gm-board-head">
              <div>
                <h2>Groups Board</h2>
                <p>
                  Drag teams between groups to rebalance them. Click edit to
                  rename a group.
                </p>
              </div>
              <div className="gm-board-actions">
                <button
                  type="button"
                  className="gm-refresh-btn"
                  onClick={handleRefresh}
                >
                  <FaSyncAlt />
                  <span>Reload data</span>
                </button>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="gm-empty-state">
                <h3>No groups yet</h3>
                <p>Create your first group to start assigning teams.</p>
              </div>
            ) : (
              <div className="gm-groups-grid">
                {groups.map((group, index) => {
                  const headerColor = groupColors[index % groupColors.length];
                  const teamsInGroup = group.teams || [];
                  return (
                    <div
                      key={group.id}
                      className={`group-card-wrapper ${
                        draggedOverZone === group.id
                          ? "drop-zone-highlight"
                          : ""
                      }`}
                      onDragOver={(e) => handleDragOver(e, group.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, group.id)}
                    >
                      <div
                        className="group-card-header"
                        style={{ backgroundColor: headerColor }}
                      >
                        <div className="group-card-main">
                          {editingGroupId === group.id ? (
                            <input
                              type="text"
                              className="group-edit-input"
                              value={editingGroupName}
                              onChange={(e) =>
                                setEditingGroupName(e.target.value)
                              }
                              onBlur={() => handleUpdateGroup(group.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleUpdateGroup(group.id);
                                if (e.key === "Escape") {
                                  setEditingGroupId(null);
                                  setEditingGroupName("");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <h2 className="group-card-title">{group.name}</h2>
                          )}
                          <span className="group-team-count">
                            {teamsInGroup.length}{" "}
                            {teamsInGroup.length === 1 ? "team" : "teams"}
                          </span>
                        </div>
                        <div className="group-actions">
                          <button
                            className="group-action-btn"
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            aria-label={`Edit ${group.name}`}
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            className="group-action-btn"
                            onClick={() => handleDeleteGroup(group.id)}
                            aria-label={`Delete ${group.name}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="group-card-body">
                        {teamsInGroup.length > 0 ? (
                          teamsInGroup.map((team, teamIndex) => (
                            <div
                              key={team.id}
                              className="team-row"
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, team, group.id)
                              }
                            >
                              <span className="team-index">
                                {teamIndex + 1}
                              </span>
                              <span className="team-name">{team.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="gm-empty-group">
                            Drag teams here to populate this group.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default GroupManagement;
