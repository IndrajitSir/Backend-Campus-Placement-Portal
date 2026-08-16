# Campus Placement Recruitment System (CPRS)

A full-stack MERN application designed to streamline the campus recruitment process for Students, Recruiters, and Placement Staff.

## 🚀 Features

### For Students
- Register and login with email/password or Social Auth (Google/GitHub).
- Create and manage professional profiles.
- Upload and manage resumes/avatars (Cloudinary integration).
- Search and apply for job placements.
- Track application status in real-time.

### For Recruiters / Placement Staff
- Manage job postings and placements.
- Shortlist, select, or reject applications.
- Dashboard for monitoring system-wide analytics.
- Real-time notifications and interview scheduling.

### For Admin / Super Admin
- Full system control and user management.
- Monitor system performance and logs.

## 🛠 Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, Axios, React Router.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io.
- **Authentication**: JWT, Passport.js (Google & GitHub OAuth).
- **Logging**: Winston, Logtail (Cloud), Daily Rotate File.
- **Storage**: Cloudinary (Media assets).
- **Caching**: Redis.

## ⚙️ Setup Instructions

### Environment Variables

Create a `.env` file in the `Backend-Campus-Placement-Portal` directory:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
NODE_ENV=development

ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

REDIS_URL=your_redis_url

LOGTAIL_SOURCE_TOKEN=your_token

GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret

SESSION_SECRET=your_session_secret
```

Create a `.env` file in the `Frontend-Campus-Placement-Portal-` directory:

```env
VITE_API_URL=http://localhost:8000
```

### Running Locally

1. **Backend**:
   ```bash
   cd Backend-Campus-Placement-Portal
   npm install
   npm run dev

## 🌐 OAuth Setup Steps

1. **Google Console**:
   - Create a project.
   - Configure OAuth Consent Screen.
   - Create Credentials (OAuth Client ID).
   - Authorized Redirect URI: `https://your-backend-url.com/api/v1/auth/google/callback`

2. **GitHub Developer Settings**:
   - Register a new OAuth application.
   - Authorization callback URL: `https://your-backend-url.com/api/v1/auth/github/callback`

## 📝 Logging System
The system uses **Winston** for centralized logging:
- **Local**: Logs are saved in `logs/` directory and printed to console.
- **Production**: Logs are streamed to **Logtail** (if token provided) and printed as JSON to console.

## 🚀 Deployment

- **Frontend**: Deploy on **Vercel** or **Netlify**. Ensure `VITE_API_URL` is set to the production backend URL.
- **Backend**: Deploy on **Render** or **Railway**. 
  - Ensure `NODE_ENV` is set to `production`.
  - Enable `trust proxy` (already configured in `app.js`).
  - Set `FRONTEND_URL` and `BACKEND_URL` to production domains.
