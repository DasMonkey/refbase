# RefBase

> **Intelligent Development Knowledge Base** - Transform your AI coding conversations into a searchable, organized reference database that grows with every development session.

[![Built with Kiro](https://img.shields.io/badge/Built%20with-Kiro-blue?style=flat-square)](https://kiro.ai)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)

## 🚀 What is RefBase?

RefBase is a revolutionary webapp that integrates with AI-powered IDEs like Kiro, Cursor and Claude Code to automatically capture, process, and organize your coding conversations into an intelligent knowledge base. Never lose track of solutions, patterns, or debugging insights again.

### The Problem
- **Lost Solutions**: Brilliant solutions from AI chats disappear in IDE history
- **Repeated Mistakes**: Same bugs and issues resurface without learning from past fixes
- **Knowledge Silos**: Team insights scattered across individual chat histories
- **Pattern Blindness**: Missing recurring successful approaches and anti-patterns

### The Solution
RefBase transforms your AI coding sessions into a **living, searchable knowledge base** that:
- 📚 **Captures** every AI conversation with full context
- 🧠 **Analyzes** patterns and extracts reusable solutions
- 🔍 **Organizes** by project, topic, and success patterns
- 🤝 **Shares** team knowledge and best practices
- 📈 **Learns** from your coding journey to suggest better approaches

## ✨ Key Features

### 🎯 **Smart Project Management**
- Multi-project workspace with Discord-style navigation
- Task management with Kanban boards and sprint planning
- Bug tracking with severity levels and resolution patterns
- Document management (PRDs, technical specs, knowledge base)
- Team chat and real-time collaboration

### 💬 **AI Conversation Integration & Learning Loop**
- **MCP Server** integration with Cursor, Claude Code, and compatible IDEs
- Automatic chat history import and processing with real-time analysis
- **AI Learning Loop**: Successful implementations automatically extracted and fed back to AI
- Conversation categorization (bug fixes, features, debugging, learning)
- Code snippet extraction and syntax highlighting
- Context preservation with file paths and project state
- **Smart Context Feeding**: AI receives relevant patterns and implementation history for better performance

### 🧩 **Advanced Pattern Recognition & AI Learning Loop**
- **Automatic Pattern Extraction**: Successful implementations become reusable patterns
- **Feature Implementation History**: Complete step-by-step processes with code changes and dependencies
- **Bug Resolution Patterns**: Proven fixes automatically extracted and suggested for similar issues
- **AI Context Enhancement**: Future AI sessions receive relevant patterns for faster, more accurate implementations
- Anti-pattern detection and warnings with alternative suggestions
- Success rate tracking and continuous improvement of pattern effectiveness
- Cross-project pattern sharing and intelligent reuse recommendations

### 🔍 **Intelligent Search & Discovery**
- Semantic search across all conversations and code
- Filter by project, technology stack, success rate, and date
- Related conversation suggestions
- Pattern-based recommendations
- Context-aware search results

### 📊 **Analytics & Insights**
- Coding productivity trends and patterns
- Problem resolution success rates
- Technology skill development tracking
- Team collaboration metrics
- Learning progress visualization

## 🏗️ Architecture

RefBase is built as a modern, scalable web application with the following architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IDE (Kiro)    │    │   Enhanced MCP   │    │   Web App       │
│   Claude Code   │◄──►│   Server +       │◄──►│   React + TS    │
│   + AI Assistant│    │   Context Feeder │    │   Tailwind CSS  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                       │                        │
         │                       ▼                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   AI Processing  │    │   Supabase      │
         │              │   + Learning     │    │   PostgreSQL    │
         │              │   Loop Engine    │    │   Auth + RLS    │
         │              └──────────────────┘    └─────────────────┘
         │                       │                        │
         │                       ▼                        ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         └──────────────│   Pattern        │    │   Vector Search │
           Smart        │   Library &      │    │   Semantic      │
           Context      │   Success        │    │   Embeddings    │
           Feeding      │   Tracking       │    │   Pinecone      │
                        └──────────────────┘    └─────────────────┘
```

### Tech Stack

**Frontend:**
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and building
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations and transitions
- **Radix UI** for accessible, unstyled UI primitives

**Backend:**
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS) for data isolation
- **Node.js MCP Server** for IDE integration
- **OpenAI/Anthropic APIs** for conversation analysis and pattern extraction

**Development:**
- **Kiro IDE** - Primary development environment with AI assistance and RefBase integration
- **ESLint + TypeScript** for code quality and type safety
- **Git** for version control with conventional commits
- **AI Learning Loop** - Continuous improvement through pattern extraction and context feeding

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account and project
- **Kiro IDE** (recommended) or any modern IDE
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/DasMonkey/refbase.git
   cd refbase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint for code quality checks
npm run type-check   # Run TypeScript compiler checks

# Database
npm run db:reset     # Reset Supabase database (development)
npm run db:migrate   # Run database migrations
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI API Keys (for pattern analysis)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🎯 Development with Kiro

This project is optimized for development with **Kiro IDE**, which provides:

- **AI-Powered Coding**: Get intelligent suggestions and code generation
- **Context Awareness**: Kiro understands your entire project structure
- **Real-time Collaboration**: Built-in features for team development
- **Integrated Testing**: Run tests and debug directly in the IDE
- **RefBase Integration**: Future native integration for conversation capture

### Kiro-Specific Features Used

- **Steering Rules**: Project-specific AI guidance in `.kiro/steering/`
- **Specs**: Structured feature development in `.kiro/specs/`
- **Context Management**: Automatic project context for AI assistance

## 📁 Project Structure

```
refbase/
├── .kiro/                    # Kiro IDE configuration
│   ├── specs/               # Feature specifications
│   └── steering/            # AI guidance rules
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── Dashboard.tsx   # Project dashboard
│   │   ├── ProjectWorkspace.tsx  # Main workspace
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   └── contexts/           # React contexts
├── supabase/
│   └── migrations/         # Database schema migrations
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Deploy to Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Write **meaningful commit messages**
- Add **tests** for new features
- Update **documentation** as needed

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kiro IDE** for providing an exceptional AI-powered development environment
- **Supabase** for the robust backend infrastructure
- **React Team** for the amazing frontend framework
- **Open Source Community** for the incredible tools and libraries

## 📞 Support

- **Documentation**: [docs.refbase.dev](https://docs.refbase.dev)
- **Issues**: [GitHub Issues](https://github.com/DasMonkey/refbase/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DasMonkey/refbase/discussions)
- **Email**: support@refbase.dev

---

**Built with ❤️ using Kiro IDE** | **Transform your coding conversations into knowledge**
