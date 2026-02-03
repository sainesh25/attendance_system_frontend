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
