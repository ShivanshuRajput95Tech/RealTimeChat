# DEPLOYMENT CHECKLIST - 2026 BEST PRACTICES

**Status**: Ready for Implementation
**Estimated Setup Time**: 30-45 minutes
**Testing Time**: 2-4 hours
**Deployment Time**: < 15 minutes

---

## Pre-Integration Checklist

### Environment & Dependencies
- [ ] Node.js 20+ LTS installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Current dependencies installed (`npm install`)
- [ ] No critical npm audit warnings (`npm audit`)

### Code Review
- [ ] schemas.js reviewed for field definitions ✅
- [ ] security.js reviewed for config options ✅
- [ ] errorHandler.js reviewed for error classes ✅
- [ ] asyncUtils.js reviewed for patterns ✅
- [ ] logger.js reviewed for logging methods ✅

### Documentation
- [ ] INTEGRATION_GUIDE_2026.md read ✅
- [ ] SESSION_SUMMARY_2026.md reviewed ✅
- [ ] All inline code comments understood ✅

---

## Installation Phase (5-10 minutes)

### Step 1: Install Dependencies
```bash
npm install zod bcryptjs jsonwebtoken helmet cors express-rate-limit pino pino-pretty
```

**Expected Output**:
```
added 42 packages, audited 185 packages
found 0 vulnerabilities
```

- [ ] All 7 packages installed successfully
- [ ] No peer dependency warnings
- [ ] `package.json` updated with versions

### Step 2: Verify Installation
```bash
npm ls zod bcryptjs jsonwebtoken helmet cors express-rate-limit pino
```

All should show installed versions (e.g., zod@3.23.8)

- [ ] All packages listed with versions
- [ ] No broken/missing dependencies

---

## Integration Phase (20-30 minutes)

### Step 3: Update Environment Variables
Create/update `.env` file with:

```bash
# Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=another-secret-key-minimum-32-characters-long

# Logging
LOG_LEVEL=debug    # change to 'warn' in production
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:5173  # change to your domain

# Database
MONGODB_URI=mongodb://localhost:27017/quickchat

# Redis (optional, for Phase 2)
REDIS_URL=redis://localhost:6379

# Cloudinary (if using image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

- [ ] `.env` file created or updated
- [ ] All required secrets configured
- [ ] JWT secrets are > 32 characters
- [ ] No secrets committed to git

### Step 4: Update server.js

**Add imports** (top of file):
```javascript
import helmet from 'helmet';
import cors from 'cors';
import logger, { createHttpLogger } from './lib/logger.js';
import { errorHandler } from './lib/errorHandler.js';
import { getHelmetConfig, getCorsConfig } from './lib/security.js';
```

**Add middleware** (after `app = express()`):
```javascript
// Request ID tracking
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random()}`;
  next();
});

// Security
app.use(helmet(getHelmetConfig()));
app.use(cors(getCorsConfig()));

// Logging
app.use(createHttpLogger());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Add at the end** (MUST be last middleware):
```javascript
// Global error handler
app.use(errorHandler);
```

- [ ] All imports added
- [ ] Security middleware enabled
- [ ] HTTP logging middleware added
- [ ] Global error handler configured (last position)
- [ ] server.js syntax valid (`node --check server.js`)

### Step 5: Update Auth Routes

Replace manual validation with schemas:

**Before**:
```javascript
router.post('/signup', async (req, res) => {
  try {
    if (!req.body.email) return res.status(400).json({ message: '...' });
    // ... more manual checks ...
  }
});
```

**After**:
```javascript
import { validateBody, signupSchema } from '../lib/schemas.js';
import { asyncHandler, ConflictError } from '../lib/errorHandler.js';
import { password, jwt_tokens } from '../lib/security.js';

router.post('/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password: plainPassword, fullName } = req.validatedData;
    
    const hashedPassword = await password.hash(plainPassword);
    const user = await User.create({ email, password: hashedPassword, fullName });
    
    const accessToken = jwt_tokens.createAccessToken({ userId: user._id }, '15m');
    res.status(201).json({ success: true, user, accessToken });
  })
);
```

- [ ] Use validateBody(signupSchema) middleware
- [ ] Use asyncHandler wrapper
- [ ] Use password.hash() for hashing
- [ ] Use jwt_tokens.createAccessToken()
- [ ] Return consistent response format

### Step 6: Update All Routes

For each message/user route:

1. **Replace validation**:
   ```javascript
   import { validateBody, validateQuery } from '../lib/schemas.js';
   
   router.get('/messages/:id',
     validateQuery(cursorPaginationSchema),
     asyncHandler(async (req, res) => { ... })
   );
   ```

2. **Replace manual auth checks**:
   ```javascript
   if (!req.userId) {
     throw new AuthenticationError('Login required');
   }
   ```

3. **Replace error handling**:
   ```javascript
   // Remove try-catch, asyncHandler catches all errors
   const message = await Message.create({ ... });
   res.json({ success: true, data: message });
   ```

4. **Add logging**:
   ```javascript
   import logger from '../lib/logger.js';
   
   logger.info('Message sent', {
     messageId: message._id,
     senderId: req.userId
   });
   ```

- [ ] All routes updated with new pattern
- [ ] No manual validation checks remain
- [ ] All routes wrapped with asyncHandler
- [ ] No manual try-catch blocks (errorHandler catches all)
- [ ] Key operations logged with logger

---

## Testing Phase (2-4 hours)

### Step 7: Unit Tests

**Test validation**:
```javascript
import { signupSchema } from '../lib/schemas.js';

