function error(res, status, code, message, details) {
  const payload = { ok: false, error: { code, message } }
  if (details !== undefined) payload.error.details = details
  return res.status(status).json(payload)
}

function ok(res, status, data) {
  return res.status(status).json(data)
}

function success(res, status, data, message) {
  // If data is an object, we can merge message if needed, or wrap it.
  // For now, let's just return data like ok(), ignoring message or adding it if data is object.
  // But signup.js passes message as 4th arg.
  // Let's assume the previous implementation (if it existed) might have wrapped it.
  // But to be safe and simple:
  return res.status(status).json(data)
}

module.exports = { error, ok, success }