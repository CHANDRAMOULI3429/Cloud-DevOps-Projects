-- ============================================
-- CloudTrace Database Schema (PostgreSQL)
-- ============================================
-- 
-- PURPOSE: Store request logs from all EC2 instances
-- 
-- WHY THIS DESIGN:
-- - Single source of truth for all requests
-- - Allows any EC2 instance to read/write
-- - Enables tracking which server handled each request
-- - Simple schema for learning purposes
-- ============================================

-- Create database (run this manually on PostgreSQL server)
-- CREATE DATABASE cloudtrace;
-- \c cloudtrace;

-- ============================================
-- REQUEST_LOGS Table
-- ============================================
-- 
-- This table stores every request that comes through the system.
-- Each row represents one HTTP request handled by one EC2 instance.
--
-- KEY CONCEPTS:
-- 1. request_id: Unique identifier for each request (UUID)
-- 2. server_hostname: Which EC2 instance handled this request
-- 3. timestamp: When the request was processed
-- 4. client_ip: Where the request came from (useful for debugging)
--
-- WHY THESE FIELDS:
-- - request_id: Track individual requests across the system
-- - server_hostname: Prove load balancing is working (different servers)
-- - timestamp: See request timing and distribution
-- - client_ip: Debugging and potential analytics
-- ============================================

CREATE TABLE IF NOT EXISTS request_logs (
    -- Primary key: auto-incrementing ID for database efficiency
    id BIGSERIAL PRIMARY KEY,
    
    -- Unique request identifier (UUID format)
    -- Example: "550e8400-e29b-41d4-a716-446655440000"
    -- WHY UUID: Guarantees uniqueness across all servers without coordination
    request_id VARCHAR(36) NOT NULL UNIQUE,
    
    -- Hostname of the EC2 instance that handled this request
    -- Example: "ip-172-31-45-123.ec2.internal"
    -- WHY: This proves load balancing is working - different requests show different hostnames
    server_hostname VARCHAR(255) NOT NULL,
    
    -- When this request was processed (server time)
    -- WHY: Track timing, see request patterns, debug issues
    timestamp TIMESTAMP NOT NULL,
    
    -- IP address of the client (from ALB or direct)
    -- WHY: Useful for debugging, security, analytics
    client_ip VARCHAR(45) NOT NULL
);

-- Index on timestamp for fast queries (show recent requests)
-- WHY: Frontend will query "show last 100 requests" - index speeds this up
CREATE INDEX IF NOT EXISTS idx_timestamp ON request_logs (timestamp DESC);

-- Index on server_hostname to see requests per server
-- WHY: Dashboard might show "how many requests did each server handle?"
CREATE INDEX IF NOT EXISTS idx_server_hostname ON request_logs (server_hostname);

-- ============================================
-- EXAMPLE QUERIES (for reference)
-- ============================================
-- 
-- Get last 100 requests:
-- SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT 100;
--
-- Count requests per server:
-- SELECT server_hostname, COUNT(*) as request_count 
-- FROM request_logs 
-- GROUP BY server_hostname;
--
-- Get requests in last hour:
-- SELECT * FROM request_logs 
-- WHERE timestamp >= NOW() - INTERVAL '1 hour'
-- ORDER BY timestamp DESC;
