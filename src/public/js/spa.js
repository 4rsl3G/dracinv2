$(document).ready(() => {
    initApp();

    // Link Hijacking
    $(document).on('click', 'a.spa-link', function(e) {
        e.preventDefault();
        const url = $(this).attr('href');
        if (url !== window.location.pathname) navigate(url);
    });

    // Form Hijacking
    $(document).on('submit', 'form.spa-form', function(e) {
        e.preventDefault();
        navigate($(this).attr('action') + '?' + $(this).serialize());
    });

    window.onpopstate = () => navigate(window.location.pathname, false);

    function navigate(url, push = true) {
        $('#loader-bar').css('width', '50%');
        
        // Teardown
        if (window.hls) { window.hls.destroy(); window.hls = null; }
        
        $.ajax({
            url: url,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: (res) => {
                $('#loader-bar').css('width', '100%');
                $('#app-content').css('opacity', 0);
                
                setTimeout(() => {
                    $('#app-content').html(res).css('opacity', 1);
                    window.scrollTo(0, 0);
                    if (push) history.pushState(null, '', url);
                    
                    initApp();
                    setTimeout(() => $('#loader-bar').css('width', '0%'), 200);
                }, 200);
            },
            error: () => {
                $('#loader-bar').css('width', '0%');
                alert('Connection Error');
            }
        });
    }

    function initApp() {
        // Nav Scroll Effect
        $(window).scroll(() => {
            $('#main-nav').toggleClass('bg-black', $(window).scrollTop() > 50);
        });

        // Initialize Swipers
        $('.content-swiper').each((i, el) => {
            new Swiper(el, {
                slidesPerView: 2.2,
                spaceBetween: 12,
                slidesPerGroup: 2,
                speed: 600,
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                breakpoints: {
                    640: { slidesPerView: 3.2, spaceBetween: 16 },
                    1024: { slidesPerView: 5.2, spaceBetween: 20, slidesPerGroup: 5 }
                }
            });
        });

        // Init Player if exists
        if ($('#player-video').length) initPlayer();
        
        AOS.refresh();
    }
});
