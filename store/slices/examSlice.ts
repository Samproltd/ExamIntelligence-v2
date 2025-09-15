import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Question {
  _id: string;
  text: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

interface Answer {
  questionId: string;
  selectedOption: string;
}

interface ExamState {
  currentExam: {
    _id: string;
    name: string;
    description: string;
    duration: number;
    totalMarks: number;
    totalQuestions: number;
    questionsToDisplay: number;
    questions: Question[];
  } | null;
  userAnswers: Answer[];
  currentQuestionIndex: number;
  loading: boolean;
  error: string | null;
  examStarted: boolean;
  examSubmitted: boolean;
  result: {
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
  } | null;
}

const initialState: ExamState = {
  currentExam: null,
  userAnswers: [],
  currentQuestionIndex: 0,
  loading: false,
  error: null,
  examStarted: false,
  examSubmitted: false,
  result: null,
};

// Helper function to shuffle questions and their options
const shuffleExam = (exam: any) => {
  // Create a deep copy of the exam
  const shuffledExam = JSON.parse(JSON.stringify(exam));

  // Shuffle questions using Fisher-Yates algorithm
  for (let i = shuffledExam.questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledExam.questions[i], shuffledExam.questions[j]] = [
      shuffledExam.questions[j],
      shuffledExam.questions[i],
    ];
  }

  // Shuffle options within each question
  shuffledExam.questions.forEach((question: any) => {
    for (let i = question.options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
    }
  });

  return shuffledExam;
};

// Async thunks
export const fetchExam = createAsyncThunk(
  'exam/fetchExam',
  async (examId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      const response = await axios.get(`/api/exams/take/${examId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.exam;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam');
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async ({ examId, answers }: { examId: string; answers: Answer[] }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      // Get start time from localStorage
      const startTime = localStorage.getItem('examStartTime');
      if (!startTime) {
        return rejectWithValue('Exam start time not found');
      }

      const response = await axios.post(
        `/api/exams/submit/${examId}`,
        {
          answers,
          startTime: parseInt(startTime),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit exam');
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setExam: (state, action: PayloadAction<any>) => {
      state.currentExam = action.payload;
    },
    startExam: state => {
      state.examStarted = true;
      state.examSubmitted = false;
      state.result = null;

      // Initialize userAnswers with empty answers for all questions
      if (state.currentExam) {
        state.userAnswers = state.currentExam.questions.map(question => ({
          questionId: question._id,
          selectedOption: '',
        }));
      }
    },
    goToNextQuestion: state => {
      if (
        state.currentExam &&
        state.currentQuestionIndex < state.currentExam.questions.length - 1
      ) {
        state.currentQuestionIndex++;
      }
    },
    goToPreviousQuestion: state => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
      }
    },
    goToQuestion: (state, action: PayloadAction<number>) => {
      if (
        state.currentExam &&
        action.payload >= 0 &&
        action.payload < state.currentExam.questions.length
      ) {
        state.currentQuestionIndex = action.payload;
      }
    },
    answerQuestion: (
      state,
      action: PayloadAction<{ questionId: string; selectedOption: string }>
    ) => {
      const { questionId, selectedOption } = action.payload;
      const answerIndex = state.userAnswers.findIndex(a => a.questionId === questionId);

      if (answerIndex !== -1) {
        state.userAnswers[answerIndex].selectedOption = selectedOption;
      } else {
        state.userAnswers.push({ questionId, selectedOption });
      }

      // Save answers to localStorage for auto-save
      try {
        localStorage.setItem('examAnswers', JSON.stringify(state.userAnswers));
      } catch (error) {
        console.error('Error saving answers to localStorage', error);
      }
    },
    resetExam: state => {
      state.currentExam = null;
      state.userAnswers = [];
      state.currentQuestionIndex = 0;
      state.examStarted = false;
      state.examSubmitted = false;
      state.result = null;

      // Clear localStorage data related to the exam
      localStorage.removeItem('examAnswers');
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('currentExamId');
    },
    loadSavedAnswers: state => {
      try {
        const savedAnswers = localStorage.getItem('examAnswers');
        if (savedAnswers) {
          state.userAnswers = JSON.parse(savedAnswers);
        }
      } catch (error) {
        console.error('Error loading saved answers', error);
      }
    },
  },
  extraReducers: builder => {
    // Fetch exam cases
    builder.addCase(fetchExam.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExam.fulfilled, (state, action) => {
      state.loading = false;
      // Shuffle the exam questions and options before setting the state
      state.currentExam = shuffleExam(action.payload);
      state.currentQuestionIndex = 0;
    });
    builder.addCase(fetchExam.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Submit exam cases
    builder.addCase(submitExam.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitExam.fulfilled, (state, action) => {
      state.loading = false;
      state.examSubmitted = true;
      state.result = action.payload;

      // Clear localStorage data related to the exam
      localStorage.removeItem('examAnswers');
      localStorage.removeItem('examStartTime');
      localStorage.removeItem('currentExamId');
    });
    builder.addCase(submitExam.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setExam,
  startExam,
  goToNextQuestion,
  goToPreviousQuestion,
  goToQuestion,
  answerQuestion,
  resetExam,
  loadSavedAnswers,
} = examSlice.actions;

export default examSlice.reducer;
