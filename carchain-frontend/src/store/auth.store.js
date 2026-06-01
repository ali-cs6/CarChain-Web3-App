import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { setToken } from "../utils/token";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on mount while we verify session

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  login: async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { user, accessToken } = data.data;
    setToken(accessToken);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    try {
      const { data } = await authApi.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
