# Store Rating System 🏬⭐

A premium, full-stack Store Rating System built with **Express (TypeScript) + Prisma (PostgreSQL)** on the backend and **Vite (React + TypeScript) + Tailwind CSS v4** on the frontend. It features three distinct user roles, interactive visual analytics charts rendered natively via SVGs, server-side pagination, searching, sorting, and robust validation.

---

## 🚀 Key Features

### 👤 Role-Based Portals

| Role | Responsibilities | Key UI Views |
| :--- | :--- | :--- |
| **System Administrator** | Manage stores and platform users | Admin Stats, Dynamic SVG Charts, User Management (Add/Delete), Store Creator |
| **Normal User** | Explore stores, submit and edit ratings | Store Search/Sort Grid, Store Detail Modal (Reviews feed, score metrics), My Ratings History |
| **Store Owner** | Monitor ratings and analytics for their assigned store | Average Score, SVG Ratings Star Distribution, Detailed Review Logs Table |

### 📈 Advanced Capabilities

*   **SVG Visual Charts & Analytics (No 3rd-Party Chart Packages):**
    *   *Admin Dashboard:* Donut SVG Chart mapping user role distribution; Vertical SVG Bar Chart showing the top 5 highest-rated stores (complete with gridlines and gradients).
    *   *Store Owner Dashboard:* Horizontal Progress SVG breakdown illustrating reviews from $1\bigstar$ to $5\bigstar$.
*   **Store Detail Modal (Normal User):** Card clicks fetch specific store metrics, star ratios, and a scrollable list of recent public reviews.
*   **"My Ratings" Log Explorer:** Normal users can search, sort, paginate, and update past reviews on a dedicated history page.
*   **Server-Side Pagination & Filters:** List pages support dynamic limit selectors (`5`, `10`, `20`, `50`) and responsive "Showing X to Y of Z" counters.
*   **Secure Auth & Forms:** Built-in validation checkmark lists verifying name constraints, email formatting, password strength, and confirm-password matching.

---

## 🛠️ Technology Stack

*   **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL database, JWT token-based authentication, Bcrypt password hashing.
*   **Frontend:** Vite, React, TypeScript, Tailwind CSS v4, Lucide React (icons), React Hot Toast (toast messages).

---

## 📂 Project Directory Structure

```text
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL database models
│   │   └── seed.ts         # System Admin default seeding script
│   ├── src/
│   │   ├── middleware/     # Auth & Role restrictions middlewares
│   │   ├── routes/         # Auth, Admin, Store, Store Owner routes
│   │   ├── app.ts          # Express App configuration
│   │   └── server.ts       # Server listening socket
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/     # ProtectedRoute, Navbar, StarRating components
    │   ├── context/        # Auth Context with Axios Interceptors
    │   ├── pages/          # Login, Signup, Admin, NormalUser, StoreOwner, MyRatings
    │   ├── services/       # Base API instance
    │   ├── App.tsx         # Routing configuration
    │   └── index.css       # Tailwind CSS v4 directives
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🗄️ Database Models

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  address   String?
  role      Role     @default(NORMAL_USER)
  store     Store?   // Owned store (1-to-1 relationship for STORE_OWNERs)
  ratings   Rating[] // Ratings submitted by the user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Store {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  address   String
  ownerId   Int?     @unique // Made optional with onDelete SetNull
  owner     User?    @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  ratings   Rating[]
  createdAt DateTime @default(now())

  @@map("stores")
}

model Rating {
  id        Int      @id @default(autoincrement())
  userId    Int
  storeId   Int
  rating    Int      // 1 to 5 stars
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Enforces that a user can only review a store once
  @@unique([userId, storeId])
  @@map("ratings")
}

enum Role {
  SYSTEM_ADMIN
  NORMAL_USER
  STORE_OWNER
}
```

---

## ⚙️ Installation & Setup

### Prerequisites

*   Node.js (v18+)
*   npm
*   PostgreSQL database running locally (Port `5432` with username `postgres`, password `root`, database name `rating_system_db`)

### 1. Set Up the Database

Make sure your PostgreSQL server is active, and create the database `rating_system_db`.

### 2. Configure the Backend

1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the `backend/` directory:
    ```env
    PORT=5000
    DATABASE_URL="postgresql://postgres:root@localhost:5432/rating_system_db?schema=public"
    JWT_SECRET="super-secret-jwt-key"
    ```
4.  Run Prisma migrations to create tables and generate the client:
    ```bash
    npx prisma db push
    ```
5.  Seed the database with the default System Admin user:
    ```bash
    npm run db:seed
    ```

### 3. Configure the Frontend

1.  Navigate into the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Ensure the API endpoint is configured correctly in `frontend/src/services/api.ts` pointing to `http://localhost:5000`.

---

## 🏃 Running the Project

### Start the Backend Server
From the `backend` directory, run:
```bash
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000).

### Start the Frontend Web App
From the `frontend` directory, run:
```bash
npm run dev
```
The app will open on [http://localhost:5173](http://localhost:5173).

---

## 🔑 Default Accounts

For quick local testing, you can log in using these seeded credentials or register a custom user role dynamically on the signup page:

*   **System Administrator:**
    *   **Email:** `admin@system.com`
    *   **Password:** `Admin@1234`