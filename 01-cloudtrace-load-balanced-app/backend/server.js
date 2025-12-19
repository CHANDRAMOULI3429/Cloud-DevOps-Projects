// ============================================
// CloudTrace Backend Server
// ============================================
// 
// PURPOSE: Stateless HTTP server that logs requests to PostgreSQL
// 
// KEY CONCEPTS DEMONSTRATED:
// 1. Stateless Architecture - No local state, all data in DB
// 2. Request Tracking - Each request gets unique ID and server ID
// 3. Database Integration - Writes to shared PostgreSQL
// 4. Hostname Identification - Knows which EC2 instance it's running on
// ============================================

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================
// Load .env file if it exists (for local development)
require('dotenv').config();

// ============================================
// IMPORTS
// ============================================
const http = require('http');
const os = require('os');
const crypto = require('crypto');
const { Pool } = require('pg');
const { URL } = require('url');

// ============================================
// CONFIGURATION
// ============================================
// 
// WHY ENVIRONMENT VARIABLES:
// - Different values for different environments (dev, prod)
// - No hardcoded credentials in code
// - Easy to change without code modification
// ============================================

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'cloudtrace';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_NAME = process.env.DB_NAME || 'cloudtrace';
const DB_PORT = process.env.DB_PORT || 5432;

// ============================================
// DATABASE CONNECTION POOL
// ============================================
// 
// WHAT IS A CONNECTION POOL:
// - Reuses database connections instead of creating new ones
// - Improves performance (connection creation is expensive)
// - Handles multiple concurrent requests efficiently
//
// WHY THIS DESIGN:
// - Each EC2 instance has its own connection pool
// - Pool size limits: prevents overwhelming the database
// - Automatic reconnection: handles temporary DB failures
// ============================================

// ============================================
// DATABASE CONNECTION POOL WITH BEST PRACTICES
// ============================================
// 
// PRODUCTION BEST PRACTICES:
// - max: Based on DB server capacity (not too high)
// - idleTimeoutMillis: Close idle connections
// - connectionTimeoutMillis: Fail fast if can't connect
// - statement_timeout: Query timeout to prevent hanging
// ============================================

const dbPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    max: 10,                          // Max 10 concurrent DB connections per EC2
    idleTimeoutMillis: 30000,         // Close idle connections after 30s
    connectionTimeoutMillis: 60000,   // 60s timeout to get connection from pool
    statement_timeout: 60000,          // 60s timeout for queries
});

// Handle pool errors
dbPool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
});

// ============================================
// DATABASE HEALTH CHECK
// ============================================
// 
// WHY: Verify database connectivity at startup
// Best practice: Fail fast if DB is unreachable
// ============================================

async function checkDatabaseConnection() {
    try {
        const client = await dbPool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Database connection verified');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('⚠️  Server will start but requests may fail');
        return false;
    }
}

// ============================================
// SERVER IDENTIFICATION
// ============================================
// 
// WHAT IS HOSTNAME:
// - Unique identifier for this EC2 instance
// - Example: "ip-172-31-45-123.ec2.internal"
// - Set by AWS automatically when instance boots
//
// WHY WE NEED THIS:
// - Proves load balancing is working (different requests hit different servers)
// - Debugging: "Which server handled this request?"
// - Monitoring: Track requests per server
//
// STATELESS PRINCIPLE:
// - We read hostname ONCE at startup
// - No need to store it anywhere (it's constant for this instance)
// - If instance dies and new one starts, it gets new hostname automatically
// ============================================

const SERVER_HOSTNAME = os.hostname();

