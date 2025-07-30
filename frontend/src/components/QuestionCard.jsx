import React from 'react';

export default function QuestionCard({ questionId, options, onAnswer, disabled }) {
  return (
    <div>
      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onAnswer(questionId, idx)}
          disabled={disabled}
          style={{
            display: 'block',
            width: '100%',
            margin: '8px 0',
            padding: '12px',
            fontSize: '16px'
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}