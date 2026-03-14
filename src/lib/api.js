// src/lib/api.js
// In dev:  calls http://localhost:3001/api/...
// In prod: calls /.netlify/functions/...

const isDev = import.meta.env.DEV
const BASE  = isDev ? 'http://localhost:3001/api' : '/.netlify/functions'

export function apiUrl(name) {
  return `${BASE}/${name}`
}

// Auth uses the admin PIN stored at login time — never exposes server secrets to the browser
function getAdminPin() {
  return sessionStorage.getItem('mama_admin_pin') || ''
}

export function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-pin': getAdminPin(),
  }
}
