import { useState } from 'react';
import { label, useI18n } from '../i18n';
import type { Task, TaskStatus, User } from '../types';
import { isOverdue } from '../utils';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];
const NEXT: Partial<Record<TaskStatus, TaskStatus>> = { todo: 'in_progress', in_progress: 'done' };

type Props = {
  tasks: Task[];
  users: User[];
  onMove: (id: number, status: TaskStatus) => void;
  onOpen: (task: Task) => void;
};

export function BoardPage({ tasks, users, onMove, onOpen }: Props) {
  const { t } = useI18n();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const drop = (status: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = Number(e.dataTransfer.getData('text/task-id'));
    const task = tasks.find(x => x.id === id);
    if (task && task.status !== status) onMove(id, status);
  };

  return (
    <>
      <p className="hint">↔ {t.dragHint}</p>
      <div className="board">
        {COLUMNS.map(status => {
          const items = tasks.filter(x => x.status === status);
          return (
            <section
              key={status}
              className={`board-column ${status} ${dragOver === status ? 'drop-target' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => drop(status, e)}
            >
              <div className="column-head">
                <div><span className="column-dot"></span><h3>{label(t, status)}</h3></div>
                <span className="count-badge">{items.length}</span>
              </div>
              {items.map(task => (
                <div
                  key={task.id}
                  className="task"
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/task-id', String(task.id))}
                  onClick={() => onOpen(task)}
                >
                  <div className="task-card-top">
                    <span className="task-id">#{task.id}</span>
                    <span className={`priority ${task.priority}`}>{label(t, task.priority)}</span>
                  </div>
                  <b>{task.title}</b>
                  <div className="task-card-bottom">
                    {task.due_date && <small className={isOverdue(task) ? 'overdue' : ''}>◷ {task.due_date}</small>}
                    <small>{users.find(u => u.id === task.assignee_id)?.name ?? ''}</small>
                  </div>
                  {NEXT[status] && (
                    <button className="move-btn" onClick={e => { e.stopPropagation(); onMove(task.id, NEXT[status]!); }}>
                      {t.move} →
                    </button>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
