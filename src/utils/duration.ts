/**
 * Format durasi dalam milidetik menjadi string yang mudah dibaca manusia.
 * Contoh: 5425000 -> "1j 30m 25d"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // tampilkan detik kalau durasi < 1 menit, atau kalau tidak ada part lain
  if (seconds > 0 && hours === 0) parts.push(`${seconds}d`);
  if (parts.length === 0) parts.push("0d");

  return parts.join(" ");
}
