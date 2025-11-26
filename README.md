# Skill Exchange Platform

A modern web platform that connects people to exchange skills and knowledge. Users can teach what they know and learn what they want through structured sessions and real-time communication.

## 🚀 Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Skill Matching**: Find users with complementary skills
- **Real-time Chat**: Communicate with potential learning partners
- **Session Management**: Schedule and manage learning sessions
- **Rating System**: Rate and review completed sessions
- **Admin Dashboard**: Comprehensive admin controls and reporting
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing

### Database
- **PostgreSQL** (via Supabase) - Primary database
- **Row Level Security** - Data protection

## 📋 Prerequisites

- Node.js 16+ and npm 8+
- Supabase account and project
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/skill-exchange-platform.git
cd skill-exchange-platform
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Setup

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
```
Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_public_key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security policies

### 5. Start Development
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Project Structure

```
skill-exchange-platform/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React contexts
│   │   ├── services/        # API services
│   │   └── config/          # Configuration files
│   └── package.json
├── backend/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── config/          # Configuration
│   │   └── utils/           # Utility functions
│   ├── server.js            # Entry point
│   └── package.json
├── database/
│   └── schema.sql           # Database schema
└── README.md
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up --build
```

### Render (Backend)
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard

### Vercel (Frontend)
1. Connect your GitHub repository
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `build`
5. Add environment variables in Vercel dashboard

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all dependencies

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔐 Environment Variables

### Backend Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend Required
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Anonymous public key
- `REACT_APP_API_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users by skills

### Session Endpoints
- `POST /api/sessions` - Create session proposal
- `GET /api/sessions` - Get user sessions
- `PUT /api/sessions/:id` - Update session status

### Chat Endpoints
- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/:chatId` - Get chat messages

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify Supabase credentials
- Check RLS policies are enabled
- Ensure database schema is properly applied

**CORS Errors**
- Verify `FRONTEND_URL` in backend .env
- Check Supabase CORS settings

**Build Failures**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, email support@skillexchange.com or create an issue on GitHub.

---

Built with ❤️ using React, Node.js, and Supabase