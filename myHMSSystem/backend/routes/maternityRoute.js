const express = require("express");
const router = express.Router();

const {
  createMaternityCase,
  addDeliveryRecord,
  getMaternityCases
} = require("../controllers/maternityController");

router.post("/", createMaternityCase);
router.post("/delivery", addDeliveryRecord);
router.get("/", getMaternityCases);

module.exports = router;
