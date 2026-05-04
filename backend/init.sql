-- LettuceDine — Production Database Schema
-- Aligned with Updated ERD (11 Entities)

-- Enable PostGIS for Spatial Location Support
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMER_ADDRESSES
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(customer_id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    zip_code VARCHAR(20),
    label VARCHAR(50) DEFAULT 'home', -- home, work, other
    location GEOGRAPHY(POINT, 4326) -- Spatial point for mapping
);

-- 3. VENDORS (Restaurant Owners)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'Unnamed Vendor', -- Consistently used in new ERD
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AUTO-FIX: Consolidate old first_name/last_name into 'name' if they exist
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='first_name') THEN
        ALTER TABLE vendors ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        UPDATE vendors SET name = first_name || ' ' || last_name;
        ALTER TABLE vendors DROP COLUMN first_name;
        ALTER TABLE vendors DROP COLUMN last_name;
    END IF;
END $$;

ALTER TABLE vendors ALTER COLUMN name SET NOT NULL;

-- 4. RESTAURANTS
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100),
    phone_number VARCHAR(20),
    street_address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),
    rating NUMERIC(3,2) DEFAULT 0,
    affordability SMALLINT CHECK (affordability BETWEEN 1 AND 3)
);

-- 5. MENU
CREATE TABLE IF NOT EXISTS menu (
    menu_id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    food_item VARCHAR(255),
    beverages VARCHAR(255),
    desserts VARCHAR(255),
    starter VARCHAR(255),
    description TEXT,
    price NUMERIC(10,2) NOT NULL
);

-- 6. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    expiry_date DATE,
    min_order_value NUMERIC(10,2) DEFAULT 0
);

-- 7. DELIVERY_DRIVERS
CREATE TABLE IF NOT EXISTS delivery_drivers (
    driver_id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    vehicle_type VARCHAR(50),
    current_status VARCHAR(50) DEFAULT 'available', -- available, busy, offline
    rating NUMERIC(3,2) DEFAULT 0
);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(customer_id),
    restaurant_id BIGINT REFERENCES restaurants(restaurant_id),
    delivery_address_id BIGINT REFERENCES customer_addresses(address_id),
    driver_id BIGINT REFERENCES delivery_drivers(driver_id),
    coupon_id BIGINT REFERENCES coupons(coupon_id),
    total_amount NUMERIC(10,2) NOT NULL,
    order_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivery_time TIMETZ,
    status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, out_for_delivery, delivered, cancelled
    special_instructions TEXT,
    driver_contact_at_order VARCHAR(20)
);

-- 9. ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_id BIGINT REFERENCES menu(menu_id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id),
    customer_id BIGINT REFERENCES customers(customer_id),
    payment_method VARCHAR(50), -- cash, credit_card, paypal
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' -- pending, completed, failed
);

-- 11. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    review_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(customer_id),
    order_id BIGINT REFERENCES orders(order_id),
    restaurant_id BIGINT REFERENCES restaurants(restaurant_id),
    rating NUMERIC(2,1) CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    review_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indices for Performance
CREATE INDEX IF NOT EXISTS idx_res_location ON restaurants USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_addr_location ON customer_addresses USING GIST (location);
