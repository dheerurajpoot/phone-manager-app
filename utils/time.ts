export function formatLastSeen(iso?: string): string {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function isOnline(iso?: string, thresholdSeconds = 20): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  return diffSec <= thresholdSeconds;
}

