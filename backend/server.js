require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection (settings come from .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Serve the frontend page too (used after deployment)
app.use(express.static(path.join(__dirname, "..", "frontend")));

const FIELDS = ["course_code", "course_name", "lecturer", "day_of_week",
                "start_time", "end_time", "venue", "goal"];

// GET all records
app.get("/api/timetable", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM timetable ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one record
app.get("/api/timetable/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM timetable WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a record
app.post("/api/timetable", async (req, res) => {
  try {
    if (!req.body.course_code) {
      return res.status(400).json({ error: "course_code is required" });
    }
    const values = FIELDS.map(f => req.body[f] || null);
    const result = await pool.query(
      `INSERT INTO timetable (${FIELDS.join(", ")})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      values
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update a record
app.put("/api/timetable/:id", async (req, res) => {
  try {
    if (!req.body.course_code) {
      return res.status(400).json({ error: "course_code is required" });
    }
    const values = FIELDS.map(f => req.body[f] || null);
    const result = await pool.query(
      `UPDATE timetable SET
         course_code=$1, course_name=$2, lecturer=$3, day_of_week=$4,
         start_time=$5, end_time=$6, venue=$7, goal=$8,
         updated_at=CURRENT_TIMESTAMP
       WHERE id=$9 RETURNING *`,
      [...values, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a record
app.delete("/api/timetable/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM timetable WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted", deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));