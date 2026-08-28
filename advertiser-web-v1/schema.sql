PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS advertisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  specification_json TEXT NOT NULL DEFAULT '{}',
  prohibited_categories_json TEXT NOT NULL DEFAULT '[]',
  venue_approval_required INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  duration_type TEXT NOT NULL,
  duration_value INTEGER NOT NULL,
  one_time_price INTEGER,
  monthly_price INTEGER,
  monthly_payment_enabled INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number TEXT NOT NULL UNIQUE,
  advertiser_id INTEGER NOT NULL,
  media_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  payment_type TEXT NOT NULL,
  desired_start_date TEXT,
  ad_content TEXT NOT NULL,
  agency_referral INTEGER NOT NULL DEFAULT 0,
  agency_name TEXT,
  referral_code TEXT,
  status TEXT NOT NULL DEFAULT 'APPLIED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(advertiser_id) REFERENCES advertisers(id),
  FOREIGN KEY(media_id) REFERENCES media(id),
  FOREIGN KEY(plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  billing_month TEXT,
  amount INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING',
  confirmed_at TEXT,
  reminder_20_sent_at TEXT,
  reminder_24_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  file_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  duration_seconds REAL,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE,
  internal_review_status TEXT NOT NULL DEFAULT 'WAITING',
  venue_review_status TEXT NOT NULL DEFAULT 'WAITING',
  correction_reason TEXT,
  approved_at TEXT,
  FOREIGN KEY(application_id) REFERENCES applications(id)
);

CREATE TABLE IF NOT EXISTS playback_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  cause TEXT,
  force_majeure INTEGER NOT NULL DEFAULT 0,
  advertiser_fault INTEGER NOT NULL DEFAULT 0,
  refundable_days INTEGER NOT NULL DEFAULT 0,
  refund_amount INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(application_id) REFERENCES applications(id)
);

INSERT OR IGNORE INTO plans(code,name,duration_type,duration_value,monthly_payment_enabled) VALUES
('7d','7日','day',7,0),
('14d','2週間','day',14,0),
('1m','1ヶ月','month',1,1),
('3m','3ヶ月','month',3,1),
('6m','6ヶ月','month',6,1),
('12m','12ヶ月','month',12,1);
