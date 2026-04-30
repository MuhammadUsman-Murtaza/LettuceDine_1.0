const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// RESTAURANTS
// GET /restaurants           — list all
// GET /restaurants/:id       — single restaurant with its address
// ============================================================
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.rating,
        r.affordability,
        a.street,
        a.city,
        a.zip_code,
        ST_AsGeoJSON(a.location)::json AS coords
      FROM restaurants r
      LEFT JOIN addresses a ON a.address_id = r.address_id
      ORDER BY r.rating DESC NULLS LAST;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/restaurants/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.name, r.rating, r.affordability,
        a.street, a.city, a.zip_code,
        ST_AsGeoJSON(a.location)::json AS coords
      FROM restaurants r
      LEFT JOIN addresses a ON a.address_id = r.address_id
      WHERE r.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// MENUS
// GET /restaurants/:id/menu  — all items for a restaurant
// Columns: food_item | beverages | desserts | starter | description | price
// ============================================================
app.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        menu_id,
        food_item,
        beverages,
        desserts,
        starter,
        description,
        price
      FROM menus
      WHERE restaurant_id = $1
      ORDER BY menu_id
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/restaurants/:id/menu', async (req, res) => {
  const { food_item, beverages, desserts, starter, description, price } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO menus (restaurant_id, food_item, beverages, desserts, starter, description, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.params.id, food_item, beverages, desserts, starter, description, price]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// CUSTOMERS
