// Firebase Sync Manager for Dashboard and Admin
class FirebaseSyncManager {
    constructor() {
        this.db = firebase.firestore();
        this.isConnected = false;
        this.init();
    }

    async init() {
        try {
            await this.db.collection('system').doc('ping').get();
            this.isConnected = true;
            console.log("✅ Firebase Sync Manager Ready");
        } catch (error) {
            console.log("⚠️ Firebase offline");
            this.isConnected = false;
        }
    }

    // User Management
    async getAllUsersFromFirebase() {
        try {
            const snapshot = await this.db.collection('users').get();
            const users = {};
            snapshot.forEach(doc => {
                users[doc.id] = { id: doc.id, ...doc.data() };
            });
            return users;
        } catch (error) {
            console.error("Error fetching users:", error);
            return {};
        }
    }

    async getUserActivities(userId, limit = 50) {
        try {
            const snapshot = await this.db.collection('activities')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            const activities = [];
            snapshot.forEach(doc => {
                activities.push({ id: doc.id, ...doc.data() });
            });
            return activities;
        } catch (error) {
            console.error("Error fetching activities:", error);
            return [];
        }
    }

    async getAllActivities(limit = 100) {
        try {
            const snapshot = await this.db.collection('activities')
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            
            const activities = [];
            snapshot.forEach(doc => {
                activities.push({ id: doc.id, ...doc.data() });
            });
            return activities;
        } catch (error) {
            console.error("Error fetching all activities:", error);
            return [];
        }
    }

    // Transaction Management
    async logTransaction(userId, username, type, amount, details) {
        try {
            await this.db.collection('transactions').add({
                userId: userId,
                username: username,
                type: type, // deposit, withdrawal, bet, win, bonus
                amount: amount,
                details: details,
                status: 'completed',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ipAddress: window.xbetStorage.getClientIP(),
                browser: navigator.userAgent
            });

            // Update user balance in Firebase
            await this.updateUserBalance(userId, type, amount);

            return { success: true };
        } catch (error) {
            console.error("Transaction log error:", error);
            return { success: false, error: error.message };
        }
    }

    async updateUserBalance(userId, type, amount) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                let newBalance = userData.balance || 0;
                
                if (type === 'deposit' || type === 'win' || type === 'bonus') {
                    newBalance += amount;
                } else if (type === 'withdrawal' || type === 'bet') {
                    newBalance -= amount;
                }
                
                await userRef.update({
                    balance: newBalance,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Balance update error:", error);
        }
    }

    // Game Management
    async logGameResult(userId, username, gameId, gameName, betAmount, winAmount, result) {
        try {
            await this.db.collection('games').add({
                userId: userId,
                username: username,
                gameId: gameId,
                gameName: gameName,
                betAmount: betAmount,
                winAmount: winAmount,
                result: result, // win, loss, draw
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ipAddress: window.xbetStorage.getClientIP(),
                browser: navigator.userAgent
            });

            // Update game balance
            await this.updateGameBalance(userId, winAmount - betAmount);

            return { success: true };
        } catch (error) {
            console.error("Game log error:", error);
            return { success: false, error: error.message };
        }
    }

    async updateGameBalance(userId, amount) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const currentGameBalance = userData.gameBalance || 0;
                const newGameBalance = currentGameBalance + amount;
                
                await userRef.update({
                    gameBalance: newGameBalance,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Game balance update error:", error);
        }
    }

    // Admin Functions
    async getSystemStats() {
        try {
            const statsRef = this.db.collection('system').doc('stats');
            const statsDoc = await statsRef.get();
            
            if (statsDoc.exists) {
                return statsDoc.data();
            } else {
                // Create default stats
                const defaultStats = {
                    totalUsers: 0,
                    totalAdmins: 0,
                    totalTransactions: 0,
                    totalGames: 0,
                    totalDeposits: 0,
                    totalWithdrawals: 0,
                    totalWins: 0,
                    totalLosses: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await statsRef.set(defaultStats);
                return defaultStats;
            }
        } catch (error) {
            console.error("Stats fetch error:", error);
            return null;
        }
    }

    async updateSystemStats(field, value) {
        try {
            const statsRef = this.db.collection('system').doc('stats');
            await statsRef.update({
                [field]: firebase.firestore.FieldValue.increment(value),
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Stats update error:", error);
        }
    }

    // Real-time Listeners
    setupRealTimeUserListener(callback) {
        return this.db.collection('users')
            .onSnapshot((snapshot) => {
                const users = {};
                snapshot.forEach(doc => {
                    users[doc.id] = { id: doc.id, ...doc.data() };
                });
                if (callback) callback(users);
            }, (error) => {
                console.error("User listener error:", error);
            });
    }

    setupRealTimeActivityListener(callback) {
        return this.db.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const activities = [];
                snapshot.forEach(doc => {
                    activities.push({ id: doc.id, ...doc.data() });
                });
                if (callback) callback(activities);
            }, (error) => {
                console.error("Activity listener error:", error);
            });
    }

    // Backup and Restore
    async backupLocalStorageToFirebase() {
        try {
            const backupData = {
                usersData: JSON.parse(localStorage.getItem('XBET_USERS_DATA') || '{}'),
                masterStore: JSON.parse(localStorage.getItem('XBET_MASTER_STORE') || '{}'),
                sessions: JSON.parse(localStorage.getItem('XBET_SESSIONS') || '{}'),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                browser: navigator.userAgent
            };

            await this.db.collection('backups').add(backupData);
            console.log("✅ Local storage backed up to Firebase");
            return { success: true };
        } catch (error) {
            console.error("Backup error:", error);
            return { success: false, error: error.message };
        }
    }

    async restoreFromFirebaseBackup(backupId) {
        try {
            const backupDoc = await this.db.collection('backups').doc(backupId).get();
            
            if (backupDoc.exists) {
                const backupData = backupDoc.data();
                
                localStorage.setItem('XBET_USERS_DATA', JSON.stringify(backupData.usersData || {}));
                localStorage.setItem('XBET_MASTER_STORE', JSON.stringify(backupData.masterStore || {}));
                localStorage.setItem('XBET_SESSIONS', JSON.stringify(backupData.sessions || {}));
                
                console.log("✅ Restored from Firebase backup");
                return { success: true };
            } else {
                return { success: false, error: "Backup not found" };
            }
        } catch (error) {
            console.error("Restore error:", error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize global sync manager
window.firebaseSync = new FirebaseSyncManager();
