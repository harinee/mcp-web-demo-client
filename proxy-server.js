/**
 * Simple CORS Proxy for MCP Demo Client
 * Forwards requests to DVMCP server and adds CORS headers
 */

const http = require('http');
const url = require('url');

const PROXY_PORT = 8081;
const DVMCP_BASE = 'http://localhost';

// Simple logging
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Create proxy server
const server = http.createServer((req, res) => {
    // Add CORS headers to all responses
    const origin = req.headers.origin || 'http://localhost:8080';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token, X-User-ID, X-Session-ID, X-Client-Info, X-Browser-Info, X-Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse the request URL
    const parsedUrl = url.parse(req.url, true);
    
    // Extract port from path (e.g., /9001/jsonrpc -> port 9001)
    const pathParts = parsedUrl.pathname.split('/').filter(part => part);
    const targetPort = pathParts[0];
    const targetPath = '/' + pathParts.slice(1).join('/');

    // Validate port is in DVMCP range
    if (!targetPort || !targetPort.match(/^900[1-9]|9010$/)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid port. Use 9001-9010.' }));
        return;
    }

    // Build target URL
    const targetUrl = `${DVMCP_BASE}:${targetPort}${targetPath}`;
    
    log(`Proxying ${req.method} ${req.url} -> ${targetUrl}`);

    // Prepare request options
    const options = {
        hostname: 'localhost',
        port: targetPort,
        path: targetPath,
        method: req.method,
        headers: {
            ...req.headers,
            host: `localhost:${targetPort}` // Fix host header
        }
    };

    // Remove hop-by-hop headers
    delete options.headers['connection'];
    delete options.headers['upgrade'];
    delete options.headers['proxy-authorization'];
    delete options.headers['proxy-authenticate'];
    delete options.headers['te'];
    delete options.headers['trailers'];
    delete options.headers['transfer-encoding'];

    // Create request to DVMCP server
    const proxyReq = http.request(options, (proxyRes) => {
        // Handle redirects by rewriting location header to use proxy
        const headers = { ...proxyRes.headers };
        if (headers.location && headers.location.includes('localhost:' + targetPort)) {
            // Rewrite redirect location to use proxy
            headers.location = headers.location.replace(
                `http://localhost:${targetPort}`,
                `http://localhost:${PROXY_PORT}/${targetPort}`
            );
            log(`Rewriting redirect location: ${proxyRes.headers.location} -> ${headers.location}`);
        }
        
        // Copy status and headers from DVMCP response
        res.writeHead(proxyRes.statusCode, headers);
        
        // Pipe response data
        proxyRes.pipe(res);
        
        log(`Response: ${proxyRes.statusCode} for ${req.url}`);
    });

    // Handle proxy request errors
    proxyReq.on('error', (err) => {
        log(`Proxy error: ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Proxy error', 
            message: err.message,
            target: targetUrl
        }));
    });

    // Handle client request errors
    req.on('error', (err) => {
        log(`Client error: ${err.message}`);
        proxyReq.destroy();
    });

    // Pipe request data to DVMCP server
    req.pipe(proxyReq);
});

// Handle server errors
server.on('error', (err) => {
    log(`Server error: ${err.message}`);
});

// Start the proxy server
server.listen(PROXY_PORT, () => {
    log(`CORS Proxy running on http://localhost:${PROXY_PORT}`);
    log(`Usage: http://localhost:${PROXY_PORT}/{port}/{path}`);
    log(`Example: http://localhost:${PROXY_PORT}/9001/jsonrpc`);
    log('Ready to proxy requests to DVMCP server (ports 9001-9010)');
});
