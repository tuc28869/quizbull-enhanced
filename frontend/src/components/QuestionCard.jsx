export default function QuestionCard({ question, onSelect }) {
  return (
    <div>
      <p>{question.questionText}</p>
      {Object.entries(question.options).map(([key, val]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          style={{ display: 'block', margin: '6px 0' }}
        >
          {key}. {val}
        </button>
      ))}
    </div>
  );
}