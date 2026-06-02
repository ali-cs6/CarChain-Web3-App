# CarChain Frontend

A modern React 19 + Vite SPA (Single Page Application) for the CarChain marketplace. Integrates with Express backend via REST API, manages authentication via JWT, and renders real-time vehicle listings and blockchain verification data.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Prerequisites & Setup](#4-prerequisites--setup)
5. [Environment Configuration](#5-environment-configuration)
6. [Project Structure](#6-project-structure)
7. [State Management](#7-state-management)
8. [API Integration](#8-api-integration)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Component Architecture](#10-component-architecture)
11. [Pages & Routing](#11-pages--routing)
12. [User Workflows](#12-user-workflows)
13. [Form Handling & Validation](#13-form-handling--validation)
14. [Error Handling & Toast Notifications](#14-error-handling--toast-notifications)
15. [Styling & Design System](#15-styling--design-system)
16. [Performance Optimization](#16-performance-optimization)
17. [Development Guidelines](#17-development-guidelines)
18. [Browser Support](#18-browser-support)
19. [Security Considerations](#19-security-considerations)
20. [Production Build & Deployment](#20-production-build--deployment)

---

## 1. Overview

CarChain Frontend is a React SPA built with modern tooling (Vite, React 19, TailwindCSS). It provides:

- **Authentication** — Registration, login, logout, JWT token management
- **Vehicle Marketplace** — Browse, filter, search listings with real-time updates
- **Listing Management** — Create, edit, delete listings; upload car photos to Cloudinary
- **Blockchain Integration** — Display vehicle history, ownership records, and verification badges from Hyperledger Fabric
- **Seller Dashboard** — Track listings, view sales history, manage inventory
- **Admin Panel** — Initialize ledger, view audit logs, manage users (for admins only)
- **Responsive Design** — Mobile-first, works on phones, tablets, desktops

The app communicates exclusively via REST API to the CarChain Backend (port 9000), which bridges to Hyperledger Fabric and MongoDB.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | >=18 | Development & build environment |
| **Framework** | React | ^19.2.6 | UI library |
| **Build Tool** | Vite | ^8.0.12 | Fast dev server & production builds |
| **State Management** | Zustand | ^5.0.13 | Lightweight auth store |
| **Routing** | React Router | ^7.15.0 | Client-side page navigation |
| **Data Fetching** | TanStack Query (React Query) | ^5.100.10 | Server state, caching, synchronization |
| **HTTP Client** | Axios | ^1.16.1 | REST API requests with interceptors |
| **UI Component Library** | Lucide React | ^1.14.0 | 300+ icon library |
| **Notifications** | React Hot Toast | ^2.6.0 | Toast alerts (success, error, loading) |
| **Styling** | Tailwind CSS | ^3.4.19 | Utility-first CSS framework |
| **CSS Processing** | PostCSS + Autoprefixer | ^8.5.14 & ^10.5.0 | CSS vendor prefixes |
| **Linting** | ESLint | ^10.3.0 | Code quality + best practices |
| **Dev Tool** | Hot Module Replacement (HMR) | (Vite built-in) | Instant updates during dev |

---

## 3. Architecture & Data Flow

### Request Flow Diagram

```
┌─────────────────────────────────┐
│      React Component            │
│   (Page, Form, Button Click)    │
└────────────────┬────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Event Handler    │
        │  (onClick, onSubmit)│
        └────────┬───────────┘
                 │
         ┌───────▼─────────┐
         │ Mutation/Query  │ (React Query)
         │ Service Call    │
         └────────┬────────┘
                  │
           ┌──────▼──────┐
           │  API Module │
           │ (*.api.js)  │
           └──────┬──────┘
                  │
        ┌─────────▼────────┐
        │ Axios Interceptor│
        │ (Add JWT Token)  │
        └────────┬────────┘
                 │
    HTTP POST/GET/PUT/DELETE
                 │
         ┌───────▼────────┐
         │ Express Backend │
         │  (port 9000)   │
         └────────────────┘
                 │
    ┌────────────┬────────────┐
    ▼            ▼            ▼
MongoDB      Fabric       Cloudinary
 (Users)   (Vehicles)    (Images)
```

### Component Render Flow

```
App.jsx (Routes & Providers)
   │
   ├─ QueryClientProvider (React Query context)
   ├─ BrowserRouter (React Router context)
   ├─ Toaster (Toast notification system)
   │
   └─ Routes
      │
      ├─ Public Routes:
      │  ├─ /login
      │  ├─ /register
      │  ├─ /
      │  ├─ /listings
      │  └─ /listings/:vehicleId
      │
      ├─ Protected Routes (ProtectedRoute wrapper):
      │  ├─ /dashboard
      │  ├─ /dashboard/sell
      │  └─ /dashboard/create-listing/:vehicleId
      │
      └─ Admin Routes (adminOnly=true):
         └─ /admin
```

---

## 4. Prerequisites & Setup

### System Requirements

- **Node.js** >= 18 (LTS recommended)
- **npm** >= 8 or **yarn** >= 3.6
- **Modern browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation

```bash
cd carchain-frontend
npm install
```

### Quick Start

```bash
# Development server (HMR enabled, port 5173)
npm run dev

# Production build
npm build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

Expected output:
```
VITE v8.0.12 ready in 145 ms

➜ Local:   http://localhost:5173/
➜ press h to show help
```

---

## 5. Environment Configuration

### Environment Variables

Create a `.env` file (already git-ignored) in the project root:

```
VITE_API_URL=http://localhost:9000/api/v1
```

#### Variable Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:9000/api/v1` | Yes |

> **Note on Vite env vars**: Only variables prefixed with `VITE_` are exposed to the client code (for security). Access via `import.meta.env.VITE_API_URL`.

### Environment-Specific Configuration

For different deployment environments:

```bash
# Development (.env.development)
VITE_API_URL=http://localhost:9000/api/v1

# Staging (.env.staging)
VITE_API_URL=https://api-staging.carchain.example.com/api/v1

# Production (.env.production)
VITE_API_URL=https://api.carchain.example.com/api/v1
```

Load with:
```bash
npm run dev -- --mode staging
```

---

## 6. Project Structure

```
carchain-frontend/
│
├── public/                          # Static assets (served as-is)
│   ├── favicon.svg
│   └── icons.svg                    # SVG sprite for UI icons
│
├── src/
│   ├── main.jsx                     # React app entry point
│   ├── App.jsx                      # Routes + providers setup
│   ├── index.css                    # Global styles + Tailwind directives
│   ├── App.css                      # App-specific styles (if any)
│   │
│   ├── api/                         # API service layer
│   │   ├── axios.js                 # Axios instance + interceptors (JWT, refresh token)
│   │   ├── auth.api.js              # register, login, logout, getMe, changePassword
│   │   ├── vehicle.api.js           # getAllVehicles, queryVehicle, register, transfer, status
│   │   ├── listing.api.js           # browse, create, update, delete, uploadPhotos
│   │   ├── sale.api.js              # completeSale, getMySales
│   │   └── admin.api.js             # initLedger, getAuditLogs, getUsers
│   │
│   ├── components/                  # Reusable React components
│   │   ├── layout/
│   │   │   ├── Layout.jsx           # Page wrapper (Navbar + footer)
│   │   │   ├── Navbar.jsx           # Header with logo, nav links, user menu
│   │   │   ├── Footer.jsx           # Footer
│   │   │   └── ProtectedRoute.jsx   # Auth guard for routes (redirect to /login if not authenticated)
│   │   │
│   │   ├── ui/                      # Design system components
│   │   │   ├── Button.jsx           # Styled button (primary, secondary, danger)
│   │   │   ├── Input.jsx            # Styled text input
│   │   │   ├── Badge.jsx            # Status badge (active, stolen, etc.)
│   │   │   ├── Spinner.jsx          # Loading spinner
│   │   │   └── EmptyState.jsx       # Empty state placeholder
│   │   │
│   │   ├── listing/
│   │   │   ├── ListingCard.jsx      # Card showing one listing (image, price, location)
│   │   │   └── ListingFilters.jsx   # Sidebar filters (make, price range, location, etc.)
│   │   │
│   │   ├── vehicle/
│   │   │   ├── VerifyBadge.jsx      # Blockchain verification indicator
│   │   │   └── HistoryTimeline.jsx  # Visual timeline of vehicle transaction history
│   │   │
│   │   └── ErrorBoundary.jsx        # React error boundary (catches render errors)
│   │
│   ├── pages/                       # Full-page components (one per route)
│   │   ├── Home.jsx                 # Landing page / hero
│   │   ├── Browse.jsx               # Marketplace listing browse with filters
│   │   ├── ListingDetail.jsx        # Single listing detail + photos, history, contact
│   │   ├── Login.jsx                # Login form
│   │   ├── Register.jsx             # Registration form
│   │   ├── Dashboard.jsx            # User dashboard (listings, sales, profile)
│   │   ├── SellVehicle.jsx          # Register a vehicle on blockchain
│   │   ├── CreateListing.jsx        # Create marketplace listing for a vehicle
│   │   ├── NotFound.jsx             # 404 page
│   │   └── admin/
│   │       └── AdminPanel.jsx       # Admin dashboard (init ledger, audit logs, users)
│   │
│   ├── store/                       # State management (Zustand)
│   │   └── auth.store.js            # Authentication state (user, isAuthenticated, login, logout)
│   │
│   ├── utils/                       # Utility functions
│   │   ├── constants.js             # API_BASE_URL, vehicle statuses, car makes, sort options
│   │   ├── token.js                 # JWT token management (getToken, setToken)
│   │   └── formatters.js            # Format utilities (price, date, mileage)
│   │
├── index.html                       # HTML entry point (Vite processes)
├── vite.config.js                   # Vite configuration (plugins, build options)
├── tailwind.config.js               # Tailwind CSS config (brand colors, custom shadows)
├── postcss.config.js                # PostCSS config (Tailwind, autoprefixer)
├── eslint.config.js                 # ESLint rules
│
├── package.json                     # Dependencies + scripts
├── package-lock.json
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Template (optional — not in this project)
├── .gitignore
└── README.md                        # This file
```

---

## 7. State Management

### Zustand Store — Auth State

**File**: `src/store/auth.store.js`

Zustand is a minimal, unopinionated state management library. The app uses a single store for authentication state:

```javascript
const useAuthStore = create((set) => ({
  // State
  user: null,                        // { _id, username, email, fullname, role, ... }
  isAuthenticated: false,
  isLoading: true,                   // true on app mount while checking session

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  
  login: async (credentials) => {    // Calls POST /users/login
    // Response includes { user, accessToken }
    // setToken() stores token in memory, Axios interceptor adds to all requests
    // set() updates Zustand state
  },
  
  logout: async () => {              // Calls POST /users/logout (invalidates server-side token)
    // Clear token from memory and state
  },
  
  checkSession: async () => {        // Calls GET /users/me (on app mount)
    // Verifies if logged-in user still valid
    // Called in App.jsx useEffect[] to restore session on page refresh
  },
}));
```

**Usage in Components**:

```javascript
import useAuthStore from "../store/auth.store";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Component re-renders when any of these change
  return isAuthenticated ? <Dashboard user={user} /> : <LoginPrompt />;
}
```

### Why Zustand?

- **Minimal** — No boilerplate, no actions/reducers/dispatch
- **Reactive** — Component subscribes only to slices it needs (auto-optimization)
- **TypeScript-friendly** — Works well with JSDoc types
- **Persists easily** — Can add localStorage middleware if needed

---

## 8. API Integration

### API Modules Pattern

Each feature has a dedicated API module that encapsulates all calls for that resource.

**File**: `src/api/listing.api.js`

```javascript
import api from "./axios";

export const listingApi = {
  getAll: (params) => api.get("/listings", { params }),
  getById: (vehicleId) => api.get(`/listings/${vehicleId}`),
  create: (data) => api.post("/listings", data),
  update: (vehicleId, data) => api.patch(`/listings/${vehicleId}`, data),
  remove: (vehicleId) => api.delete(`/listings/${vehicleId}`),
  uploadPhotos: (vehicleId, formData) =>
    api.post(`/listings/${vehicleId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
};
```

**Benefits**:
- Single source of truth for API endpoints
- Easy to mock in tests
- Consistent error handling (delegated to axios interceptors)
- Query params passed separately for cleanliness

### Axios Interceptors

**File**: `src/api/axios.js`

#### Request Interceptor

Attaches JWT token to every outgoing request:

```javascript
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

#### Response Interceptor

Handles 401 Unauthorized errors (expired access token):

```
1. Check if response status is 401 AND request hasn't been retried yet
2. If so, attempt to refresh token:
   POST /users/refresh-token (includes httpOnly cookie with refresh token)
3. If refresh succeeds:
   - Store new access token in memory (setToken)
   - Retry original request with new token
   - Resolve any queued requests
4. If refresh fails:
   - Clear token and auth state
   - Let app redirect to login
5. Queue any failed requests until refresh completes (avoid stampede)
```

**Queue mechanism**: While refreshing, subsequent requests queue up and wait. Once refresh succeeds, all queued requests retry with the new token. This prevents race conditions.

---

## 9. Authentication & Authorization

### Authentication Flow

#### Registration Flow

```
User → Registration Page
         ↓
      Form Input (username, email, password, fullname, governmentId, licenseNumber)
         ↓
   Validation (Client-side)
         ↓
   POST /users/register
         ↓
   Backend creates user, hashes password
         ↓
   Response: { user: {...}, success: true }
         ↓
   Toast: "Account created successfully"
         ↓
   Redirect to /login
```

#### Login Flow

```
User → Login Page
         ↓
      Form Input (email, password)
         ↓
   POST /users/login
         ↓
   Backend validates credentials, returns tokens
         ↓
   Frontend stores accessToken in memory (getToken/setToken)
         ↓
   httpOnly cookie set with refreshToken (automatic, browser handles)
         ↓
   Zustand: setUser() + set isAuthenticated=true
         ↓
   axios interceptor now attaches token to all requests
         ↓
   Redirect to /dashboard (or previous page if redirected from protected route)
```

#### Session Restoration (on page refresh)

```
Browser Load → App.jsx renders → useEffect[]
   ↓
   checkSession() (GET /users/me)
   ↓
   Backend verifies JWT from Authorization header
   ↓
   Success: GET /users/me returns user object
   ↓
   Frontend: setUser(response) + isLoading=false
   ↓
   App shows dashboard without login prompt
   ↓
   (If token expired, axios interceptor handles refresh)
```

#### Token Refresh Flow (transparent to user)

```
Request with expired access token
   ↓
   Backend returns 401 Unauthorized
   ↓
   Axios interceptor catches 401
   ↓
   POST /users/refresh-token
   (browser auto-sends httpOnly cookie with refreshToken)
   ↓
   Backend validates refreshToken, issues new accessToken
   ↓
   Frontend stores new accessToken in memory
   ↓
   Retry original request with new token
   ↓
   Success (or fail if refresh token also expired — redirect to /login)
```

### Authorization

**Role-Based Access Control**:

```javascript
// Protect routes based on user.role
<Route path="/admin" element={
  <ProtectedRoute adminOnly>
    <AdminPanel />
  </ProtectedRoute>
} />

// ProtectedRoute component checks:
// 1. if (!isAuthenticated) → redirect to /login
// 2. if (adminOnly && user.role !== "admin") → redirect to /
// 3. else → render children
```

### Token Storage Strategy

- **Access Token** — Stored in **memory only** (not localStorage to prevent XSS)
  - Short-lived (1 day)
  - Sent in `Authorization: Bearer <token>` header
  - Lost on page refresh (requires session check)
  
- **Refresh Token** — Stored in **httpOnly cookie** (inaccessible to JS)
  - Long-lived (10 days)
  - Browser auto-sends with all requests
  - Cannot be stolen via XSS
  - Renewed on every refresh

---

## 10. Component Architecture

### Component Hierarchy

Components follow a consistent structure:

#### 1. Layout Components (Structural)

**Navbar.jsx** — Fixed header with logo, nav links, user menu

- Responsive: hidden on mobile, dropdown menu icon instead
- Shows user avatar with initials (generated from fullname)
- Logout handler with toast

**Footer.jsx** — Static footer (company info, links, copyright)

**Layout.jsx** — Page wrapper

```jsx
export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
```

#### 2. UI Components (Reusable Design System)

Self-contained, stateless components with consistent styling via Tailwind:

**Button.jsx**

```jsx
export default function Button({ 
  children, 
  variant = "primary",    // primary, secondary, danger
  size = "md",           // sm, md, lg
  disabled = false,
  onClick,
  ...props 
}) {
  const baseClass = "font-medium rounded-lg transition-colors focus:outline-none";
  const variantClass = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-gray-300",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  
  return (
    <button className={`${baseClass} ${variantClass}`} {...props}>
      {children}
    </button>
  );
}
```

**Input.jsx** — Consistent text input styling

**Badge.jsx** — Status indicators (active ✓, stolen ⚠, scrapped ✗)

**Spinner.jsx** — Loading indicator (animated circle)

**EmptyState.jsx** — "No results" placeholder with icon + message

#### 3. Feature Components (Stateful)

Components with business logic:

**ListingCard.jsx** — Renders one listing preview

```jsx
// Props: listing { vehicleId, price, make, model, photos, location }
// Displays: image carousel, price badge, location, view count
// Click → navigate to detail page
```

**ListingFilters.jsx** — Sidebar filters for browse page

```jsx
// Props: filters (object), onChange (callback)
// Inputs: make, model, price range, year, location, sort order
// Behavior: onChange triggers re-query with new filters
```

**VerifyBadge.jsx** — Green checkmark for blockchain-verified vehicles

**HistoryTimeline.jsx** — Vertical timeline showing ownership history

```jsx
// Props: vehicleHistory (array of transactions)
// Displays: transaction ID, timestamp, owner, status, truncated txId
```

#### 4. Page Components (Route-mapped, Full-screen)

One-to-one mapping with routes. Often use layout wrapper:

```jsx
// App.jsx
<Route path="/listings" element={<Layout><Browse /></Layout>} />

// Browse.jsx — self-contained logic for /listings
export default function Browse() {
  const [filters, setFilters] = useState({...});
  const { data, isLoading } = useQuery({...});
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <ListingFilters filters={filters} onChange={setFilters} />
      <div>
        {isLoading ? <Spinner /> : listings.map(...)}
      </div>
    </div>
  );
}
```

---

## 11. Pages & Routing

### Route Map

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | Home | Public | Landing page with hero, features |
| `/login` | Login | Public | Login form (redirects to /dashboard if already authenticated) |
| `/register` | Register | Public | Registration form |
| `/listings` | Browse | Public | Marketplace browse with filters |
| `/listings/:vehicleId` | ListingDetail | Public | Single listing detail + history + contact |
| `/dashboard` | Dashboard | Protected | User dashboard (profile, my listings, sales) |
| `/dashboard/sell` | SellVehicle | Protected | Register a new vehicle on blockchain |
| `/dashboard/create-listing/:vehicleId` | CreateListing | Protected | Create marketplace listing for a vehicle |
| `/admin` | AdminPanel | Admin | Admin panel (init ledger, audit logs, users) |
| `*` | NotFound | Public | 404 Not Found |

### ProtectedRoute Component

```jsx
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  // Show spinner while checking session
  if (isLoading) return <Spinner />;
  
  // Redirect to login if not authenticated
  // (state includes 'from' so we can redirect back after login)
  if (!isAuthenticated) 
    return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Admin-only routes
  if (adminOnly && user?.role !== "admin") 
    return <Navigate to="/" replace />;
  
  return children;
}
```

---

## 12. User Workflows

### Workflow 1: Browse & Favorite a Car

```
User (unauthenticated)
  ↓
  Home page → Click "Browse Cars"
  ↓
  /listings (Browse page)
  ↓
  Select filters: make="Toyota", maxPrice=3000000
  ↓
  ListingFilters onChange → state updated → useQuery refetch
  ↓
  Grid of ListingCards rendered
  ↓
  Click a card → navigate to /listings/:vehicleId
  ↓
  ListingDetail page
  ├─ Photo carousel
  ├─ Price, mileage, description
  ├─ Blockchain verification badge + history timeline
  ├─ Seller contact info (masked until authenticated)
  └─ "Contact Seller" / "Message" buttons
```

### Workflow 2: Register & Create First Listing

```
New User
  ↓
  Click "Sign Up" → /register
  ↓
  Register form:
    username, email, password, fullname, governmentId, licenseNumber
  ↓
  Submit → POST /users/register
  ↓
  Toast: "Account created successfully"
  ↓
  Redirect to /login
  ↓
  Submit credentials → POST /users/login
  ↓
  Zustand: setUser() + setToken(accessToken)
  ↓
  Redirect to /dashboard
  ↓
  Dashboard page:
    ├─ Profile card (user info)
    ├─ "Register a Vehicle" button
    └─ My Listings & Sales tabs (empty initially)
  ↓
  Click "Register a Vehicle" → /dashboard/sell
  ↓
  SellVehicle form:
    vehicleId, make, model, year, color, owner
  ↓
  Submit → POST /vehicles (via vehicleApi.register)
  ↓
  Response includes registered vehicle from blockchain
  ↓
  Toast: "Vehicle registered successfully"
  ↓
  Redirect to /dashboard/create-listing/:vehicleId
  ↓
  CreateListing form:
    price, location, mileage, description
  ↓
  Submit → POST /listings
  ↓
  Optional: upload photos → POST /listings/:vehicleId/photos
  ↓
  Listing created, visible in /listings to all users
```

### Workflow 3: Complete a Sale

```
Authenticated Seller (with active listing)
  ↓
  /dashboard → My Listings tab
  ↓
  Click listing card → /listings/:vehicleId (ListingDetail)
  ↓
  Page shows:
    - Photo gallery (editable by seller)
    - Price, location, mileage
    - "Message Buyer" button (if interested party provided contact)
    - "Complete Sale" button (visible to seller only)
  ↓
  Buyer negotiates via platform message / external contact
  ↓
  Click "Complete Sale" → modal opens
  ↓
  Input:
    buyerIdentifier (username or email of registered buyer)
    salePrice (agreed price)
  ↓
  Submit → POST /sales/:vehicleId/complete
  ↓
  Backend:
    1. Resolves buyer from User collection
    2. Transfers ownership on blockchain (to buyer.fullname)
    3. Closes listing (isForSale=false)
    4. Reassigns listing to buyer (for their records)
    5. Creates Sale record with fabricTxId
  ↓
  Frontend receives { sale, fabricTxId }
  ↓
  Toast: "Sale completed! Ownership transferred on blockchain"
  ↓
  Dashboard refreshes:
    - Listing moves to "Sold" status
    - Seller sees it in "My Sales" with txId
    - Buyer now owns the vehicle & listing (can re-list or keep)
```

---

## 13. Form Handling & Validation

### Validation Approach

**Client-side** validation is browser-based (UX improvement):
- Empty field checks
- Email format (basic regex)
- Password requirements (UI shows requirements)

**Server-side** validation is authoritative:
- express-validator on backend
- Detailed error messages returned in API response
- Frontend displays backend errors in toasts

**No dedicated form library** — just React hooks + controlled inputs:

```jsx
function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  const update = (field) => (e) => 
    setForm(f => ({ ...f, [field]: e.target.value }));
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Client-side checks
    if (!form.email.trim()) {
      toast.error("Email required");
      return;
    }
    if (!form.password.trim()) {
      toast.error("Password required");
      return;
    }
    
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      // Server error — use backend message
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        type="email" 
        placeholder="Email" 
        value={form.email}
        onChange={update("email")}
        disabled={loading}
      />
      <Input 
        type="password" 
        placeholder="Password" 
        value={form.password}
        onChange={update("password")}
        disabled={loading}
      />
      <Button disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
```

### Photo Upload Validation

In `ListingDetail.jsx`, file upload with preview:

```javascript
const uploadMutation = useMutation({
  mutationFn: async (formData) => {
    // formData contains File objects
    // Multer on backend validates: type, size, count
    return listingApi.uploadPhotos(vehicleId, formData);
  },
  onSuccess: () => {
    toast.success("Photos uploaded");
    // Refetch listing to show new photos
  },
  onError: (err) => {
    toast.error(err.response?.data?.message || "Upload failed");
  },
});

function handleFileInput(e) {
  const files = e.target.files;
  if (files.length > 5) {
    toast.error("Max 5 photos per upload");
    return;
  }
  
  const formData = new FormData();
  Array.from(files).forEach(f => formData.append("photos", f));
  
  uploadMutation.mutate(formData);
}
```

---

## 14. Error Handling & Toast Notifications

### Toast System

**Library**: `react-hot-toast`

Configured in `main.jsx`:

```jsx
<Toaster 
  position="top-right" 
  toastOptions={{ duration: 3000 }}  // Auto-dismiss after 3s
/>
```

**Usage**:

```javascript
import toast from "react-hot-toast";

toast.success("Listing created!");
toast.error("Something went wrong");
toast.loading("Uploading...");
```

### Error Response Handling

API errors are caught in component try-catch:

```javascript
try {
  await listingApi.create(data);
  toast.success("Listing created");
} catch (err) {
  // Axios error has: err.response.data = { message, statusCode, ... }
  toast.error(err.response?.data?.message || "Failed to create listing");
}
```

### Error Boundary

Catches React rendering errors (not API errors):

```jsx
// ErrorBoundary.jsx (React class component)
export default class ErrorBoundary extends Component {
  state = { error: null };
  
  static getDerivedStateFromError(error) {
    return { error };
  }
  
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 15. Styling & Design System

### Tailwind CSS

**Config**: `tailwind.config.js`

#### Brand Color Palette

```javascript
colors: {
  brand: {
    50: "#eff6ff",    // Lightest
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",   // Primary (buttons, links, active states)
    700: "#1d4ed8",   // Darker
    800: "#1e40af",
    900: "#1e3a8a",   // Darkest
  }
}
```

**Usage**:
- Buttons: `bg-brand-600 hover:bg-brand-700`
- Links: `text-brand-600 hover:text-brand-700`
- Badges: `bg-brand-100 text-brand-700`

#### Custom Shadows

```javascript
boxShadow: {
  card: "0 1px 3px 0 rgb(0 0 0 / .08), ...",     // Subtle
  "card-hover": "0 4px 12px 0 rgb(0 0 0 / .10)", // Hover effect
  "card-lg": "0 10px 30px -5px rgb(0 0 0 / .12)", // Large/prominent
}
```

#### Animations

```javascript
animation: {
  "fade-in": "fadeIn 0.2s ease-out",
  "slide-down": "slideDown 0.2s ease-out",
}
```

### CSS Classes & Naming

**Utility classes** used extensively:

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Responsive padding: 1rem on mobile, 1.5rem on sm+, 2rem on lg+ */}
</div>

<button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
  Click me
</button>

{/* Responsive grid: 1 col on mobile, 2 on sm, 3 on lg */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Dark Mode (Optional Future Enhancement)

Currently not implemented. Tailwind supports dark mode via:

```javascript
// tailwind.config.js
darkMode: "class",  // Adds dark: prefix support
```

---

## 16. Performance Optimization

### React Query Caching

**Configuration** in `main.jsx`:

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                 // Retry once on failure
      staleTime: 30_000,        // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000,    // Keep in cache for 5 min
    },
  },
});
```

**Stale vs. Fresh**:
- **Stale** data is still shown but will refetch in background if data is accessed again
- **gcTime** (garbage collection time) — how long to keep in memory after last usage

### Query Key Patterns

Consistent naming for caching:

```javascript
// Single item
useQuery({
  queryKey: ["listing", vehicleId],  // Unique per vehicle
  queryFn: () => listingApi.getById(vehicleId),
});

// List with filters
useQuery({
  queryKey: ["listings", filters],   // Changes when filters change
  queryFn: () => listingApi.getAll(filters),
  placeholderData: (prev) => prev,   // Keep old data while fetching new
});
```

### Code Splitting

Vite automatically code-splits per route. Each lazy-loaded page is a separate chunk:

```javascript
// Automatic in Vite (no special syntax needed)
// import Browse from "../pages/Browse.jsx"  // ~40KB chunk
// When user navigates to /listings, chunk is fetched
```

### Image Optimization

Photos are hosted on **Cloudinary**, not local:
- Images are served from CDN
- Automatic format conversion (WebP for modern browsers)
- Responsive sizing via Cloudinary URL parameters (optional future enhancement)

```jsx
<img 
  src="https://res.cloudinary.com/dxxxxx/image/upload/w_400/..." 
  alt="Vehicle photo"
/>
```

### Memoization

Use `memo` for expensive pure components:

```javascript
// Prevent re-render if props unchanged
const ListingCard = memo(function({ listing }) {
  return <div>{listing.price}</div>;
});
```

---

## 17. Development Guidelines

### Adding a New Page

1. Create page component in `src/pages/PageName.jsx`
2. Add route in `App.jsx`
3. Link from navbar or other pages

**Example**: Add `/profile` page

```jsx
// src/pages/Profile.jsx
import { useAuthStore } from "../store/auth.store";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/layout/ProtectedRoute";

export default function Profile() {
  const { user } = useAuthStore();
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p><strong>Name:</strong> {user?.fullname}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Government ID:</strong> {user?.governmentId}</p>
        </div>
      </div>
    </Layout>
  );
}

// App.jsx
<Route path="/profile" element={
  <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
} />

// Navbar.jsx
<NavLink to="/profile">Profile</NavLink>
```

### Adding a New API Module

1. Create `src/api/feature.api.js`
2. Export object with all endpoints
3. Import in components and use with React Query

**Example**: Add `/api/favorites.api.js`

```javascript
import api from "./axios";

export const favoriteApi = {
  getMyFavorites: (params) => api.get("/favorites", { params }),
  addFavorite: (vehicleId) => api.post("/favorites", { vehicleId }),
  removeFavorite: (vehicleId) => api.delete(`/favorites/${vehicleId}`),
};

// Usage in component
const { data: favorites } = useQuery({
  queryKey: ["favorites"],
  queryFn: () => favoriteApi.getMyFavorites().then(r => r.data.data),
});

const addMutation = useMutation({
  mutationFn: (vehicleId) => favoriteApi.addFavorite(vehicleId),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["favorites"] });
    toast.success("Added to favorites");
  },
});
```

### Testing in Development

```bash
# Start dev server
npm run dev

# In browser DevTools:
# - React Query DevTools: chrome.google.com/webstore (TanStack Query DevTools)
# - Network tab: inspect API calls
# - Application tab: check localStorage (if we start using it)

# Mock API responses (optional: MSW library)
# npm install --save-dev msw
# Setup mock server in src/mocks/handlers.js
```

---

## 18. Browser Support

### Supported Browsers

| Browser | Min Version | Notes |
|---------|-------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support (iOS 14+) |
| Edge | 90+ | Full support |

### Polyfills

None needed — Vite targets modern browsers (ES 2020+).

For older browser support, add `@vitejs/plugin-legacy`:

```javascript
// vite.config.js
import legacy from '@vitejs/plugin-legacy';

export default {
  plugins: [
    react(),
    legacy({ targets: ['defaults', 'not IE 11'] })
  ]
}
```

---

## 19. Security Considerations

### XSS Prevention

- **No `dangerouslySetInnerHTML`** — all content escaped by React
- **No inline event handlers** — use onClick props
- **Sanitize user input** — treat all inputs as untrusted

### CSRF Prevention

- Backend sets SameSite cookies
- Axios sends requests with credentials (httpOnly cookies auto-included)
- No explicit CSRF token needed (browser + Secure + SameSite sufficient)

### Token Security

- **Access token in memory only** — never localStorage (vulnerable to XSS)
- **Refresh token in httpOnly cookie** — inaccessible to JavaScript
- **Token never in URL** — always in Authorization header

### Content Security Policy (Optional, Production)

Set in backend response headers:

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https://res.cloudinary.com;
```

### API Key Exposure

- **No API keys in frontend code** — all Cloudinary uploads go through backend
- **All sensitive operations happen on backend** — blockchain, payment, etc.
- **.env file in .gitignore** — never commit secrets

---

## 20. Production Build & Deployment

### Build Optimization

```bash
npm run build
# Output: dist/ folder (optimized, minified)
# Size: ~150-200KB gzipped
```

**Build Output**:

```
dist/
├── index.html                 # Entry point
├── assets/
│   ├── index-abc123.js       # Main bundle (hashed for cache-busting)
│   ├── Home-def456.js        # Route chunks
│   ├── Browse-ghi789.js
│   └── style-jkl012.css      # Minified CSS
└── favicon.svg
```

### Deployment Options

#### Option 1: Static Host (Vercel, Netlify, S3)

```bash
# Vercel
npm install -g vercel
vercel

# Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t carchain-frontend .
docker run -p 80:80 carchain-frontend
```

#### Option 3: Traditional Server (Node + Express)

```javascript
// server.js
const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "dist")));

// SPA: all routes fall back to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Environment Setup for Production

**.env.production**:

```
VITE_API_URL=https://api.carchain.example.com/api/v1
```

Load with:

```bash
npm run build -- --mode production
```

### Pre-Deployment Checklist

- [ ] `npm run lint` — no ESLint errors
- [ ] `npm run build` — successful build, no warnings
- [ ] Test in production build locally: `npm run preview`
- [ ] All API endpoints point to production backend
- [ ] VITE_API_URL uses HTTPS (secure)
- [ ] Error boundary in place
- [ ] Favicon set
- [ ] Metadata (title, description) updated
- [ ] Analytics/monitoring configured
- [ ] Security headers set in backend
- [ ] CORS configured for production domain

---

## Appendix: Key Imports & Exports

### Component Imports Pattern

```javascript
// Page
import Browse from "../pages/Browse.jsx";

// Layout
import Layout from "../components/layout/Layout.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";

// UI
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";

// APIs
import { listingApi } from "../api/listing.api.js";

// Utilities
import { formatPrice } from "../utils/formatters.js";
import { getToken, setToken } from "../utils/token.js";

// State
import useAuthStore from "../store/auth.store.js";

// Libraries
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Car, ChevronLeft, Search } from "lucide-react";
```

### Zustand Store Usage

```javascript
const { user, isAuthenticated, isLoading, login, logout, checkSession } = useAuthStore();
```

### React Query Usage

```javascript
// Query (read)
const { data, isLoading, error } = useQuery({
  queryKey: ["resource", id],
  queryFn: () => api.getById(id),
});

// Mutation (write)
const { mutate, mutateAsync, isPending } = useMutation({
  mutationFn: (data) => api.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resources"] }),
  onError: (error) => toast.error(error.message),
});
```

---

This comprehensive README provides everything needed to understand, develop, and deploy the CarChain frontend. For development questions, refer to the specific section; for production deployment, follow section 20.
