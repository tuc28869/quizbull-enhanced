import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard';
import { submitAnswer, getSessionResults } from '../app/slices/sessionSlice';
import { nextQuestion } from '../app/slices/sessionSlice';

export default function Quiz() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const {
    questions,
    currentIndex,
    submittingAnswer,
    results
  } = useSelector((state) => state.session);
  
  // Local UI state for feedback message
  const [feedback, setFeedback] = useState(null);

  // When all questions done, fetch results and navigate
  useEffect(() => {
    if (currentIndex >= questions.length && questions.length > 0) {
      dispatch(getSessionResults({ session_id: sessionId }))
        .unwrap()
        .then(() => navigate(`/results/${sessionId}`));
    }
  }, [currentIndex, questions.length, dispatch, navigate, sessionId]);

  // Handle an answer click
  const handleAnswer = (questionId, userAnswer) => {
    if (submittingAnswer) return;
    dispatch(submitAnswer({
      session_id: sessionId,
      question_id: questionId,
      userAnswer
    }))
      .unwrap()
      .then(({ isCorrect }) => {
        // Build feedback
        const q = questions[currentIndex];
        if (isCorrect) {
          setFeedback({ text: '✅ Correct!', correct: true });
        } else {
          const correctText = q.options[q.correctAnswer];
          setFeedback({
            text: `❌ Incorrect. Correct answer: "${correctText}". ${q.explanation}`,
            correct: false
          });
        }
        // After delay, clear feedback and move on
        setTimeout(() => {
          setFeedback(null);
          dispatch(nextQuestion());
        }, 2000);
      })
      .catch(err => {
        console.error('Answer submission failed:', err);
        alert('Failed to submit answer. Please try again.');
      });
  };

  if (questions.length === 0) {
    return <p>Loading questions…</p>;
  }

  if (currentIndex >= questions.length) {
    return <p>All done! Calculating results…</p>;
  }

  const current = questions[currentIndex];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>
        Question {currentIndex + 1} of {questions.length}
      </h2>
      <p style={{ fontSize: 18 }}>{current.question}</p>
      <QuestionCard
        questionId={current.id}
        options={current.options}
        onAnswer={handleAnswer}
        disabled={submittingAnswer || feedback !== null}
      />

      {feedback && (
        <div style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: feedback.correct ? '#e6ffed' : '#ffe6e6',
          border: `1px solid ${feedback.correct ? '#2c662d' : '#a12d2f'}`,
          borderRadius: 4
        }}>
          <p style={{ margin: 0 }}>{feedback.text}</p>
        </div>
      )}
    </div>
  );
}