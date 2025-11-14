const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const cors = require('cors');
require('dotenv').config();

// Database configuration
const db = require('./db-config');
let dbAvailable = false;

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            FRONTEND_URL,
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            // Add your production frontend URLs here
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Performance Optimizations
app.use(compression()); // Enable GZIP compression
app.set('x-powered-by', false); // Hide Express signature

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;
}

// Test database connection on startup
(async () => {
    dbAvailable = await db.testConnection();
})();

// Video info endpoint
app.post('/video-info', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }
    
    try {
        const args = [
            '--dump-json',
            '--no-warnings',
            url
        ];
        
        const ytDlp = spawn('yt-dlp', args);
        let output = '';
        let errorOutput = '';
        
        ytDlp.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ytDlp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        ytDlp.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp error:', errorOutput);
                return res.status(500).json({ 
                    message: 'Failed to fetch video info. Check URL or yt-dlp installation.'
                });
            }
            
            try {
                const data = JSON.parse(output);
                
                res.json({
                    title: data.title,
                    duration: data.duration,
                    thumbnail: data.thumbnail,
                    formats: data.formats || [],
                    uploader: data.uploader,
                    view_count: data.view_count
                });
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                res.status(500).json({ message: 'Failed to parse video info' });
            }
        });
        
        ytDlp.on('error', (error) => {
            console.error('Spawn error:', error);
            res.status(500).json({ 
                message: 'Failed to execute yt-dlp. Make sure it is installed.',
                error: error.message 
            });
        });
        
    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch video info',
            error: error.message 
        });
    }
});

// Download endpoint - GET method for direct browser downloads
app.get('/download', async (req, res) => {
    const { url, mediaType, format, quality } = req.query;
    
    // Validate input
    if (!url || !mediaType || !format) {
        return res.status(400).send('Missing required parameters');
    }
    
    console.log('Download request:', { url, mediaType, format, quality });
    
    try {
        // First, get the video title
        const titleArgs = [
            '--get-title',
            '--no-warnings',
            url
        ];
        
        const titleProcess = spawn('yt-dlp', titleArgs);
        let videoTitle = '';
        
        titleProcess.stdout.on('data', (data) => {
            videoTitle += data.toString();
        });
        
        await new Promise((resolve, reject) => {
            titleProcess.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error('Failed to get video title'));
            });
            titleProcess.on('error', reject);
        });
        
        // Clean up the title for filename use
        videoTitle = videoTitle.trim()
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .substring(0, 100); // Limit length
        
        const filename = videoTitle ? `${videoTitle}.${format}` : `video.${format}`;
        
        console.log('Video title:', videoTitle);
        console.log('Filename:', filename);
        
        let ytDlpArgs = [];
        
        // Build download arguments based on media type
        if (mediaType === 'audio') {
            ytDlpArgs = [
                '-x',
                '--audio-format', format,
                '-o', '-'
            ];
            
            if (quality && quality !== 'auto' && quality !== 'best') {
                ytDlpArgs.splice(1, 0, '--audio-quality', quality + 'K');
            }
        } else {
            // Video download
            let formatSelector;
            
            if (quality && quality !== 'auto' && quality !== 'best') {
                formatSelector = `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`;
            } else {
                formatSelector = 'bestvideo+bestaudio/best';
            }
            
            ytDlpArgs = [
                '-f', formatSelector,
                '--merge-output-format', format,
                '--recode-video', format,
                '-o', '-'
            ];
        }
        
        // Add URL at the end
        ytDlpArgs.push(url);
        
        console.log('Executing: yt-dlp', ytDlpArgs.join(' '));
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        if (mediaType === 'audio') {
            const audioMimeTypes = {
                'mp3': 'audio/mpeg',
                'm4a': 'audio/mp4',
                'opus': 'audio/opus',
                'wav': 'audio/wav'
            };
            res.setHeader('Content-Type', audioMimeTypes[format] || 'application/octet-stream');
        } else {
            const videoMimeTypes = {
                'mp4': 'video/mp4',
                'webm': 'video/webm',
                'mkv': 'video/x-matroska'
            };
            res.setHeader('Content-Type', videoMimeTypes[format] || 'application/octet-stream');
        }
        
        // Spawn yt-dlp and pipe to response
        const downloadProcess = spawn('yt-dlp', ytDlpArgs);
        
        let hasError = false;
        let errorMessage = '';
        
        // Pipe stdout to response
        downloadProcess.stdout.pipe(res);
        
        // Log stderr
        downloadProcess.stderr.on('data', (data) => {
            const message = data.toString();
            console.log('yt-dlp:', message);
            
            if (message.toLowerCase().includes('error')) {
                hasError = true;
                errorMessage += message;
            }
        });
        
        downloadProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp exited with code:', code);
                console.error('Error details:', errorMessage);
                
                if (!res.headersSent) {
                    res.status(500).send('Download failed. Please try again.');
                }
            } else {
                console.log('Download completed successfully');
            }
        });
        
        downloadProcess.on('error', (error) => {
            console.error('Process error:', error);
            if (!res.headersSent) {
                res.status(500).send('Failed to start download. Make sure yt-dlp is installed.');
            }
        });
        
        // Handle client disconnect
        req.on('close', () => {
            if (!res.writableEnded) {
                console.log('Client disconnected, killing process');
                downloadProcess.kill();
            }
        });
        
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).send('Download failed: ' + error.message);
        }
    }
});

