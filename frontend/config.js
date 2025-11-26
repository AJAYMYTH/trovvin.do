// API Configuration
const API_CONFIG = {
    // Change this to your backend URL when deploying
<<<<<<< HEAD
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trovvin-do.onrender.com',
=======
    BASE_URL: window.location.hostname === 'Render' 
        ? 'https://trovvin-do.onrender.com' 
        : ' https://trovvin-do.onrender.com',
>>>>>>> b7f3983aa299c58ef8b9846922fb4bbdbf777f69
    
    ENDPOINTS: {
        VIDEO_INFO: '/video-info',
        DOWNLOAD: '/download',
        SUBMIT_ISSUE: '/submit-issue',
        SUBMIT_CONTACT: '/submit-contact',
        LOG_DOWNLOAD: '/log-download',
        HEALTH: '/health'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[endpoint];
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, getApiUrl };
}
