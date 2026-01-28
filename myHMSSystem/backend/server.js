require("dotenv").config();
const express = require("express");
const cors = require("cors");

const consultationRoute = require("./routes/consultationRoute");
const labRoute = require("./routes/labRoute");
const admissionRoute = require("./routes/admissionRoute");
const patientRoute = require("./routes/patientRoute");
const visitRoute = require("./routes/visitRoute");
const prescriptionRoute = require("./routes/prescriptionRoute");
const vitalRoute = require("./routes/vitalRoute")
const triageRoute = require("./routes/triageRoute");
const maternityRoute = require("./routes/maternityRoute");
const billingRoute = require("./routes/billingRoute");
const icd11Route = require("./routes/icd11Route");

const app = express();
app.use(cors({
  origin: "http://localhost:5173", // Vite frontend
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());


app.use("/api/consultations", consultationRoute);
app.use("/api/labs", labRoute);
app.use("/api/admissions", admissionRoute);
app.use("/api/patients", patientRoute);
app.use("/api/visits", visitRoute);
app.use("/api/vitals", vitalRoute)
app.use("/api/prescriptions", prescriptionRoute);
app.use("/api/triages", triageRoute);
app.use("/api/maternity", maternityRoute);
app.use("/api/billing", billingRoute);
app.use("/api/icd11", icd11Route);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

console.log("WHO_CLIENT_ID:", process.env.WHO_CLIENT_ID ? "LOADED" : "MISSING");
console.log("WHO_CLIENT_SECRET:", process.env.WHO_CLIENT_SECRET ? "LOADED" : "MISSING");

console.log("ICD TOKEN:", process.env.WHO_ICD_TOKEN);

