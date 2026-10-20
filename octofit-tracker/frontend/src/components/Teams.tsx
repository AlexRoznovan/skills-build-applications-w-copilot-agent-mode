import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (!mounted) return;
        setTeams(data.teams ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load teams.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={teams.length === 0} emptyText="No teams">{teams.map((team, index) => <div key={`${team.name}-${index}`}><strong>{team.name}</strong>{team.members && team.members.length > 0 ? <span> · {team.members.length} members</span> : null}</div>)}</CapabilityCard>;
}
