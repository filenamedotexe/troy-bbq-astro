# Troy BBQ - Astro & MedusaJS Platform

A modern BBQ restaurant and catering platform built with Astro, MedusaJS v2, TypeScript, and Tailwind CSS.

## 🏗️ Architecture

- **Frontend**: Astro with React components
- **Backend**: MedusaJS v2 for e-commerce functionality
- **Database**: NeonDB (Serverless Postgres)
- **Payment**: Stripe + Square integration
- **Deployment**: Vercel (serverless functions)
- **Styling**: Tailwind CSS + shadcn/ui components

## 🚀 Project Structure

```text
/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components and Astro wrappers
│   │   ├── ui/           # shadcn/ui components
│   │   └── layout/       # Header, Footer components
│   ├── layouts/          # Astro layouts
│   ├── lib/              # Utilities, database, schemas
│   ├── pages/            # Astro pages (routes)
│   ├── styles/           # Global CSS
│   └── types/            # TypeScript type definitions
├── schema.sql            # Database schema for NeonDB
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4005`     |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 🛠️ Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`: Your NeonDB connection string
   - `MEDUSA_BACKEND_URL`: Your MedusaJS backend URL
   - Payment provider credentials (Stripe, Square)
4. **Initialize database**: The schema will be applied automatically
5. **Start development server**: `npm run dev`
6. **Open**: http://localhost:4005

## 📦 Features

### Phase 1 - Foundation ✅
- [x] Astro project with MedusaJS integration
- [x] TypeScript configuration (strict mode)
- [x] NeonDB database setup with custom tables
- [x] Tailwind CSS + shadcn/ui components
- [x] Basic responsive layout components

### Phase 2 - Core Features (In Progress)
- [ ] Admin settings management interface
- [ ] Product catalog display with filtering
- [ ] Shopping cart and checkout flow
- [ ] Payment provider integration (Stripe + Square)

### Phase 3 - Catering System
- [ ] Multi-step catering quote builder
- [ ] Dynamic pricing calculation engine
- [ ] Quote management dashboard
- [ ] Two-phase payment workflow

### Phase 4 - Polish
- [ ] Order tracking and status updates
- [ ] Email notifications
- [ ] Performance optimization and SEO
- [ ] Comprehensive error handling

## 🗄️ Database

Custom tables in NeonDB:
- `admin_settings`: Single-row configuration store
- `catering_quotes`: Quote storage and management
- `catering_addons`: Configurable add-on services

## 🎨 Design System

Built with shadcn/ui components and custom BBQ restaurant theming:
- Responsive design (mobile-first)
- Accessible components
- Consistent typography and spacing
- Brand colors and imagery

## 🚀 Deployment

Configured for Vercel deployment with:
- Serverless functions for backend logic
- Static asset optimization
- Automatic builds from Git

## 🔧 Development

The project runs on **port 4005** for both development and preview modes.

### Database Schema

Execute the `schema.sql` file on your NeonDB instance to create the required tables:

```sql
-- Creates admin_settings, catering_quotes, and catering_addons tables
-- Includes triggers, indexes, and default data
```

### Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
MEDUSA_BACKEND_URL="http://localhost:9000"
STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
SQUARE_APPLICATION_ID=""
SQUARE_ACCESS_TOKEN=""
```

## 📱 Features Overview

### Restaurant Features
- Product catalog with filtering
- Shopping cart with real-time updates  
- Multiple payment options (Stripe/Square)
- Order tracking and confirmations

### Catering System
- Interactive quote builder
- Guest count with appetite modifiers
- Location-based delivery pricing
- Custom plate combinations
- Add-on services (setup, equipment, staff)
- Two-phase payment (deposit + balance)

### Admin Dashboard
- Settings management (fees, tax rates, delivery areas)
- Menu administration
- Order management
- Catering quote approval workflow