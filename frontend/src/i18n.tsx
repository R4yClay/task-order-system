import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ru';

const en = {
  subtitle: 'Task & Order Management', email: 'Email', password: 'Password', signIn: 'Sign in',
  apiDown: 'API is unavailable. Make sure Docker services are running.', invalid: 'Invalid email or password',
  loginFailed: 'Login failed', tasks: 'Tasks', kanban: 'Kanban', analytics: 'Analytics', users: 'Users',
  logout: 'Logout', refresh: 'Refresh', dashboard: 'Operations dashboard', task: 'Task', status: 'Status',
  priority: 'Priority', assignee: 'Assignee', due: 'Due', unassigned: 'Unassigned', noTasks: 'No tasks found',
  todo: 'To do', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled', move: 'Move',
  tasksByStatus: 'Tasks by status', analyticsRestricted: 'Analytics is available to managers and admins.',
  name: 'Name', role: 'Role', active: 'Active', yes: 'Yes', no: 'No', admin: 'Admin', manager: 'Manager',
  executor: 'Executor', high: 'High', medium: 'Medium', low: 'Low', urgent: 'Urgent', language: 'Language',
  menu: 'MENU', addTask: 'Add task', newTask: 'New task', editTask: 'Edit task', title: 'Title',
  description: 'Description', project: 'Project', selectProject: 'Select project', noProjects: 'No projects available',
  create: 'Create', cancel: 'Cancel', save: 'Save', saveTask: 'Create task', taskCreated: 'Task created',
  taskUpdated: 'Task updated', taskDeleted: 'Task deleted', requiredTitle: 'Enter a task title',
  taskDetails: 'Task details', close: 'Close', projectName: 'Project name', savedAccounts: 'Saved accounts',
  quickLogin: 'Quick login', rememberAccount: 'Remember this account', removeAccount: 'Remove',
  lastUsed: 'Last used', search: 'Search tasks…', allStatuses: 'All statuses', allPriorities: 'All priorities',
  allProjects: 'All projects', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this task?',
  comments: 'Comments', noComments: 'No comments yet', writeComment: 'Write a comment…', send: 'Send',
  overdue: 'Overdue', openTasks: 'Open tasks', completionRate: 'Completion rate', totalTasks: 'Total tasks',
  workload: 'Team workload', projectProgress: 'Project progress', openPriority: 'Open tasks by priority',
  open: 'Open', addUser: 'Add user', newUser: 'New user', userCreated: 'User created', dragHint: 'Drag cards between columns',
  loginHint: 'Choose a demo account above or enter your credentials.', requestFailed: 'Request failed',
};

const ru: typeof en = {
  subtitle: 'Управление задачами и заказами', email: 'Электронная почта', password: 'Пароль', signIn: 'Войти',
  apiDown: 'API недоступен. Убедитесь, что Docker-сервисы запущены.', invalid: 'Неверный email или пароль',
  loginFailed: 'Ошибка входа', tasks: 'Задачи', kanban: 'Канбан', analytics: 'Аналитика', users: 'Пользователи',
  logout: 'Выйти', refresh: 'Обновить', dashboard: 'Панель управления', task: 'Задача', status: 'Статус',
  priority: 'Приоритет', assignee: 'Исполнитель', due: 'Срок', unassigned: 'Не назначен', noTasks: 'Задач не найдено',
  todo: 'К выполнению', in_progress: 'В работе', done: 'Готово', cancelled: 'Отменено', move: 'Переместить',
  tasksByStatus: 'Задачи по статусам', analyticsRestricted: 'Аналитика доступна менеджерам и администраторам.',
  name: 'Имя', role: 'Роль', active: 'Активен', yes: 'Да', no: 'Нет', admin: 'Администратор', manager: 'Менеджер',
  executor: 'Исполнитель', high: 'Высокий', medium: 'Средний', low: 'Низкий', urgent: 'Срочный', language: 'Язык',
  menu: 'МЕНЮ', addTask: 'Добавить задачу', newTask: 'Новая задача', editTask: 'Редактирование задачи',
  title: 'Название', description: 'Описание', project: 'Проект', selectProject: 'Выберите проект',
  noProjects: 'Нет доступных проектов', create: 'Создать', cancel: 'Отмена', save: 'Сохранить',
  saveTask: 'Создать задачу', taskCreated: 'Задача создана', taskUpdated: 'Задача обновлена',
  taskDeleted: 'Задача удалена', requiredTitle: 'Введите название задачи', taskDetails: 'Данные задачи',
  close: 'Закрыть', projectName: 'Название проекта', savedAccounts: 'Сохранённые аккаунты',
  quickLogin: 'Быстрый вход', rememberAccount: 'Запомнить этот аккаунт', removeAccount: 'Удалить',
  lastUsed: 'Последний вход', search: 'Поиск задач…', allStatuses: 'Все статусы', allPriorities: 'Все приоритеты',
  allProjects: 'Все проекты', edit: 'Изменить', delete: 'Удалить', confirmDelete: 'Удалить эту задачу?',
  comments: 'Комментарии', noComments: 'Комментариев пока нет', writeComment: 'Напишите комментарий…',
  send: 'Отправить', overdue: 'Просрочено', openTasks: 'Открытые задачи', completionRate: 'Выполнено',
  totalTasks: 'Всего задач', workload: 'Загрузка команды', projectProgress: 'Прогресс проектов',
  openPriority: 'Открытые задачи по приоритету', open: 'Открыто', addUser: 'Добавить пользователя',
  newUser: 'Новый пользователь', userCreated: 'Пользователь создан', dragHint: 'Перетаскивайте карточки между колонками',
  loginHint: 'Выберите демо-аккаунт выше или введите свои данные.', requestFailed: 'Ошибка запроса',
};

export type Dict = typeof en;
const translations: Record<Lang, Dict> = { en, ru };

const LanguageContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('taskflow_lang') as Lang) || 'en');
  const setLang = (value: Lang) => {
    setLangState(value);
    localStorage.setItem('taskflow_lang', value);
  };
  return <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}

/** Translate an enum value (status, priority, role) with a fallback to the raw value. */
export function label(t: Dict, key: string): string {
  return (t as Record<string, string>)[key] ?? key;
}
