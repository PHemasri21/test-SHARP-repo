import React, { createContext, useState, useEffect } from 'react';
import { MockBackend } from '../api/mockBackend';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await MockBackend.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const loginOrRegister = async (credentials) => {
    const loggedInUser = await MockBackend.registerOrLogin(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await MockBackend.logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginOrRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
}