# GymFlow

Premium gym management dashboard built with React, TypeScript, Vite, Tailwind CSS, and a Firebase-ready architecture.

## Features

- Admin dashboard with KPI cards and charts
- Member, trainer, payment, attendance, and workout modules
- Role-based access for super admin, gym admin, trainer, and member
- Responsive dark premium SaaS UI matching the requested visual direction
- Firebase web configuration scaffold for future auth, Firestore, and Storage integration

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication, Firestore, Storage, and Hosting.
3. Copy `.env.example` to `.env.local` and provide your Firebase client settings.
4. Add your Firebase app configuration in `src/lib/firebase.ts`.
5. Configure Firestore rules and App Check before production deployment.

## Demo login accounts

- Super Admin: `superadmin@gymflow.local` / `demo1234`
- Gym Admin: `admin@gymflow.local` / `demo1234`
- Trainer: `trainer@gymflow.local` / `demo1234`
- Member: `member@gymflow.local` / `demo1234`

> Demo accounts are for local development only and should not be used in production.

## Notes

This application uses realistic sample data and client-side state so the interface is fully interactive without a running backend. The Firebase configuration is scaffolded for a real Firebase project and remains safe for frontend use without exposing server credentials.
