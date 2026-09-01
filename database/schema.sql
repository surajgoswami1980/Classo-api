-- ═══════════════════════════════════════════════════════════════════
-- School ERP SaaS - Database Schema
-- MySQL 8.0 | Multi-Tenant (school_id isolation)
-- ═══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS school_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_erp;

-- ─────────────────────────────────────────────────────────────────
-- Platform-Level Tables (No school_id)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tier ENUM('starter', 'growth', 'enterprise') NOT NULL,
  max_students INT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  features JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  board_affiliation ENUM('CBSE', 'ICSE', 'STATE', 'UNIVERSITY') NOT NULL,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#1976D2',
  secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  subscription_plan_id INT,
  subscription_status ENUM('trial', 'active', 'expired', 'read_only') DEFAULT 'trial',
  subscription_start_date DATE,
  subscription_end_date DATE,
  trial_end_date DATE,
  max_students INT DEFAULT 300,
  enabled_modules JSON,
  website_config JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscription_status (subscription_status),
  INDEX idx_is_active (is_active),
  INDEX idx_code (code),
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Users (All roles within a school + super admins)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  role ENUM('super_admin', 'school_admin', 'sub_admin', 'teacher', 'student', 'parent', 'staff', 'incharge') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50),
  registration_id VARCHAR(50),
  permissions JSON,
  profile_image VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_role (school_id, role),
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_employee_id (school_id, employee_id),
  INDEX idx_registration_id (school_id, registration_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Academic Structure
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academic_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_current (school_id, is_current),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  academic_session_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  numeric_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_session (school_id, academic_session_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  class_id INT NOT NULL,
  name VARCHAR(10) NOT NULL,
  capacity INT DEFAULT 40,
  class_teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_class (school_id, class_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  class_id INT NOT NULL,
  type ENUM('core', 'elective', 'activity') DEFAULT 'core',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_class (school_id, class_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Students & Teachers
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  user_id INT NOT NULL,
  admission_number VARCHAR(50),
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  roll_number VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  blood_group VARCHAR(5),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  admission_date DATE,
  status ENUM('active', 'inactive', 'transferred', 'graduated') DEFAULT 'active',
  previous_school VARCHAR(255),
  transport_route_id INT,
  father_name VARCHAR(255),
  father_phone VARCHAR(15),
  mother_name VARCHAR(255),
  mother_phone VARCHAR(15),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(15),
  medical_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_class (school_id, class_id),
  INDEX idx_school_section (school_id, section_id),
  INDEX idx_school_status (school_id, status),
  INDEX idx_admission_number (school_id, admission_number),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  user_id INT NOT NULL,
  qualifications TEXT,
  date_of_joining DATE,
  designation VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(10,2),
  status ENUM('active', 'inactive', 'resigned') DEFAULT 'active',
  date_of_leaving DATE,
  assigned_classes JSON,
  assigned_subjects JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_status (school_id, status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Attendance
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'half_day') NOT NULL,
  marked_by INT NOT NULL,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_date (student_id, date),
  INDEX idx_school_class_date (school_id, class_id, date),
  INDEX idx_student_date_range (school_id, student_id, date),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  check_in_time TIMESTAMP NULL,
  check_out_time TIMESTAMP NULL,
  status ENUM('present', 'absent', 'leave', 'half_day', 'late') NOT NULL,
  marked_by INT,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_staff_date (user_id, date),
  INDEX idx_school_date (school_id, date),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Fees
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fee_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  academic_session_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  installment_count INT DEFAULT 1,
  late_fee_per_day DECIMAL(8,2) DEFAULT 0,
  late_fee_max DECIMAL(10,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_session_class (school_id, academic_session_id, class_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fee_heads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_optional TINYINT(1) DEFAULT 0,
  head_type ENUM('tuition', 'transport', 'library', 'lab', 'sports', 'exam', 'other') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fee_structure (school_id, fee_structure_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fee_installments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  installment_number INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_structure (school_id, fee_structure_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fee_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  student_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  fee_installment_id INT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'overdue', 'partial') DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_student (school_id, student_id),
  INDEX idx_school_status (school_id, status),
  INDEX idx_due_date (school_id, due_date),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  fee_invoice_id INT NOT NULL,
  student_id INT NOT NULL,
  parent_user_id INT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('upi', 'credit_card', 'debit_card', 'net_banking', 'cash', 'cheque') NOT NULL,
  gateway ENUM('razorpay', 'offline') DEFAULT 'razorpay',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  status ENUM('initiated', 'success', 'failed', 'refunded') DEFAULT 'initiated',
  failure_reason TEXT,
  receipt_url VARCHAR(500),
  platform_commission DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_status (school_id, status),
  INDEX idx_razorpay_order (razorpay_order_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Exams & Marks
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  academic_session_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  exam_type ENUM('unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly') NOT NULL,
  start_date DATE,
  end_date DATE,
  is_published TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_session (school_id, academic_session_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  exam_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  passing_marks DECIMAL(5,2) NOT NULL,
  exam_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_exam_class (school_id, exam_id, class_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  exam_id INT NOT NULL,
  exam_subject_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5),
  remarks VARCHAR(255),
  entered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_exam_subject (student_id, exam_subject_id),
  INDEX idx_school_exam (school_id, exam_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Timetable
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  academic_session_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  period_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_class_day (school_id, class_id, section_id, day_of_week),
  INDEX idx_school_teacher_day (school_id, teacher_id, day_of_week),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Assignments
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(50),
  status ENUM('draft', 'published') DEFAULT 'published',
  max_marks INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_class (school_id, class_id, section_id),
  INDEX idx_school_teacher (school_id, teacher_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT,
  attachment_url VARCHAR(500),
  is_late TINYINT(1) DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(10),
  feedback TEXT,
  graded_by INT,
  graded_at TIMESTAMP NULL,
  UNIQUE KEY uk_assignment_student (assignment_id, student_id),
  INDEX idx_assignment (school_id, assignment_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  channel ENUM('push', 'email', 'sms', 'all') DEFAULT 'all',
  target_type ENUM('all', 'role', 'class', 'section', 'individual') NOT NULL,
  target_role ENUM('teacher', 'student', 'parent', 'staff'),
  target_class_id INT,
  target_section_id INT,
  target_user_ids JSON,
  sent_by INT NOT NULL,
  status ENUM('queued', 'processing', 'sent', 'failed') DEFAULT 'queued',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_status (school_id, status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Transport
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  vehicle_type ENUM('bus', 'van', 'auto') DEFAULT 'bus',
  insurance_expiry DATE,
  fitness_expiry DATE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transport_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  vehicle_id INT,
  driver_name VARCHAR(100),
  driver_phone VARCHAR(15),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transport_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  route_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  sequence_order INT NOT NULL,
  pickup_time TIME,
  drop_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_route (school_id, route_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Library
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS library_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  isbn VARCHAR(20),
  category VARCHAR(100),
  publisher VARCHAR(255),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  rack_location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  INDEX idx_isbn (school_id, isbn),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS library_book_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  book_id INT NOT NULL,
  issued_to_user_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  fine_amount DECIMAL(8,2) DEFAULT 0,
  fine_paid TINYINT(1) DEFAULT 0,
  status ENUM('issued', 'returned', 'overdue') DEFAULT 'issued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school_status (school_id, status),
  INDEX idx_school_user (school_id, issued_to_user_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Leave Requests
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  user_id INT NOT NULL,
  leave_type ENUM('casual', 'sick', 'earned', 'maternity', 'other') NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_user (school_id, user_id),
  INDEX idx_school_status (school_id, status),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Grading
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grading_scales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('percentage', 'cgpa') NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grading_scale_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  grading_scale_id INT NOT NULL,
  grade VARCHAR(5) NOT NULL,
  min_percentage DECIMAL(5,2) NOT NULL,
  max_percentage DECIMAL(5,2) NOT NULL,
  grade_point DECIMAL(3,1),
  description VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (grading_scale_id) REFERENCES grading_scales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Audit Log
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_data JSON,
  new_data JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school_user (school_id, user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────
-- Initial Seed Data
-- ─────────────────────────────────────────────────────────────────

INSERT INTO subscription_plans (name, tier, max_students, monthly_price, annual_price, features) VALUES
('Starter', 'starter', 300, 4999.00, 49999.00, '["student","teacher","attendance","fee","exam","timetable","notification"]'),
('Growth', 'growth', 1000, 9999.00, 99999.00, '["student","teacher","attendance","fee","exam","timetable","notification","library","transport","assignment","report"]'),
('Enterprise', 'enterprise', 99999, 19999.00, 199999.00, '["student","teacher","attendance","fee","exam","timetable","notification","library","transport","assignment","report","api_access","custom_branding","priority_support"]');

-- Super Admin user (password: Admin@123)
INSERT INTO users (school_id, role, first_name, last_name, email, password, is_active) VALUES
(NULL, 'super_admin', 'Platform', 'Admin', 'admin@schoolerp.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);
