const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const compression = require('compression');
require('dotenv').config();

const fsPromises = fs.promises;

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// CORS Configuration - Allow all origins for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Performance Optimizations
app.use(compression()); // Enable GZIP compression
app.set('x-powered-by', false); // Hide Express signature

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));



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
            '--no-check-certificates',  // Skip certificate check for some regions
            url
        ];
        
        // Try different ways to call yt-dlp
        let ytDlp;
        const commandsToTry = [
            ['python3', ['-m', 'yt_dlp', ...args]],
            ['python', ['-m', 'yt_dlp', ...args]],
            ['yt-dlp', args]
        ];
        
        let lastError = null;
        for (const [command, cmdArgs] of commandsToTry) {
            try {
                ytDlp = spawn(command, cmdArgs);
                // If we get here without an exception, break out of the loop
                break;
            } catch (error) {
                lastError = error;
                console.log(`Failed to spawn ${command}:`, error.message);
            }
        }
        
        if (!ytDlp) {
            throw new Error(`Failed to spawn yt-dlp with any method. Last error: ${lastError?.message || 'Unknown error'}`);
        }
        
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
                    message: 'Failed to fetch video info. The URL may be invalid or the video may be unavailable.'
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
                message: 'Failed to execute yt-dlp. Make sure it is installed and in PATH.',
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

function buildDownloadArgs(url, mediaType, format, quality, outputTemplate) {
    const baseArgs = [
        '--no-warnings',
        '--no-check-certificates',
        '--retries', '10',
        '--fragment-retries', '10',
        '--socket-timeout', '30'
    ];

    if (mediaType === 'audio') {
        const audioQuality = quality && quality !== 'best' ? String(quality) : '0';

        return [
            ...baseArgs,
            '-f', 'bestaudio/best',
            '-x',
            '--audio-format', format,
            '--audio-quality', audioQuality,
            '--embed-metadata',
            '--embed-thumbnail',
            '--no-mtime',
            '-o', outputTemplate,
            url
        ];
    }

    const isNumericQuality = quality && quality !== 'best' && !isNaN(Number(quality));
    const selectorParts = [];

    if (isNumericQuality) {
        selectorParts.push(
            `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]`,
            `bestvideo[height<=${quality}]+bestaudio`
        );
    }

    selectorParts.push(
        'bestvideo[ext=mp4]+bestaudio[ext=m4a]',
        'bestvideo+bestaudio',
        'best[ext=mp4]',
        'best'
    );

    const formatSelector = selectorParts.join('/');

    return [
        ...baseArgs,
        '-f', formatSelector,
        '--merge-output-format', format,
        '--embed-metadata',
        '--no-mtime',
        '-o', outputTemplate,
        url
    ];
}

