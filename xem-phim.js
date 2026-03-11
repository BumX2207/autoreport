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
    // 3. BỘ CÀO PHIM (SCRAPER) TỐI ƯU TỪ HOATHINH3D
    // ===============================================================
    
    // Hàm get HTML vượt rào CORS xịn nhất bằng công cụ của Tampermonkey
    const fetchHtml = (targetUrl) => {
        return new Promise((resolve, reject) => {
            context.GM_xmlhttpRequest({
                method: "GET",
                url: targetUrl,
                onload: (res) => {
                    if(res.status === 200) resolve(res.responseText);
                    else reject(new Error("Lỗi HTTP: " + res.status));
                },
                onerror: () => reject(new Error("Mất kết nối mạng!"))
            });
        });
    };

    const parseCSV = (text) => {
        const rows =[]; let row =[], curr = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) {
                if (char === '"') { if (text[i + 1] === '"') { curr += '"'; i++; } else { inQuotes = false; } } else { curr += char; }
            } else {
                if (char === '"') { inQuotes = true; } else if (char === ',') { row.push(curr); curr = ''; } 
                else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; row.push(curr); rows.push(row); row =[]; curr = ''; } else { curr += char; }
            }
        }
        if (curr !== '' || row.length > 0) { row.push(curr); rows.push(row); }
        return rows;
    };

    // Hàm quyét danh sách tập phim từ trang chủ Phim
    const getEpisodes = async (movieUrl) => {
        const htmlText = await fetchHtml(movieUrl);
        let episodeList =[];
        
        // Quét tất cả thẻ <a href="...tap-X...">
        const matches = htmlText.match(/href=["']([^"']+\/(?:xem-phim-)?[^"']*tap-\d+[^"']*)["']/gi);
        if(matches) {
            let seenEps = new Set();
            matches.forEach(m => {
                let url = m.split(/["']/)[1];
                if(url.startsWith('/')) url = 'https://hoathinh3d.ee' + url;
                if(!url.startsWith('http')) url = 'https://hoathinh3d.ee/' + url;
                
                // Lọc số tập để sắp xếp
                const epMatch = url.match(/tap-(\d+)/i);
                const epNum = epMatch ? parseInt(epMatch[1]) : 0;
                
                // Loại bỏ tập trùng lặp (ví dụ server 1, server 2) - Ưu tiên link quét được đầu tiên
                if(epNum > 0 && !seenEps.has(epNum)) {
                    seenEps.add(epNum);
                    episodeList.push({ num: epNum, url: url });
                }
            });
        }
        
        // Luôn sắp xếp lại từ Tập 1 -> Tập N
        episodeList.sort((a,b) => a.num - b.num);
        return episodeList;
    };

    // Hàm chuẩn hóa link URL (Sửa lỗi escape string \/)
    const formatUrl = (src) => {
        if (!src) return null;
        src = src.replace(/\\\//g, '/'); // Xóa dấu escape \/ nếu có trong cấu trúc JSON
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) return 'https://hoathinh3d.ee' + src;
        return src;
    };

    // Hàm đào link Iframe (Nâng cấp: Giải mã Base64, Regex JSON mở rộng)
    const getVideoSrc = async (epUrl) => {
        try {
            const htmlText = await fetchHtml(epUrl);
            let resultSrc = null;
            
            // 1. Quét tìm thẻ iframe trực tiếp
            const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
            let match;
            while ((match = iframeRegex.exec(htmlText)) !== null) {
                let src = match[1];
                if (src && !src.includes('facebook') && !src.includes('youtube') && !src.includes('google') && !src.includes('googletagmanager')) {
                    resultSrc = src; 
                    break;
                }
            }

            // 2. DOM Parser moi link giấu trong data-src (Hỗ trợ giải mã Base64)
            if (!resultSrc) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const elementsWithDataSrc = doc.querySelectorAll('[data-src],[data-iframe], [data-video], #box-player, .player-video');
                
                for (let el of elementsWithDataSrc) {
                    let src = el.getAttribute('data-src') || el.getAttribute('data-iframe') || el.getAttribute('data-video');
                    if (src) {
                        // Nếu chuỗi không chứa "http" và không bắt đầu bằng "/" -> Khả năng cao là Base64
                        if (!src.includes('http') && !src.startsWith('/')) {
                            try { src = atob(src); } catch(e) {} // Thử giải mã
                        }
                        
                        // Nếu giải mã ra nguyên 1 cụm HTML chứa <iframe ...>
                        if (src.includes('iframe')) {
                            let m = src.match(/src=["']([^"']+)["']/);
                            if (m) src = m[1];
                        }
                        
                        if (src.includes('http') || src.startsWith('//') || src.includes('player')) {
                            resultSrc = src;
                            break;
                        }
                    }
                }
            }

            // 3. Tìm link giấu trong thẻ Script (Biến JS hoặc JSON API)
            if (!resultSrc) {
                const scriptPatterns =[
                    /"link"\s*:\s*["']([^"']+)["']/i,
                    /"url"\s*:\s*["']([^"']+)["']/i,
                    /"iframe"\s*:\s*["']([^"']+)["']/i,
                    /(?:link_play|url_play|iframe_url|file|src)\s*[:=]\s*["']([^"']+)["']/i
                ];
                for (let pattern of scriptPatterns) {
                    const m = htmlText.match(pattern);
                    if (m && m[1]) {
                        let tempSrc = m[1];
                        // Nếu là dạng text HTML sinh ra từ JSON
                        if (tempSrc.includes('<iframe')) {
                            let im = tempSrc.match(/src=\\?["']([^"'\\]+)\\?["']/);
                            if (im) tempSrc = im[1];
                        }
                        if (tempSrc.includes('http') || tempSrc.startsWith('//') || tempSrc.includes('player')) {
                            resultSrc = tempSrc;
                            break;
                        }
                    }
                }
            }

            return formatUrl(resultSrc);
            
        } catch(e) {
            console.error("Lỗi cào link video:", e);
        }
        return null; 
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
            
            // Đổi màu nút
            document.querySelectorAll('.mv-ep-btn').forEach(btn => {
                btn.classList.remove('active');
                if(parseInt(btn.getAttribute('data-ep')) === epNum) btn.classList.add('active');
            });
            
            $('mv-video-container').innerHTML = '<div class="neon-loader-container" style="height:100%; display:flex; justify-content:center; align-items:center;"><div class="neon-ring"></div></div>';
            
            try {
                const iframeSrc = await getVideoSrc(epUrl);
                if(iframeSrc) {
                    // THÊM referrerpolicy="no-referrer" ĐỂ BYPASS LỖI HOST TỪ CHỐI PHÁT (403)
                    $('mv-video-container').innerHTML = `<iframe class="mv-video-iframe" src="${iframeSrc}" referrerpolicy="origin" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe>`;
                } else {
                    $('mv-video-container').innerHTML = `<div style="color:#d63031; text-align:center; padding: 50px; font-weight:bold;">❌ Không đào được link Video từ Server. Trang web có thể đã đổi cấu trúc!</div>`;
                }
                
                // Lưu lịch sử xem phim
                localProgressData[currentMovie.link] = { epNum: epNum, time: Date.now() };
                setLocalVal(getProgressKey(), localProgressData);
                
                // Random lưu để đỡ request API quá nhiều lần liên tục
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
