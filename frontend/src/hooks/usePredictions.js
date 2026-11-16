import { useState, useCallback } from 'react';
import { predictionsAPI } from '../services/api';

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (studentId, predictionType='comprehensive') => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictionsAPI.predict({ student_id: studentId, prediction_type: predictionType });
      setResult(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Prediction failed';
      setError(msg);
      throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const reset = () => { setResult(null); setError(null); };
  return { result, loading, error, predict, reset };
}

export function useStudentPredictions(studentId) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await predictionsAPI.getByStudent(studentId);
      setPredictions(res.data);
    } catch {} finally { setLoading(false); }
  }, [studentId]);

  return { predictions, loading, fetchPredictions };
}
