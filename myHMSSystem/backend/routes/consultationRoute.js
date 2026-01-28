const express = require("express");
const router = express.Router();

const {
  createConsultation,
  getConsultationsByVisit
} = require("../controllers/consultationController");

router.post("/", createConsultation);
router.get("/:visitId", getConsultationsByVisit);

module.exports = router;
