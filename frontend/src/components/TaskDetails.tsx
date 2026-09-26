import { useEffect, useState, type FormEvent } from 'react';
import { api, errorText } from '../api/client';
import { label, useI18n } from '../i18n';
import type { Comment, Project, Task, User } from '../types';
import { isOverdue } from '../utils';

type Props = {
  task: Task;
  users: User[];
  projects: Project[];
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function TaskDetails({ task, users, projects, canManage, onClose, onEdit, onDelete }: Props) {
  const { t } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Comment[]>(`/tasks/${task.id}/comments`).then(r => setComments(r.data)).catch(() => setComments([]));
  }, [task.id]);

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post<Comment>(`/tasks/${task.id}/comments`, { text: text.trim() });
      setComments(list => [...list, data]);
      setText('');
    } catch (err) {
      setError(errorText(err, t.requestFailed));
    }
  };

  const assignee = users.find(u => u.id === task.assignee_id)?.name ?? t.unassigned;
  const project = projects.find(p => p.id === task.project_id)?.name ?? `#${task.project_id}`;

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal details">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">#{task.id} · {project}</span>
            <h2>{task.title}</h2>
          </div>
          <button className="icon-close" onClick={onClose} aria-label={t.close}>×</button>
        </div>

        <div className="detail-meta">
          <span className={`pill ${task.status}`}>{label(t, task.status)}</span>
          <span className={`priority ${task.priority}`}>{label(t, task.priority)}</span>
          <span>👤 {assignee}</span>
          {task.due_date && <span className={isOverdue(task) ? 'overdue' : ''}>◷ {task.due_date}</span>}
        </div>
        {task.description && <p className="detail-description">{task.description}</p>}

        <h3 className="detail-subtitle">{t.comments}</h3>
        <div className="comments">
          {comments.length === 0 && <div className="empty small">{t.noComments}</div>}
          {comments.map(c => (
            <div className="comment" key={c.id}>
              <span className="avatar">{(c.author_name ?? '?').charAt(0).toUpperCase()}</span>
              <div>
                <b>{c.author_name}</b> <small>{new Date(c.created_at).toLocaleString()}</small>
                <p>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="comment-form" onSubmit={addComment}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder={t.writeComment} />
          <button className="primary" type="submit">{t.send}</button>
        </form>
        {error && <div className="error-box">{error}</div>}

        {canManage && (
          <div className="modal-actions">
            <button type="button" className="secondary danger" onClick={() => { if (confirm(t.confirmDelete)) onDelete(); }}>{t.delete}</button>
            <button type="button" className="primary" onClick={onEdit}>{t.edit}</button>
          </div>
        )}
      </div>
    </div>
  );
}
