import { useState, type FormEvent } from 'react';
import { api, errorText } from '../api/client';
import { useI18n } from '../i18n';
import type { Priority, Project, Task, TaskInput, User } from '../types';

type Props = {
  task?: Task; // edit mode when provided
  executors: User[];
  projects: Project[];
  onClose: () => void;
  onSubmit: (data: TaskInput) => Promise<void>;
  onProjectCreated: (project: Project) => void;
};

export function TaskModal({ task, executors, projects, onClose, onSubmit, onProjectCreated }: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [assignee, setAssignee] = useState(task?.assignee_id ? String(task.assignee_id) : '');
  const [project, setProject] = useState(String(task?.project_id ?? projects[0]?.id ?? ''));
  const [due, setDue] = useState(task?.due_date ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError(t.requiredTitle);
    if (!project) return setError(t.noProjects);
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assignee_id: assignee ? Number(assignee) : null,
        project_id: Number(project),
        due_date: due || null,
      });
    } catch (err) {
      setError(errorText(err, t.requestFailed));
    } finally {
      setSaving(false);
    }
  };

  const addProject = async () => {
    if (!projectName.trim()) return;
    try {
      const { data } = await api.post<Project>('/projects', { name: projectName.trim(), description: null });
      onProjectCreated(data);
      setProject(String(data.id));
      setProjectName('');
      setNewProject(false);
    } catch (err) {
      setError(errorText(err, t.requestFailed));
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">TASKFLOW</span>
            <h2>{task ? t.editTask : t.newTask}</h2>
            <p>{t.taskDetails}</p>
          </div>
          <button className="icon-close" onClick={onClose} aria-label={t.close}>×</button>
        </div>
        <form className="task-form" onSubmit={submit}>
          <div className="form-section">
            <label>{t.title}<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={t.title} /></label>
            <label>{t.description}<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.description} /></label>
          </div>
          <div className="form-grid">
            <label>{t.priority}
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => <option key={p} value={p}>{t[p]}</option>)}
              </select>
            </label>
            <label>{t.assignee}
              <select value={assignee} onChange={e => setAssignee(e.target.value)}>
                <option value="">{t.unassigned}</option>
                {executors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            <label>{t.project}
              <div className="select-with-action">
                <select value={project} onChange={e => setProject(e.target.value)}>
                  <option value="">{t.selectProject}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="button" className="mini-btn" onClick={() => setNewProject(v => !v)}>＋</button>
              </div>
            </label>
            <label>{t.due}<input type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
          </div>
          {newProject && (
            <div className="inline-project">
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={t.projectName} />
              <button type="button" className="secondary" onClick={addProject}>{t.create}</button>
            </div>
          )}
          {error && <div className="error-box">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="primary" disabled={saving}>{saving ? '…' : task ? t.save : t.saveTask}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
