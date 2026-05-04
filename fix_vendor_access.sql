-- ============================================================
-- LettuceDine — Vendor Access Fixer
-- RUN THIS AFTER YOUR MAIN SEED.SQL
-- ============================================================

-- 1. Create a Master Vendor Account
-- Use this email to log in to the Vendor Portal
INSERT INTO vendors (first_name, last_name, email, phone_number, password_hash) 
VALUES ('Admin', 'Owner', 'vendor@lettuce.com', '+923005556666', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 2. Link ALL existing restaurants to this Vendor
-- This ensures they show up in the "Shop Manager" dashboard immediately.
UPDATE restaurants 
SET vendor_id = (SELECT vendor_id FROM vendors WHERE email = 'vendor@lettuce.com' LIMIT 1)
WHERE vendor_id IS NULL;

-- 3. Verify
SELECT count(*) as total_restaurants, 'Linked to Master Vendor' as status FROM restaurants;
