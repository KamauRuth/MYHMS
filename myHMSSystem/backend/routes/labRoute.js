const express = require("express");
const router = express.Router();

const {
  createLab,
  getLabs,
  createLabResult
} = require("../controllers/labController");

router.post("/", createLab);
router.get("/", getLabs);
router.post("/results", createLabResult);

module.exports = router;
