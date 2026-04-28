export const GRADE_LABELS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] as const

export const GRADE_COLORS: Record<string, string> = {
  'A+': '#4CAF50', 'A': '#4CAF50', 'A-': '#8BC34A',
  'B+': '#CDDC39', 'B': '#CDDC39', 'B-': '#FFEB3B',
  'C+': '#FFC107', 'C': '#FFC107', 'C-': '#FF9800',
  'D+': '#FF5722', 'D': '#FF5722', 'D-': '#F44336',
  'F': '#D32F2F',
}

export const GPA_SCALE_MIN = 1
export const GPA_SCALE_MAX = 4.3

export function brightenHex(hex: string, amount = 0.16): string {
  const normalized = hex.replace('#', '');
  const fullHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) return hex;

  const channel = (offset: number) => Number.parseInt(fullHex.slice(offset, offset + 2), 16);
  const blend = (value: number) => Math.round(value + (255 - value) * amount);

  return `rgb(${blend(channel(0))}, ${blend(channel(2))}, ${blend(channel(4))})`;
}
