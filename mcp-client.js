/**
 * MCP Client - Deliberately Vulnerable for Demo Purposes
 * This client is intentionally insecure to demonstrate MCP vulnerabilities
 */

class VulnerableMCPClient {
    constructor() {
        this.serverUrl = null;
        this.sessionId = null;
        this.eventSource = null;
        this.isConnected = false;
        this.sessionToken = null;
        this.userId = 'anonymous';
        this.serverCapabilities = null;
        this.tools = [];
        this.resources = [];
        
        // Deliberately store sensitive data in localStorage (VULNERABILITY)
        this.loadStoredCredentials();
        
        // Initialize request counter for debugging
        this.requestCounter = 0;
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }
    
    // VULNERABILITY: Store sensitive data in localStorage without encryption
    loadStoredCredentials() {
        try {
            const storedData = localStorage.getItem('mcp_client_data');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.sessionToken = data.sessionToken;
                this.userId = data.userId;
                this.serverUrl = data.lastServerUrl;
                
                // Log sensitive data to console (VULNERABILITY)
                console.log('Loaded stored credentials:', data);
                this.logToDebug('storage', 'Loaded stored credentials from localStorage', data);
            }
        } catch (error) {
            console.error('Error loading stored credentials:', error);
        }
    }
    
    // VULNERABILITY: Store sensitive data in localStorage without encryption
    saveCredentials() {
        try {
            const data = {
                sessionToken: this.sessionToken,
                userId: this.userId,
                lastServerUrl: this.serverUrl,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('mcp_client_data', JSON.stringify(data));
            
            // Log sensitive data to console (VULNERABILITY)
            console.log('Saved credentials to localStorage:', data);
            this.logToDebug('storage', 'Saved credentials to localStorage', data);
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    }
    
    // VULNERABILITY: No URL validation - allows connecting to any server
    async connect(serverUrl) {
        if (this.isConnected) {
            await this.disconnect();
        }
        
        this.serverUrl = serverUrl;
        this.sessionId = this.generateSessionId();
        
        // Generate fake authentication token (VULNERABILITY: predictable token)
        this.sessionToken = 'mcp_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        this.logToDebug('network', 'Attempting to connect to server', {
            url: serverUrl,
            sessionId: this.sessionId,
            token: this.sessionToken
        });
        
        try {
            // Connect to SSE first, then initialize via SSE
            await this.setupSSEConnection();
            
            // Send initialization via SSE connection
            await this.initializeConnection();
            
            this.isConnected = true;
            this.saveCredentials();
            
            this.logToDebug('network', 'Successfully connected to server', {
                url: serverUrl,
                capabilities: this.serverCapabilities
            });
            
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            this.logToDebug('errors', 'Connection failed', error);
            throw error;
        }
    }
    
    async initializeConnection() {
        // The MCP SSE transport handles initialization automatically
        // Just wait a moment for the connection to stabilize
        return new Promise((resolve) => {
            setTimeout(() => {
                // Assume successful initialization since SSE is connected
                this.serverCapabilities = {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: [], resources: [] },
                    serverInfo: { name: 'DVMCP', version: '1.0.0' }
                };
                resolve(this.serverCapabilities);
            }, 1000);
        });
    }
    
    async setupSSEConnection() {
        // Connect directly to SSE endpoint
        const sseUrl = `${this.serverUrl}/sse`;
        
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000;
        
        while (retryCount < maxRetries) {
            try {
                await this.attemptSSEConnection(sseUrl);
                this.logToDebug('network', 'SSE connection established successfully');
                return;
            } catch (error) {
                retryCount++;
                this.logToDebug('errors', `SSE connection attempt ${retryCount} failed`, error);
                
                if (retryCount >= maxRetries) {
                    console.warn('SSE connection failed after all retries, falling back to polling');
                    this.logToDebug('network', 'Falling back to polling mode');
                    await this.setupPollingFallback();
                    return;
                }
                
                console.log(`SSE connection failed, retrying in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    async attemptSSEConnection(sseUrl) {
        return new Promise((resolve, reject) => {
            this.eventSource = new EventSource(sseUrl);
            
            const connectionTimeout = setTimeout(() => {
                this.eventSource.close();
                reject(new Error('SSE connection timeout'));
            }, 10000);
            
            this.eventSource.onopen = (event) => {
                clearTimeout(connectionTimeout);
                console.log('SSE connection opened');
                this.logToDebug('network', 'SSE connection opened', event);
                resolve();
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                    this.logToDebug('errors', 'Error parsing SSE message', error);
                }
            };
            
            this.eventSource.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('SSE error:', error);
                this.logToDebug('errors', 'SSE connection error', error);
                
                // Check if this is a CORS error
                if (this.eventSource.readyState === EventSource.CLOSED) {
                    reject(new Error('SSE connection failed - possible CORS issue'));
                } else {
                    reject(error);
                }
            };
        });
    }
    
    async setupPollingFallback() {
        // Fallback to polling if SSE fails
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await this.sendHTTPRequest('/events', {
                    jsonrpc: '2.0',
                    method: 'poll_events',
                    params: { sessionId: this.sessionId }
                });
                
                if (response.result && response.result.events) {
                    response.result.events.forEach(event => {
                        this.handleMessage(event);
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
                this.logToDebug('errors', 'Polling error', error);
            }
        }, 5000); // Poll every 5 seconds
        
        this.logToDebug('network', 'Polling fallback activated');
    }
    
    async disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        this.isConnected = false;
        this.serverUrl = null;
        this.sessionId = null;
        
        this.logToDebug('network', 'Disconnected from server');
    }
    
    // Let the SSE transport handle MCP messages properly
    async sendMessageViaSSE(message) {
        // VULNERABILITY: Log sensitive data
        console.log('Message queued for MCP SSE transport:', message);
        this.logToDebug('network', 'Message queued for MCP SSE transport', message);
        
        // The SSE connection already handles the MCP protocol
        // No HTTP POST needed - let the MCP transport do its job
        return true;
    }

    // VULNERABILITY: No input validation or sanitization
    async sendMessage(method, params = {}) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        const message = {
            jsonrpc: '2.0',
            id: ++this.requestCounter,
            method: method,
            params: params
        };
        
        // Send via SSE instead of HTTP POST
        return await this.sendMessageViaSSE(message);
    }
    
    async sendHTTPRequest(endpoint, data) {
        // Connect directly to the DVMCP server (CORS now enabled on server)
        const directUrl = `${this.serverUrl}${endpoint}`;
        
        // VULNERABILITY: Include sensitive headers
        const headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': this.sessionToken,
            'X-User-ID': this.userId,
            'X-Session-ID': this.sessionId,
            'X-Client-Info': 'NotePad Pro/1.0.0',
            'X-Browser-Info': navigator.userAgent,
            'X-Origin': window.location.origin
        };
        
        // Add session_id to the request data if not already present
        if (data && typeof data === 'object' && !data.session_id) {
            data.session_id = this.sessionId;
        }
        
        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
            credentials: 'include' // VULNERABILITY: Always include credentials
        };
        
        this.logToDebug('network', 'HTTP Request', {
            url: directUrl,
            headers: headers,
            data: data
        });
        
        const response = await fetch(directUrl, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        this.logToDebug('network', 'HTTP Response', {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
        });
        
        return responseData;
    }
    
    // VULNERABILITY: No validation of incoming messages
    handleMessage(message) {
        console.log('Received message:', message);
        this.logToDebug('network', 'Received message', message);
        
        // Handle initialization response
        if (this.pendingInitialization && message.id === this.pendingInitialization.id) {
            if (message.error) {
                this.pendingInitialization.reject(new Error(`Initialization failed: ${message.error.message}`));
            } else {
                this.serverCapabilities = message.result;
                
                // VULNERABILITY: Trust server response without validation
                if (message.result && message.result.tools) {
                    this.tools = message.result.tools;
                }
                
                if (message.result && message.result.resources) {
                    this.resources = message.result.resources;
                }
                
                this.pendingInitialization.resolve(message.result);
            }
            this.pendingInitialization = null;
            return;
        }
        
        // VULNERABILITY: Trust all server messages without validation
        if (message.method === 'notifications/resources/updated') {
            this.resources = message.params.resources || [];
        }
        
        if (message.method === 'notifications/tools/updated') {
            this.tools = message.params.tools || [];
        }
        
        // VULNERABILITY: Execute server-provided notifications
        if (message.method === 'notifications/execute') {
            try {
                console.log('Executing server notification:', message.params);
                if (message.params.code) {
                    eval(message.params.code); // EXTREMELY DANGEROUS
                }
            } catch (error) {
                console.error('Error executing notification:', error);
            }
        }
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('mcpMessage', { detail: message }));
    }
    
    // VULNERABILITY: Predictable session ID generation
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Save note to server (VULNERABILITY: no data validation)
    async saveNote(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid note content');
        }
        
        // VULNERABILITY: Send excessive metadata
        const noteData = {
            content: content,
            timestamp: new Date().toISOString(),
            userId: this.userId,
            sessionId: this.sessionId,
            clientInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onlineStatus: navigator.onLine
            },
            browserFingerprint: this.generateBrowserFingerprint()
        };
        
        return await this.sendMessage('resources/save_note', noteData);
    }
    
    // Load notes from server
    async loadNotes() {
        return await this.sendMessage('resources/list_notes', {
            userId: this.userId,
            sessionId: this.sessionId
        });
    }
    
    // VULNERABILITY: Generate and expose browser fingerprint
    generateBrowserFingerprint() {
        return {
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            languages: navigator.languages,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            plugins: Array.from(navigator.plugins).map(p => p.name),
            mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type)
        };
    }
    
    // Debug logging
    logToDebug(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            type: type,
            message: message,
            data: data
        };
        
        // Store in sessionStorage for debug panel
        const debugLogs = JSON.parse(sessionStorage.getItem('mcp_debug_logs') || '[]');
        debugLogs.push(logEntry);
        
        // Keep only last 100 entries
        if (debugLogs.length > 100) {
            debugLogs.shift();
        }
        
        sessionStorage.setItem('mcp_debug_logs', JSON.stringify(debugLogs));
        
        // Trigger debug update event
        window.dispatchEvent(new CustomEvent('debugUpdate', { detail: logEntry }));
    }
    
    // Get debug logs
    getDebugLogs() {
        return JSON.parse(sessionStorage.getItem('mcp_debug_logs') || '[]');
    }
    
    // Clear debug logs
    clearDebugLogs() {
        sessionStorage.removeItem('mcp_debug_logs');
        window.dispatchEvent(new CustomEvent('debugCleared'));
    }
    
    // VULNERABILITY: Expose all internal state
    getState() {
        return {
            serverUrl: this.serverUrl,
            sessionId: this.sessionId,
            isConnected: this.isConnected,
            sessionToken: this.sessionToken,
            userId: this.userId,
            serverCapabilities: this.serverCapabilities,
            tools: this.tools,
            resources: this.resources,
            requestCounter: this.requestCounter
        };
    }
}

// Create global instance (VULNERABILITY: Global state)
window.mcpClient = new VulnerableMCPClient();

// VULNERABILITY: Expose client on window for debugging
window.getMCPState = () => window.mcpClient.getState();
window.mcpDebugLogs = () => window.mcpClient.getDebugLogs();
