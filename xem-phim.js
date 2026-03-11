((context) => {
    // ===============================================================
    // 1. CẤU HÌNH DATA SHEET & BIẾN CƠ SỞ
    // ===============================================================
    let USER_NAME = 'Khách';
    let IS_LOGGED_IN = false;
    const SHEET_ID = '1iuApMwdKYx9ofo0oJR84AlzXka0PmTQPudXzx0Uub0o';
    const SHEET_GID = '1783581099'; // GID Sheet Phim của bạn
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    
    const getProgressKey = () => 'tgdd_phim_progress_' + USER_NAME;
    
    // Kế thừa hệ thống tài khoản từ Auto BI
    if (context.AUTH_STATE && context.AUTH_STATE.isAuthorized) {
        USER_NAME = context.AUTH_STATE.userName;
        IS_LOGGED_IN = true;
    } else {
        let savedGuestInfo = localStorage.getItem('tgdd_guest_account');
        if (savedGuestInfo) {
            let acc = JSON.parse(savedGuestInfo);
            USER_NAME = acc.user;
            IS_LOGGED_IN = true;
        } else {
            let guestId = localStorage.getItem('tgdd_guest_id');
            if (!guestId) {
                guestId = 'Guest-' + Math.floor(Math.random() * 100000);
                localStorage.setItem('tgdd_guest_id', guestId);
            }
            USER_NAME = guestId;
            IS_LOGGED_IN = false;
        }
    }
    const API_URL = context.CONSTANTS ? context.CONSTANTS.GSHEET.CONFIG_API : null;
    
    // ===============================================================
    // 2. CSS GIAO DIỆN (CHUYỂN ĐỔI CHO XEM PHIM)
    // ===============================================================
    const MY_CSS = `
        /* KẾT CẤU TỔNG THỂ NHƯ APP ĐỌC TRUYỆN */
        #movie-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100% !important; height:100% !important; background:#f8f9fa; z-index:2147483646; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; flex-direction:column; overflow: hidden !important; box-sizing: border-box !important; }
        #movie-app *, #movie-app *::before, #movie-app *::after { box-sizing: border-box !important; }
        
        .mv-header { background:#fff; padding:10px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:center; align-items:center; z-index:20; flex-shrink:0; position:relative; height:60px; }
        .mv-logo { font-size:18px; font-weight:900; color:#d63031; text-transform:uppercase; letter-spacing: 1px;}
        .mv-btn-home-icon { position:absolute; left:20px; background:#fab1a0; color:#d63031; border:none; border-radius:50%; width:36px; height:36px; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:0.2s;}
        .mv-btn-close { position:absolute; right:20px; background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.2s;}
        
        .mv-user-bar { background:#2d3436; color:#dfe6e9; padding:5px 20px; font-size:12px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; flex-shrink:0;}
        .mv-toolbar { background:#fff; padding:10px 20px; border-bottom:1px solid #eee; display:flex; gap:10px; z-index:15; flex-shrink:0;}
        .mv-search-box input, .mv-filter { width:100%; padding:8px 15px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; }
        
        /* DANH SÁCH PHIM TRANG CHỦ */
        .mv-home-body { flex:1; overflow-y:auto; padding:20px; background:#f4f5f7; display:flex; flex-direction: column; gap:30px;}
        .mv-section-title { font-size: 18px; font-weight: bold; color: #2d3436; text-transform: uppercase; border-bottom: 2px solid #d63031; padding-bottom: 5px;}
        .mv-grid-container { display:flex; flex-wrap:wrap; gap:20px; }
        .mv-card { background:#fff; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.05); width:calc(16.666% - 16.666px); min-width:140px; cursor:pointer; transition:0.2s; overflow:hidden; position:relative;}
        .mv-card:hover { transform:translateY(-5px); box-shadow:0 8px 15px rgba(0,0,0,0.1); }
        .mv-card-cover { background:#2d3436; height:220px; display:flex; align-items:center; justify-content:center; color:white; position:relative; }
        .mv-card-img { width:100%; height:100%; object-fit:cover; }
        .mv-card-progress { position:absolute; bottom:0; left:0; width:100%; background:rgba(214, 48, 49, 0.8); color:#fff; font-size:12px; font-weight:bold; padding:5px; text-align:center; }
        .mv-card-info { padding:10px; }
        .mv-card-title { font-size:14px; font-weight:bold; color:#2d3436; margin-bottom:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .mv-card-genre { font-size:11px; color:#d63031; font-weight:bold; }
        
        /* GIAO DIỆN XEM PHIM (PLAYER VIEW) */
        .mv-player-view { display:none; flex:1; flex-direction:column; background:#111; overflow:hidden; }
        .mv-player-info-bar { background:#222; padding:15px 20px; border-bottom:1px solid #333; z-index:9; flex-shrink:0; text-align:center; }
        .mv-movie-title { font-size:18px; font-weight:bold; color:#fff; margin-bottom:5px; }
        .mv-episode-title { font-size:14px; color:#d63031; font-weight:600;}
        
        /* KHU VỰC VIDEO & DANH SÁCH TẬP */
        .mv-player-content-wrap { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; align-items:center; }
        /* KHU VỰC VIDEO & DANH SÁCH TẬP */
        .mv-player-content-wrap { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; align-items:center; }
        .mv-video-wrapper { width:100%; max-width:1000px; aspect-ratio:16/9; min-height: 250px; background:#000; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5); overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; }
        .mv-video-iframe { width:100%; height:100%; min-height: 250px; border:none; outline:none; background:#000; display:block; }
        
        .mv-episodes-panel { width:100%; max-width:1000px; background:#222; padding:20px; border-radius:8px; margin-top:20px; }
        .mv-ep-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:10px; }
        .mv-ep-btn { padding:10px 5px; border-radius:6px; background:#333; border:1px solid #444; color:#ccc; font-weight:bold; cursor:pointer; transition:0.2s; font-size:13px; text-align:center; }
        .mv-ep-btn:hover { background:#555; color:#fff; }
        .mv-ep-btn.active { background:#d63031; color:#fff; border-color:#d63031; box-shadow:0 0 10px rgba(214,48,49,0.5); pointer-events:none;}

        .mv-loading-overlay { position:absolute; top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:50; font-weight:bold; font-size:16px; color:#d63031;}
        
        /* GLASS UI THEME (ÁP DỤNG NẾU TOOL BẬT GLASS) */
        body.glass-ui-mode #movie-app { background: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.2), transparent 50%), rgba(15, 23, 42, 0.95) !important; backdrop-filter: blur(15px) !important; }
        body.glass-ui-mode .mv-header, body.glass-ui-mode .mv-toolbar, body.glass-ui-mode .mv-home-body { background: transparent !important; }
        body.glass-ui-mode .mv-card { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        body.glass-ui-mode .mv-card-title { color: #fff !important; }
        body.glass-ui-mode .mv-player-info-bar, body.glass-ui-mode .mv-episodes-panel { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important;}

        @media (max-width: 768px) { .mv-card { width:calc(33.33% - 15px); } .mv-video-wrapper { border-radius: 0; } .mv-player-content-wrap { padding: 0 0 20px 0; } .mv-episodes-panel { border-radius: 0; margin-top: 10px; } }
        @media (max-width: 480px) { .mv-card { width:calc(50% - 10px); min-width:140px; } }
    `;
    
    // ===============================================================
    // 3. BỘ CÀO PHIM SIÊU VIỆT (VƯỢT AJAX VÀ X-FRAME-OPTIONS)
    // ===============================================================
    
    const fetchHtml = (targetUrl) => {
        return new Promise((resolve, reject) => {
            context.GM_xmlhttpRequest({
                method: "GET", url: targetUrl,
                headers: { "User-Agent": navigator.userAgent, "Referer": "https://hoathinh3d.ee/" },
                onload: (res) => { if(res.status === 200) resolve(res.responseText); else reject(new Error("Lỗi HTTP")); },
                onerror: () => reject(new Error("Mất mạng!"))
            });
        });
    };

    const parseCSV = (text) => {
        const rows =[]; let row =[], curr = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) { if (char === '"') { if (text[i + 1] === '"') { curr += '"'; i++; } else inQuotes = false; } else curr += char; } 
            else { if (char === '"') inQuotes = true; else if (char === ',') { row.push(curr); curr = ''; } 
                else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; row.push(curr); rows.push(row); row =[]; curr = ''; } else curr += char; }
        }
        if (curr !== '' || row.length > 0) { row.push(curr); rows.push(row); } return rows;
    };

    const getEpisodes = async (movieUrl) => {
        const htmlText = await fetchHtml(movieUrl); let episodeList =[];
        const matches = htmlText.match(/href=["']([^"']+\/(?:xem-phim-)?[^"']*tap-\d+[^"']*)["']/gi);
        if(matches) {
            let seenEps = new Set();
            matches.forEach(m => {
                let url = m.split(/["']/)[1];
                if(url.startsWith('/')) url = 'https://hoathinh3d.ee' + url;
                if(!url.startsWith('http')) url = 'https://hoathinh3d.ee/' + url;
                const epNum = parseInt((url.match(/tap-(\d+)/i) || [])[1]) || 0;
                if(epNum > 0 && !seenEps.has(epNum)) { seenEps.add(epNum); episodeList.push({ num: epNum, url: url }); }
            });
        }
        return episodeList.sort((a,b) => a.num - b.num);
    };

    const formatUrl = (src, baseUrl) => {
        if (!src) return null;
        src = src.replace(/\\/g, ''); 
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) return baseUrl + src;
        if (!src.startsWith('http')) return baseUrl + '/' + src;
        return src;
    };

    const isValidLink = (url) => {
        if (!url || url.length < 5 || url === '/' || url === '#') return false;
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) return false;
        // QUAN TRỌNG: Chặn lấy nhầm iframe ẩn của trang chủ gây lỗi X-Frame-Options
        let cleanUrl = url.replace(/\/$/, '');
        if (cleanUrl === 'https://hoathinh3d.ee' || cleanUrl === 'http://hoathinh3d.ee') return false;
        return true;
    };

    const getVideoSrc = async (epUrl) => {
        try {
            const baseUrl = 'https://hoathinh3d.ee';
            let htmlText = await fetchHtml(epUrl);
            
            // 1. DÒ TÌM m3u8 TRỰC TIẾP
            let m3u8Match = htmlText.match(/(https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)/i);
            if (m3u8Match) return m3u8Match[1].replace(/\\/g, '');

            // 2. DÒ TÌM GỌI API AJAX (chuẩn Halim theme - Web VN hay dùng cái này)
            let ajaxUrlMatch = htmlText.match(/["']?ajax_url["']?\s*:\s*["']([^"']+)["']/i);
            let postIdMatch = htmlText.match(/["']?post_id["']?\s*:\s*["']?(\d+)["']?/i) || htmlText.match(/data-post_id=["'](\d+)["']/i) || htmlText.match(/data-id=["'](\d+)["']/i);
            
            if (ajaxUrlMatch && postIdMatch) {
                let ajaxUrl = ajaxUrlMatch[1].replace(/\\/g, '');
                if (!ajaxUrl.startsWith('http')) ajaxUrl = baseUrl + (ajaxUrl.startsWith('/') ? '' : '/') + ajaxUrl;
                
                let postData = `action=halim_ajax_player&episode=&server=&post_id=${postIdMatch[1]}`;
                let ajaxRes = await new Promise((resolve) => {
                    context.GM_xmlhttpRequest({
                        method: "POST", url: ajaxUrl, data: postData,
                        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest", "Referer": epUrl },
                        onload: (r) => resolve(r.responseText), onerror: () => resolve("")
                    });
                });
                
                if (ajaxRes) {
                    let ajaxM3u8 = ajaxRes.match(/(https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)/i);
                    if (ajaxM3u8) return ajaxM3u8[1].replace(/\\/g, '');
                    let ajaxIframe = ajaxRes.match(/<iframe[^>]+src=\\?["']([^"'\\]+)\\?["']/i);
                    if (ajaxIframe) return formatUrl(ajaxIframe[1], baseUrl);
                }
            }

            // 3. DÒ TÌM IFRAME TRONG MÃ HTML GỐC
            let iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
            let match; let extractedLink = null;
            while ((match = iframeRegex.exec(htmlText)) !== null) {
                let src = match[1];
                if (isValidLink(src) && !src.includes('facebook') && !src.includes('youtube') && !src.includes('google')) { 
                    extractedLink = src; break; 
                }
            }
            
            // 4. DÒ TÌM TRONG data-src CỦA HTML (Trường hợp web giấu link)
            if (!extractedLink) {
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                const els = doc.querySelectorAll('[data-src], [data-iframe],[data-video], #box-player, .player-video');
                for (let el of els) {
                    let src = el.getAttribute('data-src') || el.getAttribute('data-iframe') || el.getAttribute('data-video');
                    if (isValidLink(src)) {
                        if (!src.includes('http') && !src.startsWith('/')) { try { src = atob(src); } catch(e) {} }
                        if (src.includes('iframe')) { let m = src.match(/src=["']([^"']+)["']/); if (m) src = m[1]; }
                        if (isValidLink(src)) { extractedLink = src; break; }
                    }
                }
            }
            
            // 5. Nếu có extractedLink nội bộ, ta đào sâu thêm 1 lớp
            if (extractedLink) {
                let finalUrl = formatUrl(extractedLink, baseUrl);
                if (finalUrl.includes(baseUrl)) {
                    try {
                        let innerHtml = await fetchHtml(finalUrl);
                        let innerM3u8 = innerHtml.match(/(https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)/i);
                        if (innerM3u8) return innerM3u8[1].replace(/\\/g, '');
                        
                        let innerIframe = innerHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                        if (innerIframe && isValidLink(innerIframe[1]) && !innerIframe[1].includes(baseUrl)) {
                            return formatUrl(innerIframe[1], baseUrl);
                        }
                    } catch (err) {}
                }
                return finalUrl; // Nếu không đào được nữa thì trả về chính nó
            }
            
            return null;
        } catch(e) { console.error("Lỗi cào link video:", e); return null; }
    };
    
    // ===============================================================
    // 4. LOGIC GIAO DIỆN CHÍNH
    // ===============================================================
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';
    
        const getLocalVal = (key, def) => { try { return typeof GM_getValue === 'function' ? GM_getValue(key, def) : (JSON.parse(localStorage.getItem(key)) || def); } catch(e) { return def; }};
        const setLocalVal = (key, val) => { try { if(typeof GM_setValue === 'function') GM_setValue(key, val); localStorage.setItem(key, JSON.stringify(val)); } catch(e){} };
    
        const $ = (id) => document.getElementById(id);
        
        let movies =[]; let genres = new Set();
        let currentMovie = null;
        let localProgressData = {};
        
        // KHỞI TẠO KHUNG HTML
        let app = $('movie-app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'movie-app';
            app.innerHTML = `
                <div class="mv-header">
                    <button class="mv-btn-home-icon" id="mv-btn-home" title="Trang chủ">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    </button>
                    <div class="mv-logo">🎥 RẠP PHIM MINI</div>
                    <button class="mv-btn-close" id="mv-btn-close" title="Đóng">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                
                <div class="mv-user-bar">
                    <span>Xin chào, <span style="color:#ff7675" id="mv-user-name-display">${USER_NAME}</span></span>
                    <span id="mv-status-text">Sẵn sàng</span>
                </div>

                <div id="mv-view-home" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                    <div class="mv-toolbar">
                        <div class="mv-search-box" style="flex:1"><input type="text" id="mv-search" placeholder="🔍 Tìm kiếm phim..."></div>
                        <select class="mv-filter" id="mv-filter" style="width:140px;"><option value="all">Tất cả</option></select>
                    </div>
                    <div class="mv-home-body" id="mv-home-content">
                        <div style="width:100%; text-align:center; padding:50px; color:#888;">⏳ Đang tải dữ liệu phim...</div>
                    </div>
                </div>
    
                <div id="mv-view-player" class="mv-player-view">
                    <div class="mv-player-info-bar">
                        <div class="mv-movie-title" id="mv-read-title">Tên Phim</div>
                        <div class="mv-episode-title" id="mv-read-ep">Tập 1</div>
                    </div>
    
                    <div class="mv-player-content-wrap">
                        <div class="mv-video-wrapper" id="mv-video-container">
                            <!-- IFRAME PHÁT VIDEO NẰM Ở ĐÂY -->
                        </div>
                        
                        <div class="mv-episodes-panel">
                            <div style="color:#fff; font-weight:bold; margin-bottom:15px; font-size:16px;">Danh sách tập:</div>
                            <div class="mv-ep-grid" id="mv-episodes-grid"></div>
                        </div>
                    </div>
    
                    <div class="mv-loading-overlay" id="mv-loading">
                        <div class="neon-loader-container" style="position:relative; height:50px; width:50px; margin-bottom:15px;"><div class="neon-ring"></div></div>
                        <span id="mv-load-msg">Đang khởi tạo Player...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);

            // Xử lý sự kiện Đóng & Về trang chủ
            $('mv-btn-close').onclick = () => { 
                $('mv-video-container').innerHTML = ''; // Cắt video đang phát
                app.style.display = 'none'; 
                if(bottomNav) bottomNav.style.display = 'flex'; 
                saveCloudHistory(); 
            };
            
            $('mv-btn-home').onclick = () => { 
                $('mv-video-container').innerHTML = ''; // Cắt video đang phát
                $('mv-view-player').style.display = 'none'; 
                $('mv-view-home').style.display = 'flex'; 
                saveCloudHistory();
                renderHome();
            };
        }
        app.style.display = 'flex';
    
        // ĐỒNG BỘ CLOUD (Lưu trữ tập phim đang xem)
        const syncCloudHistory = () => {
            return new Promise((resolve) => {
                if (!API_URL || !IS_LOGGED_IN) { resolve(false); return; }
                $('mv-status-text').innerText = "Đang đồng bộ...";
                context.GM_xmlhttpRequest({
                    method: "GET", url: `${API_URL}?action=get_config&type=movie_history&user=${USER_NAME}`,
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            let cloudHistory = json.data;
                            if (typeof cloudHistory === 'string') { try { cloudHistory = JSON.parse(cloudHistory); } catch(e){} }
                            
                            localProgressData = getLocalVal(getProgressKey(), {});
                            if(cloudHistory && Array.isArray(cloudHistory)) {
                                cloudHistory.forEach(item => {
                                    let movie = movies.find(m => m.name === item.movie);
                                    if (movie) {
                                        let cloudTime = item.timestamp || 0;
                                        let lData = localProgressData[movie.link];
                                        let localTime = lData ? (lData.time || 0) : 0;
                                        if (!lData || cloudTime >= localTime) {
                                            localProgressData[movie.link] = { epNum: parseInt(item.episode) || 1, time: cloudTime };
                                        }
                                    }
                                });
                                setLocalVal(getProgressKey(), localProgressData);
                            }
                            resolve(true);
                        } catch(e) { resolve(false); }
                        $('mv-status-text').innerText = "Sẵn sàng";
                    },
                    onerror: () => { $('mv-status-text').innerText = "Lỗi mạng"; resolve(false); }
                });
            });
        };

        const saveCloudHistory = () => {
            if (!API_URL || !IS_LOGGED_IN) return; 
            let fullHistory = Object.keys(localProgressData).map(link => {
                let m = movies.find(x => x.link === link); let p = localProgressData[link];
                if (!m || !p) return null;
                return { movie: m.name, episode: p.epNum, timestamp: p.time || Date.now() };
            }).filter(item => item !== null).sort((a,b) => b.timestamp - a.timestamp).slice(0, 15);

            if (fullHistory.length === 0) return;
            context.GM_xmlhttpRequest({
                method: "POST", url: API_URL, data: JSON.stringify({ action: 'save_config', type: 'movie_history', user: USER_NAME, config: fullHistory }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
        };

        // TẢI DATA TỪ SHEET
        const loadDataFromSheet = async () => {
            try {
                const res = await fetch(CSV_URL); const csvText = await res.text(); const rows = parseCSV(csvText);
                movies =[]; genres.clear();
                for(let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    if(r.length >= 3 && r[0].trim() !== "") {
                        genres.add(r[1].trim());
                        movies.push({ name: r[0].trim(), genre: r[1].trim(), link: r[2].trim(), total: parseInt(r[3]) || '?', cover: (r.length > 4 && r[4].trim() !== "") ? r[4].trim() : null });
                    }
                }
                const filterEl = $('mv-filter'); filterEl.innerHTML = `<option value="all">Tất cả</option>`;
                genres.forEach(g => { if(g) filterEl.innerHTML += `<option value="${g}">${g}</option>`; });
                
                localProgressData = getLocalVal(getProgressKey(), {}); 
                if (IS_LOGGED_IN) await syncCloudHistory();
                renderHome(); 
            } catch (e) { $('mv-home-content').innerHTML = `<div style="color:red; text-align:center;">Lỗi tải dữ liệu. Kiểm tra lại ID Sheet.</div>`; }
        };

        // HIỂN THỊ DANH SÁCH PHIM
        const renderHome = () => {
            const kw = $('mv-search').value.toLowerCase(); const gr = $('mv-filter').value; const content = $('mv-home-content');
            content.innerHTML = ''; 

            let displayList = movies;
            if (kw !== '' || gr !== 'all') {
                displayList = movies.filter(m => m.name.toLowerCase().includes(kw) && (gr === 'all' || m.genre === gr));
            }

            if(displayList.length === 0) { content.innerHTML = `<div style="width:100%; text-align:center; padding:20px;">Chưa có bộ phim nào.</div>`; return; }

            const sec = document.createElement('div');
            sec.innerHTML = `<div class="mv-section-title">🍿 Kho Phim Của Bạn</div><div class="mv-grid-container" id="mv-main-grid" style="margin-top:20px;"></div>`;
            content.appendChild(sec);
            const grid = sec.querySelector('#mv-main-grid');

            displayList.forEach(movie => {
                const card = document.createElement('div'); card.className = 'mv-card';
                let coverHtml = (movie.cover && movie.cover.startsWith('http')) ? `<img src="${movie.cover}" class="mv-card-img" loading="lazy">` : movie.name.charAt(0).toUpperCase();
                let progressHtml = (localProgressData[movie.link] && localProgressData[movie.link].epNum) ? `<div class="mv-card-progress">Đang xem: Tập ${localProgressData[movie.link].epNum}</div>` : '';
                
                card.innerHTML = `<div class="mv-card-cover">${coverHtml}${progressHtml}</div><div class="mv-card-info"><div class="mv-card-title">${movie.name}</div><div class="mv-card-genre">${movie.genre}</div></div>`;
                card.onclick = () => openMovie(movie); 
                grid.appendChild(card);
            });
        };
    
        $('mv-search').oninput = renderHome;
        $('mv-filter').onchange = renderHome;
    
        // KHI BẤM VÀO PHIM -> QUÉT TẬP & MỞ TRANG XEM
        const openMovie = async (movie) => {
            currentMovie = movie;
            $('mv-view-home').style.display = 'none'; $('mv-view-player').style.display = 'flex';
            $('mv-read-title').innerText = movie.name;
            $('mv-read-ep').innerText = 'Đang tải danh sách tập...';
            $('mv-video-container').innerHTML = '';
            $('mv-episodes-grid').innerHTML = '';
            $('mv-loading').style.display = 'flex';
            
            try {
                const episodes = await getEpisodes(movie.link);
                if(episodes.length === 0) throw new Error("Web nguồn chưa cập nhật tập phim nào, hoặc web đã bị sập!");
                currentMovie.episodes = episodes;
                
                // Vẽ lưới nút chọn tập
                let gridHtml = '';
                episodes.forEach(ep => {
                    gridHtml += `<button class="mv-ep-btn" data-url="${ep.url}" data-ep="${ep.num}">Tập ${ep.num}</button>`;
                });
                $('mv-episodes-grid').innerHTML = gridHtml;
                
                // Xác định tập tiếp theo cần xem
                const saved = localProgressData[movie.link];
                let targetEpNum = saved && saved.epNum ? saved.epNum : episodes[0].num;
                const targetEpObj = episodes.find(e => e.num === targetEpNum) || episodes[0];
                
                // Gán sự kiện click cho các nút
                document.querySelectorAll('.mv-ep-btn').forEach(btn => {
                    btn.onclick = () => { playEpisode(parseInt(btn.getAttribute('data-ep')), btn.getAttribute('data-url')); };
                });

                $('mv-loading').style.display = 'none';
                // Tự động play
                playEpisode(targetEpObj.num, targetEpObj.url);

            } catch(e) {
                $('mv-loading').style.display = 'none';
                $('mv-video-container').innerHTML = `<div style="color:red; text-align:center; padding: 50px;">Lỗi: ${e.message}</div>`;
            }
        };

       // PHÁT VIDEO CỦA MỘT TẬP CỤ THỂ
        const playEpisode = async (epNum, epUrl) => {
            $('mv-read-ep').innerText = `Tập ${epNum} / ${currentMovie.total}`;
            
            document.querySelectorAll('.mv-ep-btn').forEach(btn => {
                btn.classList.remove('active');
                if(parseInt(btn.getAttribute('data-ep')) === epNum) btn.classList.add('active');
            });
            
            $('mv-video-container').innerHTML = '<div class="neon-loader-container" style="height:100%; display:flex; justify-content:center; align-items:center;"><div class="neon-ring"></div></div>';
            
            try {
                const iframeSrc = await getVideoSrc(epUrl);
                if(iframeSrc) {
                    if (iframeSrc.includes('.m3u8') || iframeSrc.includes('.mp4')) {
                        // Tự dựng rạp chiếu m3u8 cực xịn ngay tại trình duyệt
                        let playerHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>body,html{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;} video{width:100%;height:100%;object-fit:contain; outline:none;}</style>
                            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
                        </head>
                        <body>
                            <video id="vid" controls autoplay></video>
                            <script>
                                var video = document.getElementById('vid');
                                var src = "${iframeSrc}";
                                if (Hls.isSupported() && src.indexOf('.m3u8') !== -1) {
                                    var hls = new Hls();
                                    hls.loadSource(src);
                                    hls.attachMedia(video);
                                    hls.on(Hls.Events.MANIFEST_PARSED, function() { video.play().catch(e=>console.log("Auto-play blocked")); });
                                } else {
                                    video.src = src;
                                    video.play().catch(e=>console.log("Auto-play blocked"));
                                }
                            </script>
                        </body>
                        </html>`;
                        
                        let iframe = document.createElement('iframe');
                        iframe.className = 'mv-video-iframe';
                        iframe.allowFullscreen = true;
                        iframe.srcdoc = playerHtml;
                        $('mv-video-container').innerHTML = '';
                        $('mv-video-container').appendChild(iframe);

                    } else if (iframeSrc.includes('hoathinh3d.ee')) {
                        // NẾU TRƯỜNG HỢP CỰC ĐOAN: VẪN BỊ TRẢ VỀ LINK NỘI BỘ HOATHINH3D (gây lỗi sameorigin)
                        // GIẢI PHÁP TỐI THƯỢNG: Hack nạp thẳng mã HTML của họ vào bộ nhớ (srcdoc bypass)
                        try {
                            let playerPageHtml = await new Promise((resolve, reject) => {
                                context.GM_xmlhttpRequest({
                                    method: "GET", url: iframeSrc,
                                    headers: { "Referer": epUrl },
                                    onload: (res) => { if(res.status === 200) resolve(res.responseText); else reject(); },
                                    onerror: reject
                                });
                            });
                            
                            // Bơm thẻ base để các file css/js chạy bình thường như ở trang chủ
                            if (playerPageHtml.includes('<head>')) {
                                playerPageHtml = playerPageHtml.replace('<head>', '<head><base href="https://hoathinh3d.ee/">');
                            } else {
                                playerPageHtml = '<head><base href="https://hoathinh3d.ee/"></head>' + playerPageHtml;
                            }
                            
                            let iframe = document.createElement('iframe');
                            iframe.className = 'mv-video-iframe';
                            iframe.allowFullscreen = true;
                            iframe.srcdoc = playerPageHtml;
                            $('mv-video-container').innerHTML = '';
                            $('mv-video-container').appendChild(iframe);
                            
                        } catch(err) {
                            $('mv-video-container').innerHTML = `<div style="color:red; text-align:center; padding: 50px;">❌ Không thể lách qua lớp bảo vệ!</div>`;
                        }

                    } else {
                        // Link bên thứ 3 (Hydrax, Ophim...) nhúng hoàn toàn bình thường
                        $('mv-video-container').innerHTML = `<iframe class="mv-video-iframe" src="${iframeSrc}" referrerpolicy="no-referrer" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" frameborder="0"></iframe>`;
                    }
                } else {
                    $('mv-video-container').innerHTML = `<div style="color:#d63031; text-align:center; padding: 50px; font-weight:bold;">❌ Web nguồn thay đổi cấu trúc, không bắt được link!</div>`;
                }
                
                localProgressData[currentMovie.link] = { epNum: epNum, time: Date.now() };
                setLocalVal(getProgressKey(), localProgressData);
                if(Math.random() > 0.5) saveCloudHistory(); 
                
            } catch(e) {
                $('mv-video-container').innerHTML = `<div style="color:red; text-align:center; padding: 50px;">❌ Mất kết nối tới máy chủ chiếu phim!</div>`;
            }
        };
    
        loadDataFromSheet();
    };
    
    return {
        name: "Xem Phim",
        icon: `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2zm-6.75 11.25L10 12l4.25 3.25L10 18v-2.75z" fill="white"/></svg>`,
        bgColor: "#d63031",
        action: runTool
    };
})
