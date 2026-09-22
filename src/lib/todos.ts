export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

export type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todos";

type Listener = () => void;
const listeners = new Set<Listener>();
let todos: Todo[] = [];
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    todos = raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    todos = [];
  }
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  ensureInitialized();
  return todos;
}

export function getServerSnapshot(): Todo[] {
  return [];
}

export function addTodo(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos = [
    ...todos,
    { id: crypto.randomUUID(), text: trimmed, completed: false, createdAt: Date.now() },
  ];
  persist();
}

export function toggleTodo(id: string) {
  todos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  persist();
}

export function deleteTodo(id: string) {
  todos = todos.filter((t) => t.id !== id);
  persist();
}

// TodoMVC convention: committing an empty edit removes the item rather than
// leaving a blank row behind.
export function editTodo(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    deleteTodo(id);
    return;
  }
  todos = todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
  persist();
}

export function clearCompleted() {
  todos = todos.filter((t) => !t.completed);
  persist();
}
