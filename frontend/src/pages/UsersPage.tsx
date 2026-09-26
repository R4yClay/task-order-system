import { useState, type FormEvent } from 'react';
import { api, errorText } from '../api/client';
import { label, useI18n } from '../i18n';
import type { Role, User } from '../types';

type Props = { users: User[]; isAdmin: boolean; onCreated: (message: string) => void };

export function UsersPage({ users, isAdmin, onCreated }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'executor' as Role });
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'executor' });
      setOpen(false);
      onCreated(t.userCreated);
    } catch (err) {
      setError(errorText(err, t.requestFailed));
    }
  };

  return (
    <div className="card table-card">
      <div className="card-heading">
        <div><h2>{t.users}</h2><p>{users.length}</p></div>
        {isAdmin && <button className="secondary" onClick={() => setOpen(v => !v)}>＋ {t.addUser}</button>}
      </div>
      {open && (
        <form className="inline-form" onSubmit={submit}>
          <input required minLength={2} placeholder={t.name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder={t.email} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input required minLength={8} type="password" placeholder={t.password} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
            {(['executor', 'manager', 'admin'] as const).map(r => <option key={r} value={r}>{label(t, r)}</option>)}
          </select>
          <button className="primary" type="submit">{t.create}</button>
          {error && <div className="error-box">{error}</div>}
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.role}</th><th>{t.active}</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><div className="user-cell"><span className="avatar">{u.name.charAt(0).toUpperCase()}</span><b>{u.name}</b></div></td>
                <td>{u.email}</td>
                <td><span className={`role ${u.role}`}>{label(t, u.role)}</span></td>
                <td><span className={`active-status ${u.is_active ? '' : 'inactive'}`}><i></i>{u.is_active ? t.yes : t.no}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