// GET  /customers/:id        — profile
// POST /customers            — register new customer
// ============================================================
app.get('/customers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT customer_id, name, email, phone_num FROM customers WHERE customer_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/customers', async (req, res) => {
  const { name, email, phone_num } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO customers (name, email, phone_num)
      VALUES ($1, $2, $3)
      RETURNING customer_id, name, email, phone_num
    `, [name, email, phone_num]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// ADDRESSES  (latitude + longitude — no PostGIS)
// GET  /customers/:id/addresses
// POST /customers/:id/addresses
// ============================================================
app.get('/customers/:id/addresses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT address_id, street, city, zip_code, label,
             ST_AsGeoJSON(location)::json AS coords
      FROM addresses
      WHERE customer_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/customers/:id/addresses', async (req, res) => {
  const { street, city, zip_code, label, latitude, longitude } = req.body;
  try {
    const locationVal = (latitude != null && longitude != null)
      ? `ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)::geography`
      : 'NULL';
    const result = await pool.query(
      `INSERT INTO addresses (customer_id, street, city, zip_code, label, location)
       VALUES ($1, $2, $3, $4, $5, ${locationVal})
       RETURNING address_id, street, city, zip_code, label`,
      [req.params.id, street, city, zip_code, label]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// ORDERS
// GET  /customers/:id/orders   — history
// GET  /orders/:id             — full detail with items
// POST /orders                 — place order (transactional)
// PATCH /orders/:id/status     — update status
// ============================================================
app.get('/customers/:id/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id, o.order_date, o.total_amount, o.status,
        o.delivery_time, o.special_instructions,
        r.name  AS restaurant_name,
        a.street, a.city
      FROM orders o
      JOIN  restaurants r ON r.id           = o.restaurant_id
      LEFT JOIN addresses a ON a.address_id = o.address_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const orderRes = await pool.query(`
      SELECT
        o.*,
        r.name  AS restaurant_name,
        a.street, a.city,
        p.method AS payment_method, p.status AS payment_status,
        d.name   AS driver_name,   d.vehicle_type
      FROM orders o
      JOIN  restaurants r      ON r.id            = o.restaurant_id
      LEFT JOIN addresses a    ON a.address_id     = o.address_id
      LEFT JOIN payments  p    ON p.payment_id     = o.payment_id
      LEFT JOIN delivery_drivers d ON d.driver_id  = o.driver_id
      WHERE o.order_id = $1
    `, [req.params.id]);

    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const itemsRes = await pool.query(`
      SELECT
        oi.order_item_id,
        COALESCE(m.food_item, m.beverages, m.desserts, m.starter) AS item_name,
        m.description,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) AS line_total
      FROM order_items oi
      JOIN menus m ON m.menu_id = oi.menu_id
      WHERE oi.order_id = $1
    `, [req.params.id]);

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/orders', async (req, res) => {
  const {
    customer_id,
    restaurant_id,
    address_id,
    special_instructions,
    coupon_code,
    payment_method,
    items   // [{ menu_id, quantity, unit_price }]
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalAmount = items.reduce(
      (sum, i) => sum + i.unit_price * i.quantity, 0
    );

    // 1. Create payment (now includes customer_id per new ERD)
    const payRes = await client.query(`
      INSERT INTO payments (method, amount, status, customer_id)
      VALUES ($1, $2, 'Pending', $3)
      RETURNING payment_id
    `, [payment_method, totalAmount, customer_id]);
    const payment_id = payRes.rows[0].payment_id;

    // 2. Create order
    const orderRes = await client.query(`
      INSERT INTO orders
        (customer_id, restaurant_id, address_id, payment_id,
         total_amount, special_instructions, coupon_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING order_id
    `, [customer_id, restaurant_id, address_id, payment_id,
        totalAmount, special_instructions, coupon_code || null]);
    const order_id = orderRes.rows[0].order_id;

    // 3. Insert line items
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [order_id, item.menu_id, item.quantity, item.unit_price]);
    }

    await client.query('COMMIT');
    res.status(201).json({ order_id, payment_id, total_amount: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Order placement failed' });
  } finally {
    client.release();
  }
});

app.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(`
      UPDATE orders SET status = $1
      WHERE order_id = $2
      RETURNING order_id, status
    `, [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// REVIEWS
// GET  /restaurants/:id/reviews
// POST /reviews
// ============================================================
app.get('/restaurants/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rv.review_id, rv.rating, rv.comment, rv.date_and_time,
        c.name AS customer_name
      FROM reviews rv
      JOIN customers c ON c.customer_id = rv.customer_id
      WHERE rv.restaurant_id = $1
      ORDER BY rv.date_and_time DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/reviews', async (req, res) => {
  const { customer_id, order_id, restaurant_id, rating, comment } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO reviews (customer_id, order_id, restaurant_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING review_id, rating, comment, date_and_time
    `, [customer_id, order_id, restaurant_id, rating, comment]);

    // Auto-update restaurant average rating
    await pool.query(`
      UPDATE restaurants
      SET rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM reviews WHERE restaurant_id = $1
      )
      WHERE id = $1
    `, [restaurant_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// COUPONS
// GET /coupons/:code   — validate + return coupon details
// ============================================================
app.get('/coupons/:code', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT coupon_code, discount_amount, expiry_date, min_order_value
      FROM coupons
      WHERE coupon_code = $1 AND expiry_date >= CURRENT_DATE
    `, [req.params.code]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// ADMIN
// GET /admin/stats        — global KPIs
// GET /admin/orders       — recent order log
// GET /admin/restaurants  — all vendors with review counts
// ============================================================
app.get('/admin/stats', async (req, res) => {
  try {
    const [revRes, ordRes, custRes, vendRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total_revenue FROM orders WHERE status='Delivered'`),
      pool.query(`SELECT COUNT(*) AS active_orders FROM orders WHERE status NOT IN ('Delivered','Cancelled')`),
      pool.query(`SELECT COUNT(*) AS total_customers FROM customers`),
      pool.query(`SELECT COUNT(*) AS total_restaurants FROM restaurants`),
    ]);
    res.json({
      total_revenue:     parseFloat(revRes.rows[0].total_revenue),
      active_orders:     parseInt(ordRes.rows[0].active_orders),
      total_customers:   parseInt(custRes.rows[0].total_customers),
      total_restaurants: parseInt(vendRes.rows[0].total_restaurants),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/admin/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id, o.order_date, o.total_amount, o.status,
        c.name AS customer_name,
        r.name AS restaurant_name
      FROM orders o
      JOIN customers    c ON c.customer_id = o.customer_id
      JOIN restaurants  r ON r.id          = o.restaurant_id
      ORDER BY o.order_date DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/admin/restaurants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.name, r.rating, r.affordability,
        a.city,
        COUNT(DISTINCT o.order_id)  AS total_orders,
        COUNT(DISTINCT rv.review_id) AS total_reviews
      FROM restaurants r
      LEFT JOIN addresses  a  ON a.address_id  = r.address_id
      LEFT JOIN orders     o  ON o.restaurant_id = r.id
      LEFT JOIN reviews    rv ON rv.restaurant_id = r.id
      GROUP BY r.id, r.name, r.rating, r.affordability, a.city
      ORDER BY r.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(3000, '0.0.0.0', () => {
  console.log('LettuceDine API — listening on port 3000');
});