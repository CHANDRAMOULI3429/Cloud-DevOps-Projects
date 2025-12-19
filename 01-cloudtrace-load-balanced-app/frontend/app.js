// ============================================
// CLOUDTRACE FRONTEND APPLICATION
// ============================================
// 
// PURPOSE: Handle API calls and update UI
// 
// KEY CONCEPTS:
// 1. Fetch API - Modern way to make HTTP requests
// 2. Async/Await - Handle asynchronous operations
// 3. DOM Manipulation - Update UI based on responses
// 4. State Management - Track requests and servers
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================
// 
// WHAT IS STATE:
// - Data that changes over time
// - Requests array: All requests we've received
// - Servers map: Count of requests per server
//
// WHY WE NEED THIS:
// - Track all requests for display
// - Calculate statistics (total requests, unique servers)
// - Update UI when new requests arrive
// ============================================

let requests = []; // Array of all requests
let servers = new Map(); // Map of server hostname -> request count

// ============================================
// DOM ELEMENTS (Get references to HTML elements)
// ============================================
// 
// WHY GET ELEMENTS ONCE:
// - Performance: Don't query DOM repeatedly
// - Cleaner code: Reuse references
// ============================================

const sendRequestBtn = document.getElementById('sendRequestBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const backendUrlInput = document.getElementById('backendUrl');
const requestLogsContainer = document.getElementById('requestLogs');
const serverDistributionContainer = document.getElementById('serverDistribution');
const totalRequestsSpan = document.getElementById('totalRequests');
const uniqueServersSpan = document.getElementById('uniqueServers');

// ============================================
// SEND REQUEST FUNCTION
// ============================================
// 
// REQUEST FLOW:
// 1. User clicks "Send Request" button
// 2. Frontend sends HTTP request to backend URL
// 3. Backend (via ALB) handles request
// 4. Backend returns response with request details
// 5. Frontend displays response in UI
//
// ASYNC/AWAIT EXPLANATION:
// - fetch() is asynchronous (takes time)
// - await waits for response before continuing
// - try/catch handles errors gracefully
// ============================================

async function sendRequest() {
    // Disable button to prevent multiple clicks
    sendRequestBtn.disabled = true;
    sendRequestBtn.textContent = 'Sending...';
    
    // Get backend URL from input
    const backendUrl = backendUrlInput.value.trim();
    
    if (!backendUrl) {
        alert('Please enter a backend URL');
        sendRequestBtn.disabled = false;
        sendRequestBtn.textContent = 'Send Request';
        return;
    }
    
    try {
        // ============================================
        // STEP 1: Make HTTP Request
        // ============================================
        // 
        // WHAT fetch() DOES:
        // - Sends HTTP request to backend
        // - Returns Promise (async operation)
        // - await waits for response
        //
        // CORS NOTE:
        // - Backend must have CORS headers
        // - Otherwise browser blocks the request
        // ============================================
        
        console.log('📤 Sending request to:', backendUrl);
        const response = await fetch(backendUrl, {
            method: 'GET', // or 'POST'
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // ============================================
        // STEP 2: Check Response Status
        // ============================================
        // 
        // HTTP STATUS CODES:
        // - 200: Success
        // - 400: Bad Request
        // - 500: Server Error
        // - etc.
        //
        // WHY CHECK:
        // - Network might succeed but server returns error
        // - Handle errors gracefully
        // ============================================
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // ============================================
        // STEP 3: Parse JSON Response
        // ============================================
        // 
        // WHAT response.json() DOES:
        // - Reads response body
        // - Parses JSON string to JavaScript object
        // - Returns Promise (async)
        // ============================================
        
        const data = await response.json();
        console.log('✅ Response received:', data);
        
        // ============================================
        // STEP 4: Add Request to State
        // ============================================
        // 
        // WHAT HAPPENS:
        // - Add request to requests array
        // - Update server count in servers map
        // - Update UI to show new request
        // ============================================
        
        addRequest(data);
        
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // 
        // WHAT CAN GO WRONG:
        // - Network error (server unreachable)
        // - CORS error (backend not configured)
        // - Invalid JSON response
        // - Server error (500, etc.)
        //
        // BEST PRACTICE: Show error to user
        // ============================================
        
        console.error('❌ Request failed:', error);
        
        // Show error in UI
        const errorData = {
            request_id: `error-${Date.now()}`,
            server_hostname: 'Error',
            timestamp: new Date().toISOString(),
            client_ip: 'N/A',
            db_status: 'failed',
            db_error: error.message,
            isError: true
        };
        
        addRequest(errorData);
        
        alert(`Request failed: ${error.message}\n\nCheck:\n1. Backend URL is correct\n2. Backend server is running\n3. CORS is configured`);
    } finally {
        // ============================================
        // CLEANUP
        // ============================================
        // 
        // WHY finally:
        // - Always runs, even if error occurs
        // - Re-enable button
        // - Reset button text
        // ============================================
        
        sendRequestBtn.disabled = false;
        sendRequestBtn.textContent = 'Send Request';
    }
}

// ============================================
// ADD REQUEST TO STATE AND UI
// ============================================
// 
// WHAT THIS FUNCTION DOES:
// 1. Add request to requests array
// 2. Update server count
// 3. Update UI (logs, distribution, stats)
// ============================================

function addRequest(requestData) {
    // Add to requests array (newest first)
    requests.unshift(requestData);
    
    // Update server count
    const hostname = requestData.server_hostname;
    if (hostname && hostname !== 'Error') {
        servers.set(hostname, (servers.get(hostname) || 0) + 1);
    }
    
    // Update UI
    updateRequestLogs();
    updateServerDistribution();
    updateStats();
}

// ============================================
// UPDATE REQUEST LOGS UI
// ============================================
// 
// WHAT THIS DOES:
// - Clears current logs
// - Creates HTML for each request
// - Appends to logs container
//
// DOM MANIPULATION:
// - createElement: Create new HTML elements
// - textContent: Set text content
// - appendChild: Add to DOM
// - classList: Add CSS classes
// ============================================

function updateRequestLogs() {
    // Clear container
    requestLogsContainer.innerHTML = '';
    
    // If no requests, show empty state
    if (requests.length === 0) {
        requestLogsContainer.innerHTML = `
            <div class="empty-state">
                <p>No requests yet. Click "Send Request" to start tracking!</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for each request
    requests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.className = `request-item ${request.isError ? 'error' : (request.db_status === 'success' ? 'success' : 'error')}`;
        
        // Format timestamp
        const timestamp = new Date(request.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        // Build HTML
        requestItem.innerHTML = `
            <div class="request-header">
                <span class="request-id">${request.request_id}</span>
                <span class="request-timestamp">${formattedTime}</span>
            </div>
            <div class="request-details">
                <div class="detail-item">
                    <div class="detail-label">Server Hostname</div>
                    <div class="detail-value server-hostname">${request.server_hostname}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Client IP</div>
                    <div class="detail-value">${request.client_ip}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Database Status</div>
                    <div class="detail-value">
                        <span class="db-status ${request.db_status}">${request.db_status}</span>
                    </div>
                </div>
                ${request.db_error ? `
                <div class="detail-item">
                    <div class="detail-label">Error</div>
                    <div class="detail-value" style="color: #f44336;">${request.db_error}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        requestLogsContainer.appendChild(requestItem);
    });
}

// ============================================
// UPDATE SERVER DISTRIBUTION UI
// ============================================
// 
// WHAT THIS DOES:
// - Shows how many requests each server handled
// - Visual bar chart
// - Proves load balancing is working
// ============================================

function updateServerDistribution() {
    // Clear container
    serverDistributionContainer.innerHTML = '';
    
    // If no servers, show empty state
    if (servers.size === 0) {
        serverDistributionContainer.innerHTML = `
            <div class="empty-state">
                <p>Send requests to see distribution across servers</p>
            </div>
        `;
        return;
    }
    
    // Get max count for percentage calculation
    const maxCount = Math.max(...Array.from(servers.values()));
    
    // Sort servers by count (descending)
    const sortedServers = Array.from(servers.entries())
        .sort((a, b) => b[1] - a[1]);
    
    // Create HTML for each server
    sortedServers.forEach(([hostname, count]) => {
        const percentage = (count / maxCount) * 100;
        
        const distributionItem = document.createElement('div');
        distributionItem.className = 'distribution-item';
        distributionItem.innerHTML = `
            <div class="distribution-server">${hostname}</div>
            <div class="distribution-bar-container">
                <div class="distribution-bar" style="width: ${percentage}%">
                    ${count} request${count !== 1 ? 's' : ''}
                </div>
            </div>
            <div class="distribution-count">${count}</div>
        `;
        
        serverDistributionContainer.appendChild(distributionItem);
    });
}

// ============================================
// UPDATE STATISTICS
// ============================================
// 
// WHAT THIS DOES:
// - Update total requests count
// - Update unique servers count
// ============================================

function updateStats() {
    totalRequestsSpan.textContent = requests.length;
    uniqueServersSpan.textContent = servers.size;
}

// ============================================
// CLEAR LOGS FUNCTION
// ============================================
// 
// WHAT THIS DOES:
// - Clear requests array
// - Clear servers map
// - Reset UI
// ============================================

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        requests = [];
        servers.clear();
        updateRequestLogs();
        updateServerDistribution();
        updateStats();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
// 
// WHAT EVENT LISTENERS DO:
// - Listen for user actions (clicks, etc.)
// - Call appropriate functions
//
// WHY WE NEED THEM:
// - Connect user actions to functions
// - Make UI interactive
// ============================================

// Send request button
sendRequestBtn.addEventListener('click', sendRequest);

// Clear logs button
clearLogsBtn.addEventListener('click', clearLogs);

// Allow Enter key to send request
backendUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendRequest();
    }
});

// ============================================
// INITIALIZATION
// ============================================
// 
// WHAT HAPPENS ON PAGE LOAD:
// - Update UI with initial state (empty)
// - Ready to accept user interactions
// ============================================

console.log('✅ CloudTrace Frontend Loaded');
console.log('📝 Ready to track requests');

// Initialize UI
updateRequestLogs();
updateServerDistribution();
updateStats();

