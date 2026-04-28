-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Tables with Named Constraints

-- Customer Entity
CREATE TABLE customers (
    customer_id BIGINT GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    phone_num VARCHAR(20),
    email TEXT,
    
    CONSTRAINT pk_customers PRIMARY KEY (customer_id),
    CONSTRAINT uq_customer_email UNIQUE (email),
    CONSTRAINT chk_phone_format CHECK (phone_num ~ '^[0-9+ ]+$')
);

-- Address Entity
CREATE TABLE addresses (
    address_id BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id BIGINT,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    zip_code VARCHAR(10),
    label VARCHAR(50),
    location GEOGRAPHY(POINT, 4326),

    CONSTRAINT pk_addresses PRIMARY KEY (address_id),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Delivery Driver Entity
CREATE TABLE delivery_drivers (
    driver_id BIGINT GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    contact VARCHAR(20),
    vehicle_type TEXT,
    rating NUMERIC(2, 1),

    CONSTRAINT pk_delivery_drivers PRIMARY KEY (driver_id),
    CONSTRAINT chk_driver_rating_range CHECK (rating >= 0 AND rating <= 5.0)
);

-- Restaurants Entity
CREATE TABLE restaurants (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    rating NUMERIC(2, 1),
    affordability SMALLINT,

    CONSTRAINT pk_restaurants PRIMARY KEY (id),
    CONSTRAINT chk_restaurant_rating_range CHECK (rating >= 0 AND rating <= 5.0),
    CONSTRAINT chk_restaurant_affordability_range CHECK (affordability >= 1 AND affordability <= 3)
);

-- Menu Entity
CREATE TABLE menus (
    menu_id BIGINT GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT,
    item_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,

    CONSTRAINT pk_menus PRIMARY KEY (menu_id),
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) 
        REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT chk_menu_price_positive CHECK (price > 0)
);

-- Order Entity
CREATE TABLE orders (
    order_id BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id BIGINT,
    restaurant_id BIGINT,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pending',

    CONSTRAINT pk_orders PRIMARY KEY (order_id),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    CONSTRAINT chk_order_status_values CHECK (status IN ('Pending', 'Preparing', 'On the Way', 'Delivered', 'Cancelled')),
    CONSTRAINT chk_order_total_positive CHECK (total_amount >= 0)
);

-- 3. Create Indexes
CREATE INDEX idx_restaurants_geo ON restaurants USING GIST (location);