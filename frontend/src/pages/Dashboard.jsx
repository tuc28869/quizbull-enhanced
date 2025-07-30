import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { getQuestionsFromDatabase, startSession, clearError } from '../app/slices/sessionSlice';

export default function Dashboard() {
  const [types, setTypes] = useState([]);
  const [selectedMode, setSelectedMode] = useState('full');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    loading, 
    error, 
    questions
  } = useSelector(state => state.session);

  useEffect(() => {
    // Fetch FINRA quiz types from database
    fetchQuizTypes();
    
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);

  const fetchQuizTypes = async () => {
    try {
      const res = await api.get('/quiz/types');
      console.log('Fetched FINRA quiz types:', res.data);
      setTypes(res.data);
    } catch (error) {
      console.error('Failed to fetch FINRA quiz types:', error);
    }
  };

  const startQuiz = async (typeId, mode) => {
    try {
      // Find the quiz type
      const quizType = types.find(t => t.id === typeId);
      if (!quizType) {
        alert('Quiz type not found');
        return;
      }

      console.log(`Starting ${mode} quiz for: ${quizType.displayName}`);

      // Step 1: Get questions from database (NOT LLM API)
      const questionCount = mode === 'segmented' ? 10 : quizType.totalQuestions;
      const questionsResult = await dispatch(getQuestionsFromDatabase({ 
        quiz_type_id: typeId,
        mode: mode,
        count: questionCount
      }));

      if (getQuestionsFromDatabase.rejected.match(questionsResult)) {
        throw new Error(questionsResult.payload || 'Failed to fetch questions from database');
      }

      // Step 2: Start the session
      const sessionResult = await dispatch(startSession({ 
        quiz_type_id: typeId, 
        mode 
      }));

      if (startSession.rejected.match(sessionResult)) {
        throw new Error(sessionResult.payload || 'Failed to start session');
      }

      // Step 3: Navigate to quiz
      const sessionId = sessionResult.payload.session_id;
      navigate(`/quiz/${sessionId}`);

    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert(`Failed to start quiz: ${error.message}`);
    }
  };

  // Calculate exam details for display
  const getExamDetails = (quizType) => {
    const hours = Math.floor(quizType.timeLimit / 60);
    const minutes = quizType.timeLimit % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return {
      timeLimit: timeString,
      questionsInSegmented: Math.min(10, quizType.totalQuestions),
      totalSegments: Math.ceil(quizType.totalQuestions / 10)
    };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
        QuizBull - FINRA Certification Practice Exams
      </h1>
      
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Practice exams for Securities Industry professionals. Questions sourced from our comprehensive database.
      </p>

      {/* Mode Selection */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Select Study Mode:</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="segmented"
              checked={selectedMode === 'segmented'}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ marginRight: '8px' }}
            />
            <strong>Practice Mode</strong> - Study in 10-question segments with immediate feedback
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="full"
              checked={selectedMode === 'full'}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ marginRight: '8px' }}
            />
            <strong>Full Exam</strong> - Complete exam simulation (all questions)
          </label>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <p>🔄 Loading questions from database...</p>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#ddd', 
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60%',
              height: '4px',
              backgroundColor: '#2196f3',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#d32f2f'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => dispatch(clearError())}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#d32f2f',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Success message */}
      {questions.length > 0 && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #4CAF50', 
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#2e7d32'
        }}>
          ✅ Successfully loaded {questions.length} questions from database!
        </div>
      )}

      {/* FINRA Quiz Types */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {types.map(type => {
          const examDetails = getExamDetails(type);
          return (
            <div 
              key={type.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1a365d' }}>
                    {type.displayName}
                  </h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                    {type.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                  <div><strong>Questions:</strong> {type.totalQuestions}</div>
                  <div><strong>Time Limit:</strong> {examDetails.timeLimit}</div>
                  <div><strong>Passing Score:</strong> {type.passingScore}%</div>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                fontSize: '13px'
              }}>
                {selectedMode === 'segmented' ? (
                  <span>
                    📚 <strong>Practice Mode:</strong> Study {examDetails.questionsInSegmented} questions at a time 
                    ({examDetails.totalSegments} segments total)
                  </span>
                ) : (
                  <span>
                    🎯 <strong>Full Exam:</strong> Complete {type.totalQuestions} question exam simulation
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => startQuiz(type.id, selectedMode)} 
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading ? '#ccc' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                {loading ? 'Loading...' : `Start ${type.name} ${selectedMode === 'segmented' ? 'Practice' : 'Exam'}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Database Info */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ marginTop: '0', color: '#1a365d' }}>📊 Database-Driven Questions</h4>
        <ul style={{ marginBottom: '10px' }}>
          <li>Questions are stored in a local SQLite database for fast loading</li>
          <li>Each exam contains authentic FINRA-style questions with detailed explanations</li>
          <li>Practice mode allows focused study with immediate feedback</li>
          <li>Full exam mode simulates the actual certification experience</li>
          <li>Your progress and scores are tracked across all attempts</li>
        </ul>
        
        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
          <strong>Note:</strong> Questions are loaded from our comprehensive database. 
          No internet connection required once the app is loaded.
        </p>
      </div>
    </div>
  );
}
