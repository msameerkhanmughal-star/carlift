# Car Lift Booking App

## Overview
A React-based car lift / ride booking application with route browsing, monthly plan booking, and an admin panel. Built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Architecture
- **Frontend only** — Pure React SPA (no backend server)
- **Routing**: React Router v6
- **State/Data**: TanStack React Query
- **UI**: shadcn/ui components + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **PDF generation**: jsPDF

## Pages
- `/` — Book Ride (main booking page with route carousel and monthly plan form)
- `/my-rides` — My Rides (user's ride history)
- `/auth` — Authentication page
- `/carlift-admin` — Admin panel

## Key Files
- `src/App.tsx` — Root component with routing
- `src/pages/` — Page components
- `src/components/` — Shared components (Layout, UI)
- `src/lib/` — Utilities
- `vite.config.ts` — Vite config (port 5000, host 0.0.0.0 for Replit)

## Replit Configuration
- Dev server runs on port 5000 with `npm run dev`
- `lovable-tagger` plugin removed from Vite config (not needed on Replit)
- Deployment: `npm run build` → `node ./dist/index.cjs`