test('signup schema validates correct data', () => {
  const result = signupSchema.safeParse({
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Test User'
  });
  expect(result.success).toBe(true);
});

test('signup schema rejects invalid email', () => {
  const result = signupSchema.safeParse({
    email: 'invalid',
    password: 'password123',
    fullName: 'Test User'
  });
  expect(result.success).toBe(false);
});
```

- [ ] Validation tests passing
- [ ] Error handling tests passing
- [ ] Security tests passing (JWT, bcrypt)
- [ ] Logger tests passing

### Step 8: Integration Tests

**Test error responses**:
```bash
# Should return 400 with validation error
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'

# Expected: { success: false, message: "Invalid email", code: "VALIDATION_ERROR" }
```

- [ ] Validation errors return 400
- [ ] Auth errors return 401
- [ ] Missing resources return 404
- [ ] Success responses return 2xx

**Test security headers**:
```bash
curl -I http://localhost:5000/health | grep -i "x-content-type-options"
```

Should see security headers like:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: deny`
- `Strict-Transport-Security: ...`

- [ ] Helmet security headers present
- [ ] CORS headers configured
- [ ] Content-Security-Policy set

**Test logging format**:
```bash
npm start 2>&1 | head -20
```

Should show JSON logs like:
```json
{"timestamp":"2025-01-01T12:00:00Z","level":"INFO","message":"Server started","port":5000}
```

- [ ] Logs are valid JSON
- [ ] All required fields present
- [ ] Timestamps are ISO format

### Step 9: Manual API Testing

**Test signup**:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "fullName": "Test User"
  },
  "accessToken": "eyJhbGc..."
}
```

- [ ] Signup returns accessToken
- [ ] Password is hashed (not returned)
- [ ] Response includes user data

**Test error cases**:
```bash
# Missing required field
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Expected: { success: false, message: "...", code: "VALIDATION_ERROR" }
```

- [ ] Validation errors are clear
- [ ] Error messages help consumers
- [ ] All error codes documented

**Test JWT tokens**:
```bash
# Use token to authorize request
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer eyJhbGc..."

# Should:
# - Return 200 with user data if token valid
# - Return 401 if token missing
# - Return 401 if token expired
```

- [ ] Valid tokens accepted
- [ ] Invalid tokens rejected
- [ ] Expired tokens return 401

### Step 10: Load Testing

**Test batch operations** (from asyncUtils.js):
```javascript
// In test file
import { batchProcess } from '../lib/asyncUtils.js';

test('batchProcess handles 1000 items', async () => {
  const ids = Array.from({ length: 1000 }, (_, i) => i);
  const timer = logger.startTimer();
  
  await batchProcess(ids, 100, async (batch) => {
    await Message.updateMany({ _id: { $in: batch } }, { seen: true });
  });
  
  logger.logPerformance('Mark 1000 messages', timer, 500);
  // Should complete in < 500ms (was ~5-10 sec)
});
```

- [ ] Batch operations complete in expected time
- [ ] No timeout errors
- [ ] Database can handle batch updates

---

## Deployment Phase (< 15 minutes)

### Step 11: Pre-Deployment Verification

```bash
# Run in order
npm run build          # Build frontend
npm run test          # Run all tests
npm audit            # Security check
node --check server/server.js  # Syntax validation
```

- [ ] Build completes without errors
- [ ] All tests pass
- [ ] npm audit shows no critical issues
- [ ] No syntax errors

### Step 12: Environment Configuration

For **production** deployment:

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
JWT_SECRET=(use strong secret from password manager)
JWT_REFRESH_SECRET=(use strong secret from password manager)
CLIENT_URL=https://yourdomain.com
MONGODB_URI=(production MongoDB connection)
REDIS_URL=(production Redis connection - optional)
```

- [ ] Production JWT secrets generated (> 32 chars)
- [ ] Database credentials configured
- [ ] LOG_LEVEL set to warn (not debug)
- [ ] CLIENT_URL set to production domain
- [ ] CORS whitelist configured for domain

### Step 13: Deploy

**Option A: Vercel** (built-in support):
```bash
vercel --prod
```

- [ ] Connected to GitHub repository
- [ ] Environment variables configured in Vercel dashboard
- [ ] Deployment completes successfully
- [ ] Health check passes

**Option B: Docker**:
```bash
docker build -t quickchat .
docker run -p 5000:5000 --env-file .env.production quickchat
```

- [ ] Image builds successfully
- [ ] Container starts without errors
- [ ] API responds to requests
- [ ] Logs are properly formatted

**Option C: Traditional Server**:
```bash
npm install --production
npm start
```

