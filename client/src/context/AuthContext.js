import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { normalizeUserRole, resolveRole } from "../utils/roles";
import {
  FEATURE_DEFINITIONS,
  DEFAULT_PERMISSION_MATRIX,
  sanitizePermissionMatrix,
} from "../utils/permissions";

const AuthContext = createContext(null);

// Helper to parse JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featurePermissions, setFeaturePermissions] = useState({
    features: FEATURE_DEFINITIONS,
    matrix: sanitizePermissionMatrix(DEFAULT_PERMISSION_MATRIX),
  });

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get("/api/permissions");
      const payload = response.data || {};
      const features = Array.isArray(payload.features)
        ? payload.features
        : FEATURE_DEFINITIONS;
      const matrix = sanitizePermissionMatrix(payload.matrix);
      setFeaturePermissions({ features, matrix });
    } catch (err) {
      console.warn("Falling back to default permissions", err.message);
      setFeaturePermissions({
        features: FEATURE_DEFINITIONS,
        matrix: sanitizePermissionMatrix(DEFAULT_PERMISSION_MATRIX),
      });
    }
  }, []);

  // Fetch current user info from server (including team_id)
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("/api/users/me");
      if (response.data?.data) {
        const userData = response.data.data;
        setUser((prev) => ({
          ...prev,
          ...userData,
          role: normalizeUserRole(userData).role,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch current user:", err.message);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedUser = parseJwt(storedToken);
      if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser(normalizeUserRole(decodedUser));
        setIsAuthenticated(true);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken}`;
        fetchPermissions();
        // Also fetch current user info from server to get team_id
        setTimeout(() => fetchCurrentUser(), 100);
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  // Sync axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      const { token: newToken } = response.data;
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      const decodedUser = parseJwt(newToken);
      setToken(newToken);
      setUser(normalizeUserRole(decodedUser));
      setIsAuthenticated(true);
      await fetchPermissions();
      await fetchCurrentUser(); // Fetch full user info including team_id
      return { success: true };
    } catch (error) {
      let message = "Login failed. Please try again.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message = error.response.data.message;
      }
      return { success: false, message };
    }
  };

  const register = async (payload) => {
    try {
      const response = await axios.post("/api/auth/register", payload);
      return { success: true, data: response.data };
    } catch (error) {
      let message = "Registration failed. Please try again.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        message = error.response.data.message;
      }
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setFeaturePermissions({
      features: FEATURE_DEFINITIONS,
      matrix: sanitizePermissionMatrix(DEFAULT_PERMISSION_MATRIX),
    });
  };

  const canAccessFeature = useCallback(
    (featureKey) => {
      if (!featureKey) {
        return true;
      }
      const role = resolveRole(user?.role);
      if (!role) {
        return false;
      }
      const rolePermissions = featurePermissions.matrix?.[role];
      if (
        rolePermissions &&
        Object.prototype.hasOwnProperty.call(rolePermissions, featureKey)
      ) {
        return Boolean(rolePermissions[featureKey]);
      }
      const fallback = DEFAULT_PERMISSION_MATRIX[role];
      return fallback ? Boolean(fallback[featureKey]) : false;
    },
    [featurePermissions.matrix, user?.role]
  );

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    token,
    featurePermissions,
    canAccessFeature,
    refreshPermissions: fetchPermissions,
    fetchCurrentUser,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
