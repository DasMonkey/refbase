# Technology Stack & Development

## Build System
- **Vite** - Lightning-fast development server and build tool
- **Node.js 18+** - Runtime environment
- **npm** - Package manager

## Frontend Stack
- **React 18** - UI framework with TypeScript
- **TypeScript 5.5+** - Type-safe development
- **Tailwind CSS** - Utility-first styling framework
- **Framer Motion** - Animation library
- **Radix UI** - Accessible, unstyled UI primitives
- **React Hook Form + Zod** - Form handling with validation
- **Lucide React** - Icon library

## Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Real-time)
- **Row Level Security (RLS)** - Data isolation and security
- **Real-time subscriptions** - Live data updates

## Development Tools
- **ESLint** - Code linting with TypeScript support
- **PostCSS + Autoprefixer** - CSS processing
- **Git** - Version control

## Common Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint checks
```

### Environment Setup
```bash
npm install          # Install dependencies
cp .env.example .env # Copy environment template
```

## Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Code Quality Standards
- All new code must be TypeScript
- Follow ESLint configuration
- Use Tailwind for styling (no custom CSS unless necessary)
- Implement proper error boundaries
- Use React hooks patterns consistently