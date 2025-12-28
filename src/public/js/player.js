function initPlayer() {
    const video = document.getElementById('player-video');
    const ui = $('.player-ui');
    const playBtn = $('#btn-play');
    const bar = $('#play-bar');
    const buffer = $('#buffer-bar');
    const timeline = $('#timeline');
    const nextPopup = $('#auto-next');
    let idleTimer;

    // --- Core Logic ---
    const togglePlay = () => {
        video.paused ? video.play() : video.pause();
        updateIcon(video.paused ? 'fa-play' : 'fa-pause');
        showCenterIcon(video.paused ? 'fa-pause' : 'fa-play');
    };

    const updateIcon = (cls) => playBtn.html(`<i class="fas ${cls} text-3xl"></i>`);
    
    const showCenterIcon = (cls) => {
        $('#center-icon').html(`<i class="fas ${cls} text-6xl text-white drop-shadow-lg"></i>`)
            .css({opacity: 1, transform: 'scale(1)'});
        setTimeout(() => $('#center-icon').css({opacity: 0, transform: 'scale(1.5)'}), 500);
    };

    // --- Event Listeners ---
    video.addEventListener('play', () => { $('#spinner').hide(); updateIcon('fa-pause'); });
    video.addEventListener('pause', () => updateIcon('fa-play'));
    video.addEventListener('waiting', () => $('#spinner').show());
    video.addEventListener('playing', () => $('#spinner').hide());
    
    video.addEventListener('timeupdate', () => {
        const pct = (video.currentTime / video.duration) * 100;
        bar.css('width', `${pct}%`);
        $('#time-cur').text(fmtTime(video.currentTime));
        
        // Save Progress
        if (Math.floor(video.currentTime) % 5 === 0) {
            localStorage.setItem(`prog_${window.videoConfig.id}_${window.videoConfig.ep}`, video.currentTime);
        }

        // Auto Next Trigger (15s before end)
        if (video.duration - video.currentTime < 15 && nextPopup.hasClass('hidden') && video.getAttribute('data-next')) {
            startAutoNext();
        }
    });

    video.addEventListener('progress', () => {
        if(video.buffered.length) {
            const pct = (video.buffered.end(video.buffered.length-1) / video.duration) * 100;
            buffer.css('width', `${pct}%`);
        }
    });

    video.addEventListener('loadedmetadata', () => {
        $('#time-dur').text(fmtTime(video.duration));
        const saved = localStorage.getItem(`prog_${window.videoConfig.id}_${window.videoConfig.ep}`);
        if(saved) video.currentTime = parseFloat(saved);
        video.play().catch(() => {});
    });

    // --- Interaction ---
    playBtn.click(togglePlay);
    $('#video-wrapper').click((e) => {
        if(!$(e.target).closest('.player-ui, #auto-next').length) togglePlay();
    });
    
    $('#btn-back').click(() => { video.currentTime -= 10; showCenterIcon('fa-rotate-left'); });
    $('#btn-fwd').click(() => { video.currentTime += 10; showCenterIcon('fa-rotate-right'); });
    $('#btn-fs').click(() => document.fullscreenElement ? document.exitFullscreen() : $('#video-wrapper')[0].requestFullscreen());
    
    $('#btn-speed').click(function() {
        const s = [0.5, 1, 1.25, 1.5, 2];
        const n = s[(s.indexOf(video.playbackRate) + 1) % s.length] || 1;
        video.playbackRate = n;
        $(this).text(n + 'x');
    });

    timeline.click(function(e) {
        const pos = (e.pageX - $(this).offset().left) / $(this).width();
        video.currentTime = pos * video.duration;
    });

    // Activity Hider
    const resetIdle = () => {
        ui.css('opacity', 1);
        $('#video-wrapper').css('cursor', 'auto');
        clearTimeout(idleTimer);
        if(!video.paused) idleTimer = setTimeout(() => {
            ui.css('opacity', 0);
            $('#video-wrapper').css('cursor', 'none');
        }, 3000);
    };
    $(document).on('mousemove click', resetIdle);

    // Auto Next Logic
    let autoInterval;
    function startAutoNext() {
        nextPopup.removeClass('hidden').addClass('opacity-100 translate-y-0');
        const bar = $('#auto-timer-bar');
        bar.css('transition', 'width 10s linear').width('0%');
        
        autoInterval = setTimeout(() => {
            const url = video.getAttribute('data-next');
            if(url) $('a[href="'+url+'"]').click();
        }, 10000);
    }

    $('#btn-cancel-auto').click((e) => {
        e.stopPropagation();
        clearTimeout(autoInterval);
        nextPopup.addClass('hidden');
    });

    function fmtTime(s) {
        if(!s) return "00:00";
        const m = Math.floor(s/60), sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }
}
