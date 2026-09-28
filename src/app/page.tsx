import { SquareKanban } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-muted/40 font-sans">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <SquareKanban className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              タスクカンバン
            </h1>
            <p className="text-sm text-muted-foreground">
              Todo・InProgress・Done でタスクの進み具合を管理します
            </p>
          </div>
        </header>
        <KanbanBoard />
      </main>
    </div>
  );
}
