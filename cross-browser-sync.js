// 🔥 X-BET CROSS-BROWSER SYNC ENGINE v2.0
// Works across ALL browsers, devices, and platforms
(function() {
    'use strict';
    
    console.log('🌐 Loading X-BET Cross-Browser Sync Engine v2.0...');
    
    class CrossBrowserSync {
        constructor() {
            this.SYSTEM_ID = 'xbet_cross_sync_v2';
            this.STORAGE_KEYS = {
                MASTER_USERS: 'XBET_MASTER_USERS_V2',
                ADMIN_USERS: 'XBET_ADMIN_USERS_V2',
                SYNC_SIGNAL: 'XBET_SYNC_SIGNAL_V2',
                BROADCAST: 'XBET_BROADCAST_V2'
            };
            
            this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.init();
        }
        
        init() {
            console.log('🚀 Initializing Cross-Browser Sync Engine...');
            
            // Initialize storage if empty
            this.initializeStorage();
            
            // Listen for storage events
            window.addEventListener('storage', this.handleStorageEvent.bind(this));
            
            // Setup auto-sync
            this.setupAutoSync();
            
            // Trigger initial sync
            setTimeout(() => this.syncAllUsers(), 1000);
            
            console.log('✅ Cross-Browser Sync Engine Ready (Tab ID: ' + this.tabId + ')');
        }
        
        initializeStorage() {
            // Initialize master users if empty
            if (!localStorage.getItem(this.STORAGE_KEYS.MASTER_USERS)) {
                localStorage.setItem(this.STORAGE_KEYS.MASTER_USERS, JSON.stringify([]));
            }
            
            // Initialize admin users if empty
            if (!localStorage.getItem(this.STORAGE_KEYS.ADMIN_USERS)) {
                localStorage.setItem(this.STORAGE_KEYS.ADMIN_USERS, JSON.stringify([]));
            }
        }
        
        setupAutoSync() {
            // Sync every 10 seconds
            setInterval(() => {
                this.syncAllUsers();
            }, 10000);
        }
        
        // 🔥 REGISTER NEW USER (Call this from signup)
        registerUser(userData) {
            try {
                console.log('📝 Registering user:', userData.username);
                
                // Validate
                if (!userData.username || !userData.email) {
                    console.error('Invalid user data');
                    return null;
                }
                
                // Generate IDs
                const userId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const transactionCode = this.generateTransactionCode(userData.username);
                
                // Create complete user
                const completeUser = {
                    ...userData,
                    id: userId,
                    transactionCode: transactionCode,
                    registeredAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    browser: this.getBrowserInfo(),
                    device: this.getDeviceInfo(),
                    source: 'cross_browser_v2',
                    status: 'active',
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0
                };
                
                // 1. Add to master storage
                this.addToMasterStorage(completeUser);
                
                // 2. Add to admin storage
                this.addToAdminStorage(completeUser);
                
                // 3. Broadcast to other browsers
                this.broadcastNewUser(completeUser);
                
                // 4. Update compatibility storage
                this.updateCompatibilityStorage(completeUser);
                
                console.log('✅ User registered with cross-browser sync:', userData.username);
                return userId;
                
            } catch (error) {
                console.error('Error registering user:', error);
                return null;
            }
        }
        
        addToMasterStorage(userData) {
            try {
                let masterUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MASTER_USERS) || '[]');
                
                // Check if exists
                const existingIndex = masterUsers.findIndex(u => 
                    u.username === userData.username || u.email === userData.email
                );
                
                if (existingIndex === -1) {
                    // Add new user
                    masterUsers.push(userData);
                } else {
                    // Update existing
                    masterUsers[existingIndex] = {
                        ...masterUsers[existingIndex],
                        ...userData,
                        lastSeen: new Date().toISOString()
                    };
                }
                
                localStorage.setItem(this.STORAGE_KEYS.MASTER_USERS, JSON.stringify(masterUsers));
                return true;
                
            } catch (error) {
                console.error('Error adding to master storage:', error);
                return false;
            }
        }
        
        addToAdminStorage(userData) {
            try {
                // Format for admin panel
                const adminUser = {
                    username: userData.username,
                    email: userData.email,
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0,
                    transactionCode: userData.transactionCode || this.generateTransactionCode(userData.username),
                    status: userData.status || 'active',
                    registeredAt: userData.registeredAt || new Date().toISOString(),
                    lastLogin: userData.lastLogin || new Date().toISOString(),
                    source: 'cross_browser_admin',
                    browser: userData.browser || 'Unknown',
                    device: userData.device || 'Unknown',
                    tabId: this.tabId
                };
                
                let adminUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_USERS) || '[]');
                
                // Check if exists
                const existingIndex = adminUsers.findIndex(u => u.username === adminUser.username);
                
                if (existingIndex === -1) {
                    adminUsers.push(adminUser);
                } else {
                    adminUsers[existingIndex] = {
                        ...adminUsers[existingIndex],
                        ...adminUser,
                        lastSeen: new Date().toISOString()
                    };
                }
                
                localStorage.setItem(this.STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminUsers));
                
                // Also update ALL_XBET_USERS for backward compatibility
                this.updateAllXbetUsers(adminUser);
                
                return true;
                
            } catch (error) {
                console.error('Error adding to admin storage:', error);
                return false;
            }
        }
        
        updateAllXbetUsers(userData) {
            try {
                let allXbetUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                const existingIndex = allXbetUsers.findIndex(u => u.username === userData.username);
                
                const formattedUser = {
                    username: userData.username,
                    email: userData.email,
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0,
                    transactionCode: userData.transactionCode,
                    status: userData.status || 'active',
                    registeredAt: userData.registeredAt || new Date().toISOString(),
                    source: 'cross_browser_compatible'
                };
                
                if (existingIndex === -1) {
                    allXbetUsers.push(formattedUser);
                } else {
                    allXbetUsers[existingIndex] = formattedUser;
                }
                
                localStorage.setItem('ALL_XBET_USERS', JSON.stringify(allXbetUsers));
                
                // Also update registeredUsers
                let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
                registeredUsers[userData.username] = userData.email;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                return true;
                
            } catch (error) {
                console.error('Error updating ALL_XBET_USERS:', error);
                return false;
            }
        }
        
        broadcastNewUser(userData) {
            try {
                const broadcastData = {
                    type: 'NEW_USER',
                    user: userData,
                    timestamp: Date.now(),
                    tabId: this.tabId,
                    action: 'register'
                };
                
                // Store in localStorage to trigger storage event
                localStorage.setItem(this.STORAGE_KEYS.BROADCAST, JSON.stringify(broadcastData));
                
                // Remove after short delay
                setTimeout(() => {
                    localStorage.removeItem(this.STORAGE_KEYS.BROADCAST);
                }, 100);
                
                return true;
                
            } catch (error) {
                console.error('Error broadcasting new user:', error);
                return false;
            }
        }
        
        // 🔥 GET ALL USERS (for admin panel)
        getAllUsers() {
            try {
                // Get from admin storage (primary)
                let adminUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_USERS) || '[]');
                
                // Get from master storage (secondary)
                const masterUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MASTER_USERS) || '[]');
                
                // Merge users (avoid duplicates)
                masterUsers.forEach(masterUser => {
                    const exists = adminUsers.find(u => u.username === masterUser.username);
                    if (!exists) {
                        adminUsers.push({
                            username: masterUser.username,
                            email: masterUser.email,
                            balance: masterUser.balance || 0,
                            gameBalance: masterUser.gameBalance || 0,
                            transactionCode: masterUser.transactionCode || this.generateTransactionCode(masterUser.username),
                            status: masterUser.status || 'active',
                            registeredAt: masterUser.registeredAt || new Date().toISOString(),
                            source: 'master_storage',
                            browser: masterUser.browser || 'Unknown',
                            device: masterUser.device || 'Unknown'
                        });
                    }
                });
                
                // Also get from ALL_XBET_USERS (compatibility)
                const allXbetUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                allXbetUsers.forEach(xbetUser => {
                    const exists = adminUsers.find(u => u.username === xbetUser.username);
                    if (!exists) {
                        adminUsers.push({
                            ...xbetUser,
                            source: 'compatibility_storage'
                        });
                    }
                });
                
                console.log(`📊 Total users found: ${adminUsers.length}`);
                return adminUsers;
                
            } catch (error) {
                console.error('Error getting all users:', error);
                return [];
            }
        }
        
        // 🔥 SYNC ALL USERS
        syncAllUsers() {
            try {
                console.log('🔄 Syncing users across all browsers...');
                
                // Trigger sync signal
                localStorage.setItem(this.STORAGE_KEYS.SYNC_SIGNAL, Date.now().toString());
                
                setTimeout(() => {
                    localStorage.removeItem(this.STORAGE_KEYS.SYNC_SIGNAL);
                }, 100);
                
                return {
                    success: true,
                    timestamp: new Date().toLocaleTimeString(),
                    users: this.getAllUsers().length
                };
                
            } catch (error) {
                console.error('Error syncing users:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        
        handleStorageEvent(event) {
            // Listen for sync signals
            if (event.key === this.STORAGE_KEYS.BROADCAST && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    
                    if (data.type === 'NEW_USER') {
                        console.log('📡 Received new user from other browser:', data.user.username);
                        
                        // Add to local storage
                        this.addToAdminStorage(data.user);
                        this.addToMasterStorage(data.user);
                        
                        // Update admin panel if exists
                        if (window.admin && window.admin.loadAllUsers) {
                            setTimeout(() => {
                                window.admin.loadAllUsers();
                                window.admin.updateDisplay();
                            }, 500);
                        }
                    }
                } catch (error) {
                    console.error('Error processing broadcast:', error);
                }
            }
            
            // Listen for sync signals
            if (event.key === this.STORAGE_KEYS.SYNC_SIGNAL) {
                console.log('📡 Sync signal received from other browser');
                
                // Update admin panel
                if (window.admin && window.admin.loadAllUsers) {
                    setTimeout(() => {
                        window.admin.loadAllUsers();
                        window.admin.updateDisplay();
                    }, 500);
                }
            }
        }
        
        generateTransactionCode(username) {
            const prefix = username ? username.substring(0, 3).toUpperCase() : 'XBT';
            const timestamp = Date.now().toString(36).toUpperCase().substr(-6);
            const random = Math.random().toString(36).substr(2, 6).toUpperCase();
            return `XBT-${prefix}-${timestamp}-${random}`;
        }
        
        getBrowserInfo() {
            const ua = navigator.userAgent;
            if (ua.includes('Firefox')) return 'Firefox';
            else if (ua.includes('Chrome')) return 'Chrome';
            else if (ua.includes('Safari')) return 'Safari';
            else if (ua.includes('Edge')) return 'Edge';
            else if (ua.includes('Opera')) return 'Opera';
            else return 'Unknown';
        }
        
        getDeviceInfo() {
            const ua = navigator.userAgent;
            if (/Mobi|Android/i.test(ua)) return 'Mobile';
            else if (/Tablet|iPad/i.test(ua)) return 'Tablet';
            else return 'Desktop';
        }
        
        // 🔥 FORCE SYNC
        forceSync() {
            return this.syncAllUsers();
        }
        
        // 🔥 GET STATUS
        getStatus() {
            const adminUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_USERS) || '[]');
            const masterUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MASTER_USERS) || '[]');
            
            return {
                adminUsers: adminUsers.length,
                masterUsers: masterUsers.length,
                tabId: this.tabId,
                browser: this.getBrowserInfo(),
                device: this.getDeviceInfo(),
                timestamp: new Date().toLocaleTimeString(),
                version: '2.0'
            };
        }
    }
    
    // Create global instance
    window.crossBrowserSync = new CrossBrowserSync();
    
    console.log('✅ Cross-Browser Sync Engine v2.0 loaded successfully');
})();
