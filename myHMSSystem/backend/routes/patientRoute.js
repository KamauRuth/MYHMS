const express = require("express");
const router = express.Router();

const {
  createPatient,
  getPatients
} = require("../controllers/patientController");

// POST /api/patients
router.post("/", createPatient);

// GET /api/patients
router.get("/", getPatients);

module.exports = router;
