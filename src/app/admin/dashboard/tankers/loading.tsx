export default function TankersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-surface-2" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border-subtle bg-surface-1 p-6">
            <div className="h-6 w-40 rounded bg-surface-2" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 rounded bg-surface-2" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
