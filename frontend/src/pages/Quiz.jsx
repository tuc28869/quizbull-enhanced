import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { submitAnswer } from '../app/slices/sessionSlice';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';

export default function Quiz() {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const session = useSelector(s => s.session);
  const { questions, answers, currentIndex, mode } = session;

  const total = questions.length;
  const answered = Object.keys(answers).length;

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!questions[currentIndex]) return <p>Loading questions…</p>;

  const q = questions[currentIndex];

  function handleAnswer(choice) {
    dispatch(
      submitAnswer({
        session_id: sessionId,
        question_id: q.id,
        userAnswer: choice
      })
    );
  }

  // Block number label
  const blockSize = 10;
  const block = Math.floor(currentIndex / blockSize) + 1;
  const totalBlocks = Math.ceil(total / blockSize);

  return (
    <div>
      <h2>
        {mode === 'segmented'
          ? `Block ${block} / ${totalBlocks}`
          : `Question ${currentIndex + 1} / ${total}`}
      </h2>

      <QuestionCard question={q} onSelect={handleAnswer} />

      <ProgressBar answered={answered} total={total} />

      <p style={{ marginTop: 8 }}>Elapsed {s => elapsed}s</p>
    </div>
  );
}