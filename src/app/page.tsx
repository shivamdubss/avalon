import { CreateJoinCard } from "@/components/landing/CreateJoinCard";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-page-glow" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <section className="space-y-6">
          <p className="text-xs uppercase tracking-[0.24em] text-gild">Multiplayer Avalon</p>
          <h1 className="max-w-3xl font-display text-6xl leading-none text-parchment sm:text-7xl">
            Gather a hidden court and betray each other in real time.
          </h1>
          <p className="max-w-2xl text-lg text-mist/82">
            Private room codes. No accounts. Mobile-first decisions. Standard Avalon rules with
            narration, reconnect handling, and public team votes.
          </p>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Players</p>
              <p className="mt-2 text-3xl font-semibold text-parchment">5-10</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Mode</p>
              <p className="mt-2 text-3xl font-semibold text-parchment">Realtime</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Devices</p>
              <p className="mt-2 text-3xl font-semibold text-parchment">Phone First</p>
            </div>
          </div>
        </section>

        <div className="justify-self-end">
          <CreateJoinCard />
        </div>
      </div>
    </main>
  );
}

