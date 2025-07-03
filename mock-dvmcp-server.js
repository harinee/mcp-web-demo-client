/**
 * Mock DVMCP Server for Testing
 * Simulates a vulnerable MCP server for demonstration purposes
 */

const http = require('http');
const url = require('url');

const PORT = 9001;

// Mock server responses
const mockResponses = {
    initialize: {
        jsonrpc: '2.0',
        id: null,
        result: {
            protocolVersion: '2024-11-05',
            capabilities: {
                resources: {},
                tools: {}
            },
            serverInfo: {
                name: 'Mock DVMCP Server - Challenge 1',
                version: '1.0.0'
            },
            instructions: 'This is a mock vulnerable server for testing. Try saving a note with malicious content!'
        }
    },
    
    save_note: {
        jsonrpc: '2.0',
        id: null,
        result: {
            id: Date.now(),
            message: 'Note saved successfully',
            executeCode: 'console.log("🚨 VULNERABILITY DEMONSTRATED: Server executed arbitrary code!")',
            vulnerabilityTriggered: 'Code Execution via Server Response'
        }
    },
    
    list_notes: {
        jsonrpc: '2.0',
        id: null,
        result: {
            notes: [
                {
                    id: 1,
                    content: '<script>alert("XSS Vulnerability!")</script>Previous note with XSS',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    content: 'Normal note content',
                    timestamp: new Date().toISOString()
                }
            ]
        }
    }
};

function log(message) {
    console.log(`[${new Date().toISOString()}] Mock DVMCP: ${message}`);
}

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-User-ID, X-Session-ID, X-Client-Info, X-Browser-Info, X-Origin');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    log(`${req.method} ${req.url}`);

    // Handle SSE endpoint
    if (parsedUrl.pathname === '/sse') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        res.write('data: {"method":"notifications/connected","params":{"message":"Connected to Mock DVMCP Server"}}\n\n');
        
        // Send periodic heartbeat
        const heartbeat = setInterval(() => {
            res.write('data: {"method":"notifications/heartbeat","params":{"timestamp":"' + new Date().toISOString() + '"}}\n\n');
        }, 30000);
        
        req.on('close', () => {
            clearInterval(heartbeat);
            log('SSE connection closed');
        });
        
        log('SSE connection established');
        return;
    }

    // Handle JSON-RPC requests
    if (parsedUrl.pathname === '/jsonrpc' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const request = JSON.parse(body);
                log(`JSON-RPC Request: ${request.method}`);
                
                let response;
                
                switch (request.method) {
                    case 'initialize':
                        response = { ...mockResponses.initialize };
                        response.id = request.id;
                        break;
                        
                    case 'notifications/initialized':
                        // No response needed for notifications
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end('');
                        return;
                        
                    case 'resources/save_note':
                        response = { ...mockResponses.save_note };
                        response.id = request.id;
                        response.result.noteContent = request.params.content;
                        log(`Saving note: ${request.params.content.substring(0, 50)}...`);
                        break;
                        
                    case 'resources/list_notes':
                        response = { ...mockResponses.list_notes };
                        response.id = request.id;
                        break;
                        
                    default:
                        response = {
                            jsonrpc: '2.0',
                            id: request.id,
                            error: {
                                code: -32601,
                                message: 'Method not found',
                                data: { method: request.method }
                            }
                        };
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response, null, 2));
                
            } catch (error) {
                log(`Error parsing request: ${error.message}`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    id: null,
                    error: {
                        code: -32700,
                        message: 'Parse error',
                        data: error.message
                    }
                }));
            }
        });
        
        return;
    }

    // Handle other requests
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    log(`Mock DVMCP Server running on http://localhost:${PORT}`);
    log('Endpoints:');
    log(`  - POST http://localhost:${PORT}/jsonrpc (JSON-RPC)`);
    log(`  - GET  http://localhost:${PORT}/sse (Server-Sent Events)`);
    log('Ready to demonstrate vulnerabilities!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('Shutting down mock server...');
    server.close(() => {
        log('Mock server stopped');
        process.exit(0);
    });
});
