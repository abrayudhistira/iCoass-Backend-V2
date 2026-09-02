# iCoass Backend - Comprehensive Audit Report

**Date:** 2026-09-01  
**Auditor:** AI Code Review  
**Project:** iCoass Backend (Express.js + Socket.io + Sequelize + MySQL)

---

## Executive Summary

The iCoass Backend is a well-structured Clean Architecture implementation with solid separation of concerns (Presentation → Application → Infrastructure). It implements authentication (JWT + Refresh Tokens), real-time chat (Socket.io), AI diagnosis orchestration (Python microservice), and CRUD operations for articles/hospitals.

**Overall Risk Level: MEDIUM** - Several security vulnerabilities, performance bottlenecks, and architectural inconsistencies require attention before production deployment.

---

## 1. SECURITY FINDINGS

### 1.1 CRITICAL - Hardcoded/Weak Secrets **FIXED**✅️
| File | Issue | Risk |
|------|-------|------|
| `.env` | `JWT_SECRET=iCoass_2026` - Predictable, low entropy | **CRITICAL** - Token forgery possible |
| `.env` | `REFRESH_TOKEN_SECRET=iCoas_2026` - Typo in secret name, low entropy | **CRITICAL** - Refresh token forgery |
| `.env` | `DB_PASSWORD=123` - Extremely weak database password | **CRITICAL** - Database compromise |
| `.env.production` | `DB_PASSWORD=` - Empty password in production config | **CRITICAL** - Unsecured database |

**Recommendation:** Generate 256-bit secrets using `openssl rand -base64 32`. Use different secrets per environment. Never commit `.env` files.

---

### 1.2 HIGH - JWT Algorithm Not Specified (Algorithm Confusion Risk) **FIXED**✅️
```javascript
// AuthMiddleware.js:13
const verified = jwt.verify(token, process.env.JWT_SECRET);
// UserUseCase.js:264
const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
```
**Issue:** No explicit `algorithms: ['HS256']` parameter. Vulnerable to algorithm confusion attacks if RS256 public key is exposed.

**Fix:**
```javascript
jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

---

### 1.3 HIGH - No Rate Limiting on Auth Endpoints **FIXED**✅️
| Endpoint | Risk |
|----------|------|
| `POST /api/register` | Account enumeration, spam registration |
| `POST /api/login` | Brute force, credential stuffing |
| `POST /api/refresh-token` | Token replay, DoS |
| `POST /api/diagnosis` | AI service abuse, cost exhaustion |

**Impact:** Unlimited requests enable credential stuffing, DoS, and AI microservice cost abuse.

---

### 1.4 HIGH - CORS Misconfiguration
```javascript
// app.js:60
const io = new Server(server, { cors: { origin: "*" } });
// SocketServer.js:7
cors: { origin: "*" }
```
**Issue:** Wildcard CORS allows any domain to connect to WebSocket and make authenticated requests. Combined with credential inclusion, enables CSRF via WebSocket.

**Fix:** Restrict to specific frontend domains.

---

### 1.5 MEDIUM - SQL Injection Risk in Raw Queries
```javascript
// HospitalRepository.js:61-66
const distanceSql = sequelize.literal(`(
    6371 * acos(
        cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) + 
        sin(radians(${userLat})) * sin(radians(latitude))
    )
)`);
```
**Issue:** Template literal interpolation of `userLat`/`userLng` directly into SQL. While parsed as floats in controller, no validation prevents injection if bypassed.

**Fix:** Use parameterized queries or Sequelize's `fn`/`col` with bindings.

---

### 1.6 MEDIUM - No Helmet Security Headers
Missing: `helmet` middleware for CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

---

### 1.7 MEDIUM - Password Hash Rounds from Env Without Validation
```javascript
// UserUseCase.js:23, 210
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const salt = await bcrypt.genSalt(saltRounds);
```
**Issue:** If env var missing or non-numeric, `parseInt` returns `NaN`, causing `bcrypt.genSalt(NaN)` to default to 10 silently, or throw unpredictably.

**Fix:** Add validation with sensible default:
```javascript
const saltRounds = Math.max(10, Math.min(15, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12));
```

---

### 1.8 LOW - Debug Logging Exposes Sensitive Data
```javascript
// HospitalRepository.js:69, 89-95
console.log('[findNearest] Params:', { userLat, userLng, radiusKm, page, limit });
console.log('[findNearest] Result:', result.rows.map(r => ({ ... distance: r.dataValues.distance })));
```
**Issue:** Logs user location coordinates in production. Potential PII exposure.

---

## 2. PERFORMANCE BOTTLENECKS

### 2.1 HIGH - N+1 Query Problem in Chat Repository
```javascript
// ChatRepository.js:75-84
async getPendingRooms() {
    return await models.chat_rooms.findAll({
        where: { status: 'pending' },
        include: [{ model: models.users, as: 'user', attributes: ['id', 'username'] }],
        order: [['createdAt', 'ASC']]
    });
}
```
**Issue:** `include` with `hasMany`/`belongsTo` generates LEFT OUTER JOIN. With many pending rooms, this loads all user data. Acceptable for small datasets but scales poorly.

**Optimization:** Consider pagination (`limit`/`offset`) and/or separate user lookup with caching.

---

### 2.2 HIGH - No Database Connection Pool Tuning **FIXED**✅️
```javascript
// sequelize.js:4-16
const sequelize = new Sequelize(..., {
    // Missing pool configuration!
    logging: false,
    ...
});
```
**Default pool:** `{ max: 5, min: 0, acquire: 60000, idle: 10000 }` - Insufficient for production load.

**Recommendation:**
```javascript
pool: {
    max: 20,           // Adjust based on CPU cores & load
    min: 5,
    acquire: 30000,
    idle: 10000,
    evict: 1000        // Validate connections periodically
}
```

---

### 2.3 HIGH - No Query Timeout / Statement Timeout
Long-running queries (e.g., Haversine on large hospitals table) can block pool indefinitely. No `statement_timeout` configured in MySQL session or Sequelize options.

---

### 2.4 MEDIUM - Unbounded Pagination Limits
```javascript
// ArticlesRepository.js:10-16
async findAll(page = 1, limit = 10) { ... }

