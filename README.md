# Attendance System Frontend

React + Vite frontend for the school attendance management system.

## Stack

- **React 19** with **Vite 6**
- **React Router** for routing
- **Tailwind CSS v4** for styling
- **Radix UI** (shadcn-style components) for UI
- **Axios** for API calls
- **Sonner** for toasts

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running on mobile (same Wi‑Fi)

To use the app on your phone while the dev server runs on your PC:

1. **Get your PC’s IP** (e.g. `192.168.1.5`):
   - Windows: `ipconfig` → look for “IPv4 Address” under your Wi‑Fi adapter.
   - Mac/Linux: `ip addr` or `ifconfig`.

2. **Backend** – listen on all interfaces:
   ```bash
   cd sih25012-attendance-backend
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Frontend** – in the project root create or edit `.env` and point the API to your PC’s IP:
   ```
   VITE_API_URL=http://YOUR_PC_IP:8000
   ```
   Example: `VITE_API_URL=http://192.168.1.5:8000`

4. **Start the frontend** (Vite is already configured with `host: true`):
   ```bash
   cd attendance_system_frontend
   pnpm dev
   ```

5. **On your phone** (connected to the same Wi‑Fi), open in the browser:
   ```
   http://YOUR_PC_IP:5173
   ```
   Example: `http://192.168.1.5:5173`

The QR scan page will use the phone’s camera; API requests go from the phone to your PC’s backend.

## Scripts

- `pnpm dev` – start Vite dev server
- `pnpm build` – production build (output in `dist/`)
- `pnpm preview` – preview production build locally
- `pnpm lint` – run ESLint

## Environment

Create a `.env` file (see `.env.example`). Optional:

- `VITE_API_URL` – backend API base URL (default: `http://localhost:8000`)

## Project Structure

- `src/` – app source
  - `main.jsx` – entry, Router + AuthProvider
  - `App.jsx` – route definitions
  - `index.css` – global styles and Tailwind
  - `pages/` – route pages (Home, Login, Dashboard, Classes, Students, Teachers)
  - `components/` – shared components (ProtectedLayout, auth, ui)
  - `lib/` – API client, auth, utils
- `public/` – static assets (favicon, etc.)
