// ========== State Management ==========
const state = {
    videoInfo: null,
    availableFormats: [],
    selectedMediaType: 'video',
    isInfoFetched: false,
    isFetching: false,
    downloadHistory: []
};

// ========== Local Storage Management ==========
const STORAGE_KEY = 'trovvin_download_history';
const MAX_HISTORY = 10;

function loadDownloadHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading download history:', error);
        return [];
    }
}

function saveDownloadHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving download history:', error);
    }
}

function addToDownloadHistory(downloadData) {
    const history = loadDownloadHistory();
    
    // Create download entry
    const entry = {
        id: Date.now(),
        title: downloadData.title,
        thumbnail: downloadData.thumbnail,
        url: downloadData.url,
        mediaType: downloadData.mediaType,
        quality: downloadData.quality,
        format: downloadData.format,
        timestamp: new Date().toISOString()
    };
    
    // Add to beginning and limit to MAX_HISTORY
    history.unshift(entry);
    const limitedHistory = history.slice(0, MAX_HISTORY);
    
    saveDownloadHistory(limitedHistory);
    state.downloadHistory = limitedHistory;
    
    // Update UI
    displayRecentDownloads();
}

function clearDownloadHistory() {
    localStorage.removeItem(STORAGE_KEY);
    state.downloadHistory = [];
    displayRecentDownloads();
}

