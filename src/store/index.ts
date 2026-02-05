import { configureStore } from '@reduxjs/toolkit';
import vendorReducer from './slices/vendorSlice';

const store = configureStore({
  reducer: {
    vendor: vendorReducer,
    // Add more reducers here as needed
  },
  // Add middleware or other configuration as needed
});

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;