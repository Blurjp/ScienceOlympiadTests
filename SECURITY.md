# Security Documentation

This document outlines the security measures implemented in the Science Olympiad Tests application.

## Security Fixes Implemented

### ✅ Critical Security Issues (ALL FIXED)

#### 1. SSRF (Server-Side Request Forgery) Protection
**Location:** `lib/security.ts`, `app/api/download-pdf/route.ts`

**Vulnerability:** The download-pdf endpoint accepted arbitrary URLs without validation, allowing potential attacks on internal services.

**Fix:**
- Implemented `validateSafeUrl()` function that:
  - Only allows HTTPS protocol
  - Blocks private IP ranges (127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x)
  - Blocks IPv6 loopback and link-local addresses
  - Blocks cloud metadata endpoints (169.254.169.254)
  - Performs DNS resolution to prevent DNS rebinding attacks
  - Validates against blocked hostnames (localhost, metadata endpoints)

**Impact:** Prevents attackers from accessing internal services, cloud metadata, or scanning internal networks.

---

#### 2. Authentication & Authorization
**Location:** `lib/auth.ts`, `lib/auth-helpers.ts`, `app/api/auth/`

**Vulnerability:** No authentication system - anyone could create, modify, or delete tests.

**Fix:**
- Implemented NextAuth.js with credentials provider
- Added secure password hashing with bcrypt (12 rounds)
- Created user management system with SQLite database
- Implemented JWT-based sessions
- Added authentication middleware (`requireAuth()`, `requireAdmin()`)
- Protected all state-changing operations (POST, DELETE) with authentication
- Created user registration endpoint with validation

**Protected Endpoints:**
- `/api/save-test` - Requires authentication
- `/api/tests/[id]` (DELETE) - Requires authentication
- `/api/generate-test` - Requires authentication
- `/api/download-pdf` - Requires authentication
- `/api/parse-pdf` - Requires authentication

**User Model:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

#### 3. Rate Limiting
**Location:** `lib/security.ts`, all API routes

**Vulnerability:** No rate limiting allowed potential DoS attacks and resource exhaustion.

**Fix:**
Implemented in-memory rate limiting with configurable limits per endpoint:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/parse-pdf` | 10 requests | 1 minute |
| `/api/download-pdf` | 5 requests | 1 minute |
| `/api/save-test` | 20 requests | 1 minute |
| `/api/generate-test` | 15 requests | 1 minute |
| `/api/tests` (GET) | 30 requests | 1 minute |
| `/api/tests/[id]` (GET) | 30 requests | 1 minute |
| `/api/tests/[id]` (DELETE) | 10 requests | 1 minute |
| `/api/auth/register` | 5 requests | 1 hour |

**Features:**
- Per-IP tracking using `getClientIp()` function
- Handles X-Forwarded-For and X-Real-IP headers
- Returns 429 status with rate limit headers
- Automatic cleanup of old entries

**Response Headers:**
```
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <ISO timestamp>
```

**Note:** For production, consider migrating to Redis for distributed rate limiting.

---

#### 4. CSRF (Cross-Site Request Forgery) Protection
**Location:** `lib/security.ts`, all POST/DELETE routes

**Vulnerability:** State-changing operations lacked CSRF protection.

**Fix:**
- Implemented `validateCsrf()` function that validates request origin
- Checks Origin and Referer headers
- Verifies they match the Host header
- Returns 403 Forbidden on mismatch
- Applied to all state-changing operations

**How it works:**
```typescript
const csrfValidation = validateCsrf(request);
if (!csrfValidation.isValid) {
  return NextResponse.json(
    { error: 'Invalid request origin' },
    { status: 403 }
  );
}
```

---

#### 5. Information Disclosure Prevention
**Location:** `lib/security.ts`, all API routes

**Vulnerability:** Detailed error messages exposed internal system details to users.

**Fix:**
- Implemented `sanitizeError()` function
- Logs detailed errors server-side for debugging
- Returns generic error messages to clients
- Prevents stack trace leakage
- Removes internal implementation details from responses

**Before:**
```json
{
  "error": "Database error",
  "details": "SQLITE_ERROR: no such column: test_id"
}
```

**After:**
```json
{
  "error": "Failed to fetch tests from database"
}
```

---

## Additional Security Measures

### Input Validation

#### Registration Endpoint
- Email format validation (regex)
- Password minimum length (8 characters)
- Required fields validation
- Duplicate email detection

#### File Upload
- File type validation (PDF only)
- File size limits (10MB for uploads, 50MB for downloads)
- Buffer size checks before processing

#### URL Validation
- URL format validation
- Protocol restriction (HTTPS only)
- Timeout for fetch requests (30 seconds)

---

### Cryptographic Security

#### Password Hashing
- **Algorithm:** bcrypt
- **Cost Factor:** 12 rounds
- **Salt:** Automatically generated per password

#### Session Security
- **Strategy:** JWT (JSON Web Tokens)
- **Secret:** Environment variable `NEXTAUTH_SECRET`
- **Storage:** HTTP-only cookies (configured by NextAuth)

---

### Database Security

#### SQL Injection Prevention
- All queries use parameterized statements
- No dynamic SQL concatenation
- Input sanitization before database operations

#### Schema Constraints
- Foreign key constraints with CASCADE delete
- CHECK constraints for enums
- UNIQUE constraints on email
- NOT NULL constraints on critical fields

---

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Application Settings
NODE_ENV=development
```