// HospitalRepository.js:16-22
async findAll(page = 1, limit = 10) { ... }

// ChatRepository.js:132-139
async getMessagesByRoom(roomId, page = 1, limit = 50) { ... }
```
**Issue:** No upper bound on `limit` parameter. Client can request `limit=10000` causing memory exhaustion.

**Fix:** Enforce max limit:
```javascript
const safeLimit = Math.min(limit, 100); // Max 100 items per page
```

---

### 2.5 MEDIUM - Inefficient Haversine Query (Full Table Scan Risk)
```javascript
// HospitalRepository.js:71-86
where: {
    latitude: { [Op.between]: [minLat, maxLat] },
    longitude: { [Op.between]: [minLng, maxLng] },
    [Op.and]: Sequelize.where(distanceSql, { [Op.lte]: radiusKm })
}
```
**Issue:** Bounding box helps but MySQL cannot use composite index on `(latitude, longitude)` effectively for range queries on both columns. No spatial index (MySQL 8+ supports `SPATIAL INDEX` with `ST_Distance_Sphere`).

**Optimization for MySQL 8+:**
```sql
ALTER TABLE hospitals ADD SPATIAL INDEX idx_location (location);
-- Store POINT(latitude, longitude) in a 'location' GEOMETRY column
-- Query: ST_Distance_Sphere(location, ST_PointFromText('POINT(lng lat)')) <= radius_meters
```

---

### 2.6 MEDIUM - Synchronous File Deletion Blocks Event Loop
```javascript
// ArticleUseCase.js:36-40
if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath); // BLOCKING!
}
```
**Issue:** `fs.unlinkSync` blocks Node.js event loop. Under high load, delays all requests.

**Fix:** Use async `fs.promises.unlink()` or queue deletion to background worker.

---

### 2.7 LOW - No Redis Caching Layer
Repeated queries for:
- Article lists (public, rarely changing)
- Hospital lists (static data)
- User profiles (session-scoped)

Could benefit from Redis with TTL invalidation.

---

### 2.8 LOW - Socket.io No Adapter for Horizontal Scaling
```javascript
// app.js:59-60
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
```
**Issue:** Single-process Socket.io. Cannot scale horizontally without Redis adapter (`@socket.io/redis-adapter`).

---

## 3. CODE QUALITY & ARCHITECTURAL INCONSISTENCIES

### 3.1 HIGH - Repository Pattern Violation: Direct Model Access in Repositories
```javascript
// ChatRepository.js:4, 50, 56, 64, 91, 113, 115, 134, 158, 171, 182
const models = initModels(sequelize);
// Direct model usage throughout
const existingRoom = await models.chat_rooms.findOne(...);
const newRoom = await models.chat_rooms.create(...);
```
**Issue:** Repositories directly import and use Sequelize models, coupling data access to ORM implementation. Violates Repository pattern abstraction - cannot swap ORM or add caching layer without changing repository code.

**Correct pattern:** Repository should receive models via constructor (Dependency Injection).

---

### 3.2 HIGH - Inconsistent Error Handling Patterns **FIXED**✅️
| Location | Pattern |
|----------|---------|
| `UserUseCase.js` | Throws `Error` with string messages |
| `ChatRepository.js` | Uses `sequelize.transaction()` with try/catch |
| `ChatRepository.js:46-72` | Uses managed transaction `sequelize.transaction(async (t) => {...})` |
| `HospitalRepository.js` | No transactions, direct calls |
| Controllers | Try/catch wrapping usecase calls |

**Inconsistency:** Mix of managed/unmanaged transactions, no standard error classes, no error codes for client handling.

---

### 3.3 HIGH - Business Logic in Repository (ChatRepository) **FIXED**✅️
```javascript
// ChatRepository.js:59-61
if (existingRoom) {
    throw new Error("Anda sudah memiliki sesi konsultasi yang aktif");
}
```
**Issue:** Business rule ("one active room per user") lives in Repository, not UseCase. Violates Clean Architecture - repositories should only handle data access.

**Fix:** Move validation to `ChatUseCase.createQueue()`.

---

### 3.4 MEDIUM - Duplicate/Commented Code in ChatRepository
```javascript
// ChatRepository.js:6-71
// Three versions of createRoom() - two commented out!
// Lines 6-45: Two commented implementations
// Lines 46-72: Active implementation
```
**Issue:** Dead code bloats file, confuses maintenance. Remove commented versions.

---

### 3.5 MEDIUM - Inconsistent Timestamp Handling
| Model | Timestamps | Issue |
|-------|------------|-------|
| `users.js` | `timestamps: true` | Has `createdAt`/`updatedAt` |
| `user_tokens.js` | `timestamps: false` | No audit trail for token creation |
| `hospitals.js` | `timestamps: false` | No audit trail |
| `articles.js` | `timestamps: true` | Consistent |
| `chat_rooms.js` | `timestamps: true` | Consistent |
| `messages.js` | `timestamps: true` | Consistent |

**Inconsistency:** Some audit-critical tables lack timestamps.

---

### 3.6 MEDIUM - Inconsistent Response Format Across Controllers
```javascript
// UserController.js:12
res.status(201).json({ success: true, data: user });

