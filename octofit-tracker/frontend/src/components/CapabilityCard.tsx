import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, loading, error, empty, emptyText, children }: Props) {
  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{loading ? <p role="status">Loading...</p> : null}{error ? <div role="alert">{error}</div> : null}{!loading && !error && !empty && children ? <>{children}</> : null}{!loading && !error && empty ? <p>{emptyText ?? 'No data available.'}</p> : null}</div></section>;
}
