export type BoardStatus = "todo" | "in_progress" | "done";

export type BoardUser = {
  id: string;
  name: string;
};

export type BoardTask = {
  id: string;
  title: string;
  description: string;
  status: BoardStatus;
  order: number;
  assigneeUserIds: string[];
  accumulatedMs: number;
  activeUserIds: string[];
  lastStartAt: string | null; // ISO string
};

