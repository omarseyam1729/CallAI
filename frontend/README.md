# CallAI Frontend

Modern React frontend for the CallAI call analysis system.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **shadcn/ui** - Modern component library
- **React Router** - Navigation
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Charts for metrics
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

Make sure the backend is running on `http://localhost:8000` (or update the proxy configuration in `vite.config.ts`)

### Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Layout components (Navbar, Sidebar)
│   └── ...
├── pages/            # Page components
├── lib/              # Utilities and API client
│   ├── api.ts        # API client
│   ├── types.ts      # TypeScript types
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Features

- **Dashboard** - Overview metrics and charts
- **Call Explorer** - Browse and filter calls
- **Call Details** - View transcripts, summaries, and run analysis
- **Upload** - Drag-and-drop audio file upload
- **Agents** - Manage call agents
- **Triggers** - Create and evaluate triggers
- **Batch Processing** - Run batch analysis jobs
- **Search** - Keyword and semantic search

## API Configuration

The frontend is configured to proxy API requests to the backend. By default, it expects the backend at `http://localhost:8000`. You can override this by setting the `VITE_API_URL` environment variable.

## Development Notes

- The app uses React Query for data fetching and caching
- All API calls are typed with TypeScript
- Components use shadcn/ui for consistent styling
- Dark mode is supported via Tailwind CSS
