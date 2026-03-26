# Face Recognition Attendance System - Run Guide

## Stack
- Frontend: React (`frontend`)
- Backend: Spring Boot + MySQL (`backend`)
- AI Service: Flask + OpenCV + face_recognition (`face-ai`)

## Implemented Modules
- JWT login with role-based access (`ADMIN`, `FACULTY`)
- Student CRUD with face image upload
- Subject CRUD with faculty + class timing
- Attendance marking via webcam image -> backend -> Flask recognition
- Duplicate attendance prevention per student/subject/day
- Class-time attendance validation
- Dashboard summary + 7-day chart data API
- Daily / monthly / student-wise reports + PDF/Excel export

## Default Login Users
Created automatically at backend startup (if `users` table is empty):
- `admin / admin123`
- `faculty / faculty123`

## Database (MySQL)
1. Create DB:
```sql
CREATE DATABASE face_attendance;
```
2. Optional manual schema is in:
- `backend/schema.sql`

Backend also uses JPA `ddl-auto=update`, so tables are auto-managed.

For deployment (Render), configure these environment variables:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS` (comma-separated, e.g. your Vercel URL)

## Important Paths
- Uploaded student faces: `backend/uploads/faces`
- Flask known faces: `face-ai/known_faces`

Backend is configured to mirror uploaded student face images into Flask known faces directory via:
- `app.ai.known-faces-dir=../face-ai/known_faces`

## Service Start Order
### 1) AI Service (Flask)
```powershell
cd c:\Users\satha\Downloads\ttproject\face-ai
c:/Users/satha/Downloads/ttproject/.venv/Scripts/python.exe app.py
```

Health:
- `GET http://localhost:5000/`

### 2) Backend (Spring Boot)
```powershell
cd c:\Users\satha\Downloads\ttproject\backend
.\mvnw.cmd spring-boot:run
```

Runs on:
- `http://localhost:8082` (local default)
- `PORT` env var is respected automatically in deployment.

### 3) Frontend (React)
```powershell
cd c:\Users\satha\Downloads\ttproject\frontend
npm install
npm start
```

Runs on:
- `http://localhost:3000`

## Frontend Routing
- `/login`
- `/dashboard`
- `/students` (ADMIN)
- `/subjects` (ADMIN)
- `/attendance`
- `/reports`

## API Endpoints
- `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/students`
- `GET|POST|PUT|DELETE /api/subjects`
- `POST /api/attendance/mark`
- `GET /api/attendance/report/daily`
- `GET /api/attendance/report/monthly`
- `GET /api/attendance/report/student`
- `GET /api/attendance/report/export/excel`
- `GET /api/attendance/report/export/pdf`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/chart`

## Notes about face_recognition
- `face_recognition` may fail to install on Python 3.14 due native dependency (`dlib`) build constraints.
- Flask service is coded with graceful fallback: API still runs and returns a clear message if module is unavailable.
- For full recognition reliability, use Python 3.11 virtual environment for `face-ai`.

## Quick Validation
- Backend tests:
```powershell
cd c:\Users\satha\Downloads\ttproject\backend
.\mvnw.cmd test
```
- Mark attendance flow:
  1. Login
  2. Add subjects/students (with face images)
  3. Open Attendance page
  4. Select subject and capture image
  5. Verify records on Reports page / MySQL

## Deployment Notes
- Backend (Render): Use root `render.yaml` (service root is `backend`).
- Frontend (Vercel): Use `frontend/vercel.json` and set project root to `frontend`.
- Frontend API URL env var on Vercel:
  - `REACT_APP_API_URL=https://<your-render-service>.onrender.com`
