# Check With Me

An AI-powered fact-checking application that helps verify claims and statements in real-time using GPT-5 and web search.

## Features

- **AI-Powered Fact Checking**: Leverages OpenAI GPT-5 models for intelligent claim analysis
- **Web Search Integration**: Uses Tavily API for real-time web verification
- **Trending Prompts**: Database-driven trending fact-checks with global upvotes
- **History Tracking**: Complete logging of all fact-check requests with analytics
- **Admin Panel**: Comprehensive management interface for trending prompts and history
- **Smart Caching**: Automatic caching to reduce API costs and improve response times
- **Privacy-Safe**: Anonymous session tracking with hashed IPs

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Models**: OpenAI GPT-5 (nano/standard)
- **Search**: Tavily API
- **Styling**: Tailwind CSS 4
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm
- Supabase account
- OpenAI API key
- Tavily API key

### Environment Variables

Create a `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-nano

# Tavily Search API
TAVILY_API_KEY=your_tavily_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
# Copy contents of supabase/migrations/001_init_schema.sql to Supabase SQL Editor and execute
# Copy contents of supabase/migrations/002_seed_trending_prompts.sql to Supabase SQL Editor and execute

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
check-with-me/
├── app/
│   ├── admin/              # Admin panel for managing trending prompts and history
│   ├── api/
│   │   ├── fact-check/     # Main fact-checking endpoint
│   │   ├── trending/       # Trending prompts API
│   │   └── admin/          # Admin management APIs
│   ├── components/         # React components
│   ├── lib/                # Utility functions and configurations
│   └── page.tsx           # Main landing page
├── supabase/
│   └── migrations/        # Database schema and seed data
└── public/                # Static assets
```

## Database Schema

### `trending_prompts`
Stores curated fact-check examples with cached results and upvote counts.

### `fact_check_history`
Logs all fact-check requests with metadata, response times, and results for analytics.

## API Routes

- `POST /api/fact-check` - Submit text for fact-checking
- `GET /api/trending` - Fetch trending prompts
- `POST /api/trending/[id]/upvote` - Upvote a trending prompt
- `GET /api/admin/history` - Fetch fact-check history (with filters)
- `GET /api/admin/history/stats` - Get analytics statistics
- `POST /api/admin/history/[id]/to-trending` - Promote history entry to trending
- `POST /api/admin/trending` - Create new trending prompt
- `PUT /api/admin/trending/[id]` - Update trending prompt
- `DELETE /api/admin/trending/[id]` - Delete trending prompt

## Admin Panel

Access the admin panel at `/admin` to:
- Manage trending prompts (create, edit, delete)
- View fact-check history with search and filters
- See analytics dashboard (success rates, popular queries, response times)
- Promote successful fact-checks to trending prompts

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

This project is optimized for Vercel deployment:

1. Push to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Features in Detail

### Fact-Checking Process

1. **Initial Screening**: AI identifies claims that need verification
2. **Web Search**: Searches for relevant sources using Tavily API
3. **Verification**: AI analyzes claims against search results
4. **Confidence Scoring**: Returns confidence levels for each claim

### Caching System

- Automatically caches results based on text hash
- Checks history before calling expensive APIs
- Reduces costs and improves response times

### Privacy & Security

- IP addresses are hashed for privacy
- Anonymous session tracking
- Row-level security in Supabase
- Service role for admin operations only

## License

Private project - All rights reserved

## Contributing

This is a private project. For questions or suggestions, please contact the repository owner.

---

Built with [Claude Code](https://claude.com/claude-code) 🤖