// ArticleController.js:17-24
res.json({ success: true, data: result.rows, meta: {...} });

// HospitalController.js:20-27
res.json({ success: true, data: result.rows, meta: {...} });

// ChatController.js:9
res.json({ success: true, data: rooms }); // No meta for pagination
```
**Issue:** Some paginated endpoints return `meta`, others don't. Client SDK must handle multiple formats.

---

### 3.7 MEDIUM - No Input Sanitization on Socket Events
```javascript
// ChatHandler.js:23-35
socket.on("send_message", async (data) => {
    const { sender_id, room_id, message_text } = data;
    // No validation of sender_id, room_id, message_text length/type
    const savedMsg = await chatUseCase.saveChat(sender_id, room_id, message_text);
    io.to(`room_${room_id}`).emit("receive_message", savedMsg);
});
```
**Issue:** Trusts client-provided `sender_id` - user can spoof sender identity. No rate limiting on socket events.

---

### 3.8 LOW - Missing Request Validation on Socket Handlers
No validation middleware equivalent for Socket.io events. Consider `socket.io-middleware-validator` or manual validation.

---

### 3.9 LOW - Inconsistent Naming Conventions
| File | Convention |
|------|------------|
| `HospitalUsecase.js` | PascalCase + lowercase 'c' |
| `UserUseCase.js` | PascalCase |
| `ChatUseCase.js` | PascalCase |
| `DiagnosisUseCase.js` | PascalCase |
| `ArticleUseCase.js` | PascalCase |

**Fix:** Rename `HospitalUsecase.js` → `HospitalUseCase.js` and update imports.

---

### 3.10 LOW - Empty Domain Layer
```
src/domain/  # Empty directory
```
**Issue:** Clean Architecture defines Domain layer for enterprise business rules (entities, value objects, domain events). Currently empty - all logic in UseCases. Acceptable for small apps but limits scalability.

---

## 4. RELIABILITY & OPERATIONAL CONCERNS

### 4.1 HIGH - No Graceful Shutdown Handling
```javascript
// app.js:179-191
sequelize.sync({ force: false })
    .then(async () => { ... server.listen(PORT, ...) })
    .catch(err => { console.error(...); });
