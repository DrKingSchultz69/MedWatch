# MedWatch HMS — Backend

Production-ready Express.js + TypeScript backend for the MedWatch Hospital/Clinic Management System with real-time vitals monitoring.

## Prerequisites

- **Node.js 20+** ([download](https://nodejs.org/))
- **MongoDB** running locally on `mongodb://localhost:27017`
  - Install: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - Or run via Docker: `docker run -d -p 27017:27017 mongo:7`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed the database (creates demo users + sample data)
npm run seed

# 3. Start the development server
npm run dev
```

The server will start at:
- **REST API**: http://localhost:4000/api
- **WebSocket**: ws://localhost:4000/ws/vitals
- **Health Check**: http://localhost:4000/api/health

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| doctor@hospital.com | doctor123 | DOCTOR |
| receptionist@hospital.com | reception123 | RECEPTIONIST |
| patient@hospital.com | patient123 | PATIENT |
| pharmacist@hospital.com | pharma123 | PHARMACIST |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot-reload (nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run seed` | Seed database with demo data |

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT + user |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Get current user |

**Login Request:**
```json
POST /api/auth/login
{ "email": "doctor@hospital.com", "password": "doctor123" }
```

**Login Response:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "...",
    "email": "doctor@hospital.com",
    "name": "Dr. Sarah Chen",
    "role": "DOCTOR"
  }
}
```

### Appointments (`/api/appointments`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/appointments` | All auth | List (filtered by role) |
| GET | `/api/appointments/:id` | All auth | Get single |
| POST | `/api/appointments` | DOCTOR, RECEPTIONIST | Create |
| PATCH | `/api/appointments/:id/status` | DOCTOR, RECEPTIONIST | Update status |
| DELETE | `/api/appointments/:id` | RECEPTIONIST | Delete |

**Create Appointment:**
```json
POST /api/appointments
Authorization: Bearer <token>
{
  "patientName": "John Doe",
  "patientId": "<patient-user-id>",
  "doctorName": "Dr. Sarah Chen",
  "doctorId": "<doctor-user-id>",
  "date": "2026-04-22",
  "time": "09:00",
  "type": "Check-up",
  "notes": "Optional notes"
}
```

### Prescriptions (`/api/prescriptions`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/prescriptions` | All auth | List (filtered by role) |
| GET | `/api/prescriptions/:id` | All auth | Get single |
| POST | `/api/prescriptions` | DOCTOR | Create |
| PATCH | `/api/prescriptions/:id/status` | DOCTOR, PHARMACIST | Update status |

### Vitals (`/api/vitals`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vitals/:patientId/history?limit=60` | Yes | Last N vital readings |

## WebSocket — Real-Time Vitals

Connect to `ws://localhost:4000/ws/vitals?patientId=<id>&token=<jwt>`

**Messages received:**
```json
// Every 1 second (persisted to MongoDB)
{ "type": "vitals", "data": {
    "timestamp": 1713750000000,
    "heart_rate": 72,
    "spo2": 98,
    "temperature": 36.6,
    "respiration_rate": 16,
    "bp_systolic": 120,
    "bp_diastolic": 80
  }
}

// Every 100ms (in-memory ECG waveform)
{ "type": "ecg", "data": [0.15, 0.12, -0.2, 1.0, -0.15, 0.0, 0.2, 0.18] }
```

## Project Structure

```
server/
├── src/
│   ├── app.ts                   # Express app setup
│   ├── server.ts                # HTTP + WebSocket entry
│   ├── config/db.ts             # MongoDB connection
│   ├── controllers/             # Route handlers
│   ├── middleware/               # Auth, role, error, validation
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routers
│   ├── services/                # Vitals simulator
│   ├── sockets/                 # WebSocket handler
│   ├── types/                   # TypeScript declarations
│   └── utils/seed.ts            # Database seeder
├── .env                         # Environment variables
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Environment Variables

See `.env.example` for all available configuration options.

## Security

- JWT authentication on all protected routes
- Role-based access control (RBAC)
- Rate limiting on login (10 attempts/15 min)
- Helmet security headers
- CORS restricted to frontend origin
- Zod request body validation
- Bcrypt password hashing (12 rounds)
