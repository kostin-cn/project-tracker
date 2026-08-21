export function formatDate(dateValue?: string | number | Date): string {
  if (!dateValue) return 'нещодавно'

  return new Date(dateValue).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
