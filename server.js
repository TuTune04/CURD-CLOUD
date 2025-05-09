const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Home page - list all items
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id ASC');
    res.render('index', { items: result.rows });
  } catch (err) {
    console.error(err);
    res.render('index', { items: [], error: 'Failed to fetch items' });
  }
});

// Create a new item
app.post('/items', async (req, res) => {
  const { name, description } = req.body;
  try {
    await pool.query('INSERT INTO items (name, description) VALUES ($1, $2)', [name, description]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete an item
app.post('/items/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update an item
app.post('/items/:id/update', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await pool.query('UPDATE items SET name = $1, description = $2 WHERE id = $3', 
      [name, description, id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get a specific item for editing
app.get('/items/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.render('edit', { item: result.rows[0] });
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 