function success(res, status, data, message) {
  return res.status(status).json({ success: true, data, message });
}

function error(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

module.exports = { success, error };
