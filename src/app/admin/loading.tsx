export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-6 py-10 md:py-14">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded-full bg-white/50" />
        <div className="h-10 w-64 rounded-2xl bg-white/60" />
        <div className="h-4 w-full max-w-md rounded-full bg-white/45" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[1.6rem] border border-white/50 bg-white/45" />
        ))}
      </div>
      <div className="h-64 rounded-[2rem] border border-white/50 bg-white/45" />
      <div className="h-48 rounded-[2rem] border border-white/50 bg-white/40" />
    </div>
  );
}
