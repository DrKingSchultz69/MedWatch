# MedWatch — Hospital Management System (HMS)

**MedWatch** is a modern, comprehensive Hospital Management System featuring real-time patient vitals monitoring, role-based access control, appointment scheduling, and prescription management.

This repository contains completely decoupled but fully integrated frontend UI and backend API architectures.

## 🚀 Tech Stack

### Frontend (`/health-stream-vue`)
- **React 18** powered by **Vite**
- **TypeScript** for end-to-end type safety
- **Tailwind CSS + Shadcn UI** for elegant, responsive components
- **Framer Motion** for polished micro-animations
- **Zustand** for lightweight state management
- Real-time **WebSocket** integration for live ECG data

### Backend (`/server`)
- **Node.js + Express.js**
- **TypeScript**
- **MongoDB + Mongoose** for persistent data storage
- **JWT** (JSON Web Tokens) & robust Role-Based Access Control
- Native **WebSockets** (`ws`) streaming simulated patient vitals

## ✨ Key Features

- **Role-Based Dashboards**: Custom interfaces exclusively tailored for Doctors, Receptionists, Patients, and Pharmacists.
- **Real-Time Vitals Monitoring**: Live clinical dashboard for doctors to actively monitor patient Heart Rate, SpO2, Temperature, Blood Pressure, and streaming ECG waveforms.
- **Smart Appointment Scheduling**: Seamless booking, management, and tracking of appointments for receptionists and patients.
- **Prescription System**: Doctors can issue and track digital prescriptions to be fulfilled dynamically by the Pharmacist dashboard.
- **Premium UI/UX**: Fully responsive, accessible, beautifully crafted frontend with dynamic layouts.

## 📁 Project Structure

```text
HMS/
├── server/                 # Express REST API + WebSocket Server
│   ├── src/                # Controllers, Models, Routes, Services
│   ├── package.json        
│   └── README.md           # Deep dive into Backend APIs & Sockets
└── health-stream-vue/      # Modern React Frontend App
    ├── src/                # Pages, Components, Hooks, Stores
    ├── package.json        
    └── tailwind.config.ts  
```

## 🛠️ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **MongoDB** running locally on default `mongodb://localhost:27017`

### 2. Setup & Start Backend

```bash
cd server
npm install

# Seed the database with demo users & sample data
npm run seed      

# Start the dev server (running on http://localhost:4000)
npm run dev       
```

### 3. Setup & Start Frontend

Open a new terminal session in the project root:

```bash
cd health-stream-vue
npm install

# Start the frontend dev server
npm run dev       
```

## 🔐 Standard Demo Accounts

If you ran the `npm run seed` command, you can locally explore the different views utilizing the credentials below:

| Access Role      | Email                     | Password     |
|------------------|---------------------------|--------------|
| **Doctor**       | doctor@hospital.com       | doctor123    |
| **Receptionist** | receptionist@hospital.com | reception123 |
| **Patient**      | patient@hospital.com      | patient123   |
| **Pharmacist**   | pharmacist@hospital.com   | pharma123    |

*Navigate to the login screen and easily plug these in to view the role-restricted dashboards!*

## 📜 License

This project is licensed under the MIT License.
