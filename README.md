# Khali Class Dhundo (Technical Audition Task)

This is a simple full-stack application for finding and claiming empty classrooms. 

**Note: This application intentionally contains a concurrency/race condition bug for the purpose of a technical audition.**

## Prerequisites
- Node.js installed

## Setup & Running

### 1. Backend
Open a terminal in the `backend/` directory:
```bash
npm install
npm run setup   # Initializes the SQLite database
npm start       # Starts server on http://localhost:3000
```

### 2. Frontend
Open a new terminal in the `frontend/` directory:
```bash
npm install
npm run dev     # Starts Vite dev server (usually http://localhost:5173)
```

## The "Race Condition" Challenge
To observe the bug:
1. Open the frontend in your browser.
2. Find an "empty" room.
3. Click the **"Claim Room"** button rapidly (e.g., 5-10 times in one second).
4. Check the backend terminal logs. You will notice that multiple requests successfully "claim" the same room because the backend reads the state and checks it in JavaScript before updating, without any atomicity or locking.
5. In a properly built system, only the first request should succeed, and subsequent ones should return an error saying the room is already claimed.
