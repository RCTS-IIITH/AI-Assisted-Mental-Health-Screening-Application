import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  token: localStorage.getItem('token') || null,
  tokenType: localStorage.getItem('tokenType') || 'bearer',
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  isAuthenticated: !!localStorage.getItem('token'),
  expiresIn: localStorage.getItem('expiresIn') || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.tokenType = action.payload.tokenType;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.expiresIn = action.payload.expiresIn;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.token = null;
      state.tokenType = 'bearer';
      state.user = null;
      state.isAuthenticated = false;
      state.expiresIn = null;
      state.loading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresIn');
      // localStorage.removeItem('token_expiration');
      
      // Remove axios default header
      delete axios.defaults.headers.common['Authorization'];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;