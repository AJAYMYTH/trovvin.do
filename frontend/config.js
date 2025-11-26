// API Configuration
const API_CONFIG = {
    // Change this to your backend URL when deploying
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trovvin-do.onrender.com',
    
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
