import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Get questions from database (NOT from LLM API)
export const getQuestionsFromDatabase = createAsyncThunk(
  'session/getQuestionsFromDatabase',
  async ({ quiz_type_id, mode, count }, { rejectWithValue }) => {
    try {
      console.log(`Fetching questions from database for quiz type ${quiz_type_id}`);
      const res = await api.post('/quiz/questions', { 
        quiz_type_id, 
        mode, 
        count 
      });
      console.log(`Retrieved ${res.data.questions.length} questions from database`);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch questions from database:', err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch questions from database');
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

// Submit answer
export const submitAnswer = createAsyncThunk(
  'session/submitAnswer',
  async ({ session_id, question_id, userAnswer }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/quiz/session/${session_id}/answer`, {
        questionId: question_id,
        answer: userAnswer
      });
      return { question_id, userAnswer, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit answer');
    }
  }
);

// Get session results
export const getSessionResults = createAsyncThunk(
  'session/getResults',
  async ({ session_id }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/quiz/session/${session_id}/results`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to get results');
    }
  }
);

const initialState = {
  sessionId: null,
  mode: null,
  questions: [],
  answers: {},
  currentIndex: 0,
  finished: false,
  loading: false,
  submittingAnswer: false,
  error: null,
  results: null,
  quizType: null
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
    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get questions from database
      .addCase(getQuestionsFromDatabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestionsFromDatabase.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.quizType = action.payload.quizType;
        state.error = null;
      })
      .addCase(getQuestionsFromDatabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.questions = [];
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
      })
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.submittingAnswer = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.submittingAnswer = false;
        // Update local answers state
        const questionIndex = state.currentIndex;
        state.answers[questionIndex] = action.payload.userAnswer;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.submittingAnswer = false;
        state.error = action.payload;
      })
      // Get results
      .addCase(getSessionResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSessionResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
        state.finished = true;
      })
      .addCase(getSessionResults.rejected, (state, action) => {
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
  setCurrentIndex
} = sessionSlice.actions;

export default sessionSlice.reducer;
