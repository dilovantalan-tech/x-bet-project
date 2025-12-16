// 🔥 X-BET UNIVERSAL SYNC SYSTEM v4.0 - FIXED FOR ADMIN PANEL
(function() {
    'use strict';
    
    console.log('🔄 Loading X-BET Universal Sync System v4.0...');
    
    class XbetUniversalSync {
        constructor() {
            this.STORAGE_KEYS = {
                USERS: 'XBET_UNIVERSAL_USERS_V4',
                USERS_ADMIN: 'XBET_ADMIN_USERS_V4',  // Special storage for admin panel
                SYNC_QUEUE: 'XBET_SYNC_QUEUE_V4',
                LAST_SYNC: 'XBET_LAST_SYNC_V4',
                ADMIN_UPDATE: 'XBET_ADMIN_UPDATE_V4'
            };
            
            this.syncInterval = null;
            this.isInitialized = false;
            this.init();
        }
        
        init() {
            try {
                console.log('🛠 Initializing Universal Sync System...');
                
                // Listen for storage events from other tabs/browsers
                window.addEventListener('storage', this.handleStorageEvent.bind(this));
                
                // Initial sync
                this.syncAllUsersToAdminStorage();
                
                // Start auto-sync
                this.startAutoSync(10000); // Every 10 seconds
                
                this.isInitialized = true;
                console.log('✅ Universal Sync System Initialized!');
                
                // Set global flag
                window.xbetSyncReady = true;
                
            } catch (error) {
                console.error('❌ Failed to initialize sync system:', error);
            }
        }
        
        // 🔥 REGISTER NEW USER (from signup)
        registerUser(userData) {
            try {
                console.log('📝 Registering user in universal system:', userData.username);
                
                // Validate input
                if (!userData || !userData.username || !userData.email) {
                    console.error('Invalid user data');
                    return null;
                }
                
                // Generate user ID and transaction code
                const userId = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const transactionCode = this.generateTransactionCode(userData.username);
                
                // Complete user data
                const completeUserData = {
                    ...userData,
                    id: userId,
                    transactionCode: transactionCode,
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0,
                    registeredAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    status: 'active',
                    isAdmin: false,
                    source: 'universal_sync_v4',
                    browser: this.getBrowserInfo(),
                    device: this.getDeviceInfo()
                };
                
                // 1. Save to universal storage
                this.saveToUniversalStorage(completeUserData);
                
                // 2. Save to admin storage (CRITICAL - makes users appear in admin panel)
                this.saveToAdminStorage(completeUserData);
                
                // 3. Save to local storage for backward compatibility
                this.saveToLocalStorage(completeUserData);
                
                // 4. Trigger sync event for other tabs
                this.triggerSync('USER_CREATED');
                
                console.log('✅ User registered:', userData.username, 'ID:', userId);
                return userId;
                
            } catch (error) {
                console.error('Error registering user:', error);
                return null;
            }
        }
        
        // 🔥 SAVE TO UNIVERSAL STORAGE (across all browsers)
        saveToUniversalStorage(userData) {
            try {
                const storageKey = this.STORAGE_KEYS.USERS;
                let allUsers = [];
                
                // Get existing users
                const existingData = localStorage.getItem(storageKey);
                if (existingData) {
                    try {
                        allUsers = JSON.parse(existingData);
                        if (!Array.isArray(allUsers)) {
                            allUsers = [];
                        }
                    } catch (e) {
                        allUsers = [];
                    }
                }
                
                // Check if user exists
                const existingIndex = allUsers.findIndex(u => 
                    u.username === userData.username || u.email === userData.email
                );
                
                if (existingIndex === -1) {
                    // Add new user
                    allUsers.push(userData);
                    console.log('✅ Added to universal storage:', userData.username);
                } else {
                    // Update existing user
                    allUsers[existingIndex] = {
                        ...allUsers[existingIndex],
                        ...userData,
                        lastSeen: new Date().toISOString()
                    };
                    console.log('🔄 Updated in universal storage:', userData.username);
                }
                
                // Save back to storage
                localStorage.setItem(storageKey, JSON.stringify(allUsers));
                return true;
                
            } catch (error) {
                console.error('Error saving to universal storage:', error);
                return false;
            }
        }
        
        // 🔥 SAVE TO ADMIN STORAGE (CRITICAL - makes users appear in admin panel)
        saveToAdminStorage(userData) {
            try {
                const storageKey = this.STORAGE_KEYS.USERS_ADMIN;
                let adminUsers = [];
                
                // Get existing admin users
                const existingData = localStorage.getItem(storageKey);
                if (existingData) {
                    try {
                        adminUsers = JSON.parse(existingData);
                        if (!Array.isArray(adminUsers)) {
                            adminUsers = [];
                        }
                    } catch (e) {
                        adminUsers = [];
                    }
                }
                
                // Format user for admin panel
                const adminUserData = {
                    username: userData.username,
                    email: userData.email,
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0,
                    transactionCode: userData.transactionCode,
                    status: userData.status || 'active',
                    registeredAt: userData.registeredAt || new Date().toISOString(),
                    lastLogin: userData.lastLogin || userData.lastSeen || new Date().toISOString(),
                    source: userData.source || 'universal_sync',
                    browser: userData.browser || 'Unknown',
                    device: userData.device || 'Unknown',
                    isAdmin: userData.isAdmin || false
                };
                
                // Check if user exists
                const existingIndex = adminUsers.findIndex(u => u.username === userData.username);
                
                if (existingIndex === -1) {
                    // Add new user
                    adminUsers.push(adminUserData);
                    console.log('👑 Added to admin storage:', userData.username);
                } else {
                    // Update existing user
                    adminUsers[existingIndex] = {
                        ...adminUsers[existingIndex],
                        ...adminUserData,
                        lastSeen: new Date().toISOString()
                    };
                }
                
                // Save to admin storage
                localStorage.setItem(storageKey, JSON.stringify(adminUsers));
                
                // Also update ALL_XBET_USERS for backward compatibility
                this.updateAllXbetUsers(adminUserData);
                
                // Trigger admin update event
                this.triggerAdminUpdate();
                
                return true;
                
            } catch (error) {
                console.error('Error saving to admin storage:', error);
                return false;
            }
        }
        
        // 🔥 UPDATE ALL_XBET_USERS (for backward compatibility)
        updateAllXbetUsers(userData) {
            try {
                let allXbetUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                const existingIndex = allXbetUsers.findIndex(u => u.username === userData.username);
                
                if (existingIndex === -1) {
                    // Add new user
                    allXbetUsers.push({
                        username: userData.username,
                        email: userData.email,
                        balance: userData.balance || 0,
                        gameBalance: userData.gameBalance || 0,
                        transactionCode: userData.transactionCode,
                        status: userData.status || 'active',
                        registeredAt: userData.registeredAt || new Date().toISOString(),
                        source: 'universal_sync_v4'
                    });
                } else {
                    // Update existing user
                    allXbetUsers[existingIndex] = {
                        ...allXbetUsers[existingIndex],
                        ...userData
                    };
                }
                
                localStorage.setItem('ALL_XBET_USERS', JSON.stringify(allXbetUsers));
                return true;
                
            } catch (error) {
                console.error('Error updating ALL_XBET_USERS:', error);
                return false;
            }
        }
        
        // 🔥 SAVE TO LOCAL STORAGE (for backward compatibility)
        saveToLocalStorage(userData) {
            try {
                // Save to registeredUsers
                let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
                registeredUsers[userData.username] = userData.email;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Save detailed user data
                const detailedData = {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password || '',
                    balance: userData.balance || 0,
                    gameBalance: userData.gameBalance || 0,
                    transactionCode: userData.transactionCode,
                    isAdmin: false,
                    status: 'active',
                    registeredAt: userData.registeredAt,
                    lastLogin: new Date().toISOString(),
                    activities: userData.activities || []
                };
                
                localStorage.setItem('userData_' + userData.username, JSON.stringify(detailedData));
                return true;
                
            } catch (error) {
                console.error('Error saving to local storage:', error);
                return false;
            }
        }
        
        // 🔥 GET ALL USERS FOR ADMIN PANEL
        getAllUsers() {
            try {
                // First, sync any universal users to admin storage
                this.syncAllUsersToAdminStorage();
                
                // Get users from admin storage
                const adminUsersData = localStorage.getItem(this.STORAGE_KEYS.USERS_ADMIN);
                let adminUsers = [];
                
                if (adminUsersData) {
                    try {
                        adminUsers = JSON.parse(adminUsersData);
                        if (!Array.isArray(adminUsers)) {
                            adminUsers = [];
                        }
                    } catch (e) {
                        adminUsers = [];
                    }
                }
                
                // Also check ALL_XBET_USERS for backward compatibility
                const allXbetUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                
                // Merge users (avoid duplicates)
                allXbetUsers.forEach(xbetUser => {
                    const exists = adminUsers.find(u => u.username === xbetUser.username);
                    if (!exists) {
                        adminUsers.push({
                            ...xbetUser,
                            source: xbetUser.source || 'legacy_all_xbet'
                        });
                    }
                });
                
                // Also check registeredUsers for any missing users
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
                Object.entries(registeredUsers).forEach(([username, email]) => {
                    const exists = adminUsers.find(u => u.username === username);
                    if (!exists) {
                        adminUsers.push({
                            username: username,
                            email: email,
                            balance: 0,
                            gameBalance: 0,
                            transactionCode: this.generateTransactionCode(username),
                            status: 'active',
                            registeredAt: new Date().toISOString(),
                            source: 'legacy_registered'
                        });
                    }
                });
                
                console.log(`📊 Total users for admin: ${adminUsers.length}`);
                return adminUsers;
                
            } catch (error) {
                console.error('Error getting all users:', error);
                return [];
            }
        }
        
        // 🔥 SYNC ALL UNIVERSAL USERS TO ADMIN STORAGE
        syncAllUsersToAdminStorage() {
            try {
                console.log('🔄 Syncing universal users to admin storage...');
                
                // Get all universal users
                const universalData = localStorage.getItem(this.STORAGE_KEYS.USERS);
                let universalUsers = [];
                
                if (universalData) {
                    try {
                        universalUsers = JSON.parse(universalData);
                        if (!Array.isArray(universalUsers)) {
                            universalUsers = [];
                        }
                    } catch (e) {
                        universalUsers = [];
                    }
                }
                
                // Get current admin users
                let adminUsers = [];
                const adminData = localStorage.getItem(this.STORAGE_KEYS.USERS_ADMIN);
                if (adminData) {
                    try {
                        adminUsers = JSON.parse(adminData);
                        if (!Array.isArray(adminUsers)) {
                            adminUsers = [];
                        }
                    } catch (e) {
                        adminUsers = [];
                    }
                }
                
                // Sync each universal user
                universalUsers.forEach(universalUser => {
                    const exists = adminUsers.findIndex(u => u.username === universalUser.username);
                    
                    const adminUserData = {
                        username: universalUser.username,
                        email: universalUser.email,
                        balance: universalUser.balance || 0,
                        gameBalance: universalUser.gameBalance || 0,
                        transactionCode: universalUser.transactionCode || this.generateTransactionCode(universalUser.username),
                        status: universalUser.status || 'active',
                        registeredAt: universalUser.registeredAt || new Date().toISOString(),
                        lastLogin: universalUser.lastLogin || universalUser.lastSeen || new Date().toISOString(),
                        source: universalUser.source || 'universal_sync',
                        browser: universalUser.browser || 'Unknown',
                        device: universalUser.device || 'Unknown',
                        isAdmin: universalUser.isAdmin || false
                    };
                    
                    if (exists === -1) {
                        // Add new user
                        adminUsers.push(adminUserData);
                    } else {
                        // Update existing user
                        adminUsers[exists] = {
                            ...adminUsers[exists],
                            ...adminUserData,
                            lastSeen: new Date().toISOString()
                        };
                    }
                });
                
                // Save back to admin storage
                localStorage.setItem(this.STORAGE_KEYS.USERS_ADMIN, JSON.stringify(adminUsers));
                
                // Update timestamp
                localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
                
                console.log(`✅ Synced ${universalUsers.length} users to admin storage`);
                return {
                    success: true,
                    synced: universalUsers.length,
                    total: adminUsers.length
                };
                
            } catch (error) {
                console.error('Error syncing to admin storage:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        
        // 🔥 TRIGGER ADMIN UPDATE (notify admin panel)
        triggerAdminUpdate() {
            try {
                localStorage.setItem(this.STORAGE_KEYS.ADMIN_UPDATE, Date.now().toString());
                setTimeout(() => {
                    localStorage.removeItem(this.STORAGE_KEYS.ADMIN_UPDATE);
                }, 100);
                console.log('📢 Triggered admin panel update');
            } catch (error) {
                console.error('Error triggering admin update:', error);
            }
        }
        
        // 🔥 TRIGGER SYNC (notify other tabs)
        triggerSync(type) {
            try {
                const queue = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE) || '[]');
                queue.push({
                    type: type,
                    timestamp: Date.now(),
                    browser: this.getBrowserInfo()
                });
                
                // Keep queue manageable
                if (queue.length > 50) {
                    queue.splice(0, queue.length - 50);
                }
                
                localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
                
                console.log(`📡 Triggered sync: ${type}`);
                
            } catch (error) {
                console.error('Error triggering sync:', error);
            }
        }
        
        // 🔥 HANDLE STORAGE EVENTS
        handleStorageEvent(event) {
            if (event.key === this.STORAGE_KEYS.USERS || 
                event.key === this.STORAGE_KEYS.ADMIN_UPDATE) {
                console.log('📡 Storage event received from other tab');
                
                // Sync to admin storage
                setTimeout(() => {
                    this.syncAllUsersToAdminStorage();
                    this.triggerAdminUpdate();
                }, 500);
            }
        }
        
        // 🔥 START AUTO SYNC
        startAutoSync(interval = 10000) {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
            
            this.syncInterval = setInterval(() => {
                this.syncAllUsersToAdminStorage();
            }, interval);
            
            console.log(`⏰ Auto-sync started (${interval/1000}s interval)`);
        }
        
        // 🔥 GENERATE TRANSACTION CODE
        generateTransactionCode(username) {
            const prefix = username ? username.substring(0, 3).toUpperCase() : 'XBT';
            const timestamp = Date.now().toString(36).toUpperCase().substr(-6);
            const random = Math.random().toString(36).substr(2, 6).toUpperCase();
            return `XBT-${prefix}-${timestamp}-${random}`;
        }
        
        // 🔥 GET BROWSER INFO
        getBrowserInfo() {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            
            if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Safari')) browser = 'Safari';
            else if (ua.includes('Edge')) browser = 'Edge';
            else if (ua.includes('Opera')) browser = 'Opera';
            
            return browser;
        }
        
        // 🔥 GET DEVICE INFO
        getDeviceInfo() {
            const ua = navigator.userAgent;
            if (/Mobi|Android/i.test(ua)) {
                return 'Mobile';
            } else if (/Tablet|iPad/i.test(ua)) {
                return 'Tablet';
            } else {
                return 'Desktop';
            }
        }
        
        // 🔥 GET SYNC STATUS
        getSyncStatus() {
            try {
                const universalData = localStorage.getItem(this.STORAGE_KEYS.USERS);
                const adminData = localStorage.getItem(this.STORAGE_KEYS.USERS_ADMIN);
                
                let universalCount = 0;
                let adminCount = 0;
                
                if (universalData) {
                    try {
                        const users = JSON.parse(universalData);
                        universalCount = Array.isArray(users) ? users.length : 0;
                    } catch (e) {
                        universalCount = 0;
                    }
                }
                
                if (adminData) {
                    try {
                        const users = JSON.parse(adminData);
                        adminCount = Array.isArray(users) ? users.length : 0;
                    } catch (e) {
                        adminCount = 0;
                    }
                }
                
                const lastSync = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
                
                return {
                    universalUsers: universalCount,
                    adminUsers: adminCount,
                    lastSync: lastSync ? new Date(parseInt(lastSync)).toLocaleTimeString() : 'Never',
                    browser: this.getBrowserInfo(),
                    device: this.getDeviceInfo(),
                    syncActive: this.syncInterval !== null,
                    initialized: this.isInitialized,
                    version: '4.0'
                };
                
            } catch (error) {
                console.error('Error getting sync status:', error);
                return {
                    universalUsers: 0,
                    adminUsers: 0,
                    lastSync: 'Error',
                    browser: 'Unknown',
                    device: 'Unknown',
                    syncActive: false,
                    initialized: false,
                    version: '4.0'
                };
            }
        }
        
        // 🔥 CHECK IF READY
        isReady() {
            return this.isInitialized;
        }
        
        // 🔥 FORCE SYNC
        forceSync() {
            console.log('🔄 Manual sync requested');
            return this.syncAllUsersToAdminStorage();
        }
    }
    
    // Create global instance
    if (!window.xbetSync) {
        window.xbetSync = new XbetUniversalSync();
    }
    
    console.log('📦 X-BET Universal Sync System v4.0 loaded');
})();
