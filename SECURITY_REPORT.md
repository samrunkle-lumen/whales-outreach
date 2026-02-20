# Security and Usability Audit Report
## Whales Outreach - Comprehensive Scan Results

**Date:** February 19, 2026
**Status:** Issues Identified and Partially Fixed

---

## ✅ FIXES APPLIED

### 1. **Fixed: Google Maps API Duplicate Loading**
- **Issue:** Google Maps API was being loaded multiple times causing console errors
- **Fix:** Created centralized script loader in `/src/lib/googleMaps.ts`
- **Files Updated:**
  - `/src/lib/googleMaps.ts` (new file)
  - `/src/components/SatelliteView.tsx`

### 2. **Fixed: Exposed API Keys**
- **Issue:** Google Maps API key was hardcoded in client-side code
- **Fix:** Moved to environment variables
- **Files Updated:**
  - `/src/components/SatelliteView.tsx`
  - `/src/components/PropertyPDFExport.tsx`
  - Created `.env.local` and `.env.local.example`
  - Added `.env*.local` to `.gitignore`
- **Action Required:** Restrict API key in Google Cloud Console to your domain

### 3. **Fixed: Missing Security Headers**
- **Issue:** No security headers configured
- **Fix:** Added comprehensive security headers in `next.config.ts`
- **Headers Added:**
  - `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
  - `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
  - `X-XSS-Protection: 1; mode=block` - XSS protection
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` - Restricts camera, microphone, geolocation

---

## ⚠️ CRITICAL ISSUES - REQUIRES IMMEDIATE ACTION

### 1. **Plaintext Password in Client Code**
**File:** `/src/components/PasswordGate.tsx:16`
```typescript
const CORRECT_PASSWORD = "Wh4L3$";
```
**Risk:** Password visible in browser source code. Anyone can view this.
**Recommendation:**
- ❌ **DO NOT** use client-side password authentication in production
- ✅ Implement proper backend authentication (OAuth, JWT, NextAuth.js)
- ✅ Use secure session management with httpOnly cookies
- ✅ Add user management system

**Quick Fix for Now:**
```typescript
// In .env.local (never commit)
AUTH_PASSWORD_HASH=bcrypt_hashed_password_here

// In PasswordGate.tsx - validate on backend API route
const response = await fetch('/api/auth/verify', {
  method: 'POST',
  body: JSON.stringify({ password })
});
```

### 2. **XSS Vulnerability - innerHTML Usage**
**Files:**
- `/src/components/PDFDownloadButton.tsx:33`
- `/src/components/PropertyPDFExport.tsx:37`

**Issue:** Using `innerHTML` with template literals containing user data
```typescript
content.innerHTML = `
  <h1>${building.address}</h1>  // Potential XSS
  <p>${broker.fullName}</p>     // Potential XSS
`;
```

**Risk:** If address or names contain `<script>alert('XSS')</script>`, it will execute.

**Recommendation:**
```typescript
// Option 1: Use textContent for text-only
const h1 = document.createElement('h1');
h1.textContent = building.address; // Safe - no HTML parsing

// Option 2: Sanitize with DOMPurify
import DOMPurify from 'isomorphic-dompurify';
content.innerHTML = DOMPurify.sanitize(`
  <h1>${building.address}</h1>
`);

// Option 3: Escape HTML manually
function escapeHTML(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 3. **SSRF Vulnerability in API Routes**
**File:** `/src/app/api/scrape-brokers/route.ts:227-240`

**Issue:** No validation of URLs before making external requests
```typescript
async function searchPropertyUrls(baseUrl: string, markets: string[]) {
  urls.push(baseUrl); // No validation!
  const response = await fetch(baseUrl);
}
```

**Risk:** Attacker could provide `http://localhost:6379/` or internal AWS metadata endpoint.

**Recommendation:**
```typescript
import { URL } from 'url';

function validateExternalURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    // Block internal IPs
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]'
    ) {
      return false;
    }

    // Whitelist approach (recommended)
    const allowedDomains = ['loopnet.com', 'crexi.com'];
    return allowedDomains.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

// Use it
if (!validateExternalURL(baseUrl)) {
  throw new Error('Invalid URL');
}
```

---

## ⚠️ HIGH PRIORITY - ADDRESS SOON

### 4. **Missing Rate Limiting on API Routes**
**Files:** `/src/app/api/search-address/route.ts`, `/src/app/api/scrape-brokers/route.ts`

**Risk:** API abuse, high Firecrawl costs

**Recommendation:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

### 5. **Missing Timeout on External API Calls**
**File:** `/src/app/api/scrape-brokers/route.ts:177-206`

**Recommendation:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { ... }
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw error;
} finally {
  clearTimeout(timeout);
}
```

### 6. **Missing Input Validation**
**File:** `/src/app/api/search-address/route.ts:232-240`

**Recommendation:**
```typescript
import { z } from 'zod';

