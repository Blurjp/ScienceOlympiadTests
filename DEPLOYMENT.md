# Deployment Guide

This guide covers deploying the Science Olympiad Tests app to production.

## Prerequisites

1. A GitHub account with this repository
2. A Google Cloud Console account for OAuth
3. A deployment platform account (Vercel recommended)

## Step 1: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen:
   - User Type: External
   - App name: Science Olympiad Tests
   - User support email: your email
   - Developer contact: your email
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: SciOly Tests Production
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.vercel.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.vercel.app/api/auth/callback/google`
7. Save your Client ID and Client Secret

## Step 2: Deploy to Vercel (Recommended)

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `AUTH_SECRET`: Generate using `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add AUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_URL
```

## Step 3: Configure Database for Production

### Option A: Turso (Recommended for Vercel)

Turso is a distributed SQLite database, perfect for this app:

1. Sign up at [Turso](https://turso.tech)
2. Install Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. Create a database:
   ```bash
   turso db create scioly-prod
   ```
4. Get the connection URL:
   ```bash
   turso db show scioly-prod --url
   ```
5. Create an auth token:
   ```bash
   turso db tokens create scioly-prod
   ```
6. Update your code to use Turso:
   - Install: `npm install @libsql/client`
   - Update `lib/database.ts` to use Turso client
7. Add environment variables in Vercel:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

### Option B: Keep SQLite (Ephemeral)

For testing, you can keep SQLite, but note:
- Data will be lost on each deployment
- Not recommended for production
- Consider using Vercel's KV or Postgres for persistence

## Step 4: Update OAuth Redirect URLs

After deployment, update your Google OAuth settings:

1. Go to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your production URLs:
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

## Alternative Deployment Options

### Railway.app

1. Sign up at [Railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Railway will auto-detect Next.js and deploy
5. SQLite works out-of-the-box with persistent volumes

### Netlify

1. Install Netlify Next.js plugin: `npm install @netlify/plugin-nextjs`
2. Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
3. Deploy via Netlify dashboard or CLI
4. Add environment variables in Netlify dashboard

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app: `fly launch`
4. Set secrets:
   ```bash
   fly secrets set AUTH_SECRET=your-secret
   fly secrets set GOOGLE_CLIENT_ID=your-id
   fly secrets set GOOGLE_CLIENT_SECRET=your-secret
   ```
5. Deploy: `fly deploy`

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH_SECRET` | NextAuth secret key (generate with `openssl rand -base64 32`) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `NEXTAUTH_URL` | Your app's public URL | Yes (production) |
| `TURSO_DATABASE_URL` | Turso database URL (if using Turso) | No |
| `TURSO_AUTH_TOKEN` | Turso auth token (if using Turso) | No |

## Post-Deployment Checklist

- [ ] Test Google OAuth login
- [ ] Verify user profile creation
- [ ] Test creating a new test
- [ ] Test taking a test
- [ ] Verify test results are saved
- [ ] Check responsive design on mobile
- [ ] Set up custom domain (optional)
- [ ] Configure CORS if needed
- [ ] Set up monitoring (Vercel Analytics, etc.)

## Troubleshooting

### OAuth Error: redirect_uri_mismatch

- Check that your redirect URIs in Google Console match exactly
- Make sure to include `/api/auth/callback/google` in the path
- Verify NEXTAUTH_URL is set correctly

### Database Not Persisting

- If using SQLite on Vercel, data is ephemeral
- Switch to Turso or another persistent database
- Check volume mounts if using Railway/Fly.io

### Build Errors

- Check all environment variables are set
- Verify Node.js version (should be 20.x+)
- Check build logs for specific errors

## Monitoring and Analytics

### Vercel Analytics (Recommended)

```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Cost Estimates

- **Vercel Free Tier**: Perfect for hobby projects
  - 100GB bandwidth
  - Unlimited deployments
  - Free custom domain
- **Turso Free Tier**:
  - 8GB storage
  - 1 billion row reads/month
  - More than enough for small-medium apps

## Support

For deployment issues:
- Check the [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- Visit [Vercel Support](https://vercel.com/support)
- Check [NextAuth.js Documentation](https://next-auth.js.org/)