// Submit Issue Report endpoint
app.post('/submit-issue', async (req, res) => {
    if (!dbAvailable) {
        return res.status(503).json({ 
            message: 'Database not available. Issue report saved locally.',
            success: true // Still return success for UX
        });
    }

    try {
        const issueData = {
            issueType: req.body.issueType,
            issueTitle: req.body.issueTitle,
            videoUrl: req.body.videoUrl,
            browser: req.body.browser,
            device: req.body.device,
            description: req.body.description,
            stepsToReproduce: req.body.stepsToReproduce,
            email: req.body.email,
            severity: req.body.severity,
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        };

        await db.issueReports.create(issueData);
        
        res.json({ 
            success: true,
            message: 'Issue report submitted successfully' 
        });
    } catch (error) {
        console.error('Issue submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to submit issue report' 
        });
    }
});

// Submit Contact Message endpoint
app.post('/submit-contact', async (req, res) => {
    if (!dbAvailable) {
        return res.status(503).json({ 
            message: 'Database not available. Message saved locally.',
            success: true
        });
    }

    try {
        const contactData = {
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            category: req.body.category,
            message: req.body.message,
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        };

        await db.contactMessages.create(contactData);
        
        res.json({ 
            success: true,
            message: 'Message sent successfully' 
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message' 
        });
    }
});

// Log download analytics (optional)
app.post('/log-download', async (req, res) => {
    if (!dbAvailable) {
        return res.json({ success: true }); // Silently ignore if DB unavailable
    }

    try {
        const analyticsData = {
            videoId: req.body.videoId,
            quality: req.body.quality,
            format: req.body.format,
            mediaType: req.body.mediaType,
            success: req.body.success,
            errorMessage: req.body.errorMessage,
            duration: req.body.duration,
            ipAddress: getClientIP(req)
        };

        await db.downloadAnalytics.log(analyticsData);
        res.json({ success: true });
    } catch (error) {
        console.error('Analytics logging error:', error);
        res.json({ success: false }); // Don't fail the download for analytics
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 YouTube Downloader Server Running!`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🌐 Allowed Frontend: ${FRONTEND_URL}`);
    console.log(`📊 Database: ${dbAvailable ? 'Connected' : 'Disabled (Optional)'}`);
    console.log(`\n💡 Make sure yt-dlp is installed:`);
    console.log(`   pip install yt-dlp`);
    console.log(`   or: pip3 install yt-dlp\n`);
});
