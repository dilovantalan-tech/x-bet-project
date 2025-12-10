// 🔥 UNIVERSAL CROSS-BROWSER SYNC SYSTEM
class XbetSync {
    constructor() {
        this.SYNC_KEY = 'XBET_GLOBAL_REGISTRY';
        this.SYNC_EVENTS = [];
        this.setupSync();
    }
    
    setupSync() {
        // Listen for changes from other browsers
        window.addEventListener('storage', (event) => {
            if (event.key === this.SYNC_KEY) {
                this.handleSync(event.newValue);
            }
        });
        
        // Also sync on page load
        this.syncFromRegistry();
    }
    
    // 🔥 REGISTER NEW USER (Call this from signup.html)
    registerUser(userData) {
        console.log('Registering user:', userData.username);
        
        // 1. Save to local browser
        this.saveToLocalBrowser(userData);
        
        // 2. Save to global registry
        this.saveToGlobalRegistry(userData);
        
        // 3. Broadcast to other browsers
        this.broadcastRegistration(userData);
        
        return true;
    }
    
    saveToLocalBrowser(userData) {
        // Save to local storage (current browser)
        const localUsers = JSON.parse(localStorage.getItem('LOCAL_XBET_USERS') || '[]');
        const existingIndex = localUsers.findIndex(u => u.username === userData.username);
        
        if (existingIndex === -1) {
            localUsers.push({
                ...userData,
                browser: navigator.userAgent,
                timestamp: Date.now(),
                source: 'signup'
            });
            localStorage.setItem('LOCAL_XBET_USERS', JSON.stringify(localUsers));
        }
        
        // Also save to ALL_XBET_USERS for admin panel
        const allUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
        const allIndex = allUsers.findIndex(u => u.username === userData.username);
        
        if (allIndex === -1) {
            allUsers.push(userData);
            localStorage.setItem('ALL_XBET_USERS', JSON.stringify(allUsers));
        }
    }
    
    saveToGlobalRegistry(userData) {
        const registry = JSON.parse(localStorage.getItem(this.SYNC_KEY) || '{"users":[],"lastSync":0}');
        
        // Check if user exists
        const exists = registry.users.find(u => u.username === userData.username);
        if (!exists) {
            registry.users.push({
                ...userData,
                registeredAt: new Date().toISOString(),
                syncId: 'SYNC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            });
            registry.lastSync = Date.now();
            
            localStorage.setItem(this.SYNC_KEY, JSON.stringify(registry));
            console.log('✅ User saved to global registry:', userData.username);
        }
    }
    
    broadcastRegistration(userData) {
        // Create a unique sync event
        const syncEvent = {
            type: 'USER_REGISTERED',
            user: userData,
            timestamp: Date.now(),
            source: window.location.hostname,
            browser: navigator.userAgent
        };
        
        // Save to localStorage (triggers storage event in other tabs/browsers)
        localStorage.setItem('XBET_SYNC_EVENT_' + Date.now(), JSON.stringify(syncEvent));
        
        // Also save to a persistent sync queue
        this.addToSyncQueue(syncEvent);
    }
    
    addToSyncQueue(event) {
        const queue = JSON.parse(localStorage.getItem('XBET_SYNC_QUEUE') || '[]');
        queue.push(event);
        
        // Keep only last 100 events
        if (queue.length > 100) {
            queue.shift();
        }
        
        localStorage.setItem('XBET_SYNC_QUEUE', JSON.stringify(queue));
    }
    
    handleSync(newValue) {
        try {
            const registry = JSON.parse(newValue);
            if (registry && registry.users) {
                // Merge users into local storage
                this.mergeUsers(registry.users);
            }
        } catch (e) {
            console.error('Sync error:', e);
        }
    }
    
    mergeUsers(remoteUsers) {
        const localUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
        let added = 0;
        
        remoteUsers.forEach(remoteUser => {
            const exists = localUsers.find(u => u.username === remoteUser.username);
            if (!exists) {
                localUsers.push(remoteUser);
                added++;
            }
        });
        
        if (added > 0) {
            localStorage.setItem('ALL_XBET_USERS', JSON.stringify(localUsers));
            console.log(`🔄 Merged ${added} users from sync`);
            
            // Trigger UI update if admin panel
            if (typeof window.admin !== 'undefined') {
                window.admin.loadAllUsers();
            }
        }
    }
    
    syncFromRegistry() {
        const registry = JSON.parse(localStorage.getItem(this.SYNC_KEY) || '{"users":[]}');
        if (registry.users.length > 0) {
            this.mergeUsers(registry.users);
        }
    }
    
    // 🔥 GET ALL USERS FROM ALL SOURCES
    getAllUsers() {
        // 1. Get from local browser
        const localUsers = JSON.parse(localStorage.getItem('LOCAL_XBET_USERS') || '[]');
        
        // 2. Get from global registry
        const registry = JSON.parse(localStorage.getItem(this.SYNC_KEY) || '{"users":[]}');
        
        // 3. Get from ALL_XBET_USERS (admin format)
        const allUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
        
        // 4. Get from sync queue
        const queue = JSON.parse(localStorage.getItem('XBET_SYNC_QUEUE') || '[]');
        const queueUsers = queue.filter(e => e.type === 'USER_REGISTERED').map(e => e.user);
        
        // Merge all sources
        const allSources = [...localUsers, ...registry.users, ...allUsers, ...queueUsers];
        
        // Remove duplicates
        const uniqueUsers = [];
        const seen = new Set();
        
        allSources.forEach(user => {
            if (user.username && !seen.has(user.username)) {
                seen.add(user.username);
                uniqueUsers.push(user);
            }
        });
        
        return uniqueUsers;
    }
    
    // 🔥 FORCE SYNC (Call from admin panel)
    forceSync() {
        console.log('Forcing sync...');
        this.syncFromRegistry();
        
        // Trigger storage event manually
        const registry = JSON.parse(localStorage.getItem(this.SYNC_KEY) || '{"users":[]}');
        localStorage.setItem(this.SYNC_KEY, JSON.stringify(registry));
        
        return this.getAllUsers();
    }
}

// Create global instance
window.xbetSync = new XbetSync();
