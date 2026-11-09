export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kgso-card kgso-kpi"><div className="kgso-mu">{label}</div><div className="kgso-kpival">{value}</div>{hint && <div className="kgso-mu kgso-small">{hint}</div>}</div>
  );
}