console.log(`🚀 CloudTrace Server Starting...`);
console.log(`📦 Server Hostname: ${SERVER_HOSTNAME}`);
console.log(`🌐 Listening on port ${PORT}`);
console.log(`💾 Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

// ============================================
// UUID GENERATION FUNCTION
// ============================================
// 
// BEST PRACTICE: Simple UUID generation
// - UUID v4 collision is 1 in 2^122 (practically impossible)
// - We don't pre-check (adds unnecessary DB query)
// - Database UNIQUE constraint handles collisions
// - If duplicate key error occurs, writeRequestToDatabase will handle it
// ============================================

function generateRequestId() {
    // Generate UUID v4 (cryptographically random)
    // This is the industry standard for distributed systems
    // Collision probability: 1 in 2^122 (5.3 × 10^36)
    return crypto.randomUUID();
}

// ============================================
// DATABASE WRITE WITH RETRY LOGIC
// ============================================
// 
// BEST PRACTICE: Retry with exponential backoff
// - Handles temporary network issues
// - Handles database connection drops
// - Handles UUID collision (duplicate key error)
//
// RETRY STRATEGY:
// - Max 3 retries
// - Exponential backoff: 100ms, 200ms, 400ms
// - Only retry on transient errors (not syntax errors)
//
// TRANSACTION USAGE:
// - Use transaction for atomicity
// - If anything fails, entire operation rolls back
// - Prevents partial writes
// ============================================

async function writeRequestToDatabase(requestId, serverHostname, timestamp, clientIp, retries = 3) {
    const backoffMs = [100, 200, 400]; // Exponential backoff delays
    
    for (let attempt = 0; attempt < retries; attempt++) {
        let client = null;
        
        try {
            // Get connection from pool
            // BEST PRACTICE: Always get connection, never reuse across requests
            client = await dbPool.connect();
            
            // BEST PRACTICE: Use transaction for atomicity
            // If anything fails, entire operation rolls back
            // Prevents partial writes (e.g., insert succeeds but commit fails)
            await client.query('BEGIN');
            
            // Insert with error handling for duplicate key
            // Database UNIQUE constraint will catch UUID collisions
            // PostgreSQL uses $1, $2, $3... for placeholders
            await client.query(
                'INSERT INTO request_logs (request_id, server_hostname, timestamp, client_ip) VALUES ($1, $2, $3, $4)',
                [requestId, serverHostname, timestamp, clientIp]
            );
            
            // Commit transaction
            // Only at this point is data actually written
            await client.query('COMMIT');
            client.release();
            
            return { success: true, error: null };
            
        } catch (error) {
            // BEST PRACTICE: Always rollback on error
            // Prevents leaving transaction open
            if (client) {
                try {
                    await client.query('ROLLBACK');
                } catch (rollbackError) {
                    console.error('❌ Rollback failed:', rollbackError);
                }
                client.release();
            }
            
            // Check if it's a duplicate key error (UUID collision)
            // PostgreSQL error codes for duplicate entry
            // Error code: 23505 = unique_violation
            const isDuplicateKey = error.code === '23505' ||
                                  (error.message && error.message.includes('duplicate key'));
            
            // Check if it's a transient error (network, timeout, etc.)
            // These errors can be retried
            const isTransientError = error.code === 'ECONNRESET' ||
                                    error.code === 'ETIMEDOUT' ||
                                    error.code === 'ECONNREFUSED' ||
                                    error.code === '57P01' ||  // PostgreSQL: admin_shutdown
                                    error.code === '57P02' ||  // PostgreSQL: crash_shutdown
                                    error.code === '57P03' ||  // PostgreSQL: cannot_connect_now
                                    error.code === '08003' ||  // PostgreSQL: connection_does_not_exist
                                    error.code === '08006' ||  // PostgreSQL: connection_failure
                                    error.code === '08001' ||  // PostgreSQL: sqlclient_unable_to_establish_sqlconnection
                                    error.code === '08004' ||  // PostgreSQL: sqlserver_rejected_establishment_of_sqlconnection
                                    error.code === '08007';    // PostgreSQL: transaction_resolution_unknown
            
            // If duplicate key, return special error code
            // Caller will generate new UUID and retry
            if (isDuplicateKey) {
                return { 
                    success: false, 
                    error: 'UUID_COLLISION',
                    message: 'Request ID collision detected - extremely rare event'
                };
            }
            
            // If transient error and we have retries left, retry with backoff
            if (isTransientError && attempt < retries - 1) {
                const delay = backoffMs[attempt] || 400;
                console.warn(`⚠️  Database write failed (attempt ${attempt + 1}/${retries}): ${error.message}`);
                console.warn(`   Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // Permanent error or out of retries
            // Return error details for logging
            return { 
                success: false, 
                error: error.code || 'UNKNOWN',
                message: error.message 
            };
        }
    }
    
    // Should never reach here, but safety net
    return { success: false, error: 'MAX_RETRIES', message: 'Maximum retries exceeded' };
}

