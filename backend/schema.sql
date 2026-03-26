CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  enabled BIT NOT NULL
);

CREATE TABLE students (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(150) NOT NULL,
  face_image_path VARCHAR(500)
);

CREATE TABLE subjects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  class_start_time TIME NOT NULL,
  class_end_time TIME NOT NULL
);

CREATE TABLE attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(100) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  faculty_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT uk_attendance_student_subject_date UNIQUE (student_id, subject_id, date)
);
