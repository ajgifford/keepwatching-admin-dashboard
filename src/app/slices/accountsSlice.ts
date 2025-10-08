import { RootState } from '../store';
import { AdminProfile, CombinedAccount } from '@ajgifford/keepwatching-types';
import { EntityState, createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import axios, { AxiosError, AxiosResponse } from 'axios';

const ACCOUNTS_KEY = 'accounts';

interface ApiErrorResponse {
  message?: string;
  requestId?: string;
  status?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface AccountsResponse {
  message: string;
  results: CombinedAccount[];
}

interface ProfilesResponse {
  message: string;
  results: AdminProfile[];
}

interface AccountsSubStatus {
  loading: boolean;
  error: ApiErrorResponse | null;
}

interface ProfilesState {
  [accountId: number]: AdminProfile[];
}

const saveToLocalStorage = (accounts: CombinedAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const loadFromLocalStorage = () => {
  const data = localStorage.getItem(ACCOUNTS_KEY);
  return (data ? JSON.parse(data) : []) as CombinedAccount[];
};

interface AccountsState extends EntityState<CombinedAccount, number>, AccountsSubStatus {
  profiles: ProfilesState;
}

const accountsAdapter = createEntityAdapter<CombinedAccount>({
  sortComparer: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
});

const initialState: AccountsState = accountsAdapter.getInitialState(
  { loading: false, error: null, profiles: {} },
  loadFromLocalStorage(),
);

export const fetchAccounts = createAsyncThunk<CombinedAccount[], boolean, { rejectValue: ApiErrorResponse }>(
  'accounts/fetchAccounts',
  async (force: boolean, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<AccountsResponse> = await axios.get('/api/v1/accounts');
      return response.data.results;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
  },
  {
    condition(force, thunkApi) {
      const state = thunkApi.getState() as RootState;
      const loading = selectAccountsLoading(state);

      if (loading) {
        return false;
      }

      if (force) {
        return true;
      }

      const accounts = selectAllAccounts(state);
      if (accounts.length > 0) {
        return false;
      }
    },
  },
);

export const deleteAccount = createAsyncThunk<number, number, { rejectValue: ApiErrorResponse }>(
  'accounts/deleteAccount',
  async (accountId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/v1/accounts/${accountId}`);
      return accountId;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
  },
);

export const editAccount = createAsyncThunk<
  CombinedAccount,
  { accountId: number; defaultProfileId: number; name: string },
  { rejectValue: ApiErrorResponse }
>(
  'accounts/editAccount',
  async (
    { accountId, defaultProfileId, name }: { accountId: number; defaultProfileId: number; name: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(`/api/v1/accounts/${accountId}`, {
        name,
        defaultProfileId: defaultProfileId,
      });
      return response.data.result;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
  },
);

export const fetchProfilesForAccount = createAsyncThunk<
  { accountId: number; profiles: AdminProfile[] },
  number,
  { rejectValue: ApiErrorResponse }
>('accounts/fetchProfilesForAccount', async (accountId: number, { rejectWithValue }) => {
  try {
    const response: AxiosResponse<ProfilesResponse> = await axios.get(`/api/v1/accounts/${accountId}/profiles`);
    return { accountId, profiles: response.data.results };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue({ message: 'An unknown error occurred' });
  }
});

export const updateProfileName = createAsyncThunk<
  { accountId: number; profileId: number; name: string },
  { accountId: number; profileId: number; name: string },
  { rejectValue: ApiErrorResponse }
>('accounts/updateProfileName', async ({ accountId, profileId, name }, { rejectWithValue }) => {
  try {
    await axios.put(`/api/v1/accounts/${accountId}/profiles/${profileId}`, { name });
    return { accountId, profileId, name };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue({ message: 'An unknown error occurred' });
  }
});

export const deleteProfile = createAsyncThunk<
  { accountId: number; profileId: number },
  { accountId: number; profileId: number },
  { rejectValue: ApiErrorResponse }
>('accounts/deleteProfile', async ({ accountId, profileId }, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/v1/accounts/${accountId}/profiles/${profileId}`);
    return { accountId, profileId };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue({ message: 'An unknown error occurred' });
  }
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        accountsAdapter.setAll(state, action.payload);
        saveToLocalStorage(action.payload);
        state.error = null;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Get Accounts Failed' };
      })
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        accountsAdapter.removeOne(state, action.payload);
        saveToLocalStorage(Object.values(state.entities));
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Delete Account Failed' };
      })
      .addCase(editAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editAccount.fulfilled, (state, action) => {
        accountsAdapter.upsertOne(state, action.payload);
        saveToLocalStorage(Object.values(state.entities));
        state.loading = false;
        state.error = null;
      })
      .addCase(editAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Edit Account Failed' };
      })
      .addCase(fetchProfilesForAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfilesForAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles[action.payload.accountId] = action.payload.profiles;
        state.error = null;
      })
      .addCase(fetchProfilesForAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Fetch Profiles Failed' };
      })
      .addCase(updateProfileName.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileName.fulfilled, (state, action) => {
        const { accountId, profileId, name } = action.payload;
        if (state.profiles[accountId]) {
          const profile = state.profiles[accountId].find((p) => p.id === profileId);
          if (profile) {
            profile.name = name;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateProfileName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Update Profile Name Failed' };
      })
      .addCase(deleteProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProfile.fulfilled, (state, action) => {
        const { accountId, profileId } = action.payload;
        if (state.profiles[accountId]) {
          state.profiles[accountId] = state.profiles[accountId].filter((p) => p.id !== profileId);
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Delete Profile Failed' };
      });
  },
});

export const {
  selectAll: selectAllAccounts,
  selectById: selectAccountById,
  selectIds: selectAccountIds,
} = accountsAdapter.getSelectors((state: RootState) => state.accounts);
export const selectAccountsLoading = (state: RootState) => state.accounts.loading;
export const selectAccountsError = (state: RootState) => state.accounts.error;

// Memoized selector to prevent unnecessary rerenders
export const selectProfilesForAccount = createSelector(
  [(state: RootState) => state.accounts.profiles, (state: RootState, accountId: number) => accountId],
  (profiles, accountId) => profiles[accountId] || [],
);

export default accountsSlice.reducer;
