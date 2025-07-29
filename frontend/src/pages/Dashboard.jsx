import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Dashboard() {
  const [types, setTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quiz/types').then(res => setTypes(res.data));
  }, []);

  async function start(typeId, mode) {
    const { data } = await api.post('/quiz/session', { quiz_type_id: typeId, mode });
    navigate(`/quiz/${data.session_id}`);
  }

  return (
    <div>
      <h1>Select Exam</h1>
      {types.map(t => (
        <div key={t.id} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
          <h3>{t.displayName}</h3>
          <button onClick={() => start(t.id, 'segmented')}>10-Question Blocks</button>{' '}
          <button onClick={() => start(t.id, 'full')}>Full Exam</button>
        </div>
      ))}
    </div>
  );
}