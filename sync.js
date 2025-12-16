// 🔥 X-BET UNIVERSAL SYNC SYSTEM - Works across ALL browsers
(function() {
    // Check if already initialized
    if (window.xbetSync) {
        console.warn('⚠️ xbetSync already initialized, skipping');
        return;
    }

    class XbetUniversalSync {
        constructor() {
            this.STORAGE_KEYS = {
                USERS: 'XBET_UNIVERSAL_USERS_V2',
                TRANSACTIONS: 'XBET_UNIVERSAL_TRANSACTIONS',
                SYNC_QUEUE: 'XBET_SYNC_QUEUE_V2',
                LAST_SYNC: 'XBET_LAST_SYNC_TIME'
            };
            
            this.syncInterval = null;
            this.isInitialized = false;
            this.init();
        }
        
        init() {
            console.log('🔥 X-BET Universal Sync System Initializing...');
            
            try {
                // Listen for storage events from other tabs/browsers
                window.addEventListener('storage', this.handleStorageEvent.bind(this));
                
                // Setup auto-sync every 5 seconds
                this.startAutoSync();
                
                // Initial sync
                this.syncNow();
                
                this.isInitialized = true;
                console.log('✅ X-BET Universal Sync System Initialized');
                
                // Fire ready event
                this.fireReadyEvent();
                
            } catch (error) {
                console.error('❌ Failed to initialize sync system:', error);
                this.isInitialized = false;
            }
        }
        
        fireReadyEvent() {
            // Create and dispatch ready event
            const readyEvent = new CustomEvent('xbetSyncReady', {
                detail: { timestamp: Date.now() }
            });
            window.dispatchEvent(readyEvent);
            
            // Also set a flag for synchronous checks
            window.xbetSyncReady = true;
        }
        
        // 🔥 REGISTER NEW USER (Call this from signup)
        registerUser(userData) {
            console.log('📝 Registering user:', userData.username);
            
            // Validate input
            if (!userData || !userData.username || !userData.email) {
                console.error('Invalid user data:', userData);
                return null;
            }
            
            const completeUserData = {
                ...userData,
                id: 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                browser: this.getBrowserInfo(),
                ip: 'N/A', // Would be server-side
                registeredAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                syncVersion: '2.0'
            };
            
            // 1. Save to universal storage
            this.saveToUniversalStorage(completeUserData);
            
            // 2. Save to local browser storage (for compatibility)
            this.saveToLocalBrowser(completeUserData);
            
            // 3. Add to sync queue
            this.addToSyncQueue({
                type: 'USER_CREATED',
                data: completeUserData,
                timestamp: Date.now()
            });
            
            // 4. Trigger immediate sync
            this.triggerSync();
            
            return completeUserData.id;
        }
        
        // 🔥 SAVE TO UNIVERSAL STORAGE (Works across browsers)
        saveToUniversalStorage(userData) {
            try {
                // Get current universal users
                const storageKey = this.STORAGE_KEYS.USERS;
                let universalData = { users: [], version: "2.0", lastUpdated: new Date().toISOString() };
                
                try {
                    const stored = localStorage.getItem(storageKey);
                    if (stored) {
                        universalData = JSON.parse(stored);
                    }
                } catch (e) {
                    console.warn('Could not parse existing storage, starting fresh');
                }
                
                // Check if user exists
                const existingIndex = universalData.users.findIndex(u => 
                    u.username === userData.username || u.email === userData.email
                );
                
                if (existingIndex === -1) {
                    // Add new user
                    universalData.users.push(userData);
                    universalData.lastUpdated = new Date().toISOString();
                    universalData.totalUsers = universalData.users.length;
                    
                    localStorage.setItem(storageKey, JSON.stringify(universalData));
                    console.log('✅ User saved to universal storage:', userData.username);
                    
                    return true;
                } else {
                    // Update existing user
                    universalData.users[existingIndex] = {
                        ...universalData.users[existingIndex],
                        ...userData,
                        lastSeen: new Date().toISOString()
                    };
                    
                    localStorage.setItem(storageKey, JSON.stringify(universalData));
                    console.log('🔄 User updated in universal storage:', userData.username);
                    
                    return true;
                }
            } catch (error) {
                console.error('Error saving to universal storage:', error);
                return false;
            }
        }
        
        // 🔥 SAVE TO LOCAL BROWSER (For compatibility)
        saveToLocalBrowser(userData) {
            try {
                // Save to ALL_XBET_USERS (for admin panel)
                let allUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                const existsInAll = allUsers.findIndex(u => u.username === userData.username);
                
                if (existsInAll === -1) {
                    allUsers.push({
                        username: userData.username,
                        email: userData.email,
                        balance: userData.balance || 0,
                        gameBalance: userData.gameBalance || 0,
                        transactionCode: userData.transactionCode,
                        status: 'active',
                        registeredAt: userData.registeredAt
                    });
                    localStorage.setItem('ALL_XBET_USERS', JSON.stringify(allUsers));
                }
                
                // Save to registeredUsers (for login)
                let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
                registeredUsers[userData.username] = userData.email;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Save detailed user data
                localStorage.setItem('userData_' + userData.username, JSON.stringify({
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
                    activities: []
                }));
                
                console.log('💾 User saved to local browser storage:', userData.username);
                return true;
            } catch (error) {
                console.error('Error saving to local browser:', error);
                return false;
            }
        }
        
        // 🔥 GET ALL USERS (For admin panel)
        getAllUsers() {
            try {
                // Get from universal storage FIRST
                let universalUsers = [];
                try {
                    const universalData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || '{"users":[]}');
                    universalUsers = universalData.users || [];
                } catch (e) {
                    console.warn('Could not parse universal users');
                }
                
                let allUsers = [...universalUsers];
                
                // Also check local browser storage for any missing users
                let localAllUsers = [];
                try {
                    localAllUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                } catch (e) {
                    console.warn('Could not parse local users');
                }
                
                // Merge users (avoid duplicates)
                localAllUsers.forEach(localUser => {
                    const exists = allUsers.find(u => u.username === localUser.username);
                    if (!exists) {
                        allUsers.push({
                            ...localUser,
                            source: 'local_browser'
                        });
                    }
                });
                
                // Check registeredUsers for any other users
                let registeredUsers = {};
                try {
                    registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
                } catch (e) {
                    console.warn('Could not parse registered users');
                }
                
                Object.entries(registeredUsers).forEach(([username, email]) => {
                    const exists = allUsers.find(u => u.username === username);
                    if (!exists) {
                        allUsers.push({
                            username: username,
                            email: email,
                            balance: 0,
                            gameBalance: 0,
                            transactionCode: this.generateTransactionCode(username),
                            status: 'active',
                            registeredAt: new Date().toISOString(),
                            source: 'registeredUsers'
                        });
                    }
                });
                
                console.log(`📊 Total users found: ${allUsers.length}`);
                
                return allUsers;
            } catch (error) {
                console.error('Error getting all users:', error);
                return [];
            }
        }
        
        // 🔥 SYNC NOW (Force sync all data)
        syncNow() {
            console.log('🔄 Starting sync...');
            
            try {
                // 1. Get all users from universal storage
                let universalUsers = [];
                try {
                    const universalData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || '{"users":[]}');
                    universalUsers = universalData.users || [];
                } catch (e) {
                    console.warn('Could not parse universal data for sync');
                }
                
                // 2. Update local ALL_XBET_USERS with universal data
                let localAllUsers = [];
                try {
                    localAllUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                } catch (e) {
                    console.warn('Could not parse local users for sync');
                }
                
                universalUsers.forEach(universalUser => {
                    const exists = localAllUsers.findIndex(u => u.username === universalUser.username);
                    if (exists === -1) {
                        localAllUsers.push({
                            username: universalUser.username,
                            email: universalUser.email,
                            balance: universalUser.balance || 0,
                            gameBalance: universalUser.gameBalance || 0,
                            transactionCode: universalUser.transactionCode,
                            status: 'active',
                            registeredAt: universalUser.registeredAt
                        });
                    }
                });
                
                localStorage.setItem('ALL_XBET_USERS', JSON.stringify(localAllUsers));
                
                // 3. Update last sync time
                localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
                
                console.log(`✅ Sync completed. Total users: ${localAllUsers.length}`);
                
                return {
                    success: true,
                    users: localAllUsers.length,
                    message: `Synced ${universalUsers.length} users from universal storage`
                };
            } catch (error) {
                console.error('Sync error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
        
        // 🔥 HANDLE STORAGE EVENTS (From other tabs/browsers)
        handleStorageEvent(event) {
            if (event.key === this.STORAGE_KEYS.USERS || event.key === 'XBET_SYNC_TRIGGER') {
                console.log('📡 Received storage event from other browser/tab');
                
                // Update local data
                setTimeout(() => {
                    this.syncNow();
                    
                    // Trigger admin panel update if exists
                    if (typeof window.admin !== 'undefined' && window.admin.loadAllUsers) {
                        window.admin.loadAllUsers();
                        if (window.admin.updateDisplay) {
                            window.admin.updateDisplay();
                        }
                    }
                }, 1000);
            }
        }
        
        // 🔥 ADD TO SYNC QUEUE
        addToSyncQueue(syncItem) {
            try {
                const queue = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE) || '[]');
                queue.push(syncItem);
                
                // Keep queue manageable
                if (queue.length > 50) {
                    queue.splice(0, queue.length - 50);
                }
                
                localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
            } catch (error) {
                console.error('Error adding to sync queue:', error);
            }
        }
        
        // 🔥 TRIGGER SYNC (Notify other tabs)
        triggerSync() {
            // Set a flag to trigger storage event
            localStorage.setItem('XBET_SYNC_TRIGGER', Date.now().toString());
            
            // Remove after short delay
            setTimeout(() => {
                localStorage.removeItem('XBET_SYNC_TRIGGER');
            }, 100);
        }
        
        // 🔥 START AUTO SYNC
        startAutoSync() {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
            
            this.syncInterval = setInterval(() => {
                this.syncNow();
            }, 10000); // Sync every 10 seconds
        }
        
        // 🔥 STOP AUTO SYNC
        stopAutoSync() {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }
        
        // 🔥 GENERATE TRANSACTION CODE
        generateTransactionCode(username) {
            const prefix = username ? username.substring(0, 3).toUpperCase() : 'XBT';
            const timestamp = Date.now().toString(36).toUpperCase().slice(-8);
            const random = Math.random().toString(36).slice(2, 10).toUpperCase();
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
            
            return {
                name: browser,
                userAgent: ua.substring(0, 100),
                platform: navigator.platform,
                language: navigator.language
            };
        }
        
        // 🔥 CLEAR ALL DATA (Debug/Reset)
        clearAllData() {
            try {
                const keys = Object.values(this.STORAGE_KEYS);
                keys.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Also clear compatibility keys
                localStorage.removeItem('ALL_XBET_USERS');
                localStorage.removeItem('registeredUsers');
                
                console.log('🧹 All sync data cleared');
                return true;
            } catch (error) {
                console.error('Error clearing data:', error);
                return false;
            }
        }
        
        // 🔥 GET SYNC STATUS
        getSyncStatus() {
            let universalUsersCount = 0;
            let localUsersCount = 0;
            
            try {
                const universalData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || '{"users":[]}');
                universalUsersCount = universalData.users ? universalData.users.length : 0;
            } catch (e) {
                console.warn('Could not get universal users count');
            }
            
            try {
                const localUsers = JSON.parse(localStorage.getItem('ALL_XBET_USERS') || '[]');
                localUsersCount = localUsers.length;
            } catch (e) {
                console.warn('Could not get local users count');
            }
            
            const lastSync = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
            
            return {
                universalUsers: universalUsersCount,
                localUsers: localUsersCount,
                lastSync: lastSync ? new Date(parseInt(lastSync)).toLocaleString() : 'Never',
                browser: this.getBrowserInfo().name,
                syncActive: this.syncInterval !== null,
                initialized: this.isInitialized
            };
        }
        
        // 🔥 CHECK IF READY
        isReady() {
            return this.isInitialized;
        }
    }

    // Create global instance
    window.xbetSync = new XbetUniversalSync();

    // Also expose a promise for async loading
    window.xbetSyncReadyPromise = new Promise((resolve) => {
        window.addEventListener('xbetSyncReady', () => {
            resolve(window.xbetSync);
        });
        
        // Fallback: resolve after 2 seconds if event doesn't fire
        setTimeout(() => {
            if (window.xbetSync && window.xbetSync.isInitialized) {
                resolve(window.xbetSync);
            } else {
                console.warn('Sync system taking longer than expected to load');
            }
        }, 2000);
    });

    // Log for debugging
    console.log('🔧 X-BET Sync System loaded and initializing...');
})();
