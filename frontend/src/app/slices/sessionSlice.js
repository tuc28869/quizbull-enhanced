import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const startSession = createAsyncThunk(
  'session/start',
  async ({ quiz_type_id, mode }, { rejectWithValue }) => {
    try {
      const res = await api.post('/quiz/session', { quiz_type_id, mode });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Start failed');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'session/answer',
  async ({ session_id, question_id, userAnswer }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/quiz/session/${session_id}/answer`, {
        question_id,
        userAnswer
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Submit failed');
    }
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    sessionId: null,
    mode: null,
    questions: [],
    answers: {},                   // { questionId: 'A' }
    currentIndex: 0,
    finished: false
  },
  reducers: {
    resetSession: () => ({
      sessionId: null,
      mode: null,
      questions: [],
      answers: {},
      currentIndex: 0,
      finished: false
    })
  },
  extraReducers: builder => {
    builder
      .addCase(startSession.fulfilled, (s, a) => {
        s.sessionId = a.payload.session_id;
        s.questions = a.payload.questions;
        s.mode = a.meta.arg.mode;
        s.currentIndex = 0;
      })
      .addCase(submitAnswer.fulfilled, (s, a) => {
        s.answers[a.meta.arg.question_id] = a.meta.arg.userAnswer;
        s.currentIndex += 1;
      });
  }
});

export const { resetSession } = sessionSlice.actions;
export default sessionSlice.reducer;