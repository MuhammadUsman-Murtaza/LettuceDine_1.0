const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors()); // Critical for React Native to connect

// Use the environment variable from docker-compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, cuisine, ST_AsGeoJSON(location)::json AS coords 
      FROM restaurants;
    `);
    console.log(result.rows)
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend API listening on port 3000');
});