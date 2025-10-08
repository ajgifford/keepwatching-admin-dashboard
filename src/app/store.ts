import accountsReducer from './slices/accountsSlice';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    accounts: accountsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
