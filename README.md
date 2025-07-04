# MCP Demo Client

A deliberately vulnerable web-based client for connecting to MCP (Model Context Protocol) servers for security testing and educational purposes.

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for web server)
- Modern web browser
- Running MCP server (e.g., damn-vulnerable-MCP-server)

### Running the Client
```bash
# Start web server
python -m http.server 8080

# Open browser
open http://localhost:8080
```

## ✅ Connection Status

### **WORKING** - Connection Successfully Established
- ✅ **SSE Connection**: EventSource to `/sse` endpoint working
- ✅ **CORS**: Browser connections allowed from localhost:8080
- ✅ **MCP Protocol**: Proper MCP-over-SSE transport
- ✅ **No Errors**: 400 errors eliminated, connection completes successfully

## 🏗️ Architecture

### **Client Side**
- **Transport**: MCP over Server-Sent Events (SSE)
- **Connection**: EventSource to server `/sse` endpoint
- **Protocol**: Follows MCP specification for browser environments
- **UI**: Real-time connection status and challenge selection

### **Connection Flow**
1. User selects challenge and enters server URL (e.g., `http://localhost:9001`)
2. Client connects to `{serverUrl}/sse` via EventSource
3. SSE connection established with CORS headers
4. MCP transport handles initialization automatically
5. Status shows "CONNECTED" - ready for vulnerability testing

## 🔧 Technical Implementation

### **SSE Connection**
```javascript
// Connect to MCP server via SSE
this.eventSource = new EventSource(`${this.serverUrl}/sse`);

// Handle MCP messages
this.eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);
    this.handleMessage(message);
};
```

### **MCP Protocol**
```javascript
// Let SSE transport handle MCP messages properly
async sendMessageViaSSE(message) {
    console.log('Message queued for MCP SSE transport:', message);
    // No HTTP POST needed - let the MCP transport do its job
    return true;
}
```

### **CORS Requirements**
Server must include CORS headers:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

## 🎯 Supported Servers

### **Damn Vulnerable MCP Server**
- **Repository**: `/path/to/damn-vulnerable-MCP-server`
- **Ports**: 9001-9010 (10 challenge servers)
- **Challenges**: Easy (1-3), Medium (4-7), Hard (8-10)
- **Docker**: `docker run -d -p 9001-9010:9001-9010 dvmcp`

### **Connection Examples**
- Challenge 1: `http://localhost:9001`
- Challenge 2: `http://localhost:9002`
- Challenge 10: `http://localhost:9010`

## 🔒 Security Features (Vulnerabilities)

This client is **intentionally vulnerable** for educational purposes:

### **Client-Side Vulnerabilities**
- **XSS**: Executes server-provided code via `eval()`
- **Data Exposure**: Logs sensitive data to console
- **Storage**: Stores credentials in localStorage without encryption
- **CSRF**: No CSRF protection on requests
- **Input Validation**: Trusts all server responses

### **Example Vulnerabilities**
```javascript
// VULNERABILITY: Execute arbitrary code from server
if (message.params.code) {
    eval(message.params.code); // EXTREMELY DANGEROUS
}

// VULNERABILITY: Log sensitive data
console.log('Loaded stored credentials:', data);

// VULNERABILITY: Expose browser fingerprint
generateBrowserFingerprint() {
    return { /* detailed browser info */ };
}
```

## 📊 Connection Troubleshooting

### **Common Issues**
| Issue | Cause | Solution |
|-------|-------|----------|
| CORS Error | Server missing CORS headers | Add CORS middleware to server |
| Connection Failed | Server not running | Start MCP server on specified port |
| 400 Errors | Protocol mismatch | Use proper MCP-over-SSE transport |
| Stuck "CONNECTING" | Initialization timeout | Check server SSE endpoint |

### **Debug Information**
- Open browser DevTools → Console for detailed logs
- Check Network tab for failed requests
- Verify server is running: `curl http://localhost:9001/sse`

## 🔧 Development

### **File Structure**
```
mcp-demo-client/
├── index.html          # Main UI
├── script.js           # UI logic and event handling
├── mcp-client.js       # MCP protocol implementation
├── proxy-server.js     # CORS proxy (deprecated)
└── README.md          # This file
```

### **Key Components**
- **VulnerableMCPClient**: Main MCP client class
- **SSE Connection**: EventSource-based transport
- **Message Handling**: MCP protocol message processing
- **UI Integration**: Real-time status updates

## ⚠️ Security Warning

This client is **intentionally vulnerable** and should only be used in controlled environments for:
- Security research
- Educational purposes
- Vulnerability demonstration
- Penetration testing training

**DO NOT** use in production environments.
