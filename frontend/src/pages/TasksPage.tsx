import { useMemo, useState } from 'react';
import { label, useI18n } from '../i18n';
import type { Project, Task, User } from '../types';
import { isOverdue } from '../utils';

type Props = { tasks: Task[]; users: User[]; projects: Project[]; onOpen: (task: Task) => void };

export function TasksPage({ tasks, users, projects, onOpen }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [project, setProject] = useState('');

  const filtered = useMemo(() => tasks.filter(task =>
    (!query || task.title.toLowerCase().includes(query.toLowerCase())) &&
    (!status || task.status === status) &&
    (!priority || task.priority === priority) &&
    (!project || task.project_id === Number(project))
  ), [tasks, query, status, priority, project]);

  const projectName = (id: number) => projects.find(p => p.id === id)?.name ?? `#${id}`;

  return (
    <div className="card table-card">
      <div className="card-heading">
        <div><h2>{t.tasks}</h2><p>{filtered.length} / {tasks.length}</p></div>
        <span className="count-badge">{filtered.length}</span>
      </div>
      <div className="filters">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{t.allStatuses}</option>
          {(['todo', 'in_progress', 'done', 'cancelled'] as const).map(s => <option key={s} value={s}>{t[s]}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">{t.allPriorities}</option>
          {(['urgent', 'high', 'medium', 'low'] as const).map(p => <option key={p} value={p}>{t[p]}</option>)}
        </select>
        <select value={project} onChange={e => setProject(e.target.value)}>
          <option value="">{t.allProjects}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>{t.task}</th><th>{t.status}</th><th>{t.priority}</th><th>{t.assignee}</th><th>{t.due}</th></tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(task => (
              <tr key={task.id} className="clickable" onClick={() => onOpen(task)}>
                <td>
                  <div className="task-title">
                    <span className="task-dot"></span>
                    <div><b>{task.title}</b><small>#{task.id} · {projectName(task.project_id)}</small></div>
                  </div>
                </td>
                <td><span className={`pill ${task.status}`}>{label(t, task.status)}</span></td>
                <td><span className={`priority ${task.priority}`}>{label(t, task.priority)}</span></td>
                <td>{users.find(u => u.id === task.assignee_id)?.name ?? t.unassigned}</td>
                <td className={isOverdue(task) ? 'overdue' : ''}>
                  {task.due_date ?? '—'}{isOverdue(task) && <small> · {t.overdue}</small>}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5}><div className="empty">{t.noTasks}</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
