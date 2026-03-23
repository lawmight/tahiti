export function LoadingSpinner({ message = 'Chargement des données…' }: { message?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}