```
**Issue:** No `SIGTERM`/`SIGINT` handlers. Kubernetes/Docker stops send SIGTERM - app dies mid-request, losing WebSocket connections, in-flight DB transactions.

**Fix:**
```javascript
const shutdown = async (signal) => {
    console.log(`${signal} received, closing...`);
    server.close(() => { console.log('HTTP server closed'); });
    await sequelize.close();
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

### 4.2 HIGH - No Health Check for Dependencies Beyond DB/Python
`/health` endpoint checks DB and Python service but not:
- Redis (if added for caching/sessions)
- File storage (disk space for uploads)
- External APIs

---

### 4.3 MEDIUM - No Structured Logging
```javascript
// LogMiddleware.js:15
console.log(`${color}[${method}]${reset} ${url} - ${status} (${duration}ms)`);
```
**Issue:** Plain text logs. Hard to parse, aggregate, correlate. No correlation IDs, no log levels (error/warn/info/debug), no JSON format for log aggregation (ELK/Datadog).

**Recommendation:** Use `pino` or `winston` with structured JSON output.

---

### 4.4 MEDIUM - No API Versioning
All routes at `/api/*` with no version prefix. Breaking changes require new endpoints or breaking clients.

**Recommendation:** Use `/api/v1/` prefix.

---

### 4.5 MEDIUM - Swagger Host Hardcoded to localhost
```javascript
// swagger.js:8
host: 'localhost:3000',
```
**Issue:** Generated Swagger doc only works locally. Should be configurable via env.

---

### 4.6 LOW - Docker Compose Commented Out
```yaml
# docker-compose.yml:1-45 (entire file commented)
```
**Issue:** No working multi-container orchestration for local dev. Developers must manually start MySQL.

---

### 4.7 LOW - No Database Migration Strategy
Using `sequelize.sync({ force: false })` in production is dangerous. No migration files, no rollback capability. Schema changes require manual SQL.

**Recommendation:** Use `sequelize-cli` migrations or `umzug`.

---

## 5. TESTING GAPS

| Area | Coverage |
|------|----------|
| Unit Tests | **None found** |
| Integration Tests | **None found** |
| E2E Tests | **None found** |
| Contract Tests | Swagger only |

**Risk:** No regression protection. Refactoring authentication, chat logic, or diagnosis flow is high-risk without tests.

---

## 6. DEPENDENCY VULNERABILITIES (from package.json)

| Package | Version | Known Issues |
|---------|---------|--------------|
| `express` | `^5.2.1` | **Major version** - still in beta/RC, breaking changes likely |
| `sequelize` | `^6.37.8` | v6 EOL approaching, v7 has breaking changes |
| `socket.io` | `^4.8.3` | Generally stable |
| `jsonwebtoken` | `^9.0.3` | Check for CVE-2022-23529 (fixed in 9.0.0) |
| `bcrypt` | `^6.0.0` | Native module, build issues on some platforms |
| `multer` | `^2.1.1` | Check for path traversal fixes |

**Recommendation:** Run `npm audit` and `npm outdated`. Pin exact versions in `package-lock.json`.

---

## PRIORITY ACTION MATRIX

| Priority | Items | Effort |
|----------|-------|--------|
| **P0 (Immediate)** | 1.1 Secrets, 1.2 JWT Algorithm, 1.3 Rate Limiting, 1.4 CORS, 4.1 Graceful Shutdown | 1-2 days |
| **P1 (This Sprint)** | 1.5 SQL Injection, 2.2 Connection Pool, 2.4 Pagination Limits, 3.1 Repository Pattern, 3.3 Business Logic in Repo, 4.4 API Versioning | 3-5 days |
| **P2 (Next Sprint)** | 2.1 N+1, 2.5 Spatial Index, 2.6 Async File Delete, 3.2 Error Handling, 3.4 Dead Code, 3.5 Timestamps, 3.6 Response Format, 4.3 Structured Logging, 4.7 Migrations | 1-2 weeks |
| **P3 (Backlog)** | 1.7 Password Rounds, 1.8 Debug Logs, 2.7 Redis Cache, 2.8 Socket Adapter, 3.7 Socket Validation, 3.9 Naming, 3.10 Domain Layer, 4.2 Health Checks, 4.5 Swagger Config, 4.6 Docker Compose, 5. Testing, 6. Dependencies | Ongoing |

---

## APPENDIX: FILES AUDITED

```
app.js                                    Entry point, DI, routes
package.json                              Dependencies
Dockerfile                                Container config
docker-compose.yml                        Orchestration (commented)
.env / .env.production                    Environment configs
swagger.js                                API doc generator
src/
├── application/usecase/
│   ├── UserUseCase.js        ✓ Auth, tokens, profile
│   ├── ChatUseCase.js        ✓ Queue, messages, rooms
│   ├── DiagnosisUseCase.js   ✓ AI orchestration
│   ├── HospitalUsecase.js    ✓ Geo search, CRUD
│   └── ArticleUseCase.js     ✓ CRUD, file cleanup
├── infrastructure/
│   ├── database/
│   │   ├── sequelize.js      ✓ DB connection
│   │   └── seeder.js         ✓ Admin seed
│   ├── models/               ✓ 9 Sequelize models
│   ├── repositories/         ✓ 6 Repositories
│   ├── socket/
│   │   ├── ChatHandler.js    ✓ Socket events
│   │   └── SocketServer.js   ✓ Legacy socket init
│   └── utils/RouteScanner.js ✓ Debug routes
└── presentation/
    ├── controllers/          ✓ 5 Controllers
    └── middlewares/          ✓ 8 Middlewares
```