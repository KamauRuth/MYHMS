const express = require("express");
const router = express.Router();

const {
  createPrescription,
  addPrescriptionItem,
  getPrescriptions
} = require("../controllers/prescriptionController");

router.post("/", createPrescription);
router.post("/items", addPrescriptionItem);
router.get("/", getPrescriptions);

module.exports = router;
