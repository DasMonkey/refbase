# Project Structure & Architecture

## Directory Organization

```
refbase/
├── .kiro/                    # Kiro IDE configuration
│   ├── specs/               # Feature specifications
│   └── steering/            # AI guidance rules
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI primitives (Radix-based)
│   │   ├── *Tab.tsx        # Feature-specific tab components
│   │   ├── *Modal.tsx      # Modal dialogs
│   │   └── *.tsx           # Main application components
│   ├── contexts/           # React contexts (Theme, Auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   ├── pages/              # Page-level components
│   ├── types/              # TypeScript type definitions
│   └── main.tsx            # Application entry point
├── supabase/
│   └── migrations/         # Database schema migrations
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## Component Architecture

### Component Naming Conventions
- **Pages**: `LandingPage.tsx`, `AuthPage.tsx` - Top-level route components
- **Tabs**: `TasksTab.tsx`, `BugsTab.tsx` - Feature area components within workspace
- **Modals**: `CreateProjectModal.tsx`, `SettingsModal.tsx` - Dialog components
- **UI Components**: Located in `components/ui/` - Reusable primitives
- **Main Components**: `Sidebar.tsx`, `ProjectWorkspace.tsx` - Core app structure

### State Management Patterns
- **React Context** for global state (Theme, Auth)
- **Custom hooks** for data fetching and business logic
- **Local state** with useState for component-specific state
- **Supabase real-time** for live data synchronization

### Styling Approach
- **Tailwind CSS** utility classes for all styling
- **Dynamic theming** via CSS-in-JS for dark/light mode
- **Framer Motion** for animations and transitions
- **Responsive design** with mobile-first approach

## Key Architectural Patterns

### Discord-Style Navigation
- Sidebar with project list and navigation
- Tab-based workspace within each project
- Collapsible sidebar for space optimization

### Real-time Collaboration
- Supabase real-time subscriptions for live updates
- Optimistic UI updates with error handling
- Connection status monitoring

### Authentication Flow
- Supabase Auth integration
- Protected routes with authentication checks
- User session management

### Data Flow
1. **Supabase** ↔ **Custom Hooks** ↔ **Components**
2. Real-time subscriptions for live data
3. Optimistic updates for better UX
4. Error boundaries for graceful failure handling