# Digital Twin Engine - Limit Behavior Simulation System

A real-time simulation engine for modeling system behavior under stress conditions, featuring boundary detection and automatic halt mechanisms.

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Development](#-development)
- [Testing](#-testing)
- [Monitoring](#-monitoring)
- [Project Structure](#-project-structure)
- [License](#-license)
- [Support](#-support)
- [Live Deployment](#live-deployment)

## 🚀 Features

- **Real-time Simulation**: Live energy monitoring with trend and noise factors
- **Boundary Detection**: Automatic detection when system approaches critical limits
- **Safety Halt**: System shutdown when instability thresholds are exceeded
- **Data Persistence**: Complete simulation history storage and analysis
- **Interactive Controls**: Adjustable parameters for energy, trend, and noise
- **Visual Analytics**: Real-time charts and state monitoring

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Radix UI** components
- **Recharts** for data visualization
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **PostgreSQL** database with Drizzle ORM
- **TypeScript** for type safety
- **WebSocket** support for real-time updates

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Local Development (Windows 64-bit)

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+ for Windows
- npm or yarn

#### Setup Instructions
```bash
# 1. Clone the repository
git clone https://github.com/poliklinikvildan/DigitalTwin-Engine.git
cd DigitalTwin-Engine

# 2. Install dependencies
npm install

# 3. Install PostgreSQL 15+ from: https://www.postgresql.org/download/windows/

# 4. Create database
createdb -U postgres digitaltwin

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your database configuration:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/digitaltwin

# 6. Run database migrations (creates tables automatically)
npm run db:push

# 7. Start development server
npm run dev
```

#### Quick Database Verification
```bash
# Check if tables were created
psql -U postgres -d digitaltwin -c "\dt"

# Should show:
# simulation_runs
# simulation_steps
```

## 🚀 Deployment (Render)

### Render.com

1. **Create PostgreSQL Database** (Render Managed)
   - Render provides managed PostgreSQL - no local installation needed
   - Create new PostgreSQL service on Render
   - Database name: render_db_XXXX
   - Copy connection string from Render dashboard

2. **Deploy Web Service**
   - Connect your GitHub repository
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add `DATABASE_URL` environment variable (use Render's connection string)

## 📊 Database Schema

See [`database/SQL_DOCUMENTATION.md`](./database/SQL_DOCUMENTATION.md) for complete SQL schema documentation.

### Tables Overview
- **`simulation_runs`** - Stores simulation session metadata
- **`simulation_steps`** - Stores individual simulation time steps

## 📊 API Endpoints

### Engine Evaluation
```http
POST /api/engine/evaluate
Content-Type: application/json

{
  "energy": 0.8,
  "trend": 0.1,
  "noise": 0.2,
  "command": "start_new",
  "name": "Test Simulation",
  "maxEnergy": 1.5,
  "boundaryThreshold": 0.8,
  "haltThreshold": 1.0
}
```

### Simulation Runs
```http
GET    /api/runs              # List all runs
POST   /api/runs              # Create new run
GET    /api/runs/:id          # Get specific run
PATCH  /api/runs/:id          # Update run metadata
POST   /api/runs/:id/steps    # Add steps to run
```

## 🎯 Usage Examples

### Basic Simulation
```javascript
// Start a new simulation
const response = await fetch('/api/engine/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'start_new',
    name: 'Stress Test Alpha',
    energy: 0.9,
    trend: 0.15,
    noise: 0.25,
    maxEnergy: 1.5,
    boundaryThreshold: 0.8,
    haltThreshold: 1.0
  })
});

// Get simulation history
const runs = await fetch('/api/runs');
```

### System States

- **STABLE**: System operating within normal parameters
- **BOUNDARY_ZONE**: System approaching critical limits
- **UNSTABLE**: System exhibiting unstable behavior
- **SYSTEM_SHOULD_HALT**: Critical instability detected, shutdown initiated

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Run TypeScript checks
npm run db:push      # Push database schema changes
```

### Project Structure

```
DigitalTwin-Engine/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Page components
│       ├── App.tsx        # Main App component
│       └── main.tsx       # Entry point
│
├── server/                # Node.js backend
│   ├── routes.ts         # API endpoints
│   ├── db.ts            # Database connection
│   ├── storage.ts        # Data access layer
│   ├── server.ts         # Express server setup
│   └── websocket.ts      # WebSocket server
│
├── shared/               # Shared code
│   ├── schema.ts        # Database schema
│   └── routes.ts        # API type definitions
│
├── drizzle/              # Database migrations
│   └── 0000_aromatic_dragon_man.sql
│
├── dist/                 # Compiled output
├── node_modules/         # Dependencies
│
├── .env.example          # Environment template
├── package.json          # Project config
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

## 🧪 Testing

### Running Tests
```bash
# Run type checking
npm run check

# Test database connection
npx drizzle-kit push
```

## 📈 Monitoring

### Performance Metrics
- CPU usage monitoring
- Memory tracking
- Database query optimization
- Real-time error tracking

### Debug Endpoints
```http
GET /api/debug/runs  # View all simulation data
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:

- 📧 **Email**: poliklinikvildan@gmail.com

---

**Built for digital twin simulation and analysis example**
## Live Deployment
**URL:** https://digitaltwin-engine-3.onrender.com/  

**Platform:** Render.com
<figure>
  <img width="640" height="445"
       src="https://github.com/user-attachments/assets/1f67b5bc-6c25-45b9-88ce-bee3177d9e09"
       alt="TwinEngine Screenshot" />
  <figcaption><em>TwinEngine Screenshot</em></figcaption>
</figure>
