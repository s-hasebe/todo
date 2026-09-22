"use client";

import { useRef, useState } from "react";
import { deleteTodo, editTodo, toggleTodo, type Todo } from "@/lib/todos";

export default function TodoItem({ todo }: { todo: Todo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  // Pressing Escape unmounts the input, which the browser follows with a
  // native blur — this flag stops that blur from re-committing the draft
  // after a cancel.
  const skipNextBlurCommit = useRef(false);

  function startEditing() {
    setDraft(todo.text);
    setIsEditing(true);
  }

  function commitEdit() {
    if (skipNextBlurCommit.current) {
      skipNextBlurCommit.current = false;
      return;
    }
    editTodo(todo.id, draft);
    setIsEditing(false);
  }

  function cancelEdit() {
    skipNextBlurCommit.current = true;
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="flex items-center rounded-lg border border-black/[.08] px-4 py-2 dark:border-white/[.145]">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="flex-1 bg-transparent text-sm text-black outline-none dark:text-zinc-50"
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-black/[.08] px-4 py-2 dark:border-white/[.145]">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="h-4 w-4 shrink-0"
      />
      <span
        onDoubleClick={startEditing}
        className={`flex-1 cursor-text text-sm ${
          todo.completed
            ? "text-zinc-400 line-through dark:text-zinc-600"
            : "text-black dark:text-zinc-50"
        }`}
      >
        {todo.text}
      </span>
      <button
        type="button"
        onClick={() => deleteTodo(todo.id)}
        aria-label={`Delete "${todo.text}"`}
        className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        ×
      </button>
    </li>
  );
}