**Security Notes:**
- `.env.local` is gitignored
- Never commit secrets to version control
- Rotate `NEXTAUTH_SECRET` regularly in production
- Use different secrets for each environment

---

## Security Best Practices Implemented

### ✅ OWASP Top 10 (2021) Coverage

1. **A01:2021 – Broken Access Control**
   - ✅ Authentication required for sensitive operations
   - ✅ Authorization checks implemented
   - ✅ Role-based access control (admin/user)

2. **A02:2021 – Cryptographic Failures**
   - ✅ Bcrypt for password hashing
   - ✅ HTTPS-only URL validation
   - ✅ Secure session management

3. **A03:2021 – Injection**
   - ✅ Parameterized SQL queries
   - ✅ Input validation
   - ✅ No eval() or dangerous functions

4. **A04:2021 – Insecure Design**
   - ✅ Rate limiting to prevent abuse
   - ✅ CSRF protection
   - ✅ Defense in depth approach

5. **A05:2021 – Security Misconfiguration**
   - ✅ Environment variables for secrets
   - ✅ Proper error handling
   - ✅ Security headers (via Next.js defaults)

6. **A07:2021 – Identification and Authentication Failures**
   - ✅ Strong password requirements
   - ✅ Secure session management
   - ✅ Protection against brute force (rate limiting)

7. **A10:2021 – Server-Side Request Forgery (SSRF)**
   - ✅ URL validation and sanitization
   - ✅ Private IP blocking
   - ✅ DNS resolution validation

---

## Known Limitations & Future Improvements

### Current Limitations

1. **In-Memory Rate Limiting**
   - Not suitable for multi-instance deployments
   - Data lost on server restart
   - **Recommendation:** Migrate to Redis

2. **No Account Lockout**
   - Unlimited login attempts (rate limited but not blocked)
   - **Recommendation:** Implement account lockout after N failed attempts

3. **No Email Verification**
   - Users can register with any email
   - **Recommendation:** Add email verification flow

4. **No Password Reset**
   - No way to recover forgotten passwords
   - **Recommendation:** Implement secure password reset flow

5. **No 2FA (Two-Factor Authentication)**
   - **Recommendation:** Add TOTP-based 2FA

6. **No Session Revocation**
   - No way to invalidate specific sessions
   - **Recommendation:** Implement session management

### Planned Improvements

- [ ] Add Content Security Policy (CSP) headers
- [ ] Implement Subresource Integrity (SRI) for CDN resources
- [ ] Add security headers middleware (Helmet.js equivalent)
- [ ] Implement audit logging for sensitive operations
- [ ] Add anomaly detection for suspicious behavior
- [ ] Implement IP allowlist/blocklist
- [ ] Add honeypot fields to registration
- [ ] Implement CAPTCHA for registration
- [ ] Add session timeout and idle detection
- [ ] Implement secure password reset with time-limited tokens

---

## Security Headers

Next.js provides default security headers. Consider adding custom headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

---

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

**Do NOT:**
- Open public GitHub issues for security vulnerabilities
- Share vulnerabilities publicly before they are fixed

**DO:**
- Provide detailed reproduction steps
- Include the affected version
- Suggest a fix if possible

---

## Security Audit Checklist

- [x] SSRF protection implemented
- [x] Authentication system implemented
- [x] Authorization checks on all routes
- [x] Rate limiting on all endpoints
- [x] CSRF protection implemented
- [x] Error messages sanitized
- [x] Input validation implemented
- [x] SQL injection prevention (parameterized queries)
- [x] Password hashing with bcrypt
- [x] Session management with JWT
- [x] Environment variables for secrets
- [ ] Security headers configured (partial)
- [ ] HTTPS enforced in production
- [ ] Regular dependency updates
- [ ] Security testing (penetration testing)
- [ ] Code review process

---

## Compliance Notes

### GDPR Considerations
- User data stored in local SQLite database
- Email and name collected during registration
- No data sharing with third parties
- **TODO:** Add privacy policy
- **TODO:** Add data export functionality
- **TODO:** Add account deletion functionality

### Data Retention
- User accounts: Indefinite (until manually deleted)
- Test results: Indefinite
- Logs: Not currently persisted
- **TODO:** Implement data retention policies

---

## Maintenance

### Regular Security Tasks

**Weekly:**
- Review server logs for suspicious activity
- Check for failed authentication attempts

**Monthly:**
- Update dependencies (`npm audit`)
- Review and rotate API keys/secrets
- Check for security advisories

**Quarterly:**
- Security audit
- Penetration testing
- Review and update security policies

---

## Version History

### v1.1.0 (2025-11-09)
- ✅ Fixed SSRF vulnerability
- ✅ Implemented authentication & authorization
- ✅ Added rate limiting
- ✅ Implemented CSRF protection
- ✅ Sanitized error messages
- ✅ Added input validation

### v1.0.0 (Initial)
- ❌ No security measures
- ❌ Critical vulnerabilities present

---

**Last Updated:** 2025-11-09
**Maintained By:** Development Team
