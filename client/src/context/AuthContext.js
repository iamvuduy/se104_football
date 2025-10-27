import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3002";

const AuthContext = createContext(null);

// Helper to parse JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

// Function to check initial auth state synchronously
const getInitialAuthState = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return { token: null, user: null, isAuthenticated: false };
  }

  const decodedUser = parseJwt(token);
  if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return { token, user: decodedUser, isAuthenticated: true };
  } else {
    localStorage.removeItem("token"); // Clean up expired token
    return { token: null, user: null, isAuthenticated: false };
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedUser = parseJwt(token);
      if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
        setToken(token);
        setUser(decodedUser);
        setIsAuthenticated(true);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

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
      setUser(decodedUser);
      setIsAuthenticated(true);
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

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    token,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
