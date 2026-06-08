# Khali Class Dhundo (🏫 Empty Classroom Finder)

A premium, interactive full-stack application built for Galgotias University students to find, filter, claim, and vacate empty classrooms in real-time. 

---

## 🌟 Key Features

*   **Real-time Availability Tracker**: Color-coded badges instantly show whether a classroom is **Available** (green) or **Claimed** (red).
*   **Proximity & Block Filtering**: Combined dropdown filters to locate rooms in specific academic blocks (**AI, A, B, C, D**) or near popular student canteens (**Chai Adda, Fusion Cafe, Maggie Point, Le Broc**).
*   **Interactive Metrics Dashboard**: Live progress bars tracking total rooms, available spaces, and claimed slots.
*   **Actionable Cards**: Dynamic CTA buttons that switch between **Claim Room** (when empty) and **Vacate Room ✕** (when claimed).
*   **State-of-the-Art UX**: Beautiful cosmic dark-theme glassmorphism layout, subtle micro-animations, loading spinners, and animated Success/Error toast alerts.
*   **Bulletproof Concurrency Protection**: Zero-race-condition backend booking with client-side click throttling and state locking.

---

## 🛠️ Tech Stack & Architecture

### Frontend
*   **React (Vite)**: Component-driven stateful interface.
*   **Vanilla CSS**: Premium glassmorphic styling, custom inputs, transitions, keyframe animation sequences, and mobile responsiveness.
*   **Dual-Locking System**: React state locking + `useRef`-based click throttling (800ms threshold) to discard duplicate submissions.

### Backend
*   **Node.js & Express**: High-performance RESTful API endpoints.
*   **SQLite3**: Structured local filesystem database (`database.sqlite`).
*   **Atomic Query Transactions**: Eliminates the concurrency bug by shifting status checks to SQLite's transaction layer using single-query compare-and-swap logic.

```mermaid
graph TD
    subgraph Frontend (React / Vite)
        A[Dashboard UI] -->|1. Double-click Lock| B[Click Throttle <800ms]
        B -->|2. State Lock| C[Disable Button & Spinner]
    end
    subgraph Backend (Express)
        C -->|3. POST /api/claim/:id| D[server.js REST API]
    end
    subgraph Database (SQLite3)
        D -->|4. Atomic Query| E[(database.sqlite)]
        E -->|5. UPDATE ... WHERE status = 'empty'| F[1 Row Modified: Success]
        E -->|6. Status Already 'claimed'| G[0 Rows Modified: 400 Already Claimed]
    end
```

---

## 🔒 The Concurrency Fix (Audit & Solution)

### The Original Bug
In the starter code, claiming was executed in three non-atomic steps:
1. Query the room status: `SELECT status FROM rooms WHERE id = ?`.
2. Check in application layer: `if (row.status === 'empty')`.
3. Update the database: `UPDATE rooms SET status = 'claimed' WHERE id = ?`.

If multiple users clicked "Claim" at the same time, both requests read the status as `'empty'` before either wrote `'claimed'`, leading to a double-claim.

### The Solution
We collapsed this into a single atomic **compare-and-swap** transaction on the database level:
```sql
UPDATE rooms SET status = 'claimed' WHERE id = ? AND status = 'empty'
```
Only the first serialized request updates the row. The second request updates 0 rows because the status condition (`status = 'empty'`) fails. The backend detects this via SQLite's `this.changes` count and returns a `400 Bad Request` to all concurrent losers.

---

## 📡 API Reference

### 1. Get Classrooms
Returns a list of classrooms matching the filters.
*   **Endpoint**: `GET /api/rooms`
*   **Query Params**:
    *   `block` (optional): `'All' | 'AI Block' | 'A Block' | 'B Block' | 'C Block' | 'D Block'`
    *   `canteen` (optional): `'All' | 'Fusion Cafe' | 'Chai Adda' | 'Maggie Point' | 'Le Broc'`
*   **Success Response (200)**:
    ```json
    [
      {
        "id": 1,
        "name": "AI-101",
        "block": "AI Block",
        "description": "Next to Chai Adda",
        "status": "empty"
      }
    ]
    ```

### 2. Claim Classroom
Claims a classroom atomically.
*   **Endpoint**: `POST /api/claim/:id`
*   **Success Response (200)**: `{"message": "Room 1 claimed successfully!"}`
*   **Error Response (400)**: `{"error": "Room is already claimed"}`
*   **Error Response (404)**: `{"error": "Room not found"}`

### 3. Vacate Classroom
Releases a claimed classroom.
*   **Endpoint**: `POST /api/release/:id`
*   **Success Response (200)**: `{"message": "Room 1 is now unoccupied!"}`
*   **Error Response (400)**: `{"error": "Room is already unoccupied"}`

---

## 🚀 Setup & Execution

### Prerequisites
*   Node.js (v18+)

### 1. Backend Setup
On Windows systems, ensure you use the full path to `npm.cmd` if standard commands shadow a default dummy executable.
```bash
cd backend
npm install
npm run setup   # Initializes the SQLite database
npm start       # Starts server on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Starts Vite dev server (usually http://localhost:5173 or 5174)
```

---

## 🧪 Verification & Testing

We have included automated verification scripts in the project directory to test system load and logic:

1.  **Concurrency Test**: Simulates 10 concurrent claim requests in the same millisecond.
    ```bash
    node backend/setup.js
    node scratch/verify_concurrency.js
    ```
    *Result*: Exactly 1 success (200), 9 failures (400).
2.  **Filter Verification**: Asserts combined block and canteen filtering logic.
    ```bash
    node scratch/verify_filtering.js
    ```
3.  **Vacating Verification**: Asserts the claim-then-vacate lifecycle transitions.
    ```bash
    node scratch/verify_vacate.js
    ```
