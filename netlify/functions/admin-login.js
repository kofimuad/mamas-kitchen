const { checkAdminPin } = require('./_auth')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let pin
  try {
    ;({ pin } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  if (!pin || typeof pin !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing pin' }) }
  }

  // Re-use the same brute-force tracking as every other admin function
  const auth = checkAdminPin({ ...event.headers, 'x-admin-pin': pin })
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  }
}
