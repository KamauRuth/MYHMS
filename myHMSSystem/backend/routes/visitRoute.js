const express = require("express");
const router = express.Router();

const {
  createVisit,
  getVisits
} = require("../controllers/visitController");

// POST /api/visits
router.post("/", createVisit);

// GET /api/visits
router.get("/", getVisits);

module.exports = router;
