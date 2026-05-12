-- ============================================================
-- LETTUCEDINE: COMPLETE DYNAMIC SQL AUDIT
-- Path: backend/index.js
-- This file contains all queries executed by the API during runtime.
-- ============================================================

-- [ AUTHENTICATION ]
-- Login: Customer
SELECT customer_id, first_name, last_name, email FROM customers WHERE email = $1 AND password_hash = $2;

-- Login: Vendor
SELECT v.vendor_id, v.first_name, v.last_name, v.email, r.restaurant_id FROM vendors v LEFT JOIN restaurants r ON r.vendor_id = v.vendor_id WHERE v.email = $1 AND v.password_hash = $2;

-- Register: Customer
INSERT INTO customers (first_name, last_name, email, phone_number, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id, first_name, last_name, email;

-- Register: Vendor (Atomic Transaction)
BEGIN;
INSERT INTO vendors (first_name, last_name, email, phone_number, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING vendor_id;
INSERT INTO restaurants (name, cuisine_type, phone_number, city, street_address, vendor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING restaurant_id, name;
COMMIT; -- or ROLLBACK on error

-- [ RESTAURANT MANAGEMENT ]
-- Fetch All (Ranked by Rating)
SELECT restaurant_id, name, cuisine_type, rating, affordability, street_address, city, province FROM restaurants ORDER BY rating DESC NULLS LAST;

-- Fetch Single Detail
SELECT restaurant_id, name, cuisine_type, rating, affordability, street_address, city, province, phone_number FROM restaurants WHERE restaurant_id = $1;

-- Fetch Vendor's Restaurants
SELECT restaurant_id, name, cuisine_type, rating, city FROM restaurants WHERE vendor_id = $1;

-- Create New Restaurant
INSERT INTO restaurants (name, cuisine_type, phone_number, city, street_address, province, vendor_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- [ MENU & INVENTORY ]
-- Fetch Menu (With Coalesce for Unified Category View)
SELECT menu_id, COALESCE(food_item, beverages, desserts, starter) AS name, food_item, beverages, desserts, starter, description, price FROM menu WHERE restaurant_id = $1 ORDER BY menu_id;

-- Add Menu Item
INSERT INTO menu (restaurant_id, food_item, beverages, desserts, starter, description, price) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- Update Menu Item (Partial Update Support)
UPDATE menu SET food_item = COALESCE($1, food_item), beverages = COALESCE($2, beverages), desserts = COALESCE($3, desserts), starter = COALESCE($4, starter), description = COALESCE($5, description), price = COALESCE($6, price) WHERE menu_id = $7 RETURNING *;

-- Delete Menu Item
DELETE FROM menu WHERE menu_id = $1 RETURNING *;

-- [ CUSTOMER PROFILE & ADDRESSES ]
-- Fetch Profile
SELECT customer_id, first_name, last_name, email, phone_number, created_at FROM customers WHERE customer_id = $1;

-- Fetch Addresses
SELECT address_id, street, city, province, zip_code, label FROM customer_addresses WHERE customer_id = $1;

-- Create Address (With Spatial PostGIS location)
INSERT INTO customer_addresses (customer_id, street, city, province, zip_code, label, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING address_id, street, city, zip_code, label;

-- Delete Address (With Dependency Safety)
UPDATE orders SET delivery_address_id = NULL WHERE delivery_address_id = $1;
DELETE FROM customer_addresses WHERE customer_id = $1 AND address_id = $2 RETURNING address_id;

-- [ ORDER PROCESSING ]
-- Place Order (Multi-Table Transaction)
BEGIN;
INSERT INTO orders (customer_id, restaurant_id, delivery_address_id, total_amount, special_instructions, coupon_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING order_id;
-- (Iterative)
INSERT INTO order_items (order_id, menu_id, quantity, unit_price) VALUES ($1, $2, $3, $4);
-- Payment Link
INSERT INTO payments (order_id, customer_id, payment_method, amount, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING payment_id;
COMMIT;

-- Fetch Customer Orders (Relational Join)
SELECT o.order_id, o.order_date, o.total_amount, o.status, o.delivery_time, o.special_instructions, r.name AS restaurant_name, ca.street, ca.city FROM orders o JOIN restaurants r ON r.restaurant_id = o.restaurant_id LEFT JOIN customer_addresses ca ON ca.address_id = o.delivery_address_id WHERE o.customer_id = $1 ORDER BY o.order_date DESC;

-- Fetch Restaurant Orders (Vendor Side)
SELECT o.order_id, o.order_date, o.total_amount, o.status, o.special_instructions, c.first_name, c.last_name, ca.street, ca.city FROM orders o JOIN customers c ON c.customer_id = o.customer_id LEFT JOIN customer_addresses ca ON ca.address_id = o.delivery_address_id WHERE o.restaurant_id = $1 ORDER BY o.order_date DESC;

-- Order Detail Depth (Multi-Join)
SELECT o.order_id, o.order_date, o.total_amount, o.status, o.delivery_time, o.special_instructions, o.driver_contact_at_order, c.first_name, c.last_name, c.email, c.phone_number, r.name AS restaurant_name, ca.street, ca.city, p.payment_method, p.status AS payment_status, d.first_name AS driver_first_name, d.last_name AS driver_last_name, d.vehicle_type FROM orders o JOIN customers c ON c.customer_id = o.customer_id JOIN restaurants r ON r.restaurant_id = o.restaurant_id LEFT JOIN customer_addresses ca ON ca.address_id = o.delivery_address_id LEFT JOIN payments p ON p.order_id = o.order_id LEFT JOIN delivery_drivers d ON d.driver_id = o.driver_id WHERE o.order_id = $1;

-- Order Item Breakdown
SELECT oi.order_item_id, COALESCE(m.food_item, m.beverages, m.desserts, m.starter) AS item_name, m.description, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS line_total FROM order_items oi JOIN menu m ON m.menu_id = oi.menu_id WHERE oi.order_id = $1;

-- Update Status
UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING order_id, status;

-- [ REVIEWS & COUPONS ]
-- Fetch Reviews
SELECT rv.review_id, rv.rating, rv.comment, rv.review_date, c.first_name, c.last_name FROM reviews rv JOIN customers c ON c.customer_id = rv.customer_id WHERE rv.restaurant_id = $1 ORDER BY rv.review_date DESC;

-- Post Review (With Auto-Sync of Restaurant Rating)
BEGIN;
INSERT INTO reviews (customer_id, order_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING review_id, rating, comment, review_date;
UPDATE restaurants SET rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE restaurant_id = $1) WHERE restaurant_id = $1;
COMMIT;

-- Fetch Active Coupons
SELECT coupon_id, code, discount_amount, expiry_date, min_order_value FROM coupons WHERE expiry_date >= CURRENT_DATE;

-- Verify Coupon
SELECT coupon_id, code, discount_amount, expiry_date, min_order_value FROM coupons WHERE code = $1 AND expiry_date >= CURRENT_DATE;

-- [ ADMIN ANALYTICS ]
SELECT COALESCE(SUM(total_amount),0) AS total_revenue FROM orders WHERE status='delivered';
SELECT COUNT(*) AS active_orders FROM orders WHERE status NOT IN ('delivered','cancelled');
SELECT COUNT(*) AS total_customers FROM customers;
SELECT COUNT(*) AS total_restaurants FROM restaurants;
