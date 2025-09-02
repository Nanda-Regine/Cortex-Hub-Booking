📖 Cortex Hub Booking System

A full-stack booking platform for The Cortex Hub
, built with:

Next.js (React + TypeScript) for the frontend and API routes

Supabase for authentication, database, storage, and realtime

WhatsApp Cloud API for conversational bookings

OpenAI API for the AI booking assistant

TailwindCSS for styling

✨ Features:

User sign-up/sign-in with Supabase Auth

Profile management with avatars and unique QR codes (entry passes)

Facility booking with blocked slots per facility

Admin dashboard to view bookings by facility

AI Booking Assistant (auto-parse natural language requests)

WhatsApp booking flow (interactive list + buttons)

Email + WhatsApp confirmation notifications

cortexhub-booking/
├── components/           # Reusable UI components
│   ├── BookingForm.tsx
│   ├── EquipmentChecklist.tsx
│   ├── FacilityCard.tsx
│   ├── FacilityIcon.tsx
│   ├── Header.tsx
│   ├── QRBadge.tsx
├── pages/
│   ├── api/
│   │   ├── whatsapp-webhook.ts   # WhatsApp webhook handler
│   │   ├── ai-book.ts            # AI booking assistant endpoint
│   ├── index.tsx                 # Home page
│   ├── dashboard.tsx             # User dashboard
│   ├── admin.tsx                 # Admin dashboard
│   ├── login.tsx                 # Auth pages
├── lib/
│   ├── supabaseClient.ts         # Supabase client init
│   ├── utils.ts                  # Helper utilities
├── public/                       # Static assets
├── styles/                       # Tailwind + global CSS
├── supabase.sql                  # Database schema + RLS policies
├── .env.local                    # Local environment variables
├── next.config.js
├── package.json
└── README.md
