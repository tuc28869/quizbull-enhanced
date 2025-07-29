export default function ProgressBar({ answered, total }) {
  return (
    <div style={{ marginTop: 12 }}>
      <progress value={answered} max={total} style={{ width: '100%' }} />
      <span>
        {' '}
        {answered} / {total} ({Math.round((answered / total) * 100)}%)
      </span>
    </div>
  );
}