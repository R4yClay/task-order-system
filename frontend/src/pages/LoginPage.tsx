import { useState, type FormEvent } from 'react';
import { api, errorText, tokens } from '../api/client';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { label, useI18n } from '../i18n';

const DEMO_ACCOUNTS = [
  { role: 'admin', email: 'admin@example.com', password: 'Admin12345!' },
  { role: 'manager', email: 'manager@example.com', password: 'Manager123!' },
  { role: 'executor', email: 'executor@example.com', password: 'Executor123!' },
] as const;

type SavedAccount = { email: string; name: string };
const SAVED_KEY = 'taskflow_saved_accounts';

function loadSaved(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState<SavedAccount[]>(loadSaved);
  const [email, setEmail] = useState(() => localStorage.getItem('taskflow_last_email') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const persistSaved = (next: SavedAccount[]) => {
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const address = email.trim();
    try {
      const { data } = await api.post('/auth/login', { email: address, password });
      tokens.save(data.access_token, data.refresh_token);
      localStorage.setItem('taskflow_last_email', address);
      if (remember) {
        const demo = DEMO_ACCOUNTS.find(a => a.email === address.toLowerCase());
        const entry = { email: address, name: demo ? label(t, demo.role) : address };
        persistSaved([entry, ...saved.filter(a => a.email.toLowerCase() !== address.toLowerCase())].slice(0, 5));
      }
      onLogin();
    } catch (err: any) {
      if (!err?.response) setError(t.apiDown);
      else if (err.response.status === 401) setError(t.invalid);
      else setError(errorText(err, t.loginFailed));
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-top">
          <div>
            <div className="brand-mark">TF</div>
            <h1>TaskFlow</h1>
            <p>{t.subtitle}</p>
          </div>
          <LanguageSwitch />
        </div>

        {saved.length > 0 && (
          <section className="saved-accounts">
            <div className="login-section-title"><span>{t.savedAccounts}</span><small>{t.lastUsed}</small></div>
            <div className="saved-list">
              {saved.map(account => (
                <div className="saved-account" key={account.email}>
                  <button type="button" className="account-select" onClick={() => { setEmail(account.email); setPassword(''); }}>
                    <span className="account-avatar">{account.name.charAt(0).toUpperCase()}</span>
                    <span><b>{account.name}</b><small>{account.email}</small></span>
                  </button>
                  <button type="button" className="account-remove" title={t.removeAccount}
                    onClick={() => persistSaved(saved.filter(a => a.email !== account.email))}>×</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="quick-login">
          <div className="login-section-title"><span>{t.quickLogin}</span><small>Demo</small></div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map(account => (
              <button type="button" key={account.email} className="demo-account"
                onClick={() => { setEmail(account.email); setPassword(account.password); setError(''); }}>
                <span className={`demo-avatar ${account.role}`}>{label(t, account.role).charAt(0)}</span>
                <span><b>{label(t, account.role)}</b><small>{account.email}</small></span>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={submit}>
          <label>{t.email}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="username" />
          </label>
          <label>{t.password}
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />
          </label>
          <label className="remember-row">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span>{t.rememberAccount}</span>
          </label>
          <button className="primary big" type="submit">{t.signIn}</button>
          {error && <div className="error-box">{error}</div>}
        </form>
        <div className="login-hint">{t.loginHint}</div>
      </div>
    </div>
  );
}