- [ ] Dependencies installed
- [ ] Server starts on correct port
- [ ] All endpoints accessible
- [ ] Logs show no errors

### Step 14: Post-Deployment Verification

```bash
# Test production endpoint
curl https://yourdomain.com/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# Check security headers
curl -I https://yourdomain.com/api/health | grep -i "x-content"
# Should see: X-Content-Type-Options: nosniff
```

- [ ] Health check endpoint responds
- [ ] Security headers present
- [ ] HTTPS enforced (no HTTP fallback)
- [ ] Error rates < 0.1%
- [ ] Response times < 200ms

### Step 15: Monitoring Setup

**Set up alerts** for:
- Error rate > 1%
- Response time > 500ms
- Failed login attempts > 10 in 1 hour
- Circuit breaker state = OPEN

Configure with your monitoring service:
- CloudWatch (AWS)
- DataDog
- NewRelic
- Sentry

- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Alerts set up
- [ ] Logs aggregated

---

## Final Verification Checklist

### Security ✅
- [ ] HTTPS enforced
- [ ] CORS whitelist configured
- [ ] Helmet headers enabled (33+)
- [ ] JWT secrets > 32 characters
- [ ] No sensitive data in logs
- [ ] Rate limiting enabled on auth endpoints
- [ ] Password hashing working (bcrypt)

### Performance ✅
- [ ] API responses < 200ms
- [ ] Batch operations < 500ms
- [ ] Database queries < 50ms
- [ ] Cache hit rate > 80%
- [ ] No N+1 queries

### Reliability ✅
- [ ] Error handler catches all errors
- [ ] Retry logic working
- [ ] Circuit breaker preventing cascades
- [ ] Graceful degradation on failures
- [ ] Timeouts preventing hangs

### Code Quality ✅
- [ ] No console.log (use logger)
- [ ] All routes use asyncHandler
- [ ] Validation on all inputs
- [ ] Consistent error responses
- [ ] Comprehensive logging

### Documentation ✅
- [ ] INTEGRATION_GUIDE_2026.md available
- [ ] Custom error classes documented
- [ ] API error codes documented
- [ ] Environment variables documented
- [ ] Runbook for common issues

---

## Post-Deployment Monitoring

### Daily Checks
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] No circuit breaker trips
- [ ] Logs show normal patterns
- [ ] Failed login attempts reasonable

### Weekly Checks
- [ ] Cache hit rates stable
- [ ] Database performance baseline
- [ ] No memory leaks
- [ ] Security scans passing
- [ ] Backup procedures working

### Monthly Reviews
- [ ] Performance degradation analysis
- [ ] Security audit results
- [ ] Dependency updates available
- [ ] Capacity planning review
- [ ] Cost optimization opportunities

---

## Rollback Plan

### If Deployment Issues

1. **Immediate** (< 5 minutes):
   ```bash
   # Revert to previous version
   git revert HEAD
   npm install  # Reinstall dependencies
   npm start
   ```

2. **Verification**:
   - [ ] Health check passes
   - [ ] Can login
   - [ ] Messages send/receive
   - [ ] No errors in logs

3. **Root Cause Post-Mortem**:
   - What failed?
   - Why weren't tests catching it?
   - How to prevent next time?

---

## Timeline Summary

| Phase | Time | Status |
|-------|------|--------|
| Installation | 5-10 min | 📋 TODO |
| Integration | 20-30 min | 📋 TODO |
| Testing | 2-4 hours | 📋 TODO |
| Deployment | < 15 min | 📋 TODO |
| **Total** | **2.5-4.5 hours** | 📋 TODO |

---

## Success Metrics

After deployment, you should see:

✅ **Security**
- 33+ security headers present
- 0 critical vulnerabilities
- Authentication working with JWT

✅ **Performance**
- API response time: **< 200ms** (p95)
- Batch operations: **< 500ms**
- Cache hit rate: **> 80%**

✅ **Reliability**
- Error rate: **< 0.1%**
- Uptime: **> 99.9%**
- Failed requests: **< 1 per hour**

✅ **Code Quality**
- All errors handled consistently
- All inputs validated
- No console.log statements
- 70% less boilerplate

---

## Support & Troubleshooting

### Common Issues & Solutions

**1. Zod validation errors**
```
Error: "Email is required"
Solution: Check schema definition matches request body
```

**2. JWT authentication failing**
```
Error: "Invalid token"
Solution: Verify JWT_SECRET and token signature
```

**3. CORS errors**
```
Error: "Access-Control-Allow-Origin header missing"
Solution: Check CLIENT_URL in .env matches frontend domain
```

**4. Helmet CSP blocking**
```
Error: "Content security policy violation"
Solution: Add domain to CSP directives in security.js
```

**5. Logs not JSON format**
```
Error: "Invalid JSON in logs"
Solution: Ensure logger instance used, not console.log
```

---

See `INTEGRATION_GUIDE_2026.md` for detailed code examples and patterns.

**Questions?** Check the inline code documentation in each utility file.

**Ready to deploy!** 🚀