const addressSchema = z.object({
  address: z.string()
    .min(5, 'Address too short')
    .max(200, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Invalid characters in address'),
});

export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  const result = addressSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors },
      { status: 400 }
    );
  }

  const { address } = result.data;
  // ... rest of handler
}
```

---

## 📋 MEDIUM PRIORITY

### 7. **ReDoS Vulnerability**
**File:** `/src/app/api/search-address/route.ts:134-172`

**Recommendation:**
- Add length limits to markdown content (max 50KB)
- Use simpler regex patterns or parsing libraries
- Set timeout on regex operations

### 8. **Missing Error Boundaries**
**Recommendation:**
Create error boundaries for React components:

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // Log to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600">Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 9. **Missing Accessibility Attributes**
**Files:** Multiple components

**Checklist:**
- [ ] Add `aria-label` to all SVG icons
- [ ] Use semantic HTML (`<button>` instead of `<div onClick>`)
- [ ] Add `alt` text to all images
- [ ] Add `role="dialog"` to modals
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (NVDA, VoiceOver)

---

## 📝 LOW PRIORITY (Usability)

### 10. **Missing Loading States**
Add skeleton screens while data loads:

```typescript
// Example: OwnerList component
{isLoading ? (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="animate-pulse bg-gray-200 h-24 rounded" />
    ))}
  </div>
) : (
  <OwnerList owners={owners} />
)}
```

### 11. **Missing Toast Notifications**
Add success/error feedback:

```bash
npm install sonner
```

```typescript
import { toast } from 'sonner';

// On success
toast.success('Property added successfully!');

// On error
toast.error('Failed to add property. Please try again.');
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] **Remove hardcoded password from PasswordGate.tsx**
- [ ] **Fix XSS vulnerabilities (replace innerHTML)**
- [ ] **Add SSRF protection to API routes**
- [ ] **Implement rate limiting**
- [ ] **Add request timeouts**
- [ ] **Add input validation with Zod**
- [ ] **Restrict Google Maps API key to your domain**
- [ ] **Add CSP header (optional but recommended)**
- [ ] **Set up error tracking (Sentry, LogRocket)**
- [ ] **Add monitoring (Vercel Analytics, New Relic)**
- [ ] **Test with security scanner (OWASP ZAP, Burp Suite)**

---

## 📚 RECOMMENDED PACKAGES

```bash
# Security
npm install zod                    # Input validation
npm install isomorphic-dompurify   # XSS prevention
npm install @upstash/ratelimit     # Rate limiting

# Authentication
npm install next-auth              # OAuth/JWT auth
npm install bcryptjs @types/bcryptjs  # Password hashing

# Monitoring
npm install @sentry/nextjs         # Error tracking
npm install @vercel/analytics      # Analytics

# UX
npm install sonner                 # Toast notifications
npm install react-loading-skeleton # Loading states
```

---

## 🔧 GOOGLE CLOUD CONSOLE SETUP

**IMPORTANT:** Restrict your Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Click on your API key
4. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add your domains:
     - `https://yourdomain.com/*`
     - `https://*.vercel.app/*` (for preview deployments)
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable only:
     - Maps JavaScript API
     - Maps Static API
     - Geocoding API
6. Click "Save"

---

## 📊 SEVERITY SUMMARY

| Priority | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | 3 | Plaintext password, XSS, SSRF |
| 🟠 High | 6 | Rate limiting, timeouts, input validation, CSP, security headers |
| 🟡 Medium | 5 | ReDoS, error boundaries, accessibility, error handling, image validation |
| 🟢 Low | 4 | Loading states, toast notifications, mobile responsiveness, form validation |

**Total Issues: 18**
**Fixed: 3**
**Remaining: 15**

---

## 💡 NEXT STEPS

1. **Today:** Test the fixes applied (Google Maps, API keys, security headers)
2. **This Week:** Fix critical issues (password, XSS, SSRF)
3. **Next Week:** Add rate limiting, timeouts, input validation
4. **This Month:** Improve UX (loading states, error handling, accessibility)

---

## 📞 SUPPORT

If you need help implementing any of these fixes:
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Web Security Academy: https://portswigger.net/web-security

---

**Generated:** February 19, 2026
**Scan Tool:** Claude Code Agent with Explore subagent
**Agent ID:** ad37795
