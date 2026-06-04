const express = require("express");
const User = require("../models/User");
const Role = require("../models/Role");
const respond = require("../middleware/respond");

const router = express.Router();

function requireInternalKey(req, res, next) {
  const key = req.headers["x-internal-key"];
  const expected = process.env.INTERNAL_SERVICE_KEY;
  if (expected && key !== expected) {
    return respond.error(res, 403, "forbidden", "Invalid internal key");
  }
  next();
}

router.get("/users/:id", requireInternalKey, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("role")
      .lean();
    if (!user) return respond.error(res, 404, "not_found", "User not found");
    return respond.success(res, 200, user);
  } catch (err) {
    return respond.error(res, 500, "internal", err.message);
  }
});

router.get("/users", requireInternalKey, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      const role = await Role.findOne({ slug: req.query.role });
      if (role) filter.role = role._id;
    }
    const users = await User.find(filter)
      .select("-passwordHash")
      .populate("role")
      .lean();
    return respond.success(res, 200, users);
  } catch (err) {
    return respond.error(res, 500, "internal", err.message);
  }
});

module.exports = router;
