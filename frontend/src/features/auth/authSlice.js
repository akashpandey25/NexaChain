import { createSlice } from '@reduxjs/toolkit';
import { getStoredToken, setStoredToken, removeStoredToken } from '../../utils/tokenStorage';

/**
 * Authentication Slice
 * 
 * Manages minimal client-side authentication credentials, token synchronization,
 * and session lifecycle state.
 */

const initialToken = getStoredToken();

const initialState = {
  user: null,
  token: initialToken || null,
  isAuthenticated: Boolean(initialToken),
  isInitialized: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user || null;
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        setStoredToken(token);
      }
      state.isInitialized = true;
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload
      };
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      removeStoredToken();
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    }
  }
});

export const { setCredentials, updateUser, logout, setInitialized } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthInitialized = (state) => state.auth.isInitialized;

export default authSlice.reducer;

