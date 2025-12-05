function error(res, status, code, message, details) {
  const payload = { ok: false, error: { code, message } }
  if (details !== undefined) payload.error.details = details
  return res.status(status).json(payload)
}

function ok(res, status, data) {
  return res.status(status).json(data)
}

module.exports = { error, ok }