export function formatDate(input) {
  if (!input) return '—';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(input);
  }
}

export function formatRelativeTime(input) {
  if (!input) return 'Never';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return String(input);
  }
}

export function formatExpiry(input) {
  if (!input) return 'Permanent';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const now = Date.now();
    const diffMs = d.getTime() - now;
    if (diffMs <= 0) return 'Expired';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m remaining`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h remaining`;
  } catch {
    return String(input);
  }
}

export function formatBytes(bytes) {
  if (bytes === 0 || bytes === '0') return '0 B';
  if (!bytes) return '—';
  const num = Number(bytes);
  if (isNaN(num)) return String(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export function safeJsonStringify(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  }
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}
