# UI Preview - Science Olympiad Tests App

## Visual Layout Overview

### **Header Component** (appears on all pages)
```
╔══════════════════════════════════════════════════════════════════╗
║  [SO]  SciOly Tests    Home   Generate   Import      [👤 Profile] [Sign Out] ║
╚══════════════════════════════════════════════════════════════════╝
```

**When NOT logged in:**
```
╔══════════════════════════════════════════════════════════════════╗
║  [SO]  SciOly Tests    Home                            [Sign In]  ║
╚══════════════════════════════════════════════════════════════════╝
```

- Left: Blue logo square with "SO", app name
- Center: Navigation links (Generate/Import only visible when authenticated)
- Right: User avatar + name OR Sign In button

---

## **1. Login Page** (`/login`)

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│                    [Blue gradient background]                     │
│                                                                    │
│         ┌─────────────────────────────────────────┐              │
│         │                                          │              │
│         │         Welcome Back                     │              │
│         │                                          │              │
│         │  Sign in to access your Science         │              │
│         │  Olympiad tests and track your progress │              │
│         │                                          │              │
│         │  ┌────────────────────────────────────┐ │              │
│         │  │  [G] Sign in with Google          │ │              │
│         │  └────────────────────────────────────┘ │              │
│         │                                          │              │
│         │  By signing in, you agree to our Terms  │              │
│         │  of Service and Privacy Policy          │              │
│         │  ────────────────────────────────────── │              │
│         │  Features you'll unlock:                │              │
│         │  • Save your test results and progress  │              │
│         │  • Create and share custom tests        │              │
│         │  • Access test history and analytics    │              │
│         │  • Generate personalized practice tests │              │
│         └─────────────────────────────────────────┘              │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Design Details:**
- Centered card on blue-to-indigo gradient background
- Large "Welcome Back" title
- Single prominent Google sign-in button with Chrome icon
- Feature list showing benefits of signing in
- Clean, modern design with proper spacing

---

## **2. Profile Page** (`/profile`)

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Profile                                                          │
│  Manage your account settings and preferences                    │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Account Information                                          ││
│  │ Your personal details                                        ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │  [👤]  John Doe                                              ││
│  │        john.doe@gmail.com                                    ││
│  │                                                               ││
│  │  📧 Email: john.doe@gmail.com                                ││
│  │  👤 Provider: Google                                         ││
│  │  📅 User ID: user_abc123def456                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Your Statistics                                              ││
│  │ Track your progress and achievements                         ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  ││
│  │  │    0     │  │    0%    │  │    0     │                  ││
│  │  │  Tests   │  │ Average  │  │  Tests   │                  ││
│  │  │Completed │  │  Score   │  │ Created  │                  ││
│  │  └──────────┘  └──────────┘  └──────────┘                  ││
│  │   [Blue]       [Green]       [Purple]                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Account Actions                                              ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │  ┌────────────────────────────────────────────────────────┐││
│  │  │           [🚪] Sign Out                                 │││
│  │  └────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Design Details:**
- Three main cards stacked vertically
- **Account Info Card**: Shows user avatar (or placeholder), name, email, provider, user ID
- **Statistics Card**: Three colored boxes showing:
  - Blue: Tests Completed (currently 0)
  - Green: Average Score (currently 0%)
  - Purple: Tests Created (currently 0)
- **Actions Card**: Red "Sign Out" button
- Clean, card-based layout with proper spacing

---

## **3. Home Page** (unchanged from before)

Your existing home page with test browser functionality remains the same, but now includes:
- Header with authentication state
- Sign in prompt for guests
- User profile access for logged-in users

---

## **4. Protected Routes** (`/generate`, `/import`)

When NOT logged in and trying to access:
```
┌──────────────────────────────────────────────────────────────────┐
│                   [Automatic redirect to /login]                  │
└──────────────────────────────────────────────────────────────────┘
```

These routes automatically redirect unauthenticated users to the login page.

---

## **Color Scheme**

- **Primary**: Blue (#2563eb)
- **Backgrounds**: White cards on gray/gradient backgrounds
- **Text**:
  - Headers: Black (#000)
  - Body: Gray-700 (#374151)
  - Muted: Gray-500 (#6b7280)
- **Accents**:
  - Blue for primary actions
  - Green for positive metrics
  - Purple for creation stats
  - Red for destructive actions (Sign Out)

---

## **Responsive Design**

All pages are fully responsive:
- **Mobile**: Single column, stacked cards, hamburger menu
- **Tablet**: Two-column stats, condensed navigation
- **Desktop**: Full layout as shown above

---

## **Interactive Elements**

1. **Buttons**:
   - Large, rounded corners
   - Hover effects (darkening)
   - Icons + text on desktop, icons only on mobile

2. **Cards**:
   - White background
   - Subtle shadow
   - Rounded corners
   - Proper padding and spacing

3. **Navigation**:
   - Active state highlighting
   - Smooth transitions
   - Conditional rendering based on auth state

---

## **To See It Live**

To preview the actual UI locally:

1. Set up environment variables:
```bash
cp .env.example .env.local
```

2. Add Google OAuth credentials to `.env.local`:
```
AUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

3. Start the dev server:
```bash
npm run dev
```

4. Visit:
   - `http://localhost:3000` - Home page
   - `http://localhost:3000/login` - Login page
   - `http://localhost:3000/profile` - Profile (requires login)

---

## **Screenshots Reference**

The design follows modern SaaS UI patterns similar to:
- **Vercel's dashboard** (clean, card-based)
- **GitHub's settings page** (organized sections)
- **Google's Material Design** (proper spacing, shadows)

With a focus on:
- ✅ Clean, minimalist design
- ✅ Proper visual hierarchy
- ✅ Accessible contrast ratios
- ✅ Responsive across devices
- ✅ Professional appearance
