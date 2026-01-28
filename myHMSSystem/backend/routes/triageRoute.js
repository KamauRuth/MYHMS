const express = require("express");
const router = express.Router();

const {
  createTriage,
  getPendingTriage,
  routeTriage
} = require("../controllers/triageController");

// CREATE TRIAGE
router.post("/", createTriage);

// GET TRIAGE QUEUE
router.get("/pending", getPendingTriage);

// ROUTE TRIAGE
router.put("/:triageId/route", routeTriage);

module.exports = router;