function displayRecentDownloads() {
    const container = document.getElementById('recentDownloads');
    if (!container) return;
    
    const history = loadDownloadHistory();
    
    if (history.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const recentList = container.querySelector('.recent-list');
    if (!recentList) return;
    
    recentList.innerHTML = history.map(item => `
        <div class="recent-item" data-url="${item.url}">
            <div class="recent-thumbnail">
                <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                <div class="recent-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7z" fill="white"/>
                    </svg>
                </div>
            </div>
            <div class="recent-info">
                <h4>${item.title}</h4>
                <div class="recent-meta">
                    <span class="recent-badge ${item.mediaType}">${item.mediaType === 'video' ? '🎥' : '🎵'} ${item.mediaType}</span>
                    <span class="recent-quality">${item.quality}p • ${item.format.toUpperCase()}</span>
                </div>
                <span class="recent-time">${formatTimeAgo(item.timestamp)}</span>
            </div>
            <button class="recent-reload" onclick="reloadDownload('${item.url}')" title="Download again">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function reloadDownload(url) {
    const urlInput = document.getElementById('videoUrl');
    if (urlInput) {
        urlInput.value = url;
        handleAutoFetch();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function displayWelcomeMessage() {
    const history = loadDownloadHistory();
    const welcomeMsg = document.getElementById('welcomeMessage');
    
    if (!welcomeMsg) return;
    
    if (history.length > 0) {
        const lastDownload = history[0];
        const userName = localStorage.getItem('trovvin_user_name') || 'there';
        
        welcomeMsg.innerHTML = `
            <div class="welcome-content">
                <h3>Welcome back, ${userName}! 👋</h3>
                <p>You have <strong>${history.length}</strong> recent download${history.length > 1 ? 's' : ''}</p>
            </div>
        `;
        welcomeMsg.style.display = 'block';
    } else {
        welcomeMsg.style.display = 'none';
    }
}

// ========== DOM Elements ==========
const elements = {
    videoUrlInput: document.getElementById('videoUrl'),
    urlLoader: document.getElementById('urlLoader'),
    downloadForm: document.getElementById('downloadForm'),
    downloadBtn: document.getElementById('downloadBtn'),
    statusMessage: document.getElementById('statusMessage'),
    
    videoInfo: document.getElementById('videoInfo'),
    thumbnail: document.getElementById('thumbnail'),
    videoTitle: document.getElementById('videoTitle'),
    videoDuration: document.getElementById('videoDuration'),
    
    videoType: document.getElementById('videoType'),
    audioType: document.getElementById('audioType'),
    videoOptions: document.getElementById('videoOptions'),
    audioOptions: document.getElementById('audioOptions'),
    
    videoFormat: document.getElementById('videoFormat'),
    videoQuality: document.getElementById('videoQuality'),
    audioFormat: document.getElementById('audioFormat'),
    audioQuality: document.getElementById('audioQuality')
};

// ========== Event Listeners ==========
function initializeEventListeners() {
    // Auto-fetch on URL paste/input
    let debounceTimer;
    
    // Listen to both input and paste events
    elements.videoUrlInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const url = e.target.value.trim();
        
        if (isValidYouTubeUrl(url)) {
            // Clear any previous error messages
            const statusMessage = elements.statusMessage;
            if (statusMessage.classList.contains('error')) {
                statusMessage.style.display = 'none';
            }
            
            debounceTimer = setTimeout(() => {
                handleAutoFetch();
            }, 1000);  // Increased delay to 1 second for better UX
        } else if (url.length > 10) {
            // Only show error if URL is long enough
            state.isInfoFetched = false;
            resetUI();
        } else {
            // Just reset UI for short inputs
            state.isInfoFetched = false;
            resetUI();
        }
    });
    
    // Immediate fetch on paste
    elements.videoUrlInput.addEventListener('paste', (e) => {
        clearTimeout(debounceTimer);
        setTimeout(() => {
            const url = elements.videoUrlInput.value.trim();
            if (isValidYouTubeUrl(url)) {
                handleAutoFetch();
            } else if (url.length > 10) {
                showStatus('⚠️ Invalid YouTube URL format', 'error');
            }
        }, 100);
    });
    
    elements.downloadForm.addEventListener('submit', handleDownload);
    
    elements.videoType.addEventListener('change', handleMediaTypeChange);
    elements.audioType.addEventListener('change', handleMediaTypeChange);
}

// ========== URL Validation ==========
function isValidYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const patterns = [
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11})/,
        /^(https?:\/\/)?(www\.)?(youtu\.be\/[a-zA-Z0-9_-]{11})/,
        /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/[a-zA-Z0-9_-]{11})/,
        /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/[a-zA-Z0-9_-]{11})/,
        /^(https?:\/\/)?(m\.)?(youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11})/  // Mobile URLs
    ];
    return patterns.some(pattern => pattern.test(url));
}

// ========== Auto Fetch Video Info ==========
async function handleAutoFetch() {
    if (state.isFetching) return;
    
    const videoUrl = elements.videoUrlInput.value.trim();
    
    if (!isValidYouTubeUrl(videoUrl)) {
        showStatus('Please enter a valid YouTube URL', 'error');
        return;
    }
    
    state.isFetching = true;
    elements.urlLoader.classList.add('active');
    showStatus('Fetching video information...', 'info');
    
    try {
        const response = await fetch(getApiUrl('VIDEO_INFO'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl })
        });
        
        if (!response.ok) {
            let errorMsg = 'Failed to fetch video info';
            try {
                const error = await response.json();
                errorMsg = error.message || errorMsg;
            } catch (e) {
                // Response wasn't JSON
                errorMsg = `Server error (${response.status}): ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        // Validate the response data
        if (!data || !data.title) {
            throw new Error('Invalid video data received');
        }
        
        state.videoInfo = data;
        state.availableFormats = data.formats || [];
        state.isInfoFetched = true;
        
        displayVideoInfo(data);
        populateQualityOptions();
        enableDownloadButton();
        showStatus('✔ Ready to download!', 'success');
        
    } catch (error) {
        console.error('Fetch error:', error);
        showStatus('❌ Could not fetch video info: ' + error.message, 'error');
        state.isInfoFetched = false;
        resetUI();
    } finally {
        state.isFetching = false;
        elements.urlLoader.classList.remove('active');
    }
}

// ========== Display Video Info ==========
function displayVideoInfo(data) {
    elements.thumbnail.src = data.thumbnail || '';
    elements.videoTitle.textContent = data.title || 'Unknown Title';
    elements.videoDuration.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
        </svg>
        ${formatDuration(data.duration || 0)}
    `;
    elements.videoInfo.style.display = 'block';
}

function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ========== Populate Quality Options ==========
function populateQualityOptions() {
    const mediaType = getSelectedMediaType();
    
    if (mediaType === 'video') {
        populateVideoQualities();
    } else {
        populateAudioQualities();
    }
}

function populateVideoQualities() {
    const videoFormats = state.availableFormats.filter(f => f.vcodec !== 'none' && f.height);
    const uniqueHeights = [...new Set(videoFormats.map(f => f.height))].sort((a, b) => b - a);
    
    elements.videoQuality.innerHTML = '';
    elements.videoQuality.disabled = false;
    
    if (uniqueHeights.length === 0) {
        elements.videoQuality.innerHTML = '<option value="best">Best Available</option>';
        return;
    }
    
    const bestHeight = uniqueHeights[0];
    uniqueHeights.forEach((height, index) => {
        const option = document.createElement('option');
        const label = getQualityLabel(height);
        option.value = height;
        option.textContent = `${label} (${height}p)`;
        if (index === 0) option.selected = true;
        elements.videoQuality.appendChild(option);
    });
}

function populateAudioQualities() {
    const audioFormats = state.availableFormats.filter(f => f.acodec !== 'none' && f.abr);
    const uniqueBitrates = [...new Set(audioFormats.map(f => Math.round(f.abr)))].sort((a, b) => b - a);
    
    elements.audioQuality.innerHTML = '';
    elements.audioQuality.disabled = false;
    
    if (uniqueBitrates.length === 0) {
        elements.audioQuality.innerHTML = '<option value="best">Best Available</option>';
        return;
    }
    
    uniqueBitrates.forEach((bitrate, index) => {
        const option = document.createElement('option');
        option.value = bitrate;
        option.textContent = `${bitrate} kbps`;
        if (index === 0) option.selected = true;
        elements.audioQuality.appendChild(option);
    });
}

function getQualityLabel(height) {
    const labels = {
        2160: '4K',
        1440: '2K',
        1080: 'Full HD',
        720: 'HD',
        480: 'SD',
        360: 'Low'
    };
    return labels[height] || 'Quality';
}

// ========== Media Type Change Handler ==========
function handleMediaTypeChange(e) {
    state.selectedMediaType = e.target.value;
    
    if (state.selectedMediaType === 'video') {
        elements.videoOptions.style.display = 'grid';
        elements.audioOptions.style.display = 'none';
    } else {
        elements.videoOptions.style.display = 'none';
        elements.audioOptions.style.display = 'grid';
    }
    
    if (state.isInfoFetched) {
        populateQualityOptions();
    }
}

function getSelectedMediaType() {
    return elements.videoType.checked ? 'video' : 'audio';
}

// ========== Download Handler ==========
async function handleDownload(e) {
    e.preventDefault();
    
    // Check if backend is reachable
    try {
        const healthResponse = await fetch(getApiUrl('HEALTH'));
        if (!healthResponse.ok) {
            throw new Error('Backend server is not responding');
        }
    } catch (error) {
        showStatus('❌ Server error: ' + error.message, 'error');
        return;
    }
    
    const videoUrl = elements.videoUrlInput.value.trim();
    
    // Validate URL
    if (!videoUrl || !isValidYouTubeUrl(videoUrl)) {
        showStatus('Please enter a valid YouTube URL', 'error');
        return;
    }
    
    // For single video downloads, ensure video info is fetched
    if (!state.isInfoFetched) {
        showStatus('Fetching video info...', 'info');
        await handleAutoFetch();
        
        if (!state.isInfoFetched) {
            showStatus('Please wait for video info to load', 'warning');
            return;
        }
    }
    
    const mediaType = getSelectedMediaType();
    
    let format, quality;
    
    if (mediaType === 'video') {
        format = elements.videoFormat.value;
        quality = elements.videoQuality.value;
    } else {
        format = elements.audioFormat.value;
        quality = elements.audioQuality.value;
    }
    
    // Save to download history
    addToDownloadHistory({
        title: state.videoInfo.title,
        thumbnail: state.videoInfo.thumbnail,
        url: videoUrl,
        mediaType: mediaType,
        quality: quality,
        format: format
    });
    
    // Build download URL with parameters
    const params = new URLSearchParams();
    params.append('url', videoUrl);
    params.append('mediaType', mediaType);
    params.append('format', format);
    params.append('quality', quality);
    
    const downloadUrl = `${getApiUrl('DOWNLOAD')}?${params.toString()}`;
    
    // Show status
    showStatus('Starting download... Check your browser\'s download manager!', 'info');
    
    // Disable button temporarily
    elements.downloadBtn.disabled = true;
    
    // Create a hidden link and trigger download
    try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(a);
            showStatus('Download started! Check your browser downloads (Ctrl+J)', 'success');
            elements.downloadBtn.disabled = false;
        }, 100);
    } catch (error) {
        console.error('Download error:', error);
        showStatus('❌ Download failed: ' + error.message, 'error');
        elements.downloadBtn.disabled = false;
    }
}

// ========== UI Helper Functions ==========
function showStatus(message, type) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = 'status-message ' + type;
    elements.statusMessage.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 5000);
    }
}

function enableDownloadButton() {
    elements.downloadBtn.disabled = false;
    const btnText = elements.downloadBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Download Now';
}

function resetUI() {
    elements.videoInfo.style.display = 'none';
    elements.downloadBtn.disabled = true;
    const btnText = elements.downloadBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = 'Paste URL to Start';
}

// ========== Initialize App ==========
initializeEventListeners();

// Load download history on page load
state.downloadHistory = loadDownloadHistory();
displayWelcomeMessage();
displayRecentDownloads();

// ========== Smooth Scroll Navigation ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navbarHeight = 100; // Account for fixed navbar
            const targetPosition = target.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// ========== FAQ Accordion ==========
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        // Close other FAQ items
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
        });
        
        // Toggle current item
        if (!wasActive) {
            item.classList.add('active');
        }
    });
});

// ========== Active Nav on Scroll ==========
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id], main[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});
