import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios'; // FIXED IMPORT PATH
import { generateQuestions, startSession, useGeneratedQuestions, clearError } from '../app/slices/sessionSlice';

export default function Dashboard() {
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    loading, 
    error, 
    generationStatus, 
    generatedQuestions 
  } = useSelector(state => state.session);

  useEffect(() => {
    // Fetch quiz types on component mount
    fetchQuizTypes();
    
    // Clear any previous errors
    dispatch(clearError());
  }, [dispatch]);

  const fetchQuizTypes = async () => {
    try {
      const res = await api.get('/quiz/types');
      setTypes(res.data);
    } catch (error) {
      console.error('Failed to fetch quiz types:', error);
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

      console.log(`Starting ${mode} quiz for: ${quizType.name}`);

      // Step 1: Generate questions using AI
      const generateResult = await dispatch(generateQuestions({ 
        certification: quizType.name 
      }));

      if (generateQuestions.rejected.match(generateResult)) {
        throw new Error(generateResult.payload || 'Failed to generate questions');
      }

      // Step 2: Start the session
      const sessionResult = await dispatch(startSession({ 
        quiz_type_id: typeId, 
        mode 
      }));

      if (startSession.rejected.match(sessionResult)) {
        throw new Error(sessionResult.payload || 'Failed to start session');
      }

      // Step 3: Use the generated questions
      dispatch(useGeneratedQuestions());

      // Step 4: Navigate to quiz
      const sessionId = sessionResult.payload.session_id;
      navigate(`/quiz/${sessionId}`);

    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert(`Failed to start quiz: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        QuizBull Enhanced - Select Your Exam
      </h1>

      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#f0f8ff', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <p>
            {generationStatus === 'loading' ? 
              '🤖 Generating quiz questions with AI...' : 
              '⚙️ Starting quiz session...'
            }
          </p>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#ddd', 
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: generationStatus === 'loading' ? '50%' : '80%',
              height: '4px',
              backgroundColor: '#4CAF50',
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
      {generationStatus === 'success' && generatedQuestions.length > 0 && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #4CAF50', 
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#2e7d32'
        }}>
          ✅ Successfully generated {generatedQuestions.length} questions!
        </div>
      )}

      {/* Quiz types */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {types.map(type => (
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
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
              {type.displayName}
            </h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => startQuiz(type.id, 'full')} 
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  minWidth: '100px'
                }}
              >
                Full Exam
              </button>
              
              <button 
                onClick={() => startQuiz(type.id, 'segmented')} 
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  minWidth: '100px'
                }}
              >
                Practice Mode
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px' 
      }}>
        <h4>How it works:</h4>
        <ol>
          <li>Select a certification exam above</li>
          <li>Choose "Full Exam" for a complete test or "Practice Mode" for segmented practice</li>
          <li>Our AI will generate fresh questions for your selected certification</li>
          <li>Complete the quiz and get your results</li>
        </ol>
        
        <p><strong>Note:</strong> Questions are generated in real-time using AI, so each quiz will have unique questions!</p>
      </div>
    </div>
  );
}