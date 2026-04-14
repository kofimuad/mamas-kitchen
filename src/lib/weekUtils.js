// src/lib/weekUtils.js
// Utilities for determining the current delivery week and next upcoming event

// Delivery schedule:
// - Plate orders: cutoff Friday 6PM, delivery Saturday
// - Tray orders:  cutoff Monday 8PM,   delivery Wednesday

// Returns 'plate' or 'tray' based on what the next upcoming delivery is
// Schedule:
//   Tray cutoff: Monday 8PM → delivery Wednesday
//   Plate cutoff: Friday 6PM → delivery Saturday
//
// Day windows:
//   Sun           → next = Wednesday tray
//   Mon before 8PM → next = Wednesday tray   (still can order)
//   Mon 8PM+      → next = Saturday plate    (tray cutoff passed)
//   Tue           → next = Saturday plate
//   Wed           → next = Saturday plate
//   Thu           → next = Saturday plate
//   Fri before 6PM → next = Saturday plate   (still can order)
//   Fri 6PM+      → next = Wednesday tray    (plate cutoff passed)
//   Sat           → next = Wednesday tray
export function getNextDeliveryType() {
  const now  = new Date()
  const day  = now.getDay() // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const hour = now.getHours()

  if (day === 0) return 'tray'                          // Sunday
  if (day === 1) return hour < 20 ? 'tray'  : 'plate'  // Monday
  if (day === 2) return 'plate'                         // Tuesday
  if (day === 3) return 'plate'                         // Wednesday
  if (day === 4) return 'plate'                         // Thursday
  if (day === 5) return hour < 18 ? 'plate' : 'tray'   // Friday
  if (day === 6) return 'tray'                          // Saturday
  return 'plate'
}

// Returns label for the next delivery
export function getNextDeliveryLabel() {
  return getNextDeliveryType() === 'tray'
    ? { type: 'tray',  day: 'Wednesday', cutoff: 'Monday 8 PM',   tab: 'tray'  }
    : { type: 'plate', day: 'Saturday',  cutoff: 'Friday 6 PM',   tab: 'plate' }
}

// Get the Thursday of the current delivery week (week starts Thursday, ends Wednesday)
export function getWeekStart(date = new Date()) {
  // Delivery week: Thursday (start) to next Wednesday (delivery)
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ..., 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Find most recent Thursday (or today if Thursday)
  // If today is Thu (4), diff = 0; if Wed (3), diff = -6
  // So: diff = (day >= 4) ? day - 4 : day + 3
  const diff = (day >= 4) ? day - 4 : day + 3
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Get the Wednesday and Saturday of the current delivery week
export function getDeliveryDates(date = new Date()) {
  const thursday = getWeekStart(date)
  // Wednesday is 6 days after Thursday
  const wed = new Date(thursday); wed.setDate(thursday.getDate() + 6)
  // Saturday is 2 days after Thursday
  const sat = new Date(thursday); sat.setDate(thursday.getDate() + 2)
  return { wednesday: wed, saturday: sat }
}

// Format a week label like "Week of Mar 22 (Thu)"
export function weekLabel(date = new Date()) {
  const thursday = getWeekStart(date)
  return `Week of ${thursday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// Group orders by delivery week and type
export function groupOrdersByWeekAndType(orders) {
  const groups = {}

  orders.forEach(order => {
    const created = order.createdAt ? new Date(order.createdAt) : new Date()
    if (isNaN(created.getTime())) return // skip orders with invalid dates
    const thursday  = getWeekStart(created)
    const weekKey = thursday.toISOString().slice(0, 10)
    const type    = order.orderType || 'plate'
    const key     = `${weekKey}__${type}`

    if (!groups[key]) {
      groups[key] = {
        weekKey,
        weekStart: thursday,
        weekLabel: weekLabel(created),
        type,
        label: type === 'tray' ? 'Wednesday Trays' : 'Saturday Plates',
        deliveryDate: (() => {
          try {
            return type === 'tray'
              ? getDeliveryDates(created).wednesday
              : getDeliveryDates(created).saturday
          } catch { return null }
        })(),
        orders: [],
      }
    }
    groups[key].orders.push(order)
  })

  // Sort groups: most recent week first, within same week: trays before plates (Wed before Sat)
  return Object.values(groups).sort((a, b) => {
    if (b.weekStart - a.weekStart !== 0) return b.weekStart - a.weekStart
    return a.type === 'tray' ? -1 : 1
  })
}
