import { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../services/api';

export function useStudents(initialParams = {}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page:1, total:0, pages:1 });
  const [params, setParams] = useState({ page:1, page_size:20, ...initialParams });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentsAPI.list(params);
      setStudents(res.data.items || []);
      setPagination({ page:res.data.page, total:res.data.total, pages:res.data.pages });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch students');
    } finally { setLoading(false); }
  }, [params]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const updateParams = (newParams) => setParams(prev => ({ ...prev, ...newParams, page:1 }));
  const nextPage = () => setParams(prev => ({ ...prev, page: Math.min(prev.page+1, pagination.pages) }));
  const prevPage = () => setParams(prev => ({ ...prev, page: Math.max(1, prev.page-1) }));

  return { students, loading, error, pagination, params, updateParams, nextPage, prevPage, refresh:fetchStudents };
}

export function useStudent(id) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    studentsAPI.get(id)
      .then(res => setStudent(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return { student, loading };
}
