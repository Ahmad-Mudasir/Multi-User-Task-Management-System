"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { SessionPayload } from "@/lib/auth/session";
import type { BoardStatus, BoardTask, BoardUser } from "./types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const columns: { key: BoardStatus; title: string }[] = [
  { key: "todo", title: "To Do" },
  { key: "in_progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function computeDisplayedMs(t: BoardTask) {
  if (!t.lastStartAt || t.activeUserIds.length === 0) return t.accumulatedMs;
  const delta = Date.now() - new Date(t.lastStartAt).getTime();
  return t.accumulatedMs + Math.max(0, delta);
}

export function ProjectBoard({
  session,
  project,
  users,
  initialTasks,
}: {
  session: SessionPayload;
  project: { id: string; name: string };
  users: BoardUser[];
  initialTasks: BoardTask[];
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Lightweight polling to keep the board in sync across users.
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/tasks`);
        if (!res.ok) return;
        const data = (await res.json()) as { tasks: BoardTask[] };
        if (cancelled) return;
        setTasks(data.tasks);
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [project.id]);

  const byStatus = useMemo(() => {
    const map: Record<BoardStatus, BoardTask[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    for (const k of Object.keys(map) as BoardStatus[]) {
      map[k].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [tasks]);

  async function createTask() {
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
    if (!res.ok) return;
    const data = (await res.json()) as { task: BoardTask };
    setTasks((prev) => [...prev, data.task]);
    setNewTitle("");
  }

  async function persistOrders(status: BoardStatus, orderedIds: string[]) {
    await fetch(`/api/projects/${project.id}/tasks/reorder`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, orderedIds }),
    });
  }

  async function onStartTimer(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/timer/start`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { task: BoardTask };
    setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
  }

  async function onStopTimer(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/timer/stop`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { task: BoardTask };
    setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
  }

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const fromStatus = source.droppableId as BoardStatus;
    const toStatus = destination.droppableId as BoardStatus;

    const next = [...tasks];
    const moving = next.find((t) => t.id === draggableId);
    if (!moving) return;

    // Remove from current list
    const fromList = next.filter((t) => t.status === fromStatus).sort((a, b) => a.order - b.order);
    const toList =
      fromStatus === toStatus
        ? fromList
        : next.filter((t) => t.status === toStatus).sort((a, b) => a.order - b.order);

    const fromIds = fromList.map((t) => t.id).filter((id) => id !== draggableId);
    const toIds =
      fromStatus === toStatus ? fromIds : toList.map((t) => t.id);

    toIds.splice(destination.index, 0, draggableId);

    // Optimistic update: set status + order in local state
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== draggableId) return t;
        return { ...t, status: toStatus };
      });

      // Reassign orders for affected columns
      const applyOrders = (status: BoardStatus, ids: string[]) => {
        const orderMap = new Map(ids.map((id, idx) => [id, idx]));
        return updated.map((t) =>
          t.status === status && orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
        );
      };

      const withTo = applyOrders(toStatus, toIds);
      if (fromStatus === toStatus) return withTo;
      return applyOrders(fromStatus, fromIds);
    });

    // Persist: status change (if cross-column) + reorder(s)
    if (fromStatus !== toStatus) {
      await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      await Promise.all([persistOrders(fromStatus, fromIds), persistOrders(toStatus, toIds)]);
    } else {
      await persistOrders(toStatus, toIds);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + banner */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-md shadow-slate-200">
        <div className="h-28 bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400" />
        <div className="-mt-10 flex items-center justify-between gap-4 px-6 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-indigo-600 shadow-md">
              {project.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Project board
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {project.name}
              </h1>
              <p className="text-xs text-slate-500">
                Shared Kanban board with live task timers for your company.
              </p>
            </div>
          </div>
          <Link
            href="/app"
            className="hidden cursor-pointer items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 md:inline-flex"
          >
            ← Back to workspace
          </Link>
        </div>
      </div>

      {/* Add task row */}
      <div className="flex gap-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick add task…"
          className="bg-white"
        />
        <Button onClick={createTask} disabled={saving || newTitle.trim().length === 0}>
          Add task
        </Button>
      </div>

      {/* Board columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col rounded-2xl bg-slate-50/80 p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {col.title}
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {byStatus[col.key].length}
                </span>
              </div>

              <Droppable droppableId={col.key}>
                {(dropProvided) => (
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className="min-h-[220px] space-y-3 rounded-xl bg-slate-100/80 p-3"
                  >
                    {byStatus[col.key].map((t, idx) => {
                      const meWorking = t.activeUserIds.includes(session.userId);
                      const displayedMs = computeDisplayedMs(t);
                      const workingNames = t.activeUserIds
                        .map((id) => users.find((u) => u.id === id)?.name)
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <Draggable key={t.id} draggableId={t.id} index={idx}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-800">{t.title}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Time: {formatDuration(displayedMs)}
                                  </div>
                                  {t.activeUserIds.length > 0 ? (
                                    <div className="text-[11px] text-slate-500">
                                      Working:{" "}
                                      <span className="font-medium text-slate-700">
                                        {workingNames || `${t.activeUserIds.length} user(s)`}
                                      </span>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-col gap-2">
                                  {t.status === "done" ? null : meWorking ? (
                                    <Button
                                      variant="secondary"
                                      onClick={() => onStopTimer(t.id)}
                                      className="h-8 px-3 text-xs"
                                    >
                                      Stop
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() => onStartTimer(t.id)}
                                      className="h-8 px-3 text-xs"
                                    >
                                      Start
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {dropProvided.placeholder}
                    {byStatus[col.key].length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
                        Drop tasks here
                      </div>
                    ) : null}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