// Download endpoint - GET method for direct browser downloads
app.get('/download', async (req, res) => {
    const { url, mediaType, format, quality } = req.query;

    if (!url || !mediaType || !format) {
        return res.status(400).send('Missing required parameters');
    }

    console.log('Download request:', { url, mediaType, format, quality });

    try {
        const titleArgs = [
            '--get-title',
            '--no-warnings',
            '--no-check-certificates',
            url
        ];

        // Try different ways to call yt-dlp for title extraction
        let titleProcess;
        const commandsToTry = [
            ['python3', ['-m', 'yt_dlp', ...titleArgs]],
            ['python', ['-m', 'yt_dlp', ...titleArgs]],
            ['yt-dlp', titleArgs]
        ];
        
        let lastError = null;
        for (const [command, cmdArgs] of commandsToTry) {
            try {
                titleProcess = spawn(command, cmdArgs);
                // If we get here without an exception, break out of the loop
                break;
            } catch (error) {
                lastError = error;
                console.log(`Failed to spawn ${command} for title:`, error.message);
            }
        }
        
        if (!titleProcess) {
            throw new Error(`Failed to spawn yt-dlp for title with any method. Last error: ${lastError?.message || 'Unknown error'}`);
        }

        let videoTitle = '';
        let titleError = '';

        titleProcess.stdout.on('data', (data) => {
            videoTitle += data.toString();
        });

        titleProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            titleError += msg;
            console.log('yt-dlp title:', msg);
        });

        await new Promise((resolve, reject) => {
            titleProcess.on('close', (code) => {
                if (code === 0 && videoTitle.trim()) {
                    resolve();
                } else {
                    console.error('Failed to get video title:', titleError || videoTitle);
                    resolve();
                }
            });
            titleProcess.on('error', reject);
        });

        let safeTitle = (videoTitle || '').trim()
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .substring(0, 100);

        const filename = safeTitle ? `${safeTitle}.${format}` : `video.${format}`;

        console.log('Resolved filename:', filename);

        const tempDir = path.join(os.tmpdir(), 'trovvin-do-downloads');
        await fsPromises.mkdir(tempDir, { recursive: true });
        const tempFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`;
        const tempFilePath = path.join(tempDir, tempFileName);

        const ytDlpArgs = buildDownloadArgs(url, mediaType, format, quality, tempFilePath);

        console.log('Executing yt-dlp with args:', ytDlpArgs.join(' '));

        // Try different ways to call yt-dlp for download
        let downloadProcess;
        const downloadCommandsToTry = [
            ['python3', ['-m', 'yt_dlp', ...ytDlpArgs]],
            ['python', ['-m', 'yt_dlp', ...ytDlpArgs]],
            ['yt-dlp', ytDlpArgs]
        ];
        
        lastError = null;
        for (const [command, cmdArgs] of downloadCommandsToTry) {
            try {
                downloadProcess = spawn(command, cmdArgs);
                // If we get here without an exception, break out of the loop
                break;
            } catch (error) {
                lastError = error;
                console.log(`Failed to spawn ${command} for download:`, error.message);
            }
        }
        
        if (!downloadProcess) {
            throw new Error(`Failed to spawn yt-dlp for download with any method. Last error: ${lastError?.message || 'Unknown error'}`);
        }

        let errorOutput = '';

        downloadProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            errorOutput += msg;
            console.log('yt-dlp:', msg);
        });

        await new Promise((resolve, reject) => {
            downloadProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    console.error('yt-dlp exited with code:', code);
                    console.error('yt-dlp error output:', errorOutput);
                    reject(new Error('yt-dlp failed with code ' + code));
                }
            });

            downloadProcess.on('error', (error) => {
                reject(error);
            });
        });

        try {
            const stats = await fsPromises.stat(tempFilePath);
            if (!stats || stats.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const stream = fs.createReadStream(tempFilePath);

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            if (mediaType === 'audio') {
                const audioMimeTypes = {
                    mp3: 'audio/mpeg',
                    m4a: 'audio/mp4',
                    opus: 'audio/opus',
                    wav: 'audio/wav'
                };
                res.setHeader('Content-Type', audioMimeTypes[format] || 'application/octet-stream');
            } else {
                const videoMimeTypes = {
                    mp4: 'video/mp4',
                    webm: 'video/webm',
                    mkv: 'video/x-matroska'
                };
                res.setHeader('Content-Type', videoMimeTypes[format] || 'application/octet-stream');
            }

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).send('Failed to read downloaded file.');
                } else {
                    res.end();
                }
            });

            stream.pipe(res);

            stream.on('close', () => {
                fsPromises.unlink(tempFilePath).catch((err) => {
                    console.error('Failed to remove temp file:', err);
                });
            });

            req.on('close', () => {
                stream.destroy();
            });

        } catch (error) {
            await fsPromises.unlink(tempFilePath).catch(() => {});
            throw error;
        }

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).send('Download failed: ' + error.message);
        }
    }
});

// Submit Issue Report endpoint - Data saved in browser's localStorage
app.post('/submit-issue', async (req, res) => {
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
            timestamp: new Date().toISOString()
        };

        // Log to console for debugging (optional)
        console.log('Issue report received:', issueData);
        
        // Return success - data will be stored in browser's localStorage
        res.json({ 
            success: true,
            message: 'Issue report saved successfully in local storage' 
        });
    } catch (error) {
        console.error('Issue submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to submit issue report' 
        });
    }
});

// Submit Contact Message endpoint - Data saved in browser's localStorage
app.post('/submit-contact', async (req, res) => {
    try {
        const contactData = {
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            category: req.body.category,
            message: req.body.message,
            timestamp: new Date().toISOString()
        };

        // Log to console for debugging (optional)
        console.log('Contact message received:', contactData);
        
        // Return success - data will be stored in browser's localStorage
        res.json({ 
            success: true,
            message: 'Message saved successfully in local storage' 
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message' 
        });
    }
});

// Log download analytics - Data logged to console and stored in browser's localStorage
app.post('/log-download', async (req, res) => {
    try {
        const analyticsData = {
            videoId: req.body.videoId,
            quality: req.body.quality,
            format: req.body.format,
            mediaType: req.body.mediaType,
            success: req.body.success,
            errorMessage: req.body.errorMessage,
            duration: req.body.duration,
            timestamp: new Date().toISOString()
        };

        // Log to console for debugging (optional)
        console.log('Download analytics:', analyticsData);
        
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
    console.log(`💾 Storage: Chrome Local Storage (No Database)`);
    console.log(`\n💡 Make sure yt-dlp is installed:`);
    console.log(`   pip install yt-dlp`);
    console.log(`   or: pip3 install yt-dlp\n`);
});
