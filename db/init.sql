-- 0. Define ENUMs for categorical data
CREATE TYPE order_status AS ENUM ('pending', 'placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_mode AS ENUM ('credit_card', 'paypal', 'cash', 'crypto');
CREATE TYPE driver_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');

-- 1. Restaurants (Updated with Affordability)
CREATE TABLE restaurants (
    restaurant_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cuisine_type VARCHAR(50),
    phone_number VARCHAR(20) CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    affordability SMALLINT NOT NULL CHECK (affordability IN (1, 2, 3)), -- 1=$, 2=$$, 3=$$$
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50),
    location POINT,
    rating DECIMAL(2,1)
);

-- 2. Other Independent Tables
CREATE TABLE customers (
    customer_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    password_hash VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE delivery_drivers (
    driver_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30),
    phone_number VARCHAR(20) NOT NULL CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    current_status driver_status DEFAULT 'offline'
);

CREATE TABLE coupons (
    coupon_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    expiry_date DATE NOT NULL
);

-- 3. Dependent Tables
CREATE TABLE customer_addresses (
    address_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50),
    zip_code VARCHAR(10) NOT NULL,
    location POINT,
    label address_type DEFAULT 'home'
);

CREATE TABLE menu (
    menu_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    price MONEY NOT NULL
);

-- 4. Transactional Tables
CREATE TABLE orders (
    order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    delivery_address_id INT REFERENCES customer_addresses(address_id),
    restaurant_id INT REFERENCES restaurants(restaurant_id),
    driver_id INT REFERENCES delivery_drivers(driver_id),
    driver_contact_at_order VARCHAR(20) CHECK (driver_contact_at_order ~ '^\+?[0-9]{7,15}$'),
    coupon_id INT REFERENCES coupons(coupon_id),
    total_amount MONEY NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status order_status DEFAULT 'pending'
    special_instructions TEXT
);

CREATE TABLE order_items (
    order_item_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_id INT REFERENCES menu(menu_id),
    quantity INT NOT NULL DEFAULT 1,
    subtotal_price MONEY NOT NULL -- Frozen price at time of purchase
);

CREATE TABLE payments (
    payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT UNIQUE REFERENCES orders(order_id),
    payment_method payment_mode NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount MONEY NOT NULL
);

CREATE TABLE reviews (
    review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_id INT UNIQUE REFERENCES orders(order_id),
    restaurant_id INT REFERENCES restaurants(restaurant_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);