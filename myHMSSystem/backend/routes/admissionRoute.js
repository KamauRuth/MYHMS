const express = require("express");
const router = express.Router();

const {
  createAdmission,
  getActiveAdmissions,
  dischargePatient
} = require("../controllers/admissionController");

// CREATE ADMISSION
router.post("/", createAdmission);

// GET ACTIVE ADMISSIONS
router.get("/active", getActiveAdmissions);

// DISCHARGE PATIENT
router.put("/:admissionId/discharge", dischargePatient);

module.exports = router;
