import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function History() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/user/history?limit=50&page=1').then(res => setRows(res.data.sessions));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Exam</th>
          <th>Score %</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{new Date(r.date).toLocaleDateString()}</td>
            <td>{r.exam}</td>
            <td>{r.score.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}