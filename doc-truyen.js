((context) => {
    // ===============================================================
    // 1. CẤU HÌNH DATA SHEET
    // ===============================================================
    const SHEET_ID = '1iuApMwdKYx9ofo0oJR84AlzXka0PmTQPudXzx0Uub0o';
    const SHEET_GID = '984479015';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    
    // Khóa lưu trữ lịch sử đọc cục bộ (Dùng cho cả Khách và User)
    const PROGRESS_KEY = 'tgdd_story_progress_v1';
    
    // Lấy thông tin User và API từ Auto BI Context
    // Nếu không có User (Khách) -> Tạo một ID ảo để hiển thị cho đẹp
    let USER_NAME = 'Khách';
    if (context.AUTH_STATE && context.AUTH_STATE.userName) {
        USER_NAME = context.AUTH_STATE.userName;
    } else {
        // Tạo ID ảo cho khách nếu chưa có
        let guestId = localStorage.getItem('tgdd_guest_id');
        if (!guestId) {
            guestId = 'Guest-' + Math.floor(Math.random() * 1000);
            localStorage.setItem('tgdd_guest_id', guestId);
        }
        USER_NAME = guestId;
    }
    
    const API_URL = context.CONSTANTS ? context.CONSTANTS.GSHEET.CONFIG_API : null;
    
    // ===============================================================
    // 2. CSS GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        #truyen-app { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f8f9fa; z-index:2147483800; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; flex-direction:column; overflow:hidden; }
        
        /* HEADER */
        .tr-header { background:#fff; padding:10px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; z-index:20; flex-shrink:0; }
        .tr-logo { font-size:20px; font-weight:900; color:#e17055; display:flex; align-items:center; gap:8px; cursor:pointer;}
        .tr-btn-close { background:#fab1a0; color:#d63031; border:none; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; }
        
        /* USER INFO BAR */
        .tr-user-bar { background:#2d3436; color:#dfe6e9; padding:5px 20px; font-size:12px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; }
        .tr-user-name { color: #00cec9; }

        /* TOOLBAR */
        .tr-toolbar { background:#fff; padding:10px 20px; border-bottom:1px solid #eee; display:flex; gap:10px; z-index:15; flex-wrap:nowrap; align-items:center; }
        .tr-search-box { flex:1; display:flex; min-width: 0; }
        .tr-search-box input { width:100%; padding:8px 15px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; transition:0.3s; }
        .tr-search-box input:focus { border-color:#e17055; box-shadow:0 0 5px rgba(225,112,85,0.3); }
        .tr-filter { padding:8px 10px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; background:#fff; cursor:pointer; width: 130px; flex-shrink: 0; text-overflow: ellipsis;}
        
        /* GRID TRUYỆN */
        .tr-home-body { flex:1; overflow-y:auto; padding:20px; background:#f4f5f7; display:flex; flex-wrap:wrap; gap:20px; align-content: flex-start;}
        .tr-card { background:#fff; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.05); width:calc(25% - 15px); min-width:200px; overflow:hidden; cursor:pointer; transition:transform 0.2s; display:flex; flex-direction:column;}
        .tr-card:hover { transform:translateY(-5px); box-shadow:0 8px 15px rgba(0,0,0,0.1); }
        
        .tr-card-cover { background:#e17055; height:200px; display:flex; align-items:center; justify-content:center; color:white; font-size:50px; overflow:hidden; position:relative; }
        .tr-card-img { width:100%; height:100%; object-fit:cover; display:block; }
        .tr-card-progress { position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.7); color:#FFD700; font-size:12px; font-weight:bold; padding:5px; text-align:center; }
    
        .tr-card-info { padding:12px; flex:1; display:flex; flex-direction:column; }
        .tr-card-title { font-size:15px; font-weight:bold; color:#2d3436; margin-bottom:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .tr-card-genre { font-size:11px; color:#00b894; background:#e8f8f5; padding:3px 8px; border-radius:12px; align-self:flex-start; margin-bottom:8px;}
        .tr-card-chap { font-size:12px; color:#636e72; margin-top:auto; font-weight:500;}
    
        /* READER VIEW */
        .tr-reader-view { display:none; flex:1; flex-direction:column; background:#f4f5f7; overflow:hidden; position:relative; }
        
        .tr-reader-tools { background:#2d3436; padding:10px 20px; display:flex; justify-content:center; gap:10px; z-index:10; position: relative; flex-wrap: wrap;}
        .tr-btn-tool { background:#636e72; color:white; border:none; padding:8px 15px; border-radius:20px; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s; white-space: nowrap;}
        .tr-btn-tool:hover { background:#b2bec3; color:#2d3436; }
        .tr-btn-play { background:#00b894; }
        .tr-btn-play:hover { background:#55efc4; }
        .tr-btn-stop { background:#d63031; }
        .tr-btn-settings { background:#0984e3; } 
        .tr-btn-sleep { background:#6c5ce7; }

        /* BẢNG CÀI ĐẶT */
        .tr-settings-panel {
            position: absolute; top: 50px; left: 50%; transform: translateX(-50%);
            background: white; padding: 15px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            width: 300px; display: none; flex-direction: column; gap: 10px; z-index: 100;
            border: 1px solid #eee;
        }
        .tr-settings-panel.show { display: flex; animation: slideDown 0.2s; }
        .tr-setting-row { display: flex; flex-direction: column; gap: 5px; }
        .tr-setting-label { font-size: 12px; font-weight: bold; color: #555; }
        .tr-setting-input { width: 100%; cursor: pointer; }
        .tr-setting-val { font-size: 11px; color: #0984e3; float: right;}
        @keyframes slideDown { from {opacity:0; transform:translate(-50%, -10px);} to {opacity:1; transform:translate(-50%, 0);} }
        
        .tr-reader-info-bar { background:#fff; padding:15px 20px; border-bottom:1px solid #ddd; z-index:9; flex-shrink:0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .tr-story-title { font-size:20px; font-weight:bold; color:#2d3436; text-align:center; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
        .tr-chapter-title { font-size:16px; color:#e17055; text-align:center; margin-bottom:10px; font-weight:600;}
        .tr-nav-bar { display:flex; justify-content:center; align-items:center; gap:10px;}
        .tr-nav-btn { padding:6px 15px; background:#e17055; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; transition:0.2s; white-space:nowrap; }
        .tr-nav-btn:hover { background:#d63031; }
        .tr-nav-btn:disabled { background:#b2bec3; cursor:not-allowed; }
        .tr-nav-select { padding:6px; border-radius:4px; border:1px solid #ccc; font-size:14px; outline:none; max-width: 150px; cursor:pointer;}
    
        .tr-reader-content-wrap { flex:1; overflow-y:auto; padding:20px; scroll-behavior: smooth; display:flex; justify-content:center; align-items:flex-start; }
        .tr-paper { background:#fff; max-width:800px; width:100%; padding:30px 40px; border-radius:8px; box-shadow:0 5px 20px rgba(0,0,0,0.05); height:fit-content; margin-bottom: 50px; }
        
        .tr-text { font-size:18px; line-height:1.7; color:#2d3436; text-align:justify; }
        .tr-text p { margin-bottom: 15px; }
        .tr-reading-active { background: #ffeaa7; color: #d63031; border-radius: 3px; border-left: 3px solid #e17055; padding-left: 5px; }
    
        .tr-loading-overlay { position:absolute; top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:50; font-weight:bold; font-size:16px; color:#e17055;}
        
        /* FAKE LOCK SCREEN */
        #tr-fake-lock-screen {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000000; z-index: 2147483999; 
            flex-direction: column; justify-content: center; align-items: center;
            color: #444; user-select: none;
        }
        .tr-fake-clock { font-size: 40px; font-weight: bold; color: #222; margin-bottom: 20px; }
        .tr-fake-hint { font-size: 14px; color: #333; animation: breathe 3s infinite; }
        @keyframes breathe { 0%, 100% {opacity: 0.3} 50% {opacity: 0.8} }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .tr-card { width:calc(33.33% - 15px); }
            .tr-paper { padding: 20px; }
            .tr-text { font-size: 16px; }
            .tr-btn-tool span { display: none; }
            .tr-settings-panel { width: 90%; }
        }
        @media (max-width: 480px) {
            .tr-card { width:calc(50% - 10px); min-width: 140px; }
            .tr-card-cover { height: 180px; }
            .tr-toolbar { gap: 5px; padding: 10px; }
            .tr-nav-btn { padding: 6px 10px; font-size: 12px; }
            .tr-filter { width: 100px; font-size: 12px; }
        }
    `;
    
    // ===============================================================
    // 3. HÀM FETCH VƯỢT RÀO VÀ PARSE CSV
    // ===============================================================
    const fetchWithFallbacks = async (targetUrl) => {
        const proxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
        ];
        for (let proxy of proxies) {
            try {
                const res = await fetch(proxy);
                if (!res.ok) continue;
                let htmlText = "";
                if(proxy.includes('allorigins')) {
                    const json = await res.json();
                    htmlText = json.contents;
                } else {
                    htmlText = await res.text();
                }
                // Check if result is valid
                if(htmlText.includes('Cloudflare') && htmlText.includes('Attention Required!')) continue;
                if(!htmlText || htmlText.length < 10) continue;

                return htmlText;
            } catch (e) { console.warn("Proxy failed", proxy); }
        }
        throw new Error("Lỗi tải trang. Các Proxy đã bị chặn.");
    };
    
    const parseCSV = (text) => {
        if(!text) return [];
        const rows = [];
        let row = [], curr = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) {
                if (char === '"') {
                    if (text[i + 1] === '"') { curr += '"'; i++; } else { inQuotes = false; }
                } else { curr += char; }
            } else {
                if (char === '"') { inQuotes = true; } 
                else if (char === ',') { row.push(curr); curr = ''; } 
                else if (char === '\n' || char === '\r') {
                    if (char === '\r' && text[i + 1] === '\n') i++;
                    row.push(curr); rows.push(row); row = []; curr = '';
                } else { curr += char; }
            }
        }
        if (curr !== '' || row.length > 0) { row.push(curr); rows.push(row); }
        return rows;
    };
    
    // ===============================================================
    // 4. LOGIC CHÍNH CỦA APP
    // ===============================================================
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';
    
        const getLocalVal = (key, def) => { try { return typeof GM_getValue === 'function' ? GM_getValue(key, def) : (JSON.parse(localStorage.getItem(key)) || def); } catch(e) { return def; }};
        const setLocalVal = (key, val) => { try { if(typeof GM_setValue === 'function') GM_setValue(key, val); localStorage.setItem(key, JSON.stringify(val)); } catch(e){} };
    
        const $ = (id) => document.getElementById(id);
        let synth = window.speechSynthesis;
        
        let stories = [];
        let genres = new Set();
        let currentStory = null;
        let currentChapter = 1;
        let isReading = false;
        let currentSentences = [];
        let currentSentenceIndex = 0;
        let isResuming = false;
        let preloadedData = { chapNum: null, contentHtml: null, contentArr: null };

        // SETTINGS
        let ttsRate = 1.3;
        let ttsPitch = 1.0;
        let ttsVoiceIndex = -1;
        let availableVoices = [];
        
        // WAKE LOCK
        let wakeLock = null;
    
        // INIT UI
        let app = $('truyen-app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'truyen-app';
            app.innerHTML = `
                <div class="tr-header">
                    <div class="tr-logo" id="tr-btn-home">📖 Đọc Truyện Online</div>
                    <button class="tr-btn-close" id="tr-btn-close">✖</button>
                </div>
                <div class="tr-user-bar">
                    <span>Xin chào, <span class="tr-user-name">${USER_NAME}</span></span>
                    <span id="tr-status-text">Sẵn sàng</span>
                </div>
                <div id="tr-view-home" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                    <div class="tr-toolbar">
                        <div class="tr-search-box"><input type="text" id="tr-search" placeholder="🔍 Tìm truyện..."></div>
                        <select class="tr-filter" id="tr-filter"><option value="all">Tất cả</option></select>
                    </div>
                    <div class="tr-home-body" id="tr-grid"><div style="width:100%; text-align:center; padding:50px; color:#888;">⏳ Đang tải danh sách truyện...</div></div>
                </div>
                <div id="tr-view-reader" class="tr-reader-view">
                    <div class="tr-reader-tools">
                        <button class="tr-btn-tool" id="btn-back-home">⬅️ <span>Trang chủ</span></button>
                        <button class="tr-btn-tool tr-btn-play" id="btn-read-play">▶️ <span>Đọc</span></button>
                        <button class="tr-btn-tool" id="btn-read-pause">⏸️ <span>Dừng</span></button>
                        <button class="tr-btn-tool tr-btn-settings" id="btn-settings">⚙️ <span>Cài đặt</span></button>
                        <button class="tr-btn-tool tr-btn-sleep" id="btn-sleep-mode">🌙 <span>Treo máy</span></button>
                        <div class="tr-settings-panel" id="tr-settings-panel">
                            <div class="tr-setting-row">
                                <span class="tr-setting-label">Giọng đọc</span>
                                <select id="sel-voice" class="tr-nav-select" style="width:100%; max-width:100%"></select>
                            </div>
                            <div class="tr-setting-row">
                                <span class="tr-setting-label">Tốc độ: <span id="val-rate" class="tr-setting-val">1.3</span></span>
                                <input type="range" id="rng-rate" class="tr-setting-input" min="0.5" max="2.0" step="0.1" value="1.3">
                            </div>
                            <div class="tr-setting-row">
                                <span class="tr-setting-label">Cao độ: <span id="val-pitch" class="tr-setting-val">1.0</span></span>
                                <input type="range" id="rng-pitch" class="tr-setting-input" min="0.5" max="2.0" step="0.1" value="1.0">
                            </div>
                        </div>
                    </div>
                    <div class="tr-reader-info-bar">
                        <div class="tr-story-title" id="tr-read-title">Tên Truyện</div>
                        <div class="tr-chapter-title" id="tr-read-chap">Chương 1</div>
                        <div class="tr-nav-bar">
                            <button class="tr-nav-btn" id="btn-prev-chap">⬅ Trước</button>
                            <select class="tr-nav-select" id="sel-chap"></select>
                            <button class="tr-nav-btn" id="btn-next-chap">Tiếp ➡</button>
                        </div>
                    </div>
                    <div class="tr-reader-content-wrap" id="tr-content-wrap">
                        <div class="tr-paper"><div class="tr-text" id="tr-read-text">Nội dung...</div></div>
                    </div>
                    <div class="tr-loading-overlay" id="tr-loading">
                        <div style="font-size:40px; margin-bottom:10px;">⏳</div>
                        <span id="tr-load-msg">Đang tải dữ liệu truyện...</span>
                    </div>
                    <div id="tr-fake-lock-screen">
                        <div class="tr-fake-clock" id="tr-fake-clock">00:00</div>
                        <div class="tr-fake-hint">Chạm 2 lần để mở khóa</div>
                        <div style="margin-top:20px; color:#222; font-size:12px;">Mode: Battery Saver (OLED)</div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
    
            $('tr-btn-close').onclick = () => { app.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; stopTTS(); releaseWakeLock(); saveCloudHistory(); };
            $('tr-btn-home').onclick = $('btn-back-home').onclick = () => { stopTTS(); releaseWakeLock(); saveCloudHistory(); $('tr-view-reader').style.display = 'none'; $('tr-view-home').style.display = 'flex'; renderStories(stories); };
            
            $('btn-settings').onclick = (e) => { e.stopPropagation(); $('tr-settings-panel').classList.toggle('show'); };
            $('tr-settings-panel').onclick = (e) => e.stopPropagation();
            document.addEventListener('click', (e) => { if(!e.target.closest('#btn-settings')) $('tr-settings-panel').classList.remove('show'); });

            // Wake Lock
            $('btn-sleep-mode').onclick = async () => {
                if (!isReading) { alert("Vui lòng bấm ĐỌC trước khi treo máy!"); return; }
                try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); } } catch (err) {}
                $('tr-fake-lock-screen').style.display = 'flex';
                const updateClock = () => { const now = new Date(); $('tr-fake-clock').innerText = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`; };
                updateClock(); window.fakeClockInterval = setInterval(updateClock, 10000);
            };
            let lastTap = 0;
            $('tr-fake-lock-screen').onclick = (e) => {
                const cur = new Date().getTime(); const diff = cur - lastTap;
                if (diff < 500 && diff > 0) { $('tr-fake-lock-screen').style.display = 'none'; releaseWakeLock(); if(window.fakeClockInterval) clearInterval(window.fakeClockInterval); e.preventDefault(); }
                lastTap = cur;
            };
            const releaseWakeLock = () => { if (wakeLock) { wakeLock.release(); wakeLock = null; } };

            $('rng-rate').oninput = (e) => { ttsRate = parseFloat(e.target.value); $('val-rate').innerText = ttsRate; };
            $('rng-pitch').oninput = (e) => { ttsPitch = parseFloat(e.target.value); $('val-pitch').innerText = ttsPitch; };
            $('sel-voice').onchange = (e) => { ttsVoiceIndex = parseInt(e.target.value); };

            const loadVoices = () => {
                availableVoices = synth.getVoices().filter(v => v.lang.toLowerCase().includes('vi'));
                const sel = $('sel-voice'); sel.innerHTML = `<option value="-1">Mặc định</option>`;
                availableVoices.forEach((v, i) => { sel.innerHTML += `<option value="${i}">${v.name}</option>`; });
            };
            synth.onvoiceschanged = loadVoices; setTimeout(loadVoices, 500);
        }
        app.style.display = 'flex';
    
        // LOAD DATA FUNCTION (REVERTED TO DIRECT FETCH)
        const loadDataFromSheet = async () => {
            try {
                // SỬ DỤNG FETCH TRỰC TIẾP NHƯ BẢN GỐC
                const res = await fetch(CSV_URL);
                if (!res.ok) throw new Error("Fetch failed");
                const csvText = await res.text();
                
                const rows = parseCSV(csvText);
                
                stories = []; genres.clear();
                for(let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    if(r.length >= 4 && r[0].trim() !== "") {
                        genres.add(r[1].trim());
                        stories.push({ 
                            name: r[0].trim(), 
                            genre: r[1].trim(), 
                            link: r[2].trim(), 
                            total: parseInt(r[3].trim()) || 1,
                            cover: (r.length > 4 && r[4].trim() !== "") ? r[4].trim() : null
                        });
                    }
                }
                renderFilters(); renderStories(stories);
            } catch (e) { 
                console.error(e);
                $('tr-grid').innerHTML = `<div style="color:red; width:100%; text-align:center;">Lỗi tải dữ liệu: ${e.message}</div>`; 
            }
        };
    
        const renderFilters = () => {
            const filterEl = $('tr-filter'); filterEl.innerHTML = `<option value="all">Tất cả</option>`;
            genres.forEach(g => { if(g) filterEl.innerHTML += `<option value="${g}">${g}</option>`; });
        };
    
        const renderStories = (list) => {
            const grid = $('tr-grid'); grid.innerHTML = '';
            if(list.length === 0) return grid.innerHTML = `<div style="width:100%; text-align:center;">Không tìm thấy truyện nào.</div>`;
            const progressData = getLocalVal(PROGRESS_KEY, {});
            list.forEach(story => {
                const card = document.createElement('div'); card.className = 'tr-card';
                let coverHtml = (story.cover && story.cover.startsWith('http')) ? `<img src="${story.cover}" class="tr-card-img" loading="lazy">` : story.name.charAt(0).toUpperCase();
                let progressHtml = (progressData[story.link] && progressData[story.link].chap) ? `<div class="tr-card-progress">Đang đọc: Chương ${progressData[story.link].chap}</div>` : '';
                card.innerHTML = `<div class="tr-card-cover">${coverHtml}${progressHtml}</div><div class="tr-card-info"><div class="tr-card-title">${story.name}</div><div class="tr-card-genre">${story.genre}</div><div class="tr-card-chap">Tổng: ${story.total} Chương</div></div>`;
                card.onclick = () => openStory(story); grid.appendChild(card);
            });
        };
    
        $('tr-search').oninput = () => {
            const kw = $('tr-search').value.toLowerCase(); const gr = $('tr-filter').value;
            renderStories(stories.filter(s => s.name.toLowerCase().includes(kw) && (gr === 'all' || s.genre === gr)));
        };
        $('tr-filter').onchange = $('tr-search').oninput;
    
        const getChapterUrl = (baseLink, chapNum) => {
            if(baseLink.match(/chuong-\d+/)) return baseLink.replace(/chuong-\d+/, `chuong-${chapNum}`);
            let cleanLink = baseLink.endsWith('/') ? baseLink.slice(0, -1) : baseLink;
            return `${cleanLink}/chuong-${chapNum}/`;
        };
    
        const parseChapterHTML = (htmlText) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const contentHtml = doc.querySelector('#chapter-c') || doc.querySelector('.chapter-c');
            if(!contentHtml) throw new Error("Không tìm thấy nội dung chữ.");
            contentHtml.querySelectorAll('.ads, script, iframe').forEach(el => el.remove());
            const paragraphs = Array.from(contentHtml.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 0);
            let finalHtml = "", cleanArr = [];
            if(paragraphs.length > 0) {
                finalHtml = paragraphs.map(p => `<p>${p}</p>`).join(''); cleanArr = paragraphs;
            } else {
                let rawParts = contentHtml.innerHTML.split(/<br\s*\/?>/i).map(t => t.replace(/<[^>]*>?/gm, '').trim()).filter(t => t.length > 0);
                finalHtml = rawParts.map(p => `<p>${p}</p>`).join(''); cleanArr = rawParts;
            }
            return { finalHtml, cleanArr };
        };
    
        const updateNavUI = () => {
            $('btn-prev-chap').disabled = (currentChapter <= 1);
            $('btn-next-chap').disabled = (currentChapter >= currentStory.total);
            let optionsHTML = [];
            for(let i=1; i<=currentStory.total; i++){ optionsHTML.push(`<option value="${i}" ${i === currentChapter ? 'selected' : ''}>Chương ${i}</option>`); }
            $('sel-chap').innerHTML = optionsHTML.join('');
        };
    
        const preloadNextChapter = async (chapNum) => {
            if (chapNum > currentStory.total) return;
            try {
                const targetUrl = getChapterUrl(currentStory.link, chapNum);
                const htmlText = await fetchWithFallbacks(targetUrl);
                const parsed = parseChapterHTML(htmlText);
                preloadedData = { chapNum: chapNum, contentHtml: parsed.finalHtml, contentArr: parsed.cleanArr };
            } catch (e) { preloadedData = { chapNum: null }; }
        };
    
        const openStory = async (story) => {
            currentStory = story; preloadedData = { chapNum: null };
            $('tr-view-home').style.display = 'none'; $('tr-view-reader').style.display = 'flex';
            const progressData = getLocalVal(PROGRESS_KEY, {});
            const saved = progressData[story.link];
            if (saved && saved.chap) {
                currentChapter = saved.chap; currentSentenceIndex = saved.sentence || 0; isResuming = true;
            } else {
                currentChapter = 1; currentSentenceIndex = 0; isResuming = false;
            }
            await loadAndDisplayChapter(currentChapter);
        };
    
        const loadAndDisplayChapter = async (chapNum) => {
            stopTTS(); currentChapter = chapNum;
            $('tr-load-msg').innerText = `Đang tải: ${currentStory.name} - Chương ${currentChapter}...`;
            $('tr-loading').style.display = 'flex';
            try {
                let data = null;
                if (preloadedData.chapNum === currentChapter) {
                    data = { finalHtml: preloadedData.contentHtml, cleanArr: preloadedData.contentArr };
                } else {
                    const targetUrl = getChapterUrl(currentStory.link, currentChapter);
                    const htmlText = await fetchWithFallbacks(targetUrl);
                    data = parseChapterHTML(htmlText);
                }
                $('tr-read-title').innerText = currentStory.name;
                $('tr-read-chap').innerText = `Chương ${currentChapter} / ${currentStory.total}`;
                $('tr-read-text').innerHTML = data.finalHtml;
                updateNavUI(); 
                currentSentences = data.cleanArr.join('. ').match(/[^.!?\n]+[.!?\n]+/g) || data.cleanArr;
                if (!isResuming) { currentSentenceIndex = 0; }
                $('tr-loading').style.display = 'none';
                if (isResuming && currentSentenceIndex > 0) {
                    setTimeout(() => {
                        const pTags = $('tr-read-text').querySelectorAll('p');
                        let targetSentence = currentSentences[currentSentenceIndex];
                        if(targetSentence) {
                            for(let p of pTags) {
                                if(p.innerText.includes(targetSentence.substring(0, 15))) {
                                    p.classList.add('tr-reading-active');
                                    p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    break;
                                }
                            }
                        }
                        isResuming = false;
                    }, 500);
                } else { $('tr-content-wrap').scrollTop = 0; }
                saveProgressToLocal(); saveCloudHistory();
                if (currentChapter < currentStory.total) { setTimeout(() => { preloadNextChapter(currentChapter + 1); }, 1500); }
            } catch (e) {
                $('tr-loading').style.display = 'none'; $('tr-read-text').innerHTML = `<p style="color:red;">Lỗi tải chương: ${e.message}</p>`;
            }
        };
    
        const saveProgressToLocal = () => {
            if(!currentStory) return;
            let progressData = getLocalVal(PROGRESS_KEY, {});
            progressData[currentStory.link] = { chap: currentChapter, sentence: currentSentenceIndex, time: Date.now() };
            setLocalVal(PROGRESS_KEY, progressData);
        };

        const saveCloudHistory = () => {
            if(!currentStory || !context.AUTH_STATE.isAuthorized || !API_URL) return;
            const historyData = { story: currentStory.name, chapter: currentChapter, percent: Math.round((currentChapter / currentStory.total) * 100) + '%', time: new Date().toLocaleString('vi-VN') };
            $('tr-status-text').innerText = "Đang lưu...";
            context.GM_xmlhttpRequest({
                method: "POST", url: API_URL,
                data: JSON.stringify({ action: 'save_config', type: 'history', user: USER_NAME, config: JSON.stringify(historyData) }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: (res) => { $('tr-status-text').innerText = "Đã lưu"; setTimeout(()=> $('tr-status-text').innerText = "Sẵn sàng", 2000); },
                onerror: () => { $('tr-status-text').innerText = "Lỗi lưu"; }
            });
        };
    
        $('btn-prev-chap').onclick = () => { if(currentChapter > 1) { isResuming=false; saveCloudHistory(); loadAndDisplayChapter(currentChapter - 1); }};
        $('btn-next-chap').onclick = () => { if(currentChapter < currentStory.total) { isResuming=false; saveCloudHistory(); loadAndDisplayChapter(currentChapter + 1); }};
        $('sel-chap').onchange = (e) => { isResuming=false; saveCloudHistory(); loadAndDisplayChapter(parseInt(e.target.value)); };
    
        const getVoice = () => {
            if (ttsVoiceIndex >= 0 && availableVoices[ttsVoiceIndex]) return availableVoices[ttsVoiceIndex];
            let voices = synth.getVoices();
            let viVoices = voices.filter(v => v.lang.toLowerCase().includes('vi'));
            if (viVoices.length === 0) return null;
            return viVoices.find(v => v.name.includes('Google') || v.name.includes('Tiếng Việt')) || viVoices[0];
        };
    
        const setupUtterance = (text, isSystemMsg = false) => {
            let u = new SpeechSynthesisUtterance(text);
            u.lang = 'vi-VN'; 
            const voice = getVoice();
            if(voice) u.voice = voice;
            u.rate = isSystemMsg ? 1.4 : ttsRate; u.pitch = isSystemMsg ? 1.1 : ttsPitch; 
            return u;
        };
    
        const speakSystemMsg = (text, callback) => {
            let u = setupUtterance(text, true);
            u.onend = () => { if(callback) callback(); };
            synth.speak(u);
        };
    
        const speakNextSentence = () => {
            if(currentSentenceIndex >= currentSentences.length) { handleChapterFinished(); return; }
            let sentence = currentSentences[currentSentenceIndex];
            let u = setupUtterance(sentence);
            u.onend = () => { currentSentenceIndex++; saveProgressToLocal(); if(isReading) speakNextSentence(); };
            u.onerror = (e) => { console.warn("TTS Error: ", e); isReading = false; };
            synth.speak(u);
            const pTags = $('tr-read-text').querySelectorAll('p');
            pTags.forEach(p => p.classList.remove('tr-reading-active'));
            for(let p of pTags) { if(p.innerText.includes(sentence.substring(0, 15))) { p.classList.add('tr-reading-active'); p.scrollIntoView({ behavior: 'smooth', block: 'center' }); break; } }
        };
    
        const handleChapterFinished = () => {
            isReading = false; saveCloudHistory();
            if(currentChapter < currentStory.total) {
                speakSystemMsg(`Đã đọc xong chương ${currentChapter}, chuyển sang chương mới.`, async () => {
                    isResuming = false; await loadAndDisplayChapter(currentChapter + 1); isReading = true; speakNextSentence();
                });
            } else { speakSystemMsg("Đã đọc xong bộ truyện. Cảm ơn bạn.", () => { alert("Bạn đã đọc hết truyện!"); }); }
        };
    
        const stopTTS = () => { isReading = false; synth.cancel(); };
    
        $('btn-read-play').onclick = () => { if (!isReading) { isReading = true; synth.getVoices(); if(synth.paused) synth.resume(); else speakNextSentence(); } };
        $('btn-read-pause').onclick = () => { isReading = false; synth.pause(); saveProgressToLocal(); saveCloudHistory(); };
        $('btn-read-stop').onclick = () => { stopTTS(); currentSentenceIndex = 0; saveProgressToLocal(); saveCloudHistory(); $('tr-read-text').querySelectorAll('p').forEach(p => p.classList.remove('tr-reading-active'));};
    
        loadDataFromSheet();
    };
    
    return {
        name: "Đọc Truyện V1",
        icon: `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.15C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" fill="white"/></svg>`,
        bgColor: "#e17055",
        action: runTool
    };
})
