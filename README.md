# Digital Twin Engine - Limit Behavior Simulation System

A real-time simulation engine for modeling system behavior under stress conditions, featuring boundary detection and automatic halt mechanisms.

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

### Local Development
```bash
# Clone the repository
git clone https://github.com/poliklinikvildan/DigitalTwin-Engine.git
cd DigitalTwin-Engine

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/digitaltwin

# Application Settings
NODE_ENV=development
```

### Database Setup

#### PostgreSQL (Recommended for Production)
```bash
# Create database
createdb digitaltwin

# Run migrations
npm run db:push
```

## 🚀 Deployment

### Render.com

1. **Create PostgreSQL Database**
   - Name: `vldn-db`
   - Database: `vldn`
   - Region: Same as your service

2. **Deploy Web Service**
   - Connect your GitHub repository
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add `DATABASE_URL` environment variable

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
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/      # React hooks
│   │   └── pages/      # Page components
├── server/               # Node.js backend
│   ├── routes.ts      # API endpoints
│   ├── db.ts         # Database connection
│   └── storage.ts     # Data access layer
├── shared/              # Shared types and schema
│   ├── schema.ts      # Database schema
│   └── routes.ts      # API type definitions
└── drizzle/            # Database migrations
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For questions and support:

- 📧 **Issues**: [GitHub Issues](https://github.com/poliklinikvildan/DigitalTwin-Engine/issues)
- 📧 **Discussions**: [GitHub Discussions](https://github.com/poliklinikvildan/DigitalTwin-Engine/discussions)
- 📧 **Email**: poliklinikvildan@gmail.com

---

**Built for digital twin simulation and analysis example**
