import { auth, signInWithGitHub, logout } from './auth/firebase-auth.js';

// Auth UI Templates
function renderAuthUI() {
    return `
        <div class="auth-container">
            <h1>X-Bet 🎯</h1>
            <p>Zero Cost Gamma Platform</p>
            <button id="githubSignIn" class="btn btn-github">
                🚀 Sign in with GitHub
            </button>
        </div>
    `;
}

function renderUserProfile(user) {
    return `
        <div class="user-profile">
            <img src="${user.photoURL}" alt="Profile" class="avatar">
            <span>Welcome, ${user.displayName}!</span>
            <button id="logoutBtn" class="btn btn-logout">Logout</button>
        </div>
    `;
}

function renderDashboard() {
    return `
        <div class="dashboard">
            <div class="user-stats">
                <div class="stat-card">
                    <h3>Points Balance</h3>
                    <p class="points">1,000</p>
                </div>
                <div class="stat-card">
                    <h3>Active Predictions</h3>
                    <p class="predictions">0</p>
                </div>
            </div>
            
            <div class="games-section">
                <h2>🎮 Available Predictions</h2>
                <div class="games-grid">
                    <div class="game-card">
                        <h3>ETH Price Prediction</h3>
                        <p>⏰ Deadline: 2 hours</p>
                        <p>👥 Participants: 150</p>
                        <button class="btn-predict">Make Prediction</button>
                    </div>
                    <div class="game-card">
                        <h3>BTC Weekly Close</h3>
                        <p>⏰ Deadline: 1 day</p>
                        <p>👥 Participants: 89</p>
                        <button class="btn-predict">Make Prediction</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Main App Logic
function initApp() {
    auth.onAuthStateChanged((user) => {
        const authSection = document.getElementById('auth-section');
        const mainContent = document.getElementById('main-content');
        
        if (user) {
            // User is signed in
            authSection.innerHTML = renderUserProfile(user);
            mainContent.style.display = 'block';
            mainContent.innerHTML = renderDashboard();
            
            // Add logout event listener
            document.getElementById('logoutBtn').addEventListener('click', logout);
        } else {
            // User is signed out
            authSection.innerHTML = renderAuthUI();
            mainContent.style.display = 'none';
            
            // Add login event listener
            document.getElementById('githubSignIn').addEventListener('click', signInWithGitHub);
        }
    });
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', initApp);
