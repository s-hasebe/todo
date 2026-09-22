"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  addTodo,
  clearCompleted,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type Filter,
} from "@/lib/todos";
import TodoItem from "./todo-item";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addTodo(text);
    setText("");
  }

  const visibleTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.completed).length;
  const hasCompleted = todos.some((t) => t.completed);

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        To-Do
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-full border border-black/[.08] bg-white px-4 py-2 text-sm text-black outline-none focus:border-black/20 dark:border-white/[.145] dark:bg-black dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Add
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No tasks yet — add one above.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visibleTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>

          {visibleTodos.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No {filter} tasks.
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              {remaining} {remaining === 1 ? "item" : "items"} left
            </span>
            <div className="flex gap-3">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={
                    filter === f.value
                      ? "font-medium text-black underline underline-offset-4 dark:text-zinc-50"
                      : "hover:text-zinc-700 dark:hover:text-zinc-200"
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearCompleted}
              disabled={!hasCompleted}
              className="hover:text-zinc-700 disabled:opacity-40 disabled:hover:text-zinc-500 dark:hover:text-zinc-200 dark:disabled:hover:text-zinc-400"
            >
              Clear completed
            </button>
          </div>
        </>
      )}
    </div>
  );
}
