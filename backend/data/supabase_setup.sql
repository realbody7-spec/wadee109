-- ============================================================
-- RESTAURANT SOP & POS SYSTEM - SUPABASE DATABASE INITIALIZATION
-- Copy and paste this script into Supabase SQL Editor and click RUN
-- ============================================================

-- 1. Create Inventory Table (คลังวัตถุดิบ)
CREATE TABLE IF NOT EXISTS public.inventory (
  id VARCHAR(64) PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'others',
  quantity NUMERIC(12, 2) DEFAULT 0,
  pieces NUMERIC(12, 2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'units',
  cost NUMERIC(12, 2) DEFAULT 0,
  bill_number VARCHAR(100) DEFAULT '',
  image TEXT DEFAULT '',
  portion_size NUMERIC(12, 2) DEFAULT 1,
  portion_unit VARCHAR(50) DEFAULT 'units',
  associated_pos_item VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table (บัญชีผู้ใช้งานและพนักงาน)
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Settings Table (การตั้งค่าระบบ)
CREATE TABLE IF NOT EXISTS public.settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Logs Table (ประวัติการแจ้งเตือน)
CREATE TABLE IF NOT EXISTS public.logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event VARCHAR(255),
  status VARCHAR(50),
  details TEXT
);

-- 5. Create POS Menu Table (เมนูอาหาร POS)
CREATE TABLE IF NOT EXISTS public.pos_menu (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'main',
  price NUMERIC(12, 2) DEFAULT 0,
  image TEXT DEFAULT '',
  recipe JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create POS Tables Table (โต๊ะอาหาร POS)
CREATE TABLE IF NOT EXISTS public.pos_tables (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 4,
  status VARCHAR(50) DEFAULT 'available',
  current_order_id VARCHAR(64) DEFAULT ''
);

-- 7. Create POS Orders Table (รายการออเดอร์และการขาย POS)
CREATE TABLE IF NOT EXISTS public.pos_orders (
  id VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL,
  table_id VARCHAR(64) DEFAULT 'dine-in',
  table_name VARCHAR(100) DEFAULT '',
  order_type VARCHAR(50) DEFAULT 'dine-in',
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  service_charge NUMERIC(12, 2) DEFAULT 0,
  vat NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT '',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Disable RLS (Row Level Security) for easy access by JS client
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_orders DISABLE ROW LEVEL SECURITY;

-- Grant permissions to public/anon/authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