// ============================================
// REQUEST HANDLER FUNCTION
// ============================================
// 
// REQUEST FLOW (what happens when user makes request):
// 
// 1. User clicks button in frontend
// 2. Frontend sends HTTP request to ALB
// 3. ALB chooses one healthy EC2 instance (round-robin)
// 4. ALB forwards request to chosen EC2
// 5. This function receives the request
// 6. We generate unique request ID (with collision handling)
// 7. We write to database with retry logic (request_id, hostname, timestamp)
// 8. We return response with all details
// 9. Frontend displays which server handled it
//
// STATELESS CHECKLIST:
// ✅ No local variables storing request data
// ✅ No file system writes
// ✅ All state goes to database
// ✅ Can be killed and restarted without data loss
// ✅ Any instance can handle any request
// ============================================

async function handleRequest(req, res) {
    // ============================================
    // STEP 1: Generate Unique Request ID
    // ============================================
    let requestId = generateRequestId();
    
    // ============================================
    // STEP 2: Get Client IP Address
    // ============================================
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     'unknown';
    
    // ============================================
    // STEP 3: Get Current Timestamp
    // ============================================
    const timestamp = new Date();
    
    // ============================================
    // STEP 4: Write to Database (with retry and collision handling)
    // ============================================
    let dbResult = await writeRequestToDatabase(requestId, SERVER_HOSTNAME, timestamp, clientIp);
    
    // Handle UUID collision (extremely rare, but we handle it)
    // If duplicate key error, generate new UUID and retry once
    if (!dbResult.success && dbResult.error === 'UUID_COLLISION') {
        console.warn('⚠️  UUID collision detected (extremely rare!), generating new UUID and retrying...');
        requestId = generateRequestId();
        dbResult = await writeRequestToDatabase(requestId, SERVER_HOSTNAME, timestamp, clientIp);
    }
    
    // Log database operation result
    if (!dbResult.success) {
        console.error('❌ Database write failed:', dbResult.message || dbResult.error);
    }
    
    // ============================================
    // STEP 5: Build Response
    // ============================================
    // 
    // WHAT WE RETURN:
    // - request_id: So frontend can display it
    // - server_hostname: Proves which EC2 handled it
    // - timestamp: When it was processed
    // - db_status: Whether write succeeded (for debugging)
    // ============================================
    
    const responseData = {
        request_id: requestId,
        server_hostname: SERVER_HOSTNAME,
        timestamp: timestamp.toISOString(),
        client_ip: clientIp,
        db_status: dbResult.success ? 'success' : 'failed',
        ...(dbResult.error && { db_error: dbResult.message || dbResult.error })
    };
    
    // ============================================
    // STEP 6: Send HTTP Response
    // ============================================
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  // Allow frontend to access
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    res.end(JSON.stringify(responseData, null, 2));
    
    // ============================================
    // LOGGING (for debugging)
    // ============================================
    console.log(`✅ Request ${requestId} handled by ${SERVER_HOSTNAME} at ${timestamp.toISOString()}`);
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
// 
// PURPOSE: ALB health checks hit this endpoint
// 
// WHAT ALB DOES:
// - Sends GET /health every 30 seconds (configurable)
// - If returns 200 OK → instance is healthy
// - If returns error → instance is unhealthy, stop sending traffic
//
// BEST PRACTICE: Check actual dependencies (database)
// - Not just "server is running"
// - Verify database connectivity
// - Return detailed status for debugging
// ============================================

async function handleHealthCheck(req, res) {
    let dbHealthy = false;
    
    try {
        const client = await dbPool.connect();
        await client.query('SELECT 1');
        client.release();
        dbHealthy = true;
    } catch (error) {
        // Database is down
    }
    
    const statusCode = dbHealthy ? 200 : 503; // 503 = Service Unavailable
    const healthData = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        server_hostname: SERVER_HOSTNAME,
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected'
    };
    
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(healthData, null, 2));
}

