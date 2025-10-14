export default function AdminFinancialsPage() {
  return (
    <div className="space-y-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Financial dashboard</h1>
        <p className="text-sm text-muted-foreground">
          View revenue trends, order volumes, and payout readiness per bar.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <div className="rounded-xl border bg-card p-6" key={index}>
            <p className="text-sm text-muted-foreground">Metric {index}</p>
            <p className="mt-2 text-3xl font-semibold">£0.00</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Connect this dashboard to `/v1/admin/metrics/revenue` and `/v1/admin/metrics/orders` to populate the charts.
      </p>
    </div>
  );
}
