-- ============================================================
-- LettuceDine — Updated Seed Data
-- Links Restaurants to Vendors (Owners)
-- ============================================================

-- 1. Create Vendors (The People)
INSERT INTO vendors (first_name, last_name, email, phone_number, password_hash) VALUES
('Faisal', 'Ahmed', 'faisal@cafeflo.com', '+923001112222', 'password123'),
('Sana', 'Khan', 'sana@biryanicenter.com', '+923003334444', 'password123'),
('Admin', 'User', 'vendor@lettuce.com', '+923005556666', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 2. Create Restaurants (Linked to Vendors)
INSERT INTO restaurants (name, cuisine_type, phone_number, affordability, street_address, city, province, rating, vendor_id) VALUES
('Cafe Flo', 'French', '+9221111222333', 3, 'D-82, Block 4, Clifton', 'Karachi', 'Sindh', 4.8, 1),
('Biryani Center', 'Pakistani', '+9221333444555', 1, 'Plot 12-C, 26th Street, DHA', 'Karachi', 'Sindh', 4.5, 2),
('Xander''s', 'European', '+9221555666777', 2, 'E Street, Block 4, Clifton', 'Karachi', 'Sindh', 4.7, 3)
ON CONFLICT DO NOTHING;

-- 3. Create Menu Items
INSERT INTO menu (restaurant_id, food_item, description, price) VALUES
(1, 'Steak Frites', 'Prime beef with crispy fries', 2450.00),
(1, 'Onion Soup', 'Traditional French onion soup', 850.00),
(2, 'Chicken Biryani', 'Spicy aromatic basmati rice', 450.00),
(3, 'Pepperoni Pizza', 'Wood-fired sourdough pizza', 1850.00);

-- 4. Create Customers
INSERT INTO customers (first_name, last_name, email, phone_number, password_hash) VALUES
('Usman', 'Murtaza', 'usman@example.com', '+923000000000', 'password123'),
('Ali', 'Raza', 'ali@example.com', '+923011111111', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 5. Create Sample Orders
INSERT INTO orders (customer_id, restaurant_id, total_amount, status, special_instructions) VALUES
(1, 1, 3300.00, 'pending', 'Please make the steak medium-rare.'),
(2, 2, 450.00, 'preparing', 'Extra raita please.');
