import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listProfiles } from '../../api';
import type { Profile } from '../../types';

export default function ProfilesPage() {
  const [items, setItems] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    listProfiles()
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) =>
      [p.first_name, p.profile_id, p.goal, p.job_activity]
        .some(x => String(x).toLowerCase().includes(s))
    );
  }, [items, q]);

  if (error) return <div style={{ padding: 16, color: '#b91c1c' }}>Erreur: {error}</div>;
  if (!items.length) return <div style={{ padding: 16 }}>Chargement…</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Profils</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, id, objectif…)"
          style={{ width: 280, border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 10
      }}>
        {filtered.map((p) => (
          <div key={p.profile_id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontWeight: 600 }}>{p.first_name}</div>
              <Link
                to={`/profiles/${p.profile_id}`}
                style={{ fontSize: 12, textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px' }}
              >
                Voir le détail →
              </Link>
            </div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{p.profile_id}</div>
            <div style={{ marginTop: 8 }}>Âge: {ageFrom(p.birth_date)} ans</div>
            <div>Objectif: {p.goal}</div>
            <div>Taille: {p.height_cm} cm</div>
            <div>Poids: {p.weight_kg} kg</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ageFrom(iso: string): number | string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
