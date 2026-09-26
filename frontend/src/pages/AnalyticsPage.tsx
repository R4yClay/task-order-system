import { Bar, BarChart, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { label, useI18n } from '../i18n';
import type { Summary } from '../types';

const STATUS_COLORS: Record<string, string> = {
  todo: '#3b82f6', in_progress: '#f59e0b', done: '#22c55e', cancelled: '#94a3b8',
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#94a3b8',
};

export function AnalyticsPage({ stats }: { stats: Summary | null }) {
  const { t } = useI18n();
  if (!stats) {
    return (
      <div className="card restricted">
        <div className="empty-icon">◒</div><h2>{t.analytics}</h2><p>{t.analyticsRestricted}</p>
      </div>
    );
  }

  const byStatus = Object.entries(stats.by_status).map(([key, count]) => ({ key, name: label(t, key), count }));
  const byPriority = (['urgent', 'high', 'medium', 'low'] as const)
    .map(key => ({ key, name: label(t, key), count: stats.by_priority[key] }));
  const workload = stats.by_assignee.map(a => ({ name: a.name, [t.open]: a.open, [t.done]: a.done }));

  return (
    <>
      <div className="kpis">
        <div className="card kpi"><small>{t.totalTasks}</small><strong>{stats.total}</strong></div>
        <div className="card kpi"><small>{t.openTasks}</small><strong>{stats.open}</strong></div>
        <div className="card kpi"><small>{t.completionRate}</small><strong>{stats.completion_rate}%</strong></div>
        <div className={`card kpi ${stats.overdue ? 'alert' : ''}`}><small>{t.overdue}</small><strong>{stats.overdue}</strong></div>
      </div>

      <div className="charts">
        <div className="card chart">
          <div className="card-heading"><div><h2>{t.tasksByStatus}</h2></div></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byStatus.map(d => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart">
          <div className="card-heading"><div><h2>{t.openPriority}</h2></div></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byPriority.map(d => <Cell key={d.key} fill={PRIORITY_COLORS[d.key]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart">
          <div className="card-heading"><div><h2>{t.workload}</h2></div></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workload} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={90} />
              <Tooltip /><Legend />
              <Bar dataKey={t.open} stackId="a" fill="#3b82f6" />
              <Bar dataKey={t.done} stackId="a" fill="#22c55e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart">
          <div className="card-heading"><div><h2>{t.projectProgress}</h2></div></div>
          <div className="progress-list">
            {stats.by_project.map(p => {
              const percent = p.total ? Math.round((100 * p.done) / p.total) : 0;
              return (
                <div key={p.project_id} className="progress-row">
                  <div className="progress-label"><b>{p.name}</b><small>{p.done}/{p.total} · {percent}%</small></div>
                  <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
