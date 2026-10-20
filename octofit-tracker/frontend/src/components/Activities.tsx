import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (!mounted) return;
        setActivities(data.activities ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load activities.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={activities.length === 0} emptyText="No activities">{activities.map((activity, index) => <div key={`${activity.type}-${index}`}><strong>{activity.type}</strong> <span>{activity.minutes} min</span>{activity.points !== undefined ? <span> · {activity.points} pts</span> : null}</div>)}</CapabilityCard>;
}
