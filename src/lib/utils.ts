// Shared utility helpers for Worxstance.

export const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });


