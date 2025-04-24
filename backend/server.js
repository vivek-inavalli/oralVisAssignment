// server.js

require("dotenv").config(); // Load .env
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Serve uploaded images

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const SECRET = process.env.SECRET;
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

//── Mongoose Schemas & Models ────────────────────────────────────────────────
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "patient" },
});
const User = mongoose.model("User", userSchema);

const dentistSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "dentist" },
});
const Dentist = mongoose.model("Dentist", dentistSchema);

const checkupRequestSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dentist: { type: Schema.Types.ObjectId, ref: "Dentist", required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
const CheckupRequest = mongoose.model("CheckupRequest", checkupRequestSchema);

const checkupResultSchema = new Schema({
  checkupRequest: {
    type: Schema.Types.ObjectId,
    ref: "CheckupRequest",
    required: true,
  },
  images: [String], // file paths under /uploads
  notes: String,
  createdAt: { type: Date, default: Date.now },
});
const CheckupResult = mongoose.model("CheckupResult", checkupResultSchema);

//── Routes ───────────────────────────────────────────────────────────────────

// Auth: signup & login for patients
app.post("/api/user/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password, role: "patient" });
    await user.save();
    res.status(201).json({ message: "Patient registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: signup & login for dentists
app.post("/api/dentists/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const dentist = new Dentist({ username, password, role: "dentist" });
    await dentist.save();
    res.status(201).json({ message: "Dentist registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/dentists/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const dentist = await Dentist.findOne({ username, password });
    if (!dentist)
      return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: dentist._id, role: dentist.role }, SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all dentists (public)
app.get("/api/dentists", async (req, res) => {
  try {
    const dentists = await Dentist.find().select("username");
    res.json(dentists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient requests a checkup
app.post("/api/checkup-requests", authenticateToken, async (req, res) => {
  if (req.user.role !== "patient") return res.sendStatus(403);
  const { dentistId } = req.body;
  try {
    const reqDoc = new CheckupRequest({
      patient: req.user.id,
      dentist: dentistId,
    });
    await reqDoc.save();
    res.status(201).json(reqDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dentist views assigned requests
app.get(
  "/api/dentist/checkup-requests",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "dentist") return res.sendStatus(403);
    try {
      const requests = await CheckupRequest.find({
        dentist: req.user.id,
      }).populate("patient", "username");
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Dentist uploads results (images + notes)
app.post(
  "/api/dentist/upload-result/:requestId",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    if (req.user.role !== "dentist") return res.sendStatus(403);
    try {
      const imagePaths = req.files.map(
        (f) => `/uploads/${path.basename(f.path)}`
      );
      const { notes } = req.body;
      const result = new CheckupResult({
        checkupRequest: req.params.requestId,
        images: imagePaths,
        notes,
      });
      await result.save();
      await CheckupRequest.findByIdAndUpdate(req.params.requestId, {
        status: "completed",
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Patient views their results
app.get(
  "/api/checkup-results/:requestId",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "patient") return res.sendStatus(403);
    try {
      const result = await CheckupResult.findOne({
        checkupRequest: req.params.requestId,
      }).populate({
        path: "checkupRequest",
        populate: { path: "dentist", select: "username" },
      });
      if (!result) return res.status(404).json({ message: "No results yet" });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
