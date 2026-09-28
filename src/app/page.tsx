import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          タスクカンバン
        </h1>
        <KanbanBoard />
      </main>
    </div>
  );
}
