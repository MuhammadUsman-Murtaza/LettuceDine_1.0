-- ============================================================
-- LettuceDine — Final Merged Production Schema
-- Combines our ERD + teammate's improvements
-- ============================================================

-- 0. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- ENUMs (adopted from teammate — DB-level type safety)
-- ============================================================
CREATE TYPE order_status   AS ENUM ('pending', 'placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_mode   AS ENUM ('credit_card', 'debit_card', 'paypal', 'cash', 'crypto');
CREATE TYPE driver_status  AS ENUM ('available', 'busy', 'offline');
CREATE TYPE address_type   AS ENUM ('home', 'work', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ============================================================
-- 1. CUSTOMERS
-- Adopted: first/last name split, password_hash, created_at,
--          stricter phone regex (teammate)
-- ============================================================
CREATE TABLE customers (
    customer_id   BIGINT GENERATED ALWAYS AS IDENTITY,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    phone_number  VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),

    CONSTRAINT pk_customers      PRIMARY KEY (customer_id),
    CONSTRAINT uq_customer_email UNIQUE (email),
    CONSTRAINT chk_customer_phone CHECK (phone_number ~ '^\+?[0-9]{7,15}$')
);

-- ============================================================
-- 2. CUSTOMER_ADDRESSES
-- Adopted: province, address_type ENUM, NOT NULL zip (teammate)
-- Kept:    PostGIS GEOGRAPHY location (ours — superior to POINT)
-- Note:    Separate from restaurant address by design (teammate's
--          valid architectural decision — restaurants embed their
--          own address since they only ever have one)
-- ============================================================
CREATE TABLE customer_addresses (
    address_id   BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id  BIGINT       NOT NULL,
    street       VARCHAR(255) NOT NULL,
    city         VARCHAR(100) NOT NULL,
    province     VARCHAR(50),
    zip_code     VARCHAR(10)  NOT NULL,
    label        address_type DEFAULT 'home',
    location     GEOGRAPHY(POINT, 4326),

    CONSTRAINT pk_customer_addresses  PRIMARY KEY (address_id),
    CONSTRAINT fk_addr_customer       FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- ============================================================
-- 3. DELIVERY_DRIVERS
-- Adopted: first/last name split, current_status ENUM (teammate)
-- Kept:    rating column (ours — needed for vendor dashboard)
-- ============================================================
CREATE TABLE delivery_drivers (
    driver_id      BIGINT GENERATED ALWAYS AS IDENTITY,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    phone_number   VARCHAR(20) NOT NULL,
    vehicle_type   VARCHAR(30),
    current_status driver_status DEFAULT 'offline',
    rating         NUMERIC(2, 1),

    CONSTRAINT pk_delivery_drivers     PRIMARY KEY (driver_id),
    CONSTRAINT chk_driver_phone        CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT chk_driver_rating_range CHECK (rating >= 0 AND rating <= 5.0)
);

-- ============================================================
-- 4. RESTAURANTS
-- Adopted: cuisine_type, phone_number, affordability SMALLINT,
--          embedded address (teammate's valid design decision)
-- Kept:    PostGIS GEOGRAPHY directly on restaurants (our
--          improvement over teammate's plain POINT)
-- ============================================================
CREATE TABLE restaurants (
    restaurant_id  BIGINT GENERATED ALWAYS AS IDENTITY,
    name           VARCHAR(100) NOT NULL,
    cuisine_type   VARCHAR(50),
    phone_number   VARCHAR(20),
    affordability  SMALLINT     NOT NULL DEFAULT 1,
    street_address VARCHAR(255),
    city           VARCHAR(100),
    province       VARCHAR(50),
    location       GEOGRAPHY(POINT, 4326),
    rating         NUMERIC(2, 1),

    CONSTRAINT pk_restaurants               PRIMARY KEY (restaurant_id),
    CONSTRAINT chk_restaurant_phone         CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT chk_restaurant_affordability CHECK (affordability IN (1, 2, 3)),
    CONSTRAINT chk_restaurant_rating        CHECK (rating >= 0 AND rating <= 5.0)
);

-- ============================================================
-- 5. MENU
-- Kept:    ERD structure — separate columns for each category
--          (food_item, beverages, desserts, starter, description)
-- Kept:    NUMERIC(10,2) over MONEY (locale-safe)
-- ============================================================
CREATE TABLE menu (
    menu_id       BIGINT GENERATED ALWAYS AS IDENTITY,
    restaurant_id BIGINT,
    food_item     VARCHAR(100),
    beverages     VARCHAR(100),
    desserts      VARCHAR(100),
    starter       VARCHAR(100),
    description   TEXT,
    price         NUMERIC(10, 2) NOT NULL,

    CONSTRAINT pk_menu            PRIMARY KEY (menu_id),
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    CONSTRAINT chk_menu_price     CHECK (price > 0)
);

-- ============================================================
-- 6. COUPONS
-- Adopted: INT identity PK (cleaner FKs) + code UNIQUE (teammate)
-- Kept:    min_order_value (ours — business logic requirement)
-- Kept:    discount_amount NUMERIC (both approaches valid;
--          amount chosen to stay ERD-aligned)
-- ============================================================
CREATE TABLE coupons (
    coupon_id       BIGINT GENERATED ALWAYS AS IDENTITY,
    code            VARCHAR(20)    UNIQUE NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL,
    expiry_date     DATE           NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,

    CONSTRAINT pk_coupons           PRIMARY KEY (coupon_id),
    CONSTRAINT chk_coupon_discount  CHECK (discount_amount > 0),
    CONSTRAINT chk_coupon_min_order CHECK (min_order_value >= 0)
);

-- ============================================================
-- 7. ORDERS
-- Adopted: order_status ENUM, driver_contact_at_order,
--          coupon_id INT FK (teammate)
-- Kept:    delivery_time, special_instructions,
--          NUMERIC total_amount (ours)
-- Note:    payment_id FK removed from here — payments now
--          reference orders (teammate's cleaner direction)
-- ============================================================
CREATE TABLE orders (
    order_id                BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id             BIGINT,
    restaurant_id           BIGINT,
    delivery_address_id     BIGINT,
    driver_id               BIGINT,
    coupon_id               BIGINT,
    driver_contact_at_order VARCHAR(20),
    total_amount            NUMERIC(10, 2) NOT NULL,
    order_date              TIMESTAMPTZ    DEFAULT NOW(),
    delivery_time           TIMETZ,
    status                  order_status   DEFAULT 'pending',
    special_instructions    TEXT,

    CONSTRAINT pk_orders           PRIMARY KEY (order_id),
    CONSTRAINT fk_order_customer   FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),
    CONSTRAINT fk_order_restaurant FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id),
    CONSTRAINT fk_order_address    FOREIGN KEY (delivery_address_id)
        REFERENCES customer_addresses(address_id),
    CONSTRAINT fk_order_driver     FOREIGN KEY (driver_id)
        REFERENCES delivery_drivers(driver_id),
    CONSTRAINT fk_order_coupon     FOREIGN KEY (coupon_id)
        REFERENCES coupons(coupon_id),
    CONSTRAINT chk_driver_contact  CHECK (driver_contact_at_order ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT chk_order_total     CHECK (total_amount >= 0)
);

-- ============================================================
-- 8. ORDER_ITEMS
-- Kept:    unit_price name + NUMERIC type (ours)
-- Note:    "frozen price at time of purchase" concept retained
-- ============================================================
CREATE TABLE order_items (
    order_item_id BIGINT GENERATED ALWAYS AS IDENTITY,
    order_id      BIGINT         NOT NULL,
    menu_id       BIGINT         NOT NULL,
    quantity      INT            NOT NULL DEFAULT 1,
    unit_price    NUMERIC(10, 2) NOT NULL,

    CONSTRAINT pk_order_items  PRIMARY KEY (order_item_id),
    CONSTRAINT fk_oi_order     FOREIGN KEY (order_id)
        REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_menu      FOREIGN KEY (menu_id)
        REFERENCES menu(menu_id),
    CONSTRAINT chk_oi_quantity CHECK (quantity > 0),
    CONSTRAINT chk_oi_price    CHECK (unit_price >= 0)
);

-- ============================================================
-- 9. PAYMENTS
-- Adopted: payment_mode ENUM, payment_date, order_id FK
--          direction (payment references order), UNIQUE order_id
-- Kept:    payment_status ENUM (ours), customer_id FK (ERD),
--          NUMERIC amount (ours)
-- ============================================================
CREATE TABLE payments (
    payment_id      BIGINT GENERATED ALWAYS AS IDENTITY,
    order_id        BIGINT         UNIQUE NOT NULL,
    customer_id     BIGINT,
    payment_method  payment_mode   NOT NULL,
    payment_date    TIMESTAMPTZ    DEFAULT NOW(),
    amount          NUMERIC(10, 2) NOT NULL,
    status          payment_status DEFAULT 'pending',

    CONSTRAINT pk_payments         PRIMARY KEY (payment_id),
    CONSTRAINT fk_payment_order    FOREIGN KEY (order_id)
        REFERENCES orders(order_id),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id) ON DELETE SET NULL,
    CONSTRAINT chk_payment_amount  CHECK (amount >= 0)
);

-- ============================================================
-- 10. REVIEWS
-- Adopted: review_date name, UNIQUE order_id (teammate)
-- Kept:    NUMERIC(2,1) rating for decimal support,
--          TIMESTAMPTZ timezone awareness (ours)
-- ============================================================
CREATE TABLE reviews (
    review_id     BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id   BIGINT,
    order_id      BIGINT UNIQUE,
    restaurant_id BIGINT,
    rating        NUMERIC(2, 1) NOT NULL,
    comment       TEXT,
    review_date   TIMESTAMPTZ   DEFAULT NOW(),

    CONSTRAINT pk_reviews           PRIMARY KEY (review_id),
    CONSTRAINT fk_review_customer   FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),
    CONSTRAINT fk_review_order      FOREIGN KEY (order_id)
        REFERENCES orders(order_id),
    CONSTRAINT fk_review_restaurant FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(restaurant_id),
    CONSTRAINT chk_review_rating    CHECK (rating >= 1 AND rating <= 5.0)
);

-- ============================================================
-- 11. INDEXES
-- ============================================================
-- Spatial
CREATE INDEX idx_restaurants_geo ON restaurants        USING GIST (location);
CREATE INDEX idx_addresses_geo   ON customer_addresses USING GIST (location);

-- Query performance
CREATE INDEX idx_orders_customer    ON orders  (customer_id);
CREATE INDEX idx_orders_status      ON orders  (status);
CREATE INDEX idx_orders_date        ON orders  (order_date);
CREATE INDEX idx_reviews_restaurant ON reviews (restaurant_id);
CREATE INDEX idx_menu_restaurant    ON menu    (restaurant_id);
CREATE INDEX idx_payments_order     ON payments (order_id);
