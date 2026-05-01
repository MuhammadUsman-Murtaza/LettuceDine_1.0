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
// ============================================================
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        restaurant_id,
        name,
        cuisine_type,
        rating,
        affordability,
        street_address,
        city,
        province,
        ST_AsGeoJSON(location)::json AS coords
      FROM restaurants
      ORDER BY rating DESC NULLS LAST;
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
        restaurant_id, name, cuisine_type, rating, affordability,
        street_address, city, province, phone_number,
        ST_AsGeoJSON(location)::json AS coords
      FROM restaurants
      WHERE restaurant_id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// MENU
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
      FROM menu
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
      INSERT INTO menu (restaurant_id, food_item, beverages, desserts, starter, description, price)
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
// ============================================================
app.get('/customers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT customer_id, first_name, last_name, email, phone_number, created_at 
       FROM customers WHERE customer_id = $1`,
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
  const { first_name, last_name, email, phone_number, password_hash } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO customers (first_name, last_name, email, phone_number, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING customer_id, first_name, last_name, email
    `, [first_name, last_name, email, phone_number, password_hash]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// CUSTOMER ADDRESSES
// ============================================================
app.get('/customers/:id/addresses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT address_id, street, city, province, zip_code, label,
             ST_AsGeoJSON(location)::json AS coords
      FROM customer_addresses
      WHERE customer_id = $1
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/customers/:id/addresses', async (req, res) => {
  const { street, city, province, zip_code, label, latitude, longitude } = req.body;
  try {
    const locationVal = (latitude != null && longitude != null)
      ? `ST_SetSRID(ST_MakePoint(${parseFloat(longitude)}, ${parseFloat(latitude)}), 4326)::geography`
      : 'NULL';
    const result = await pool.query(
      `INSERT INTO customer_addresses (customer_id, street, city, province, zip_code, label, location)
       VALUES ($1, $2, $3, $4, $5, $6, ${locationVal})
       RETURNING address_id, street, city, zip_code, label`,
      [req.params.id, street, city, province, zip_code, label || 'home']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// ORDERS
// ============================================================
app.get('/customers/:id/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.order_id, o.order_date, o.total_amount, o.status,
        o.delivery_time, o.special_instructions,
        r.name AS restaurant_name,
        ca.street, ca.city
      FROM orders o
      JOIN  restaurants r ON r.restaurant_id = o.restaurant_id
      LEFT JOIN customer_addresses ca ON ca.address_id = o.delivery_address_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/orders', async (req, res) => {
  const {
    customer_id,
    restaurant_id,
    delivery_address_id,
    special_instructions,
    coupon_id,
    payment_method, // ENUM: 'credit_card', 'paypal', etc.[cite: 1]
    items           // [{ menu_id, quantity, unit_price }]
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalAmount = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    // 1. Create order first[cite: 1]
    const orderRes = await client.query(`
      INSERT INTO orders
        (customer_id, restaurant_id, delivery_address_id, total_amount, 
         special_instructions, coupon_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING order_id
    `, [customer_id, restaurant_id, delivery_address_id, totalAmount, special_instructions, coupon_id || null]);
    
    const order_id = orderRes.rows[0].order_id;

    // 2. Insert order items[cite: 1]
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [order_id, item.menu_id, item.quantity, item.unit_price]);
    }

    // 3. Create payment referencing the order[cite: 1]
    const payRes = await client.query(`
      INSERT INTO payments (order_id, customer_id, payment_method, amount, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING payment_id
    `, [order_id, customer_id, payment_method, totalAmount]);

    await client.query('COMMIT');
    res.status(201).json({ order_id, payment_id: payRes.rows[0].payment_id, total_amount: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Order placement failed' });
  } finally {
    client.release();
  }
});

// ============================================================
// REVIEWS
// ============================================================
app.get('/restaurants/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rv.review_id, rv.rating, rv.comment, rv.review_date,
        c.first_name, c.last_name
      FROM reviews rv
      JOIN customers c ON c.customer_id = rv.customer_id
      WHERE rv.restaurant_id = $1
      ORDER BY rv.review_date DESC
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
      RETURNING review_id, rating, comment, review_date
    `, [customer_id, order_id, restaurant_id, rating, comment]);

    // Update restaurant average
    await pool.query(`
      UPDATE restaurants
      SET rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE restaurant_id = $1)
      WHERE restaurant_id = $1
    `, [restaurant_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================
// COUPONS
// ============================================================
app.get('/coupons/:code', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT coupon_id, code, discount_amount, expiry_date, min_order_value
      FROM coupons
      WHERE code = $1 AND expiry_date >= CURRENT_DATE
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
// ORDER DETAIL + STATUS UPDATE
// ============================================================
app.get('/orders/:id', async (req, res) => {
  try {
    const orderRes = await pool.query(`
      SELECT
        o.order_id, o.order_date, o.total_amount, o.status,
        o.delivery_time, o.special_instructions, o.driver_contact_at_order,
        r.name        AS restaurant_name,
        ca.street, ca.city,
        p.payment_method, p.status AS payment_status,
        d.first_name  AS driver_first_name,
        d.last_name   AS driver_last_name,
        d.vehicle_type
      FROM orders o
      JOIN  restaurants r        ON r.restaurant_id  = o.restaurant_id
      LEFT JOIN customer_addresses ca ON ca.address_id    = o.delivery_address_id
      LEFT JOIN payments p        ON p.order_id       = o.order_id
      LEFT JOIN delivery_drivers d ON d.driver_id     = o.driver_id
      WHERE o.order_id = $1
    `, [req.params.id]);

    if (orderRes.rows.length === 0)
      return res.status(404).json({ error: 'Not found' });

    const itemsRes = await pool.query(`
      SELECT
        oi.order_item_id,
        COALESCE(m.food_item, m.beverages, m.desserts, m.starter) AS item_name,
        m.description,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) AS line_total
      FROM order_items oi
      JOIN menu m ON m.menu_id = oi.menu_id
      WHERE oi.order_id = $1
    `, [req.params.id]);

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending','placed','preparing','out_for_delivery','delivered','cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
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
// START SERVER
// ============================================================
app.listen(3000, '0.0.0.0', () => {
  console.log('LettuceDine API — listening on port 3000');
});