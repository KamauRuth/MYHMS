const express = require("express");
const router = express.Router();

const {
  createVital,
  getVitalsByAdmission
} = require("../controllers/vitalController");

// ADD VITALS
router.post("/", createVital);

// GET VITALS FOR ADMISSION
router.get("/:admissionId", getVitalsByAdmission);

module.exports = router;
