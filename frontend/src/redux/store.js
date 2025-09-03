import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import childrenReducer from './childrenSlice.js'
import questionnaireReducer from './questionnaireSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    children:childrenReducer,
    questionnaire: questionnaireReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// Export store as default
export default store;