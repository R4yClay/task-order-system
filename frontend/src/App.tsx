import { useCallback, useEffect, useState } from 'react';
import { api, tokens } from './api/client';
import { LanguageSwitch } from './components/LanguageSwitch';
import { TaskDetails } from './components/TaskDetails';
import { TaskModal } from './components/TaskModal';
import { useI18n } from './i18n';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BoardPage } from './pages/BoardPage';
import { LoginPage } from './pages/LoginPage';
import { TasksPage } from './pages/TasksPage';
import { UsersPage } from './pages/UsersPage';
import type { Project, Summary, Task, TaskInput, TaskStatus, User } from './types';

type Tab = 'tasks' | 'board' | 'analytics' | 'users';

export function App() {
  const { t } = useI18n();
  const [loggedIn, setLoggedIn] = useState(() => Boolean(tokens.access));
  const [tab, setTab] = useState<Tab>('tasks');
  const [me, setMe] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Summary | null>(null);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [opened, setOpened] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [meRes, taskRes, userRes, projectRes, statRes] = await Promise.all([
      api.get<User>('/auth/me'),
      api.get<Task[]>('/tasks'),
      api.get<User[]>('/users'),
      api.get<Project[]>('/projects'),
      api.get<Summary>('/analytics/summary').catch(() => ({ data: null })),
    ]);
    setMe(meRes.data);
    setTasks(taskRes.data);
    setUsers(userRes.data);
    setProjects(projectRes.data);
    setStats(statRes.data);
  }, []);

  useEffect(() => { if (loggedIn) load().catch(() => undefined); }, [loggedIn, load]);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 3000);
  };

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  const canManage = me?.role === 'admin' || me?.role === 'manager';

  const move = async (id: number, status: TaskStatus) => {
    // Optimistic update keeps drag-and-drop snappy; reload reconciles with the server.
    setTasks(list => list.map(x => (x.id === id ? { ...x, status } : x)));
    await api.patch(`/tasks/${id}/status`, { status }).finally(load);
  };

  const saveTask = async (data: TaskInput) => {
    if (editing && editing !== 'new') {
      await api.patch(`/tasks/${editing.id}`, data);
      flash(t.taskUpdated);
    } else {
      await api.post('/tasks', data);
      flash(t.taskCreated);
    }
    setEditing(null);
    await load();
  };

  const deleteTask = async (task: Task) => {
    await api.delete(`/tasks/${task.id}`);
    setOpened(null);
    flash(t.taskDeleted);
    await load();
  };

  const logout = () => {
    tokens.clear();
    setLoggedIn(false);
  };

  const nav: [Tab, string, string][] = [
    ['tasks', t.tasks, '▤'], ['board', t.kanban, '▦'], ['analytics', t.analytics, '◒'], ['users', t.users, '♙'],
  ];
  const titles: Record<Tab, string> = { tasks: t.tasks, board: t.kanban, analytics: t.analytics, users: t.users };

  return (
    <div className="app">
      <aside>
        <div className="side-brand">
          <div className="brand-mark small">TF</div>
          <div><strong>TaskFlow</strong><small>{t.subtitle}</small></div>
        </div>
        <div className="nav-title">{t.menu}</div>
        <nav>
          {nav.map(([key, text, icon]) => (
            <button key={key} className={tab === key ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab(key)}>
              <span className="nav-icon">{icon}</span>{text}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          {me && <div className="me"><span className="avatar">{me.name.charAt(0)}</span><div><b>{me.name}</b><small>{t[me.role]}</small></div></div>}
          <LanguageSwitch />
          <button className="logout" onClick={logout}><span>↪</span>{t.logout}</button>
        </div>
      </aside>

      <main>
        <header className="page-header">
          <div><div className="eyebrow">TASKFLOW</div><h1>{titles[tab]}</h1><span>{t.dashboard}</span></div>
          <div className="header-actions">
            {(tab === 'tasks' || tab === 'board') && canManage && (
              <button className="primary add-task" onClick={() => setEditing('new')}><span>＋</span>{t.addTask}</button>
            )}
            <button className="secondary refresh" onClick={load}><span>↻</span>{t.refresh}</button>
          </div>
        </header>

        {notice && <div className="success-box">✓ {notice}</div>}
        {tab === 'tasks' && <TasksPage tasks={tasks} users={users} projects={projects} onOpen={setOpened} />}
        {tab === 'board' && <BoardPage tasks={tasks} users={users} onMove={move} onOpen={setOpened} />}
        {tab === 'analytics' && <AnalyticsPage stats={stats} />}
        {tab === 'users' && <UsersPage users={users} isAdmin={me?.role === 'admin'} onCreated={m => { flash(m); load(); }} />}

        {opened && (
          <TaskDetails
            task={opened}
            users={users}
            projects={projects}
            canManage={canManage}
            onClose={() => setOpened(null)}
            onEdit={() => { setEditing(opened); setOpened(null); }}
            onDelete={() => deleteTask(opened)}
          />
        )}
        {editing && (
          <TaskModal
            task={editing === 'new' ? undefined : editing}
            executors={users.filter(u => u.role === 'executor' && u.is_active)}
            projects={projects}
            onClose={() => setEditing(null)}
            onSubmit={saveTask}
            onProjectCreated={p => setProjects(list => [p, ...list])}
          />
        )}
      </main>
    </div>
  );
}
