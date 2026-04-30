-- 0. Define ENUMs for categorical data
CREATE TYPE order_status AS ENUM ('pending', 'placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_mode AS ENUM ('credit_card', 'paypal', 'cash', 'crypto');
CREATE TYPE driver_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');

-- 1. Restaurants
CREATE TABLE restaurants (
    restaurant_id INT GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) NOT NULL,
    cuisine_type VARCHAR(50),
    phone_number VARCHAR(20),
    affordability SMALLINT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50),
    location POINT,
    rating DECIMAL(2,1),
    
    CONSTRAINT pk_restaurants PRIMARY KEY (restaurant_id),
    CONSTRAINT chk_restaurant_phone CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT chk_restaurant_affordability CHECK (affordability IN (1, 2, 3)),
    CONSTRAINT chk_restaurant_rating CHECK (rating >= 0 AND rating <= 5)
);

-- 2. Other Independent Tables
CREATE TABLE customers (
    customer_id INT GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_customers PRIMARY KEY (customer_id),
    CONSTRAINT uq_customer_email UNIQUE (email),
    CONSTRAINT chk_customer_phone CHECK (phone_number ~ '^\+?[0-9]{7,15}$')
);

CREATE TABLE delivery_drivers (
    driver_id INT GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(30),
    phone_number VARCHAR(20) NOT NULL,
    current_status driver_status DEFAULT 'offline',
    
    CONSTRAINT pk_delivery_drivers PRIMARY KEY (driver_id),
    CONSTRAINT chk_driver_phone CHECK (phone_number ~ '^\+?[0-9]{7,15}$')
);

CREATE TABLE coupons (
    coupon_id INT GENERATED ALWAYS AS IDENTITY,
    code VARCHAR(20) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    expiry_date DATE NOT NULL,
    
    CONSTRAINT pk_coupons PRIMARY KEY (coupon_id),
    CONSTRAINT uq_coupon_code UNIQUE (code),
    CONSTRAINT chk_coupon_discount CHECK (discount_percentage > 0 AND discount_percentage <= 100)
);

-- 3. Dependent Tables
CREATE TABLE customer_addresses (
    address_id INT GENERATED ALWAYS AS IDENTITY,
    customer_id INT,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50),
    zip_code VARCHAR(10) NOT NULL,
    location POINT,
    label address_type DEFAULT 'home',
    
    CONSTRAINT pk_customer_addresses PRIMARY KEY (address_id),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE menu (
    menu_id INT GENERATED ALWAYS AS IDENTITY,
    restaurant_id INT,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL, -- Decimals are often preferred over MONEY for arithmetic
    
    CONSTRAINT pk_menu PRIMARY KEY (menu_id),
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    CONSTRAINT chk_menu_price CHECK (price >= 0)
);

-- 4. Transactional Tables
CREATE TABLE orders (
    order_id INT GENERATED ALWAYS AS IDENTITY,
    customer_id INT,
    delivery_address_id INT,
    restaurant_id INT,
    driver_id INT,
    driver_contact_at_order VARCHAR(20),
    coupon_id INT,
    total_amount DECIMAL(12,2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status order_status DEFAULT 'pending',
    special_instructions TEXT,
    
    CONSTRAINT pk_orders PRIMARY KEY (order_id),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_order_address FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(address_id),
    CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    CONSTRAINT fk_order_driver FOREIGN KEY (driver_id) REFERENCES delivery_drivers(driver_id),
    CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT chk_order_driver_phone CHECK (driver_contact_at_order ~ '^\+?[0-9]{7,15}$')
);

CREATE TABLE order_items (
    order_item_id INT GENERATED ALWAYS AS IDENTITY,
    order_id INT,
    menu_id INT,
    quantity INT NOT NULL DEFAULT 1,
    subtotal_price DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT pk_order_items PRIMARY KEY (order_item_id),
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_items_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id),
    CONSTRAINT chk_item_quantity CHECK (quantity > 0)
);

CREATE TABLE payments (
    payment_id INT GENERATED ALWAYS AS IDENTITY,
    order_id INT NOT NULL,
    payment_method payment_mode NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(12,2) NOT NULL,
    
    CONSTRAINT pk_payments PRIMARY KEY (payment_id),
    CONSTRAINT uq_payment_order UNIQUE (order_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT chk_payment_amount CHECK (amount >= 0)
);

CREATE TABLE reviews (
    review_id INT GENERATED ALWAYS AS IDENTITY,
    customer_id INT,
    order_id INT,
    restaurant_id INT,
    rating INT,
    comment TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_reviews PRIMARY KEY (review_id),
    CONSTRAINT uq_review_order UNIQUE (order_id),
    CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_review_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5)
);