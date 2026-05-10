// src/lib/weekUtils.js
// Retained for any future utility use. Active cycle logic has moved to the
// backend (cycles collection) and the useActiveCycle hook.

// Get the Thursday of the current delivery week (Thursday-anchored, Thu–Wed)
export function getWeekStart(date = new Date()) {
  const d   = new Date(date)
  const day = d.getDay()
  const diff = day >= 4 ? day - 4 : day + 3
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Format a week label like "Week of Mar 22"
export function weekLabel(date = new Date()) {
  const thursday = getWeekStart(date)
  return `Week of ${thursday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
