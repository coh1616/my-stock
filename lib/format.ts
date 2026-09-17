export function formatNumber(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}
