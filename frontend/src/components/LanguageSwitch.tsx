import { useI18n } from '../i18n';

export function LanguageSwitch() {
  const { lang, t, setLang } = useI18n();
  return (
    <div className="language">
      <span>{t.language}</span>
      <div className="lang-buttons">
        {(['en', 'ru'] as const).map(code => (
          <button key={code} type="button" className={lang === code ? 'active' : ''} onClick={() => setLang(code)}>
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
