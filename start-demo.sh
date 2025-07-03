#!/bin/bash

# NotePad Pro - MCP Demo Client Startup Script

echo "🚀 Starting NotePad Pro MCP Demo Environment"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check if DVMCP server is running
echo "🔍 Checking for DVMCP server..."
dvmcp_running=false
for port in {9001..9010}; do
    if check_port $port; then
        echo "✅ Found DVMCP server on port $port"
        dvmcp_running=true
        break
    fi
done

if [ "$dvmcp_running" = false ]; then
    echo "⚠️  DVMCP server not detected on ports 9001-9010"
    echo "   Please start the DVMCP server first:"
    echo "   docker run -p 9001-9010:9001-9010 dvmcp"
    echo ""
fi

# Start proxy server
echo "🔧 Starting CORS proxy server..."
if check_port 8081; then
    echo "⚠️  Port 8081 is already in use. Stopping existing process..."
    pkill -f "node proxy-server.js" 2>/dev/null || true
    sleep 2
fi

node proxy-server.js &
PROXY_PID=$!
echo "✅ CORS proxy server started on port 8081 (PID: $PROXY_PID)"

# Wait a moment for proxy to start
sleep 2

# Start web server
echo "🌐 Starting web server..."
if check_port 8080; then
    echo "⚠️  Port 8080 is already in use. Stopping existing process..."
    pkill -f "python3 -m http.server 8080" 2>/dev/null || true
    sleep 2
fi

python3 -m http.server 8080 &
WEB_PID=$!
echo "✅ Web server started on port 8080 (PID: $WEB_PID)"

echo ""
echo "🎉 Demo environment is ready!"
echo "============================================="
echo "📱 Open your browser and go to: http://localhost:8080"
echo "🔧 CORS Proxy running on: http://localhost:8081"
echo "🐛 Open browser Developer Tools to see vulnerabilities"
echo ""
echo "📋 Demo Steps:"
echo "1. Select a challenge from the dropdown"
echo "2. Click 'Connect' to connect to DVMCP server"
echo "3. Save a note to trigger vulnerabilities"
echo "4. Open Debug Console to see exposed data"
echo "5. Try browser console commands like window.dumpAllData()"
echo ""
echo "⚠️  Remember: This is intentionally vulnerable software for education only!"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping demo environment..."
    kill $PROXY_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
