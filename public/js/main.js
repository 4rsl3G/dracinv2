$(document).ready(function() {
    // 1. Navbar Scroll Effect
    $(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('#navbar').addClass('bg-netBlack').removeClass('bg-gradient-to-b');
        } else {
            $('#navbar').removeClass('bg-netBlack').addClass('bg-gradient-to-b');
        }
    });

    // 2. Fetch Languages
    $.get('/api/languages', function(data) {
        if(Array.isArray(data)) {
            const select = $('#langSelect');
            data.forEach(l => {
                select.append(new Option(l.name || l.code, l.code));
            });
            // Set current lang from URL param if exists
            const urlParams = new URLSearchParams(window.location.search);
            const currentLang = urlParams.get('lang');
            if(currentLang) select.val(currentLang);
        }
    });

    // 3. Lang Switch
    $('#langSelect').change(function() {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('lang', $(this).val());
        window.location.search = urlParams.toString();
    });

    // 4. Search Debounce
    let searchTimeout;
    $('#searchInput').on('keyup focus', function() {
        const query = $(this).val();
        if (query.length > 2) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                window.location.href = `/search?q=${query}&lang=${$('#langSelect').val()}`;
            }, 800);
        }
    });

    // 5. Modal Logic
    window.openTitle = function(code, name, cover, totalEp) {
        const modal = $('#detailModal');
        const content = $('#modalContent');
        const body = $('#modalBody');
        
        modal.removeClass('hidden').addClass('flex');
        setTimeout(() => {
            content.removeClass('scale-95 opacity-0').addClass('scale-100 opacity-100');
        }, 10);

        // Skeleton
        body.html(`
            <div class="h-64 bg-gray-800 w-full rounded-t-md skeleton"></div>
            <div class="p-8">
                <div class="h-8 bg-gray-700 w-1/2 mb-4 skeleton rounded"></div>
                <div class="grid grid-cols-4 gap-2 mt-8">
                   ${'<div class="h-12 bg-gray-800 skeleton rounded"></div>'.repeat(8)}
                </div>
            </div>
        `);

        // Fetch Episodes
        const lang = $('#langSelect').val();
        $.get(`/api/episodes/${code}?lang=${lang}`, function(episodes) {
            let epHtml = episodes.map(e => `
                <a href="/watch/${code}/${e.episode_number}?lang=${lang}" class="bg-zinc-800 p-3 rounded hover:bg-zinc-700 flex justify-between items-center group">
                    <span class="text-white font-bold">Ep ${e.episode_number}</span>
                    ${e.locked ? '<i class="fas fa-lock text-gray-500"></i>' : '<i class="fas fa-play text-gray-400 group-hover:text-white"></i>'}
                </a>
            `).join('');

            body.html(`
                <div class="relative h-96">
                    <img src="${cover}" class="w-full h-full object-cover object-top rounded-t-md opacity-40">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent"></div>
                    <div class="absolute bottom-8 left-8">
                        <h2 class="text-4xl font-bold text-white mb-2">${name}</h2>
                        <div class="flex gap-4 items-center">
                            <span class="text-green-400 font-bold">98% Match</span>
                            <span class="text-gray-300">${totalEp} Episodes</span>
                        </div>
                        <a href="/watch/${code}/1?lang=${lang}" class="mt-4 bg-netRed text-white px-8 py-2 rounded font-bold inline-block hover:bg-red-700 transition">
                            <i class="fas fa-play mr-2"></i> Play S1:E1
                        </a>
                    </div>
                </div>
                <div class="p-8">
                    <h3 class="text-xl font-bold text-white mb-4">Episodes</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scroll">
                        ${epHtml}
                    </div>
                </div>
            `);
        });
    }

    window.closeModal = function() {
        const modal = $('#detailModal');
        const content = $('#modalContent');
        content.removeClass('scale-100 opacity-100').addClass('scale-95 opacity-0');
        setTimeout(() => modal.addClass('hidden').removeClass('flex'), 300);
    }
    
    // Close modal on click outside
    $('#detailModal').click(function(e) {
        if(e.target === this) window.closeModal();
    });
});
