// session.js - Save this in js/session.js
const SessionManager = {
    // Check if user is logged in
    isLoggedIn: function() {
        const token = localStorage.getItem('xbet_token');
        const user = localStorage.getItem('xbet_user');
        return token && user;
    },

    // Login user
    login: function(userData) {
        localStorage.setItem('xbet_token', userData.token || 'demo_token_12345');
        localStorage.setItem('xbet_user', JSON.stringify(userData));
        sessionStorage.setItem('is_logged_in', 'true');
        return true;
    },

    // Logout user
    logout: function() {
        localStorage.removeItem('xbet_token');
        localStorage.removeItem('xbet_user');
        sessionStorage.removeItem('is_logged_in');
        window.location.href = 'index.html';
    },

    // Get current user
    getCurrentUser: function() {
        const userStr = localStorage.getItem('xbet_user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return {
            username: 'Guest',
            balance: 0,
            user_id: 'guest_001'
        };
    },

    // Update user data
    updateUser: function(data) {
        const current = this.getCurrentUser();
        const updated = { ...current, ...data };
        localStorage.setItem('xbet_user', JSON.stringify(updated));
        return updated;
    }
};
