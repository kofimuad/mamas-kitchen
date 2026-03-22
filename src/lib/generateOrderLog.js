// src/lib/generateOrderLog.js
// Generates a detailed order log PDF using jsPDF (npm package)
// All order data, timeline events, payment info, and stats included

import { jsPDF } from 'jspdf'

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusLabel(status) {
  const map = {
    pending_payment: 'Awaiting Payment',
    confirmed:       'Confirmed',
    delivered:       'Delivered',
    new:             'New',
    cooking:         'Cooking',
    ready:           'Ready',
    declined:        'Declined',
  }
  return map[status] || status
}

export async function generateOrderLog(orders, title = 'All Orders') {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW     = 210  // page width mm
  const PH     = 297  // page height mm
  const ML     = 18   // margin left
  const MR     = 18   // margin right
  const CW     = PW - ML - MR
  const BROWN  = [30, 14, 4]
  const ORANGE = [212, 84, 26]
  const GOLD   = [200, 155, 40]
  const LGRAY  = [230, 220, 212]
  const MGRAY  = [170, 140, 110]
  const WHITE  = [255, 255, 255]
  const GREEN  = [34, 140, 80]
  const RED    = [192, 50, 40]

  let y = 0

  function checkPage(needed = 20) {
    if (y + needed > PH - 18) {
      doc.addPage()
      y = 18
      drawPageFooter()
    }
  }

  function drawPageFooter() {
    const pg = doc.internal.getCurrentPageInfo().pageNumber
    doc.setFontSize(8)
    doc.setTextColor(...MGRAY)
    doc.text(`Obaa Yaa's Kitchen — Confidential Order Log`, ML, PH - 8)
    doc.text(`Page ${pg}`, PW - MR, PH - 8, { align: 'right' })
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.line(ML, PH - 12, PW - MR, PH - 12)
  }

  // ── COVER / HEADER ─────────────────────────────────────────
  // Dark header bar
  doc.setFillColor(...BROWN)
  doc.rect(0, 0, PW, 48, 'F')

  doc.setFontSize(22)
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.text("Obaa Yaa's Kitchen", ML, 20)

  doc.setFontSize(11)
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'normal')
  doc.text('AUTHENTIC GHANAIAN CUISINE', ML, 28)

  doc.setFontSize(14)
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.text(title, ML, 40)

  // Report meta
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'normal')
  const generated = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  doc.text(`Generated: ${generated}`, PW - MR, 40, { align: 'right' })
  doc.text(`Total Orders: ${orders.length}`, PW - MR, 32, { align: 'right' })

  y = 58

  // ── SUMMARY STATS ──────────────────────────────────────────
  doc.setFontSize(11)
  doc.setTextColor(...BROWN)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', ML, y)
  y += 5
  doc.setDrawColor(...ORANGE)
  doc.setLineWidth(0.8)
  doc.line(ML, y, ML + 30, y)
  y += 7

  // Count by status
  const byStatus = {}
  let totalRevenue = 0
  let confirmedCount = 0
  let pendingCount = 0
  const itemFreq = {}

  orders.forEach(o => {
    const s = o.status || 'unknown'
    byStatus[s] = (byStatus[s] || 0) + 1
    if (s === 'confirmed' || s === 'delivered') {
      totalRevenue += o.total || 0
      confirmedCount++
    }
    if (s === 'pending_payment') pendingCount++
    ;(o.items || o.plates || []).forEach(p => {
      itemFreq[p.name] = (itemFreq[p.name] || 0) + (p.qty || 1)
    })
  })

  const topItems = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Stats boxes (2 columns)
  const stats = [
    { label: 'Total Orders',          value: String(orders.length) },
    { label: 'Confirmed / Delivered', value: String(confirmedCount) },
    { label: 'Awaiting Payment',       value: String(pendingCount) },
    { label: 'Total Revenue',          value: `$${totalRevenue}` },
  ]

  const boxW = (CW - 6) / 2
  stats.forEach((s, i) => {
    const bx = ML + (i % 2) * (boxW + 6)
    const by = y + Math.floor(i / 2) * 22
    doc.setFillColor(252, 247, 242)
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.4)
    doc.roundedRect(bx, by, boxW, 18, 2, 2, 'FD')
    doc.setFontSize(7.5)
    doc.setTextColor(...MGRAY)
    doc.setFont('helvetica', 'bold')
    doc.text(s.label.toUpperCase(), bx + 5, by + 6.5)
    doc.setFontSize(16)
    doc.setTextColor(...ORANGE)
    doc.setFont('helvetica', 'bold')
    doc.text(s.value, bx + 5, by + 14)
  })
  y += 48

  // Top items
  if (topItems.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(...BROWN)
    doc.setFont('helvetica', 'bold')
    doc.text('Most Ordered Items', ML, y)
    y += 5

    topItems.forEach(([name, count], i) => {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BROWN)
      doc.text(`${i + 1}. ${name}`, ML + 3, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...ORANGE)
      doc.text(`×${count}`, PW - MR, y, { align: 'right' })
      y += 6
    })
  }

  y += 8
  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.4)
  doc.line(ML, y, PW - MR, y)
  y += 10

  // ── ORDER ENTRIES ──────────────────────────────────────────
  doc.setFontSize(11)
  doc.setTextColor(...BROWN)
  doc.setFont('helvetica', 'bold')
  doc.text('Order Details', ML, y)
  y += 5
  doc.setDrawColor(...ORANGE)
  doc.setLineWidth(0.8)
  doc.line(ML, y, ML + 36, y)
  y += 8

  orders.forEach((order, idx) => {
    const items   = order.items || order.plates || []
    const info    = order.info || {}
    const name    = info.name    || order.customerName || '—'
    const branch  = info.branch  || order.branch       || '—'
    const batt    = info.battalion || order.battalion   || ''
    const phone   = info.phone   || order.phone        || '—'
    const payM    = info.paymentMethod  || order.paymentMethod  || '—'
    const payH    = info.paymentHandle  || '—'
    const status  = order.status || 'unknown'
    const isConf  = status === 'confirmed' || status === 'delivered'

    // Estimate height needed for this order
    const neededH = 14 + (items.length * 6) + 48
    checkPage(neededH)

    // Order header bar
    doc.setFillColor(isConf ? 240 : 252, isConf ? 248 : 247, isConf ? 244 : 242)
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.roundedRect(ML, y, CW, 12, 2, 2, 'FD')

    // Order number + status
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BROWN)
    doc.text(`#${idx + 1}  —  Order ${order._id?.toString().slice(-8).toUpperCase() || '—'}`, ML + 4, y + 7.5)

    // Status pill
    const pillColor = isConf ? GREEN : status === 'pending_payment' ? [160, 120, 0] : status === 'declined' ? RED : MGRAY
    doc.setFillColor(...pillColor)
    const statusText = statusLabel(status)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    const pillW = doc.getTextWidth(statusText) + 6
    doc.roundedRect(PW - MR - pillW - 2, y + 3, pillW + 2, 6, 1, 1, 'F')
    doc.text(statusText, PW - MR - pillW / 2 - 1, y + 7.2, { align: 'center' })

    y += 15

    // Two-column layout: customer info left, order info right
    const colW = (CW - 6) / 2

    // Left: customer details
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...ORANGE)
    doc.text('CUSTOMER', ML, y)
    y += 4.5

    const customerLines = [
      ['Name',        name],
      ['Branch',      `${branch}${batt ? ' · ' + batt : ''}`],
      ['Phone',       phone],
      ['Payment',     payM === 'cashapp' ? 'Cash App' : payM === 'zelle' ? 'Zelle' : payM],
      ['Handle',      payH],
      ['Order Type',  order.orderType === 'tray' ? 'Tray Order (Wednesday)' : 'Plate Order (Saturday)'],
    ]

    const infoStartY = y
    customerLines.forEach(([label, val]) => {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...MGRAY)
      doc.text(`${label}:`, ML, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BROWN)
      const lines = doc.splitTextToSize(String(val || '—'), colW - 22)
      doc.text(lines, ML + 22, y)
      y += lines.length * 4.5
    })

    // Right: items ordered
    const rightX = ML + colW + 6
    let ry = infoStartY

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...ORANGE)
    doc.text('ITEMS ORDERED', rightX, ry)
    ry += 4.5

    items.forEach(item => {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BROWN)
      const itemName = doc.splitTextToSize(`${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}`, colW - 20)
      doc.text(itemName, rightX, ry)
      if (item.price != null) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...ORANGE)
        doc.text(`$${item.price * (item.qty || 1)}`, PW - MR, ry, { align: 'right' })
      }
      ry += itemName.length * 4.5
    })

    // Total
    ry += 1
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.line(rightX, ry, PW - MR, ry)
    ry += 4
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BROWN)
    doc.text('Total', rightX, ry)
    doc.setTextColor(...ORANGE)
    doc.text(`$${order.total || 0}`, PW - MR, ry, { align: 'right' })
    ry += 5

    // Sync y to whichever column is taller
    y = Math.max(y, ry) + 4

    // ── Timeline ─────────────────────────────────────────────
    checkPage(28)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...ORANGE)
    doc.text('TIMELINE', ML, y)
    y += 4.5

    const timeline = []
    if (order.createdAt)   timeline.push({ event: 'Order placed',    time: order.createdAt,   color: BROWN })
    if (order.confirmedAt) timeline.push({ event: 'Order confirmed', time: order.confirmedAt, color: GREEN })
    if (order.deliveredAt) timeline.push({ event: 'Delivered',       time: order.deliveredAt, color: ORANGE })

    // Calculate time-to-confirm
    if (order.createdAt && order.confirmedAt) {
      const diffMs  = new Date(order.confirmedAt) - new Date(order.createdAt)
      const diffMin = Math.round(diffMs / 60000)
      const diffStr = diffMin < 60
        ? `${diffMin}m`
        : `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`
      timeline[1].extra = `(confirmed in ${diffStr})`
    }

    if (timeline.length === 0) {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...MGRAY)
      doc.text('No timeline events recorded yet.', ML + 3, y)
      y += 5
    } else {
      timeline.forEach((t, i) => {
        // Dot
        doc.setFillColor(...t.color)
        doc.circle(ML + 3, y - 1, 1.5, 'F')
        // Line connector
        if (i < timeline.length - 1) {
          doc.setDrawColor(...LGRAY)
          doc.setLineWidth(0.4)
          doc.line(ML + 3, y + 0.5, ML + 3, y + 4.5)
        }
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...t.color)
        doc.text(t.event, ML + 7, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MGRAY)
        doc.text(fmt(t.time), ML + 50, y)
        if (t.extra) {
          doc.setTextColor(...GREEN)
          doc.text(t.extra, ML + 100, y)
        }
        y += 5
      })
    }

    // Divider between orders
    y += 4
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.line(ML, y, PW - MR, y)
    y += 8
  })

  // Draw footer on last page
  drawPageFooter()

  // ── Save ──────────────────────────────────────────────────
  const dateStr  = new Date().toISOString().slice(0, 10)
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  doc.save(`obaa-yaa-${safeName}-${dateStr}.pdf`)
}
