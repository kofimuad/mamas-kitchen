// src/lib/api.js
// In dev:  calls http://localhost:3001/api/...
// In prod: calls /.netlify/functions/...

const isDev  = import.meta.env.DEV
const BASE   = isDev ? 'http://localhost:3001/api' : '/.netlify/functions'

export function apiUrl(name) {
  // Dev:  /api/get-menu
  // Prod: /.netlify/functions/get-menu
  return `${BASE}/${name}`
}

export const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || ''

export function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
  }
}
