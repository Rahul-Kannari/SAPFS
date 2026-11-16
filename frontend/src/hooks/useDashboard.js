import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

export function useDashboard(refreshInterval = 30000) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [s, t, a, h] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getPerformanceTrends(),
        dashboardAPI.getAttendanceAnalytics(),
        dashboardAPI.getRiskHeatmap(),
      ]);
      if (s.status==='fulfilled') setStats(s.value.data);
      if (t.status==='fulfilled') setTrends(t.value.data);
      if (a.status==='fulfilled') setAttendance(a.value.data);
      if (h.status==='fulfilled') setHeatmap(h.value.data);
      setLastUpdated(new Date());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, trends, attendance, heatmap, loading, lastUpdated, refresh: fetchAll };
}
