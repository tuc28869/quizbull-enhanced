import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return data.accessToken;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

const initialState = { token: null, user: null, status: 'idle', error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, s => { s.status = 'loading'; })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded';
        s.token = a.payload;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;