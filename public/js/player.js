document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const loading = document.getElementById('loading');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const volumeSlider = document.getElementById('volumeSlider');
    const qualityList = document.getElementById('qualityList');
    
    let hls;

    // --- 1. Fetch Play URL ---
    async function initPlayer() {
        loading.style.display = 'flex';
        try {
            const res = await fetch(`/api/play/${CONFIG.code}?ep=${CONFIG.ep}&lang=${CONFIG.lang}`);
            const data = await res.json();
            
            // Determine source based on simple logic or data provided
            // Assuming API returns specific m3u8 or we construct it. 
            // NOTE: The prompt says API returns data.video.video_480, etc. 
            // Usually proper HLS has a master playlist. If not, we pick best.
            
            let source = data.video?.video_1080 || data.video?.video_720 || data.video?.video_480;
            
            if (!source) throw new Error("No video source");

            // Handle Expiration / Re-fetch logic
            if (data.expires_in) {
                setTimeout(() => {
                    console.log("Token expired, refreshing...");
                    const currTime = video.currentTime;
                    initPlayer().then(() => video.currentTime = currTime); 
                }, (data.expires_in - 10) * 1000);
            }

            setupHls(source);
        } catch (e) {
            console.error(e);
            alert("Error loading video");
        }
    }

    function setupHls(source) {
        if (Hls.isSupported()) {
            if(hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(source);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                loading.style.display = 'none';
                video.play();
                generateQualityControls(data.levels);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
                const level = hls.levels[data.level];
                console.log("Switched quality to", level.height + 'p');
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', () => {
                loading.style.display = 'none';
                video.play();
            });
        }
    }

    // --- 2. Controls Logic ---
    function togglePlay() {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateProgress() {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        currentTimeEl.innerText = formatTime(video.currentTime);
        durationEl.innerText = formatTime(video.duration || 0);

        // Save history every 5 sec
        if(Math.floor(video.currentTime) % 5 === 0 && video.currentTime > 0) {
            saveHistory();
        }
    }

    function scrub(e) {
        const scrubTime = (e.offsetX / progressBarContainer.offsetWidth) * video.duration;
        video.currentTime = scrubTime;
    }

    function generateQualityControls(levels) {
        qualityList.innerHTML = '<li class="p-1 hover:text-white hover:bg-gray-800 cursor-pointer" onclick="switchLevel(-1)">Auto</li>';
        levels.forEach((level, index) => {
            const li = document.createElement('li');
            li.className = 'p-1 hover:text-white hover:bg-gray-800 cursor-pointer';
            li.innerText = level.height + 'p';
            li.onclick = () => switchLevel(index);
            qualityList.appendChild(li);
        });
    }

    window.switchLevel = (levelIndex) => {
        hls.currentLevel = levelIndex;
    }

    function saveHistory() {
        const client_id = getCookie('client_id');
        fetch('/api/history', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                client_id: client_id,
                code: CONFIG.code,
                ep: CONFIG.ep,
                position: video.currentTime,
                duration: video.duration
            })
        });
    }
    
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // --- 3. Event Listeners ---
    video.addEventListener('click', togglePlay);
    playPauseBtn.addEventListener('click', togglePlay);
    video.addEventListener('timeupdate', updateProgress);
    progressBarContainer.addEventListener('click', scrub);
    
    document.getElementById('forwardBtn').addEventListener('click', () => video.currentTime += 10);
    document.getElementById('rewindBtn').addEventListener('click', () => video.currentTime -= 10);
    
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.getElementById('videoContainer').requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        video.muted = false;
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        if (e.code === 'ArrowRight') video.currentTime += 5;
        if (e.code === 'ArrowLeft') video.currentTime -= 5;
        if (e.code === 'KeyF') document.getElementById('fullscreenBtn').click();
    });

    // Init
    initPlayer();
});