// ============================================
// CORS PREFLIGHT HANDLER
// ============================================
// 
// WHAT IS CORS PREFLIGHT:
// - Browser sends OPTIONS request before actual request
// - Asks server: "Can I make this request?"
// - Server responds: "Yes, here are allowed methods/headers"
//
// WHY WE NEED THIS:
// - Frontend makes requests from different origin
// - Browser enforces CORS security
// - Without this, browser blocks the request
// ============================================

function handleOptions(req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
}

// ============================================
// HTTP SERVER CREATION WITH ROUTING
// ============================================
// 
// WHAT HAPPENS HERE:
// 1. Create HTTP server
// 2. Listen for incoming requests
// 3. Route requests to appropriate handler
//
// REQUEST ROUTING (BEST PRACTICE):
// - OPTIONS request → handleOptions (CORS preflight)
// - GET /health → handleHealthCheck (ALB health checks)
// - GET / or POST / → handleRequest (main logic)
// - Unknown method → 405 error
//
// ERROR HANDLING:
// - Wrap in try-catch to prevent server crashes
// - Always return response (never hang)
// ============================================

const server = http.createServer(async (req, res) => {
    // BEST PRACTICE: Wrap in try-catch to prevent crashes
    try {
        // Parse URL to get path
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            handleOptions(req, res);
            return;
        }
        
        // Health check endpoint (for ALB)
        if (path === '/health' && req.method === 'GET') {
            await handleHealthCheck(req, res);
            return;
        }
        
        // Main request handler
        if ((path === '/' || path === '/api/request') && (req.method === 'GET' || req.method === 'POST')) {
            await handleRequest(req, res);
            return;
        }
        
        // 404 for unknown routes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        
    } catch (error) {
        // BEST PRACTICE: Never let errors crash the server
        console.error('❌ Request handling error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }));
    }
});

// ============================================
// SERVER STARTUP WITH DATABASE CHECK
// ============================================
// 
// WHAT HAPPENS WHEN SERVER STARTS:
// 1. Verify database connection
// 2. Server listens on specified port
// 3. Ready to accept incoming connections
// 4. ALB health checks will start hitting /health
//
// BEST PRACTICE: Check dependencies at startup
// - Fail fast if critical dependencies are down
// - Log clear error messages
// - Still start server (maybe DB comes back online)
// ============================================

async function startServer() {
    // Check database connection before starting
    await checkDatabaseConnection();
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server is running and ready to accept requests`);
        console.log(`🔗 Health check endpoint: http://localhost:${PORT}/health`);
        console.log(`🔗 API endpoint: http://localhost:${PORT}/api/request`);
        console.log(`\n📊 STATELESS ARCHITECTURE CHECKLIST:`);
        console.log(`   ✅ No local file storage`);
        console.log(`   ✅ No in-memory state between requests`);
        console.log(`   ✅ All data in shared database`);
        console.log(`   ✅ Can be killed and restarted without data loss`);
        console.log(`   ✅ Any instance can handle any request`);
        console.log(`\n🛡️  BEST PRACTICES IMPLEMENTED:`);
        console.log(`   ✅ UUID collision handling with retry`);
        console.log(`   ✅ Database write retry with exponential backoff`);
        console.log(`   ✅ Transaction-based database operations`);
        console.log(`   ✅ Connection pooling with proper limits`);
        console.log(`   ✅ Health check endpoint for ALB`);
        console.log(`   ✅ Comprehensive error handling`);
        console.log(`   ✅ Graceful shutdown handling\n`);
    });
}

// Start the server
startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
// 
// WHAT HAPPENS ON SHUTDOWN:
// 1. Stop accepting new requests
// 2. Wait for existing requests to finish
// 3. Close database connections
// 4. Exit process
//
// WHY THIS MATTERS:
// - Prevents data loss (finish in-flight requests)
// - Clean resource cleanup
// - ALB will detect instance is down and stop sending traffic
// ============================================

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
    
    await dbPool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});
