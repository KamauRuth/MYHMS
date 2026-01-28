const express = require("express");
const router = express.Router();

const {
  createInvoice,
  addInvoiceItem,
  getInvoices
} = require("../controllers/billingController");

router.post("/", createInvoice);
router.post("/items", addInvoiceItem);
router.get("/", getInvoices);

module.exports = router;
