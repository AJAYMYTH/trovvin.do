const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'youtube_downloader',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;

// Create connection pool
function createPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

// Test database connection
async function testConnection() {
    try {
        const connection = await createPool().getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.warn('⚠ Database connection failed:', error.message);
        console.warn('  Application will continue without database features');
        return false;
    }
}

// Issue Reports Operations
const issueReports = {
    async create(data) {
        const query = `
            INSERT INTO issue_reports 
            (issue_type, issue_title, video_url, browser, device, description, 
             steps_to_reproduce, email, severity, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await createPool().execute(query, [
            data.issueType,
            data.issueTitle,
            data.videoUrl,
            data.browser,
            data.device,
            data.description,
            data.stepsToReproduce,
            data.email,
            data.severity,
            data.ipAddress,
            data.userAgent
        ]);
        return result;
    }
};

// Contact Messages Operations
const contactMessages = {
    async create(data) {
        const query = `
            INSERT INTO contact_messages 
            (name, email, subject, category, message, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await createPool().execute(query, [
            data.name,
            data.email,
            data.subject,
            data.category,
            data.message,
            data.ipAddress,
            data.userAgent
        ]);
        return result;
    }
};

// Download Analytics Operations
const downloadAnalytics = {
    async log(data) {
        const query = `
            INSERT INTO download_analytics 
            (video_id, quality, format, media_type, success, error_message, duration, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await createPool().execute(query, [
            data.videoId,
            data.quality,
            data.format,
            data.mediaType,
            data.success,
            data.errorMessage,
            data.duration,
            data.ipAddress
        ]);
        return result;
    }
};

module.exports = {
    testConnection,
    issueReports,
    contactMessages,
    downloadAnalytics,
    pool: () => createPool()
};
