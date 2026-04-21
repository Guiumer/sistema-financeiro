export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

export function getMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  return `${month}/${year}`;
}

export function isSameMonth(dateStr: string, monthsAgo = 0): boolean {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const [year, month] = dateStr.split('-').map(Number);
  return year === target.getFullYear() && month === target.getMonth() + 1;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
