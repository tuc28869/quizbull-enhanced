import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios'; // FIXED IMPORT PATH

// Generate questions using AI
export const generateQuestions = createAsyncThunk(
  'session/generate',
  async ({ certification }, { rejectWithValue }) => {
    try {
      console.log('Generating questions for:', certification);
      const res = await api.post('/quiz/generate', { certification });
      console.log('Questions generated successfully:', res.data.questions.length);
      return res.data.questions;
    } catch (err) {
      console.error('Question generation failed:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Question generation failed');
    }
  }
);

// Start quiz session
export const startSession = createAsyncThunk(
  'session/start',
  async ({ quiz_type_id, mode }, { rejectWithValue }) => {
    try {
      const res = await api.post('/quiz/session', { quiz_type_id, mode });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start session');
    }
  }
);

const initialState = {
  sessionId: null,
  mode: null,
  questions: [],
  generatedQuestions: [], // AI generated questions
  answers: {},
  currentIndex: 0,
  finished: false,
  loading: false,
  error: null,
  generationStatus: 'idle' // idle, loading, success, failed
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setAnswer: (state, action) => {
      const { questionIndex, answer } = action.payload;
      state.answers[questionIndex] = answer;
    },
    nextQuestion: (state) => {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    finishQuiz: (state) => {
      state.finished = true;
    },
    resetSession: (state) => {
      return {
        ...initialState
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    useGeneratedQuestions: (state) => {
      // Move generated questions to active questions
      if (state.generatedQuestions.length > 0) {
        state.questions = state.generatedQuestions;
        state.currentIndex = 0;
        state.answers = {};
        state.finished = false;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate questions
      .addCase(generateQuestions.pending, (state) => {
        state.loading = true;
        state.generationStatus = 'loading';
        state.error = null;
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.generationStatus = 'success';
        state.generatedQuestions = action.payload;
        state.error = null;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.loading = false;
        state.generationStatus = 'failed';
        state.error = action.payload;
        state.generatedQuestions = [];
      })
      // Start session
      .addCase(startSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionId = action.payload.session_id;
        state.mode = action.payload.mode;
        state.error = null;
      })
      .addCase(startSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setAnswer, 
  nextQuestion, 
  previousQuestion, 
  finishQuiz, 
  resetSession, 
  clearError,
  useGeneratedQuestions 
} = sessionSlice.actions;

export default sessionSlice.reducer;