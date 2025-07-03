/**
 * NotePad Pro - Main Application Script
 * Deliberately vulnerable MCP client for demonstration purposes
 */

class NotePadProApp {
    constructor() {
        this.notes = [];
        this.debugVisible = false;
        this.currentTab = 'network';
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.loadStoredNotes();
        this.updateUI();
        this.setupDebugPanel();
        this.simulateAuthentication();
        
        // Log application initialization (VULNERABILITY: expose internal state)
        console.log('NotePad Pro initialized', {
            version: '1.0.0',
            vulnerabilities: [
                'No input validation',
                'Insecure storage',
                'XSS vulnerabilities',
                'CSRF vulnerabilities',
                'Information disclosure'
            ]
        });
    }
    
    setupEventListeners() {
        // Connection controls
        document.getElementById('connectBtn').addEventListener('click', () => this.connectToServer());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnectFromServer());
        document.getElementById('challengeSelect').addEventListener('change', (e) => this.updateServerUrl(e.target.value));
        
        // Note management
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());
        document.getElementById('loadNotesBtn').addEventListener('click', () => this.loadNotes());
        document.getElementById('clearNotesBtn').addEventListener('click', () => this.clearNotes());
        
        // Debug controls
        document.getElementById('toggleDebugBtn').addEventListener('click', () => this.toggleDebug());
        document.getElementById('clearDebugBtn').addEventListener('click', () => this.clearDebugLogs());
        
        // Debug tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchDebugTab(e.target.dataset.tab));
        });
        
        // Authentication
        document.getElementById('authBtn').addEventListener('click', () => this.authenticate());
        
        // MCP client events
        window.addEventListener('mcpMessage', (e) => this.handleMCPMessage(e.detail));
        window.addEventListener('debugUpdate', (e) => this.updateDebugDisplay(e.detail));
        window.addEventListener('debugCleared', () => this.clearDebugDisplay());
        
        // VULNERABILITY: Allow message passing from any origin
        window.addEventListener('message', (e) => {
            console.log('Received postMessage:', e);
            this.handlePostMessage(e.data);
        });
    }
    
    updateServerUrl(port) {
        if (port) {
            const url = `http://localhost:${port}`;
            document.getElementById('customUrl').value = url;
        }
    }
    
    async connectToServer() {
        const customUrl = document.getElementById('customUrl').value.trim();
        const selectedPort = document.getElementById('challengeSelect').value;
        
        let serverUrl;
        if (customUrl) {
            serverUrl = customUrl;
        } else if (selectedPort) {
            serverUrl = `http://localhost:${selectedPort}`;
        } else {
            this.showError('Please select a challenge or enter a custom URL');
            return;
        }
        
        this.updateConnectionStatus('Connecting...');
        this.setButtonStates(false, false, false, false, false);
        
        try {
            await window.mcpClient.connect(serverUrl);
            this.updateConnectionStatus('Connected', true);
            this.setButtonStates(false, true, true, true, true);
            this.showSuccess(`Connected to ${serverUrl}`);
            
            // VULNERABILITY: Automatically authenticate after connection
            await this.autoAuthenticate();
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.updateConnectionStatus('Connection Failed');
            this.setButtonStates(true, false, false, false, false);
            this.showError(`Connection failed: ${error.message}`);
        }
    }
    
    async disconnectFromServer() {
        try {
            await window.mcpClient.disconnect();
            this.updateConnectionStatus('Disconnected');
            this.setButtonStates(true, false, false, false, false);
            this.showSuccess('Disconnected from server');
            this.clearResponse();
        } catch (error) {
            console.error('Disconnect failed:', error);
            this.showError(`Disconnect failed: ${error.message}`);
        }
    }
    
    updateConnectionStatus(status, isConnected = false) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = status;
        statusElement.className = `status ${isConnected ? 'connected' : 'disconnected'}`;
    }
    
    setButtonStates(connect, disconnect, save, load, clear) {
        document.getElementById('connectBtn').disabled = !connect;
        document.getElementById('disconnectBtn').disabled = !disconnect;
        document.getElementById('saveNoteBtn').disabled = !save;
        document.getElementById('loadNotesBtn').disabled = !load;
        document.getElementById('clearNotesBtn').disabled = !clear;
    }
    
    async saveNote() {
        const content = document.getElementById('noteContent').value;
        
        if (!content.trim()) {
            this.showError('Please enter some content for your note');
            return;
        }
        
        try {
            // VULNERABILITY: No input sanitization
            const response = await window.mcpClient.saveNote(content);
            
            if (response.error) {
                this.showError(`Failed to save note: ${response.error.message}`);
                return;
            }
            
            // Add to local notes (VULNERABILITY: trust server response)
            const note = {
                id: response.result?.id || Date.now(),
                content: content,
                timestamp: new Date().toISOString(),
                serverResponse: response.result
            };
            
            this.notes.push(note);
            this.saveNotesToStorage();
            this.updateNotesDisplay();
            this.showResponse(response);
            this.showSuccess('Note saved successfully');
            
            // Clear the textarea
            document.getElementById('noteContent').value = '';
            
        } catch (error) {
            console.error('Save failed:', error);
            this.showError(`Save failed: ${error.message}`);
        }
    }
    
    async loadNotes() {
        try {
            const response = await window.mcpClient.loadNotes();
            
            if (response.error) {
                this.showError(`Failed to load notes: ${response.error.message}`);
                return;
            }
            
            // VULNERABILITY: Trust server response without validation
            if (response.result && response.result.notes) {
                this.notes = response.result.notes;
                this.saveNotesToStorage();
                this.updateNotesDisplay();
            }
            
            this.showResponse(response);
            this.showSuccess('Notes loaded successfully');
            
        } catch (error) {
            console.error('Load failed:', error);
            this.showError(`Load failed: ${error.message}`);
        }
    }
    
    clearNotes() {
        if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
            this.notes = [];
            this.saveNotesToStorage();
            this.updateNotesDisplay();
            this.clearResponse();
            this.showSuccess('All notes cleared');
        }
    }
    
    // VULNERABILITY: Store notes in localStorage without encryption
    saveNotesToStorage() {
        try {
            localStorage.setItem('notepad_notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Failed to save notes to storage:', error);
        }
    }
    
    loadStoredNotes() {
        try {
            const storedNotes = localStorage.getItem('notepad_notes');
            if (storedNotes) {
                this.notes = JSON.parse(storedNotes);
            }
        } catch (error) {
            console.error('Failed to load stored notes:', error);
            this.notes = [];
        }
    }
    
    updateNotesDisplay() {
        const container = document.getElementById('notesContainer');
        
        if (this.notes.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes saved yet. Connect to a server and save some notes!</p>';
            return;
        }
        
        container.innerHTML = this.notes.map(note => {
            // VULNERABILITY: No HTML escaping - XSS vulnerability
            return `
                <div class="note-item">
                    <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
                    <div class="note-content">${note.content}</div>
                </div>
            `;
        }).join('');
    }
    
    showResponse(response) {
        const container = document.getElementById('responseContainer');
        const isError = response.error;
        
        container.className = `response-display ${isError ? 'response-error' : 'response-success'}`;
        
        // VULNERABILITY: Display raw response without sanitization
        container.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }
    
    clearResponse() {
        const container = document.getElementById('responseContainer');
        container.className = 'response-display';
        container.innerHTML = '<p class="empty-state">Server responses will appear here...</p>';
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Debug panel functionality
    setupDebugPanel() {
        this.updateDebugDisplay();
        this.updateStorageDisplay();
    }
    
    toggleDebug() {
        this.debugVisible = !this.debugVisible;
        const debugContent = document.getElementById('debugConsole');
        const toggleBtn = document.getElementById('toggleDebugBtn');
        
        debugContent.style.display = this.debugVisible ? 'block' : 'none';
        toggleBtn.textContent = this.debugVisible ? 'Hide Debug' : 'Show Debug';
        
        if (this.debugVisible) {
            this.updateDebugDisplay();
        }
    }
    
    switchDebugTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });
        
        // Update content based on tab
        switch (tab) {
            case 'network':
                this.updateNetworkLogs();
                break;
            case 'storage':
                this.updateStorageDisplay();
                break;
            case 'errors':
                this.updateErrorLogs();
                break;
        }
    }
    
    updateDebugDisplay(newEntry = null) {
        if (!this.debugVisible) return;
        
        switch (this.currentTab) {
            case 'network':
                this.updateNetworkLogs();
                break;
            case 'storage':
                this.updateStorageDisplay();
                break;
            case 'errors':
                this.updateErrorLogs();
                break;
        }
    }
    
    updateNetworkLogs() {
        const logs = window.mcpClient.getDebugLogs().filter(log => log.type === 'network');
        const container = document.getElementById('networkLogs');
        
        container.innerHTML = logs.map(log => `
            <div class="log-entry">
                <div class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-content">
                    <strong>${log.message}</strong>
                    ${log.data ? `<pre>${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }
    
    updateStorageDisplay() {
        const container = document.getElementById('storageLogs');
        
        // VULNERABILITY: Display all storage contents including sensitive data
        const storageData = {
            localStorage: this.getAllLocalStorage(),
            sessionStorage: this.getAllSessionStorage(),
            mcpState: window.getMCPState(),
            cookies: document.cookie,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled
            }
        };
        
        container.innerHTML = `
            <div class="log-entry">
                <div class="log-timestamp">${new Date().toLocaleString()}</div>
                <div class="log-content">
                    <strong>Storage Contents</strong>
                    <pre>${JSON.stringify(storageData, null, 2)}</pre>
                </div>
            </div>
        `;
    }
    
    updateErrorLogs() {
        const logs = window.mcpClient.getDebugLogs().filter(log => log.type === 'errors');
        const container = document.getElementById('errorLogs');
        
        container.innerHTML = logs.map(log => `
            <div class="log-entry error">
                <div class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-content">
                    <strong>${log.message}</strong>
                    ${log.data ? `<pre>${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }
    
    clearDebugLogs() {
        window.mcpClient.clearDebugLogs();
        this.clearDebugDisplay();
    }
    
    clearDebugDisplay() {
        document.getElementById('networkLogs').innerHTML = '';
        document.getElementById('storageLogs').innerHTML = '';
        document.getElementById('errorLogs').innerHTML = '';
    }
    
    // VULNERABILITY: Expose all localStorage contents
    getAllLocalStorage() {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            storage[key] = localStorage.getItem(key);
        }
        return storage;
    }
    
    // VULNERABILITY: Expose all sessionStorage contents
    getAllSessionStorage() {
        const storage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            storage[key] = sessionStorage.getItem(key);
        }
        return storage;
    }
    
    // VULNERABILITY: Fake authentication with predictable tokens
    async authenticate() {
        const fakeToken = 'auth_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const fakeUserId = 'user_' + Math.floor(Math.random() * 10000);
        
        // Store in MCP client
        window.mcpClient.sessionToken = fakeToken;
        window.mcpClient.userId = fakeUserId;
        window.mcpClient.saveCredentials();
        
        // Update UI
        document.getElementById('sessionToken').textContent = fakeToken;
        document.getElementById('userId').textContent = fakeUserId;
        
        this.showSuccess('Authentication successful');
    }
    
    simulateAuthentication() {
        // Auto-authenticate with weak credentials
        setTimeout(() => {
            const storedData = localStorage.getItem('mcp_client_data');
            if (storedData) {
                const data = JSON.parse(storedData);
                document.getElementById('sessionToken').textContent = data.sessionToken || 'Not authenticated';
                document.getElementById('userId').textContent = data.userId || 'anonymous';
            }
        }, 1000);
    }
    
    async autoAuthenticate() {
        // VULNERABILITY: Automatic authentication without user consent
        await this.authenticate();
    }
    
    // VULNERABILITY: Handle messages from any origin
    handlePostMessage(data) {
        console.log('Handling postMessage:', data);
        
        if (data.type === 'execute') {
            try {
                // EXTREMELY DANGEROUS: Execute arbitrary code from postMessage
                eval(data.code);
            } catch (error) {
                console.error('PostMessage execution failed:', error);
            }
        }
        
        if (data.type === 'updateNote') {
            document.getElementById('noteContent').value = data.content;
        }
        
        if (data.type === 'stealData') {
            // VULNERABILITY: Respond to data theft requests
            window.postMessage({
                type: 'dataResponse',
                data: {
                    notes: this.notes,
                    storage: this.getAllLocalStorage(),
                    mcpState: window.getMCPState()
                }
            }, '*');
        }
    }
    
    handleMCPMessage(message) {
        console.log('Handling MCP message:', message);
        
        // VULNERABILITY: Execute code from MCP messages
        if (message.method === 'notifications/execute') {
            try {
                if (message.params && message.params.code) {
                    eval(message.params.code);
                }
            } catch (error) {
                console.error('MCP message execution failed:', error);
            }
        }
        
        // Update UI based on message
        if (message.method === 'notifications/update_ui') {
            this.updateUIFromServer(message.params);
        }
    }
    
    // VULNERABILITY: Update UI based on server instructions
    updateUIFromServer(params) {
        if (params.noteContent) {
            document.getElementById('noteContent').value = params.noteContent;
        }
        
        if (params.showMessage) {
            this.showNotification(params.showMessage, params.messageType || 'info');
        }
        
        if (params.executeCode) {
            try {
                eval(params.executeCode);
            } catch (error) {
                console.error('Server UI code execution failed:', error);
            }
        }
    }
    
    updateUI() {
        this.updateNotesDisplay();
        this.updateConnectionStatus('Disconnected');
        this.setButtonStates(true, false, false, false, false);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotePadProApp();
    
    // VULNERABILITY: Expose app instance globally
    window.vulnerableApp = window.app;
    
    // Add some CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification {
            animation: slideIn 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
});

// VULNERABILITY: Expose debug functions globally
window.dumpAllData = () => {
    return {
        notes: window.app.notes,
        localStorage: window.app.getAllLocalStorage(),
        sessionStorage: window.app.getAllSessionStorage(),
        mcpState: window.getMCPState(),
        cookies: document.cookie
    };
};

window.executeArbitraryCode = (code) => {
    try {
        return eval(code);
    } catch (error) {
        console.error('Code execution failed:', error);
        return error;
    }
};

// VULNERABILITY: Add global error handler that exposes sensitive information
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    window.mcpClient.logToDebug('errors', 'Global error', {
        message: event.error.message,
        stack: event.error.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        state: window.getMCPState()
    });
});

// VULNERABILITY: Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    window.mcpClient.logToDebug('errors', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
        state: window.getMCPState()
    });
});
