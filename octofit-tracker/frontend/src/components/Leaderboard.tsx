import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (!mounted) return;
        setEntries(data.leaderboard ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load leaderboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={entries.length === 0} emptyText="No leaderboard">{entries.map((entry) => <div key={`${entry.teamName}-${entry.rank}`}><strong>#{entry.rank}</strong> {entry.teamName} · {entry.totalPoints} pts</div>)}</CapabilityCard>;
}
