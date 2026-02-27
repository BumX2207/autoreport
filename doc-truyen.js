((context) => {
    // ===============================================================
    // 1. CẤU HÌNH DATA SHEET & BIẾN CƠ SỞ
    // ===============================================================
    let USER_NAME = 'Khách';
    let IS_LOGGED_IN = false;
    const SHEET_ID = '1iuApMwdKYx9ofo0oJR84AlzXka0PmTQPudXzx0Uub0o';
    const SHEET_GID = '984479015';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    
    const getProgressKey = () => 'tgdd_truyen_progress_' + USER_NAME;
    
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
    // 2. CSS GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        /* FIX LỖI TRÀN MÀN HÌNH NGANG (BORDER-BOX) */
        #truyen-app { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f8f9fa; z-index:2147483646; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; flex-direction:column; overflow:hidden; box-sizing: border-box; }
        #truyen-app *, #truyen-app *::before, #truyen-app *::after { box-sizing: inherit; }
        
        .tr-header { background:#fff; padding:10px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:center; align-items:center; z-index:20; flex-shrink:0; position:relative; height:60px; }
        .tr-logo { font-size:18px; font-weight:900; color:#e17055; text-transform:uppercase; letter-spacing: 1px;}
        
        .tr-btn-home-icon { position:absolute; left:20px; background:#ffeaa7; color:#e17055; border:none; border-radius:50%; width:36px; height:36px; display:flex; justify-content:center; align-items:center; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.1); transition:0.2s;}
        .tr-btn-home-icon:hover { background:#e17055; color:white; }
        
        .tr-btn-close { position:absolute; right:20px; background:#fab1a0; color:#d63031; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.1); transition:0.2s;}
        .tr-btn-close:hover { background:#d63031; color:white; }
        
        .tr-user-bar { background:#2d3436; color:#dfe6e9; padding:5px 20px; font-size:12px; display:flex; justify-content:space-between; align-items:center; font-weight:bold; flex-shrink:0;}
        .tr-user-name { color: #00cec9; }

        .tr-toolbar { background:#fff; padding:10px 20px; border-bottom:1px solid #eee; display:flex; gap:10px; z-index:15; flex-wrap:nowrap; align-items:center; flex-shrink:0;}
        .tr-search-box { flex:1; display:flex; min-width: 0; }
        .tr-search-box input { width:100%; padding:8px 15px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; transition:0.3s; }
        .tr-search-box input:focus { border-color:#e17055; box-shadow:0 0 5px rgba(225,112,85,0.3); }
        .tr-filter { padding:8px 10px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; background:#fff; cursor:pointer; width: 130px; flex-shrink: 0; text-overflow: ellipsis;}
        
        .tr-home-body { flex:1; overflow-y:auto; padding:20px; background:#f4f5f7; display:flex; flex-direction: column; gap:30px; scroll-behavior: smooth;}
        
        .tr-section { width: 100%; display: flex; flex-direction: column; gap: 15px;}
        .tr-section-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e17055; padding-bottom: 5px;}
        .tr-section-title { font-size: 18px; font-weight: bold; color: #2d3436; text-transform: uppercase; }
        .tr-btn-view-all { background: transparent; color: #e17055; border: 1px solid #e17055; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap;}
        .tr-btn-view-all:hover { background: #e17055; color: white; }
        .tr-grid-container { display:flex; flex-wrap:wrap; gap:20px; align-content: flex-start; width: 100%; }

        .tr-card { background:#fff; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.05); width:calc(16.666% - 16.666px); min-width:160px; overflow:hidden; cursor:pointer; transition:transform 0.2s; display:flex; flex-direction:column; position:relative;}
        .tr-card:hover { transform:translateY(-5px); box-shadow:0 8px 15px rgba(0,0,0,0.1); }
        
        .tr-card-cover { background:#e17055; height:200px; display:flex; align-items:center; justify-content:center; color:white; font-size:50px; overflow:hidden; position:relative; }
        .tr-card-img { width:100%; height:100%; object-fit:cover; display:block; }
        .tr-card-progress { position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.7); color:#FFD700; font-size:12px; font-weight:bold; padding:5px; text-align:center; }
    
        .tr-btn-delete-history { position:absolute; top:8px; right:8px; background:rgba(255,255,255,0.9); color:#d63031; border:none; border-radius:50%; width:26px; height:26px; font-size:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:center; align-items:center; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:0.2s; }
        .tr-btn-delete-history:hover { background:#d63031; color:white; }

        .tr-card-info { padding:12px; flex:1; display:flex; flex-direction:column; }
        .tr-card-title { font-size:15px; font-weight:bold; color:#2d3436; margin-bottom:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .tr-card-genre { font-size:11px; color:#00b894; background:#e8f8f5; padding:3px 8px; border-radius:12px; align-self:flex-start; margin-bottom:8px;}
        .tr-card-chap { font-size:12px; color:#636e72; margin-top:auto; font-weight:500;}
    
        .tr-reader-view { display:none; flex:1; flex-direction:column; background:#f4f5f7; overflow:hidden; position:relative; }
        
        .tr-reader-info-bar { background:#fff; padding:15px 20px; border-bottom:1px solid #ddd; z-index:9; flex-shrink:0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .tr-story-title { font-size:20px; font-weight:bold; color:#2d3436; text-align:center; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
        .tr-chapter-title { font-size:16px; color:#e17055; text-align:center; margin-bottom:10px; font-weight:600;}
        .tr-nav-bar { display:flex; justify-content:center; align-items:center; gap:10px;}
        .tr-nav-btn { padding:6px 15px; background:#e17055; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; transition:0.2s; white-space:nowrap; }
        .tr-nav-btn:hover { background:#d63031; }
        .tr-nav-btn:disabled { background:#b2bec3; cursor:not-allowed; }
        .tr-nav-select { padding:6px; border-radius:4px; border:1px solid #ccc; font-size:14px; outline:none; max-width: 150px; cursor:pointer;}
    
        .tr-reader-content-wrap { flex:1; overflow-y:auto; padding:20px; scroll-behavior: smooth; display:flex; justify-content:center; align-items:flex-start; }
        .tr-paper { background:#fff; max-width:800px; width:100%; padding:30px 40px; border-radius:8px; box-shadow:0 5px 20px rgba(0,0,0,0.05); height:fit-content; margin-bottom: 30px; }
        
        .tr-text { font-size:18px; line-height:1.7; color:#2d3436; text-align:justify; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }
        .tr-text p { margin-bottom: 15px; }

        .tr-sent { cursor: pointer; border-radius: 4px; padding: 2px 3px; transition: background 0.2s, color 0.2s; }
        .tr-sent:hover { background: #e8f8f5; }
        .tr-reading-active { background: #ffeaa7; color: #d63031; }

        /* THANH TIẾN ĐỘ ĐỌC NẰM NGAY TRÊN TOOLBAR */
        .tr-progress-container { width: 100%; height: 5px; background: rgba(225, 112, 85, 0.15); z-index: 100; flex-shrink: 0; }
        .tr-progress-bar { height: 100%; background: linear-gradient(90deg, #ff9ff3, #e17055); width: 0%; transition: width 0.2s linear; position: relative; }
        .tr-progress-thumb { position: absolute; right: -6px; top: -5px; width: 15px; height: 15px; background: #fff; border: 3px solid #e17055; border-radius: 50%; box-shadow: 0 0 10px #e17055, 0 0 20px rgba(225,112,85,0.8); animation: spark 1.5s infinite alternate; }
        @keyframes spark { 0% { box-shadow: 0 0 5px #e17055, 0 0 10px rgba(225,112,85,0.5); transform: scale(0.9); } 100% { box-shadow: 0 0 15px #e17055, 0 0 25px rgba(225,112,85,1); transform: scale(1.15); } }

        /* THANH CÔNG CỤ NÚT BẤM DƯỚI CÙNG CAO 80PX */
        .tr-reader-tools { background:#2d3436; padding:0 20px; height:80px; display:flex; justify-content:center; align-items:center; gap:12px; z-index:10; position: relative; flex-wrap: nowrap; overflow-x: auto; flex-shrink: 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.1);}
        .tr-reader-tools::-webkit-scrollbar { display: none; }
        
        .tr-btn-tool { flex-shrink: 1; background:#636e72; color:white; border:none; padding:10px 20px; border-radius:25px; font-size:14px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.3s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.15); white-space: nowrap;}
        .tr-btn-tool:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.2); }
        .tr-btn-tool:active { transform: translateY(1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .tr-btn-play { background:#00b894; }
        .tr-btn-stop { background:#d63031; }
        .tr-btn-settings { background:#0984e3; } 
        .tr-btn-sleep { background:#6c5ce7; }
        
        /* BẢNG CÀI ĐẶT POPUP NÂNG LÊN CAO HƠN VÌ TOOLBAR ĐÃ 80PX */
        .tr-settings-panel {
            position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
            background: white; padding: 15px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            width: 300px; display: none; flex-direction: column; gap: 10px; z-index: 100;
            border: 1px solid #eee;
        }
        .tr-settings-panel.show { display: flex; animation: slideUp 0.2s; }
        .tr-setting-row { display: flex; flex-direction: column; gap: 5px; }
        .tr-setting-label { font-size: 12px; font-weight: bold; color: #555; }
        .tr-setting-input { width: 100%; cursor: pointer; }
        .tr-setting-val { font-size: 11px; color: #0984e3; float: right;}
        @keyframes slideUp { from {opacity:0; transform:translate(-50%, 10px);} to {opacity:1; transform:translate(-50%, 0);} }
    
        .tr-loading-overlay { position:absolute; top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:50; font-weight:bold; font-size:16px; color:#e17055;}
        
        #tr-fake-lock-screen {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000000; z-index: 2147483999; flex-direction: column; justify-content: center; align-items: center;
            color: #ccc; user-select: none; text-align: center; padding: 20px;
        }
        .tr-fake-status { font-size: 16px; color: #888; margin-bottom: 15px; }
        .tr-fake-story-name { font-size: 24px; font-weight: bold; color: #e17055; margin-bottom: 30px; text-transform: uppercase; }
        .tr-fake-hint { font-size: 14px; color: #555; animation: breathe 3s infinite; border: 1px solid #333; padding: 8px 15px; border-radius: 20px;}
        @keyframes breathe { 0%, 100% {opacity: 0.3; border-color:#333} 50% {opacity: 0.9; border-color:#777} }

        #tr-interruption-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2147483999; flex-direction: column; justify-content: center; align-items: center; }
        .tr-btn-resume-giant { width: 100px; height: 100px; border-radius: 50%; background: #00b894; color: white; border: none; font-size: 40px; cursor: pointer; box-shadow: 0 0 25px rgba(0, 184, 148, 0.6); display: flex; justify-content: center; align-items: center; animation: pulse-play 2s infinite; padding-left: 8px; }
        @keyframes pulse-play { 0% {transform: scale(1); box-shadow: 0 0 15px rgba(0,184,148,0.5);} 50% {transform: scale(1.1); box-shadow: 0 0 35px rgba(0,184,148,0.9);} 100% {transform: scale(1); box-shadow: 0 0 15px rgba(0,184,148,0.5);} }
        .tr-interruption-text { color: #fff; margin-top: 25px; font-size: 18px; font-weight: bold; letter-spacing: 1px;}
        .tr-btn-close-overlay { margin-top: 40px; background: transparent; border: 1px solid #777; color: #aaa; padding: 8px 25px; border-radius: 20px; cursor: pointer; font-size: 13px;}

        @media (max-width: 768px) {
            .tr-card { width:calc(33.33% - 15px); }
            .tr-paper { padding: 20px; }
            .tr-text { font-size: 16px; }
            .tr-settings-panel { width: 90%; }
        }
        @media (max-width: 480px) {
            .tr-card { width:calc(50% - 10px); min-width: 140px; }
            .tr-card-cover { height: 230px; }
            .tr-card-img { object-fit: fill; }
            .tr-toolbar { gap: 5px; padding: 10px; }
            .tr-nav-btn { padding: 6px 10px; font-size: 12px; }
            .tr-filter { width: 130px; font-size: 12px; }
            .tr-section-title { font-size: 16px; }
            
            /* LOẠI BỎ PADDING THỪA THEO ĐÚNG YÊU CẦU */
            .tr-reader-tools { gap: 8px; justify-content: space-between; padding: 0 15px; } 
        }
    `;
    
    // ===============================================================
    // 3. FETCH & PARSE
    // ===============================================================
    const fetchWithFallbacks = async (targetUrl) => {
        const proxies =[
            `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
        ];
        for (let proxy of proxies) {
            try {
                const res = await fetch(proxy);
                if (!res.ok) continue;
                let htmlText = "";
                if(proxy.includes('allorigins')) { const json = await res.json(); htmlText = json.contents; } 
                else { htmlText = await res.text(); }
                if(htmlText.includes('Cloudflare') && htmlText.includes('Attention Required!')) continue; 
                return htmlText;
            } catch (e) { console.warn("Proxy failed", proxy); }
        }
        throw new Error("Lỗi tải trang. Các Proxy đã bị chặn.");
    };
    
    const parseCSV = (text) => {
        const rows =[]; let row =[], curr = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) {
                if (char === '"') { if (text[i + 1] === '"') { curr += '"'; i++; } else { inQuotes = false; } } 
                else { curr += char; }
            } else {
                if (char === '"') { inQuotes = true; } 
                else if (char === ',') { row.push(curr); curr = ''; } 
                else if (char === '\n' || char === '\r') {
                    if (char === '\r' && text[i + 1] === '\n') i++;
                    row.push(curr); rows.push(row); row =[]; curr = '';
                } else { curr += char; }
            }
        }
        if (curr !== '' || row.length > 0) { row.push(curr); rows.push(row); }
        return rows;
    };
    
    // ===============================================================
    // 4. LOGIC CHÍNH
    // ===============================================================
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';
    
        const getLocalVal = (key, def) => { try { return typeof GM_getValue === 'function' ? GM_getValue(key, def) : (JSON.parse(localStorage.getItem(key)) || def); } catch(e) { return def; }};
        const setLocalVal = (key, val) => { try { if(typeof GM_setValue === 'function') GM_setValue(key, val); localStorage.setItem(key, JSON.stringify(val)); } catch(e){} };
    
        const $ = (id) => document.getElementById(id);
        let synth = window.speechSynthesis;
        synth.getVoices();
        
        let stories =[]; let genres = new Set();
        let currentStory = null; let currentChapter = 1; let currentSentences =[]; let currentSentenceIndex = 0;
        let isReading = false; let isResuming = false; let isJumping = false;
        let preloadedData = { chapNum: null, contentArr: null };
        let showAllHistory = false;
        
        let shouldReadChapterTitle = false;

        let isUserScrolling = false; let scrollResumeTimer = null;
        let localProgressData = {}; let activeSession = { link: null, chap: 1, sentence: 0 }; 

        let ttsRate = 1.3; let ttsPitch = 1.1; let ttsVoiceIndex = -1; let availableVoices =[]; let wakeLock = null;

        let currentCategoryView = null; 
        let categoryItemsLimit = 10; 
        
        const requestWakeLock = async () => {
            if (!wakeLock) {
                try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
            }
        };
        const releaseWakeLock = () => {
            if (wakeLock) { wakeLock.release(); wakeLock = null; }
        };

        const updatePlayPauseUI = (reading) => {
            const iconPlay = $('icon-play'); const iconStop = $('icon-stop');
            const textToggle = $('text-read-toggle'); const btnToggle = $('btn-read-toggle');
            if (reading) {
                if(iconPlay) iconPlay.style.display = 'none';
                if(iconStop) iconStop.style.display = 'block';
                if(textToggle) textToggle.innerText = 'Dừng lại';
                if(btnToggle) { btnToggle.classList.remove('tr-btn-play'); btnToggle.classList.add('tr-btn-stop'); }
            } else {
                if(iconPlay) iconPlay.style.display = 'block';
                if(iconStop) iconStop.style.display = 'none';
                if(textToggle) textToggle.innerText = 'AI Đọc';
                if(btnToggle) { btnToggle.classList.remove('tr-btn-stop'); btnToggle.classList.add('tr-btn-play'); }
            }
        };

        const updateProgressBar = () => {
            const wrap = $('tr-content-wrap');
            if (!wrap) return;
            let percent = 0;
            
            if (isReading && !isUserScrolling) {
                if (currentSentences.length > 0) percent = (currentSentenceIndex / currentSentences.length) * 100;
            } else {
                const scrollT = wrap.scrollTop;
                const scrollH = wrap.scrollHeight - wrap.clientHeight;
                if (scrollH > 0) percent = (scrollT / scrollH) * 100;
                else percent = 100; 
            }

            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;

            const bar = $('tr-progress-bar');
            if (bar) bar.style.width = percent + '%';
        };

        // TẠO DOM APP
        let app = $('truyen-app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'truyen-app';
            app.innerHTML = `
                <div class="tr-header">
                    <button class="tr-btn-home-icon" id="tr-btn-home" title="Trang chủ">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    </button>
                    <div class="tr-logo">Đọc Truyện Online</div>
                    <button class="tr-btn-close" id="tr-btn-close" title="Đóng">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                
                <div class="tr-user-bar">
                    <span>Xin chào, <span class="tr-user-name" id="tr-user-name-display">${USER_NAME}</span></span>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span id="tr-status-text">Sẵn sàng</span>
                        <div id="tr-auth-btns" style="display:flex; gap:10px;"></div>
                    </div>
                </div>

                <div id="tr-view-home" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                    <div class="tr-toolbar">
                        <div class="tr-search-box"><input type="text" id="tr-search" placeholder="🔍 Tìm kiếm tên truyện..."></div>
                        <select class="tr-filter" id="tr-filter"><option value="all">Tất cả thể loại</option></select>
                    </div>
                    <div class="tr-home-body" id="tr-home-content">
                        <div style="width:100%; text-align:center; padding:50px; color:#888;">⏳ Đang tải dữ liệu truyện...</div>
                    </div>
                </div>
    
                <div id="tr-view-reader" class="tr-reader-view">
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
                        <div class="tr-paper">
                            <div class="tr-text" id="tr-read-text">Nội dung...</div>
                        </div>
                    </div>

                    <!-- Thanh Tiến Độ Nằm Sát Trên Toolbar -->
                    <div class="tr-progress-container" id="tr-progress-container">
                        <div class="tr-progress-bar" id="tr-progress-bar">
                            <div class="tr-progress-thumb"></div>
                        </div>
                    </div>
                    
                    <!-- Toolbar Dưới Cùng Cố Định Chiều Cao 80px -->
                    <div class="tr-reader-tools">
                        <button class="tr-btn-tool tr-btn-play" id="btn-read-toggle">
                            <svg id="icon-play" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            <svg id="icon-stop" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="display:none;"><path d="M6 6h12v12H6z"/></svg>
                            <span id="text-read-toggle">AI Đọc</span>
                        </button>
                        
                        <button class="tr-btn-tool tr-btn-settings" id="btn-settings">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
                            <span>Cài đặt</span>
                        </button>
                        
                        <button class="tr-btn-tool tr-btn-sleep" id="btn-sleep-mode">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
                            <span>Treo máy</span>
                        </button>
                    </div>

                    <!-- Bảng Cài đặt Trồi Lên Mượt Mà -->
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
                            <span class="tr-setting-label">Cao độ: <span id="val-pitch" class="tr-setting-val">1.1</span></span>
                            <input type="range" id="rng-pitch" class="tr-setting-input" min="0.5" max="2.0" step="0.1" value="1.1">
                        </div>
                    </div>
    
                    <div class="tr-loading-overlay" id="tr-loading">
                        <div style="font-size:40px; margin-bottom:10px;">⏳</div>
                        <span id="tr-load-msg">Đang tải dữ liệu truyện...</span>
                    </div>

                    <div id="tr-fake-lock-screen">
                        <div class="tr-fake-status">Đang treo máy nghe truyện:</div>
                        <div class="tr-fake-story-name" id="tr-sleep-story-name">Tên Truyện</div>
                        <div class="tr-fake-hint">Bấm 2 lần vào màn hình để trở lại</div>
                    </div>

                    <div id="tr-interruption-overlay">
                        <button id="btn-resume-giant" class="tr-btn-resume-giant">▶</button>
                        <div class="tr-interruption-text">Truyện đang tạm dừng</div>
                        <button id="btn-close-overlay" class="tr-btn-close-overlay">Bỏ qua</button>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
            
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && isReading) {
                    isReading = false; 
                    synth.cancel(); 
                    saveCloudHistory(); 
                    updatePlayPauseUI(false);
                    releaseWakeLock(); 
                    $('tr-interruption-overlay').style.display = 'flex'; 
                }
            });

            $('btn-resume-giant').onclick = () => {
                $('tr-interruption-overlay').style.display = 'none';
                if (!isReading) {
                    isReading = true; synth.getVoices();
                    updatePlayPauseUI(true);
                    requestWakeLock(); 
                    speakNextSentence(); 
                }
            };

            $('btn-close-overlay').onclick = () => { $('tr-interruption-overlay').style.display = 'none'; };

            const contentWrap = document.getElementById('tr-content-wrap');
            if (contentWrap) {
                const handleUserScroll = () => {
                    isUserScrolling = true;
                    updateProgressBar(); 
                    if(scrollResumeTimer) clearTimeout(scrollResumeTimer);
                    scrollResumeTimer = setTimeout(() => { isUserScrolling = false; }, 4000); 
                };
                contentWrap.addEventListener('touchstart', handleUserScroll, {passive: true});
                contentWrap.addEventListener('wheel', handleUserScroll, {passive: true});
                contentWrap.addEventListener('touchmove', handleUserScroll, {passive: true});
                contentWrap.addEventListener('scroll', updateProgressBar, {passive: true});
            }

            let lastClickTime = 0;
            $('tr-read-text').addEventListener('click', (e) => {
                const now = new Date().getTime();
                if (now - lastClickTime < 350) { 
                    let target = e.target.closest('.tr-sent');
                    if (target) {
                        let idx = parseInt(target.getAttribute('data-idx'));
                        jumpToSentence(idx);
                    }
                }
                lastClickTime = now;
            });

            $('tr-btn-close').onclick = () => { app.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; stopTTS(); releaseWakeLock(); saveCloudHistory(); currentCategoryView = null; };

            const updateAuthUI = () => {
                const nameEl = $('tr-user-name-display'); const btnContainer = $('tr-auth-btns');
                if (!nameEl || !btnContainer) return;
                nameEl.innerText = USER_NAME;
                if (!IS_LOGGED_IN) {
                    btnContainer.innerHTML = `<button id="tr-btn-login" style="background:#0984e3; color:#fff; border:none; padding:3px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Đăng nhập</button><button id="tr-btn-register" style="background:#00b894; color:#fff; border:none; padding:3px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Đăng ký</button>`;
                    $('tr-btn-login').onclick = () => showAuthModal('login'); $('tr-btn-register').onclick = () => showAuthModal('register');
                } else {
                    let isMwUser = context.AUTH_STATE && context.AUTH_STATE.isAuthorized;
                    if (!isMwUser) {
                        btnContainer.innerHTML = `<button id="tr-btn-logout" style="background:#d63031; color:#fff; border:none; padding:3px 10px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">Đăng xuất</button>`;
                        $('tr-btn-logout').onclick = () => {
                            if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                                localStorage.removeItem('tgdd_guest_account');
                                let guestId = 'Guest-' + Math.floor(Math.random() * 100000);
                                localStorage.setItem('tgdd_guest_id', guestId);
                                USER_NAME = guestId; IS_LOGGED_IN = false; activeSession = {link:null, chap:1, sentence:0}; localProgressData = {};
                                currentCategoryView = null;
                                updateAuthUI(); renderHome();
                            }
                        };
                    } else { btnContainer.innerHTML = ''; }
                }
            };

            const showAuthModal = (mode) => {
                const isLogin = mode === 'login'; const title = isLogin ? '🔐 ĐĂNG NHẬP KHÁCH' : '📝 TẠO TÀI KHOẢN';
                const htmlContent = `<div style="text-align:left; font-size:13px; margin-bottom:10px;"><div style="margin-bottom:8px;"><label style="font-weight:bold; color:#555;">Tài khoản đăng nhập:</label><input type="text" id="tr-auth-user" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-top:4px;" placeholder="Tên đăng nhập (không dấu)..."></div><div style="margin-bottom:20px;"><label style="font-weight:bold; color:#555;">Mật khẩu:</label><input type="password" id="tr-auth-pass" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-top:4px;" placeholder="Nhập mật khẩu..."></div><button id="tr-auth-submit" class="tgdd-msg-btn" style="width:100%; background: ${isLogin ? '#0984e3' : '#00b894'}; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">${isLogin ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'}</button></div>`;
                context.UI.showMsg(title, htmlContent, 'info');

                setTimeout(() => {
                    const modal = document.getElementById('tgdd-msg-modal');
                    if (modal) { modal.style.zIndex = '2147483999'; let parent = modal.parentElement; while(parent && parent.tagName !== 'BODY') { if(window.getComputedStyle(parent).position === 'fixed' || window.getComputedStyle(parent).position === 'absolute') { parent.style.zIndex = '2147483998'; } parent = parent.parentElement; } }
                    const btnSubmit = document.getElementById('tr-auth-submit');
                    if(btnSubmit) {
                        btnSubmit.onclick = () => {
                            const u = document.getElementById('tr-auth-user').value.trim(); const p = document.getElementById('tr-auth-pass').value.trim();
                            if(!u || !p) { alert("⚠️ Vui lòng nhập đầy đủ tài khoản và mật khẩu!"); return; }
                            btnSubmit.innerText = "⏳ Đang xử lý..."; btnSubmit.disabled = true;

                            context.GM_xmlhttpRequest({
                                method: "POST", url: API_URL, data: JSON.stringify({ action: isLogin ? 'login_guest' : 'register_guest', user: u, password: p }),
                                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                onload: async (res) => { 
                                    try {
                                        const json = JSON.parse(res.responseText);
                                        if(json.status === 'success') {
                                            if (modal) modal.style.display = 'none'; document.body.classList.remove('tgdd-body-lock');
                                            localStorage.setItem('tgdd_guest_account', JSON.stringify({user: u, pass: p}));
                                            USER_NAME = u; IS_LOGGED_IN = true;
                                            currentCategoryView = null;
                                            updateAuthUI();
                                            $('tr-status-text').innerText = "Đang tải lịch sử...";
                                            await syncCloudHistory(); renderHome();
                                        } else { alert("❌ Lỗi: " + json.message); btnSubmit.innerText = isLogin ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'; btnSubmit.disabled = false; }
                                    } catch(e) { console.error(e); alert("❌ Lỗi phản hồi từ máy chủ!"); btnSubmit.disabled = false; }
                                }, onerror: () => { alert("❌ Mất kết nối mạng!"); btnSubmit.disabled = false; }
                            });
                        };
                    }
                }, 100);
            };

            updateAuthUI();
            
            $('tr-btn-home').onclick = () => { 
                stopTTS(); releaseWakeLock(); saveCloudHistory(); 
                $('tr-view-reader').style.display = 'none'; $('tr-view-home').style.display = 'flex'; 
                showAllHistory = false; currentCategoryView = null; renderHome();
            };
            
            $('btn-settings').onclick = (e) => { e.stopPropagation(); $('tr-settings-panel').classList.toggle('show'); };
            $('tr-settings-panel').onclick = (e) => e.stopPropagation();
            document.addEventListener('click', (e) => { if(!e.target.closest('#btn-settings')) $('tr-settings-panel').classList.remove('show'); });

            const enterSleepMode = async () => {
                if (!isReading) { alert("Vui lòng bấm AI Đọc trước khi treo máy!"); return; }
                $('tr-sleep-story-name').innerText = currentStory ? currentStory.name : "Truyện";
                $('tr-fake-lock-screen').style.display = 'flex';
            };

            $('btn-sleep-mode').onclick = enterSleepMode;

            let lastTap = 0;
            $('tr-fake-lock-screen').onclick = (e) => {
                const cur = new Date().getTime(); const diff = cur - lastTap;
                if (diff < 500 && diff > 0) { 
                    $('tr-fake-lock-screen').style.display = 'none'; 
                    e.preventDefault(); 
                }
                lastTap = cur;
            };

            $('rng-rate').oninput = (e) => { ttsRate = parseFloat(e.target.value); $('val-rate').innerText = ttsRate; };
            $('rng-pitch').oninput = (e) => { ttsPitch = parseFloat(e.target.value); $('val-pitch').innerText = ttsPitch; };
            $('sel-voice').onchange = (e) => { ttsVoiceIndex = parseInt(e.target.value); };

            const loadVoices = () => {
                availableVoices = synth.getVoices().filter(v => v.lang.toLowerCase().includes('vi'));
                const sel = $('sel-voice'); sel.innerHTML = `<option value="-1">Mặc định (Google/Chị Google)</option>`;
                availableVoices.forEach((v, i) => { sel.innerHTML += `<option value="${i}">${v.name}</option>`; });
            };
            synth.onvoiceschanged = loadVoices; setTimeout(loadVoices, 500);
        }
        app.style.display = 'flex';
    
        // -----------------------------------------------------
        // ĐỒNG BỘ CLOUD -> LOCAL
        // -----------------------------------------------------
        const syncCloudHistory = () => {
            return new Promise((resolve) => {
                if (!API_URL || !IS_LOGGED_IN) { resolve(false); return; }
                $('tr-status-text').innerText = "Đang đồng bộ Cloud...";
                
                context.GM_xmlhttpRequest({
                    method: "GET", url: `${API_URL}?action=get_config&type=history&user=${USER_NAME}`,
                    onload: (res) => {
                        try {
                            const json = JSON.parse(res.responseText);
                            let cloudHistory = json.data;
                            if (typeof cloudHistory === 'string') { try { cloudHistory = JSON.parse(cloudHistory); } catch(e){} }
                            
                            localProgressData = getLocalVal(getProgressKey(), {});

                            if(cloudHistory && Array.isArray(cloudHistory)) {
                                cloudHistory.forEach(item => {
                                    let story = stories.find(s => s.name === item.story);
                                    if (story) {
                                        let cloudTime = item.timestamp || 0;
                                        let lData = localProgressData[story.link];
                                        let localTime = lData ? (lData.time || 0) : 0;
                                        if (!lData || cloudTime >= localTime) {
                                            localProgressData[story.link] = { 
                                                chap: parseInt(item.chapter) || 1, 
                                                sentence: parseInt(item.sentence) || 0,
                                                time: cloudTime 
                                            };
                                        }
                                    }
                                });
                                setLocalVal(getProgressKey(), localProgressData);
                                $('tr-status-text').innerText = "Đã đồng bộ từ Cloud";
                            } else { $('tr-status-text').innerText = "Chưa có lịch sử"; }
                            resolve(true);
                        } catch(e) { console.warn("Parse cloud error", e); $('tr-status-text').innerText = "Lỗi dữ liệu"; resolve(false); }
                        setTimeout(() => $('tr-status-text').innerText = "Sẵn sàng", 3000);
                    },
                    onerror: () => { $('tr-status-text').innerText = "Lỗi mạng"; resolve(false); }
                });
            });
        };

        const loadDataFromSheet = async () => {
            try {
                const res = await fetch(CSV_URL); const csvText = await res.text(); const rows = parseCSV(csvText);
                stories =[]; genres.clear();
                for(let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    if(r.length >= 4 && r[0].trim() !== "") {
                        genres.add(r[1].trim());
                        stories.push({ name: r[0].trim(), genre: r[1].trim(), link: r[2].trim(), total: parseInt(r[3].trim()) || 1, cover: (r.length > 4 && r[4].trim() !== "") ? r[4].trim() : null });
                    }
                }
                renderFilters(); 
                localProgressData = getLocalVal(getProgressKey(), {}); 
                if (IS_LOGGED_IN) { await syncCloudHistory(); }
                renderHome(); 
            } catch (e) { console.error(e); $('tr-home-content').innerHTML = `<div style="color:red; width:100%; text-align:center;">Lỗi tải dữ liệu.</div>`; }
        };

        const renderFilters = () => {
            const filterEl = $('tr-filter'); filterEl.innerHTML = `<option value="all">Tất cả thể loại</option>`;
            genres.forEach(g => { if(g) filterEl.innerHTML += `<option value="${g}">${g}</option>`; });
        };
    
        const renderStoryCards = (list, container, isHistoryCard = false) => {
            list.forEach(story => {
                const card = document.createElement('div'); card.className = 'tr-card';
                let coverHtml = (story.cover && story.cover.startsWith('http')) ? `<img src="${story.cover}" class="tr-card-img" loading="lazy">` : story.name.charAt(0).toUpperCase();
                let progressHtml = (localProgressData[story.link] && localProgressData[story.link].chap) ? `<div class="tr-card-progress">Đang đọc: Chương ${localProgressData[story.link].chap}</div>` : '';
                
                let deleteBtnHtml = isHistoryCard ? `<button class="tr-btn-delete-history" title="Xóa lịch sử truyện này">✖</button>` : '';

                card.innerHTML = `<div class="tr-card-cover">${coverHtml}${progressHtml}${deleteBtnHtml}</div><div class="tr-card-info"><div class="tr-card-title">${story.name}</div><div class="tr-card-genre">${story.genre}</div><div class="tr-card-chap">Tổng: ${story.total} Chương</div></div>`;
                
                if (isHistoryCard) {
                    card.querySelector('.tr-btn-delete-history').onclick = (e) => {
                        e.stopPropagation();
                        if(confirm(`Bạn có chắc muốn xóa lịch sử bộ truyện: ${story.name}?`)) {
                            delete localProgressData[story.link];
                            if(activeSession.link === story.link) activeSession = { link: null, chap: 1, sentence: 0 };
                            setLocalVal(getProgressKey(), localProgressData);
                            saveCloudHistory(); 
                            renderHome();
                        }
                    };
                }
                card.onclick = () => openStory(story); 
                container.appendChild(card);
            });
        };

        const renderCategoryDetail = (container) => {
            let title = ""; let list =[];
            if (currentCategoryView === 'all') { title = "📚 Tất cả truyện"; list = stories; } 
            else {
                title = currentCategoryView === 'tiên hiệp' ? '☁️ Tiên Hiệp' : currentCategoryView === 'kiếm hiệp' ? '⚔️ Kiếm Hiệp' : '🌸 Ngôn Tình';
                list = stories.filter(s => s.genre.toLowerCase().includes(currentCategoryView));
            }

            const sec = document.createElement('div'); sec.className = 'tr-section';
            sec.innerHTML = `
                <div class="tr-section-header" style="justify-content: flex-start; gap: 15px;">
                    <button class="tr-btn-view-all" id="btn-back-cat" style="padding: 4px 8px;">⬅ Quay lại</button>
                    <div class="tr-section-title">${title}</div>
                </div>
                <div class="tr-grid-container" id="grid-detail"></div>
            `;
            container.appendChild(sec);

            sec.querySelector('#btn-back-cat').onclick = () => { currentCategoryView = null; renderHome(); };

            const grid = sec.querySelector('#grid-detail');
            const displayList = list.slice(0, categoryItemsLimit);
            renderStoryCards(displayList, grid);

            const wrapBtn = document.createElement('div');
            wrapBtn.style = "width: 100%; text-align: center; margin-top: 20px;";
            const btnMore = document.createElement('button');
            btnMore.className = 'tr-btn-tool'; 
            btnMore.style = "margin: 0 auto; background: #e17055; width: fit-content;";

            if (categoryItemsLimit >= list.length) {
                btnMore.innerText = "Đã tải hết danh sách truyện";
                btnMore.style.background = "#b2bec3";
                btnMore.style.cursor = "not-allowed";
                btnMore.style.boxShadow = "none";
                btnMore.disabled = true;
            } else {
                btnMore.innerText = "Tải thêm 10 truyện ⬇";
                btnMore.onclick = () => { categoryItemsLimit += 10; renderHome(); };
            }
            wrapBtn.appendChild(btnMore);
            container.appendChild(wrapBtn);
        };

        const renderCategorySection = (container, title, catKey, list, limit) => {
            if (list.length === 0) return;
            const sec = document.createElement('div'); sec.className = 'tr-section';
            const safeId = "grid-" + catKey.replace(/\s+/g, "");
            sec.innerHTML = `
                <div class="tr-section-header">
                    <div class="tr-section-title">${title}</div>
                    ${list.length > limit ? `<button class="tr-btn-view-all" id="btn-view-all-${safeId}">Xem tất cả (${list.length})</button>` : ''}
                </div>
                <div class="tr-grid-container" id="${safeId}"></div>
            `;
            container.appendChild(sec);
            renderStoryCards(list.slice(0, limit), sec.querySelector(`#${safeId}`));

            const btn = sec.querySelector(`#btn-view-all-${safeId}`);
            if (btn) {
                btn.onclick = () => { currentCategoryView = catKey; categoryItemsLimit = 10; $('tr-home-content').scrollTop = 0; renderHome(); };
            }
        };

        const renderHome = () => {
            const kw = $('tr-search').value.toLowerCase(); const gr = $('tr-filter').value; const content = $('tr-home-content');
            content.innerHTML = ''; 

            if (kw !== '' || gr !== 'all') {
                currentCategoryView = null; 
                const filtered = stories.filter(s => s.name.toLowerCase().includes(kw) && (gr === 'all' || s.genre === gr));
                if(filtered.length === 0) { content.innerHTML = `<div style="width:100%; text-align:center; padding:20px;">Không tìm thấy truyện nào phù hợp.</div>`; return; }
                const grid = document.createElement('div'); grid.className = 'tr-grid-container';
                renderStoryCards(filtered, grid); content.appendChild(grid); return;
            }

            if (currentCategoryView !== null) {
                renderCategoryDetail(content);
                return;
            }

            let historyList = stories.filter(s => localProgressData[s.link]).map(s => {
                return { ...s, lastReadTime: localProgressData[s.link].time || 0 };
            }).sort((a, b) => b.lastReadTime - a.lastReadTime);

            if (historyList.length > 0) {
                const limit = showAllHistory ? historyList.length : 6;
                const displayList = historyList.slice(0, limit);
                const sec = document.createElement('div'); sec.className = 'tr-section';
                sec.innerHTML = `<div class="tr-section-header"><div class="tr-section-title">🕒 Truyện đang đọc</div>${historyList.length > 6 ? `<button class="tr-btn-view-all" id="btn-toggle-history">${showAllHistory ? 'Thu gọn' : 'Xem tất cả (' + historyList.length + ')'}</button>` : ''}</div><div class="tr-grid-container" id="grid-history"></div>`;
                content.appendChild(sec);
                renderStoryCards(displayList, sec.querySelector('#grid-history'), true); 
                const toggleBtn = sec.querySelector('#btn-toggle-history');
                if(toggleBtn) { toggleBtn.onclick = () => { showAllHistory = !showAllHistory; renderHome(); }; }
            }

            renderCategorySection(content, "📚 Tất cả truyện", "all", stories, 10);
            renderCategorySection(content, "☁️ Tiên Hiệp", "tiên hiệp", stories.filter(s => s.genre.toLowerCase().includes("tiên hiệp")), 6);
            renderCategorySection(content, "⚔️ Kiếm Hiệp", "kiếm hiệp", stories.filter(s => s.genre.toLowerCase().includes("kiếm hiệp")), 6);
            renderCategorySection(content, "🌸 Ngôn Tình", "ngôn tình", stories.filter(s => s.genre.toLowerCase().includes("ngôn tình")), 6);
        };
    
        $('tr-search').oninput = () => { currentCategoryView = null; renderHome(); };
        $('tr-filter').onchange = () => { currentCategoryView = null; renderHome(); };
    
        // -----------------------------------------------------
        // LOGIC ĐỌC TRUYỆN & SESSION KEY
        // -----------------------------------------------------
        const getChapterUrl = (baseLink, chapNum) => {
            if(baseLink.match(/chuong-\d+/)) return baseLink.replace(/chuong-\d+/, `chuong-${chapNum}`);
            let cleanLink = baseLink.endsWith('/') ? baseLink.slice(0, -1) : baseLink; return `${cleanLink}/chuong-${chapNum}/`;
        };
    
        const parseChapterHTML = (htmlText) => {
            const parser = new DOMParser(); const doc = parser.parseFromString(htmlText, 'text/html');
            const contentHtml = doc.querySelector('#chapter-c') || doc.querySelector('.chapter-c');
            if(!contentHtml) throw new Error("Không tìm thấy nội dung chữ.");
            contentHtml.querySelectorAll('.ads, script, iframe').forEach(el => el.remove());
            const paragraphs = Array.from(contentHtml.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 0);
            let cleanArr =[];
            if(paragraphs.length > 0) { cleanArr = paragraphs; } 
            else { cleanArr = contentHtml.innerHTML.split(/<br\s*\/?>/i).map(t => t.replace(/<[^>]*>?/gm, '').trim()).filter(t => t.length > 0); }
            return { cleanArr };
        };
    
        const updateNavUI = () => {
            $('btn-prev-chap').disabled = (currentChapter <= 1); $('btn-next-chap').disabled = (currentChapter >= currentStory.total);
            let optionsHTML =[]; for(let i=1; i<=currentStory.total; i++){ optionsHTML.push(`<option value="${i}" ${i === currentChapter ? 'selected' : ''}>Chương ${i}</option>`); }
            $('sel-chap').innerHTML = optionsHTML.join('');
        };
    
        const preloadNextChapter = async (chapNum) => {
            if (chapNum > currentStory.total) return;
            try {
                const targetUrl = getChapterUrl(currentStory.link, chapNum); const htmlText = await fetchWithFallbacks(targetUrl); const parsed = parseChapterHTML(htmlText);
                preloadedData = { chapNum: chapNum, contentArr: parsed.cleanArr };
            } catch (e) { preloadedData = { chapNum: null }; }
        };
    
        const openStory = async (story) => {
            currentStory = story; preloadedData = { chapNum: null };
            $('tr-view-home').style.display = 'none'; $('tr-view-reader').style.display = 'flex';
            
            if (activeSession.link === story.link) {
                currentChapter = activeSession.chap; currentSentenceIndex = activeSession.sentence;
            } else {
                const saved = localProgressData[story.link];
                if (saved && saved.chap) {
                    currentChapter = saved.chap; currentSentenceIndex = saved.sentence || 0;
                } else { currentChapter = 1; currentSentenceIndex = 0; }
                activeSession = { link: story.link, chap: currentChapter, sentence: currentSentenceIndex };
            }

            isResuming = (currentSentenceIndex > 0);
            shouldReadChapterTitle = !isResuming; 
            await loadAndDisplayChapter(currentChapter, false); 
        };
    
        const loadAndDisplayChapter = async (chapNum, triggerSaveCloud = true) => {
            stopTTS(); currentChapter = chapNum;
            $('tr-load-msg').innerText = `Đang tải: ${currentStory.name} - Chương ${currentChapter}...`;
            $('tr-loading').style.display = 'flex';
            try {
                let data = null;
                if (preloadedData.chapNum === currentChapter) { data = { cleanArr: preloadedData.contentArr }; } 
                else { const targetUrl = getChapterUrl(currentStory.link, currentChapter); const htmlText = await fetchWithFallbacks(targetUrl); data = parseChapterHTML(htmlText); }
                
                $('tr-read-title').innerText = currentStory.name; $('tr-read-chap').innerText = `Chương ${currentChapter} / ${currentStory.total}`;
                updateNavUI(); 
                
                let builtHtml = '';
                currentSentences =[];
                let sIndex = 0;

                data.cleanArr.forEach(txt => {
                    let pText = txt.trim();
                    if (!/[.!?]+["'”’\])}]*$/.test(pText)) pText += '.';

                    let sents = pText.match(/[^.!?]+[.!?]+/g) ||[pText];
                    let pHtml = '<p>';
                    sents.forEach(s => {
                        let st = s.trim();
                        if (st.length > 0) {
                            currentSentences.push(st);
                            pHtml += `<span class="tr-sent" data-idx="${sIndex}">${st}</span> `;
                            sIndex++;
                        }
                    });
                    pHtml += '</p>';
                    builtHtml += pHtml;
                });

                $('tr-read-text').innerHTML = builtHtml;
                
                if (!isResuming) { currentSentenceIndex = 0; }
                updateLocalSessionKey(currentChapter, currentSentenceIndex);

                $('tr-loading').style.display = 'none';
                
                if (isResuming && currentSentenceIndex > 0) {
                    setTimeout(() => {
                        let targetSpan = $('tr-read-text').querySelector(`.tr-sent[data-idx="${currentSentenceIndex}"]`);
                        if(targetSpan) { 
                            targetSpan.classList.add('tr-reading-active'); 
                            if(!isUserScrolling) targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                        }
                        isResuming = false;
                        updateProgressBar(); 
                    }, 500);
                } else { 
                    $('tr-content-wrap').scrollTop = 0; 
                    setTimeout(updateProgressBar, 100); 
                }
                
                if (triggerSaveCloud) saveCloudHistory();
                
                if (currentChapter < currentStory.total) { setTimeout(() => { preloadNextChapter(currentChapter + 1); }, 1500); }
            } catch (e) { $('tr-loading').style.display = 'none'; $('tr-read-text').innerHTML = `<p style="color:red;">Lỗi tải chương: ${e.message}</p>`; }
        };

        const updateLocalSessionKey = (chap, sentence) => {
            if(!currentStory) return;
            activeSession = { link: currentStory.link, chap: chap, sentence: sentence };
            localProgressData[currentStory.link] = { chap: chap, sentence: sentence, time: Date.now() };
            setLocalVal(getProgressKey(), localProgressData);
        };

        const saveCloudHistory = () => {
            if (!API_URL || !IS_LOGGED_IN || isReading) return; 

            let fullHistory = Object.keys(localProgressData).map(link => {
                let s = stories.find(st => st.link === link); let p = localProgressData[link];
                if (!s || !p) return null;
                return {
                    story: s.name, 
                    chapter: p.chap, 
                    sentence: p.sentence || 0,
                    timestamp: p.time || Date.now()
                };
            }).filter(item => item !== null).sort((a,b) => b.timestamp - a.timestamp).slice(0, 15);

            if (fullHistory.length === 0) return;

            $('tr-status-text').innerText = "Đang lưu Cloud...";
            context.GM_xmlhttpRequest({
                method: "POST", url: API_URL, data: JSON.stringify({ action: 'save_config', type: 'history', user: USER_NAME, config: fullHistory }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: () => { $('tr-status-text').innerText = "Đã lưu"; setTimeout(()=> $('tr-status-text').innerText = "Sẵn sàng", 2000); },
                onerror: () => { $('tr-status-text').innerText = "Lỗi lưu"; }
            });
        };
    
        $('btn-prev-chap').onclick = () => { if(currentChapter > 1) { isResuming=false; shouldReadChapterTitle=true; loadAndDisplayChapter(currentChapter - 1, true); }};
        $('btn-next-chap').onclick = () => { if(currentChapter < currentStory.total) { isResuming=false; shouldReadChapterTitle=true; loadAndDisplayChapter(currentChapter + 1, true); }};
        $('sel-chap').onchange = (e) => { isResuming=false; shouldReadChapterTitle=true; loadAndDisplayChapter(parseInt(e.target.value), true); };
    
        // -----------------------------------------------------
        // LOGIC TTS (ĐỌC TRUYỆN) & JUMP DOUBLE CLICK
        // -----------------------------------------------------
        const getVoice = () => {
            if (ttsVoiceIndex >= 0 && availableVoices[ttsVoiceIndex]) return availableVoices[ttsVoiceIndex];
            let voices = synth.getVoices(); let viVoices = voices.filter(v => v.lang.toLowerCase().includes('vi'));
            if (viVoices.length === 0) return null;
            return viVoices.find(v => v.name.includes('Google') || v.name.includes('Tiếng Việt')) || viVoices[0];
        };
    
        const setupUtterance = (text, isSystemMsg = false) => {
            let u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; 
            const voice = getVoice(); if(voice) u.voice = voice;
            u.rate = isSystemMsg ? 1.4 : ttsRate; u.pitch = isSystemMsg ? 1.1 : ttsPitch; return u;
        };
    
        const speakSystemMsg = (text, callback) => {
            let u = setupUtterance(text, true); u.onend = () => { if(callback) callback(); }; synth.speak(u);
        };
    
        const jumpToSentence = (idx) => {
            isJumping = true;
            synth.cancel(); 
            
            currentSentenceIndex = idx;
            updateLocalSessionKey(currentChapter, currentSentenceIndex);
            
            const spans = $('tr-read-text').querySelectorAll('.tr-sent');
            spans.forEach(s => s.classList.remove('tr-reading-active'));
            let targetSpan = $('tr-read-text').querySelector(`.tr-sent[data-idx="${idx}"]`);
            if (targetSpan) {
                targetSpan.classList.add('tr-reading-active');
                if(!isUserScrolling) targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            isReading = true;
            updatePlayPauseUI(true);
            requestWakeLock();
            updateProgressBar(); 
            setTimeout(() => { isJumping = false; speakNextSentence(); }, 150);
        };

        const speakNextSentence = () => {
            if(currentSentenceIndex >= currentSentences.length) { handleChapterFinished(); return; }
            
            if (currentSentenceIndex === 0 && shouldReadChapterTitle) {
                shouldReadChapterTitle = false;
                speakSystemMsg(`Chương ${currentChapter}`, () => {
                    if (isReading) speakNextSentence(); 
                });
                return; 
            }

            let sentence = currentSentences[currentSentenceIndex];
            let cleanText = sentence.replace(/["'()$#@*~\[\]{}“”‘’]/g, '').replace(/\.{2,}/g, '.').trim();

            let u = setupUtterance(cleanText);
            u.onend = () => { 
                if(!isReading) return; 
                currentSentenceIndex++; 
                updateLocalSessionKey(currentChapter, currentSentenceIndex); 
                speakNextSentence(); 
            };
            u.onerror = (e) => { 
                console.warn("TTS Error: ", e); 
                if (!isJumping) {
                    isReading = false; 
                    updatePlayPauseUI(false);
                    releaseWakeLock();
                }
            };
            synth.speak(u);

            const spans = $('tr-read-text').querySelectorAll('.tr-sent'); 
            spans.forEach(s => s.classList.remove('tr-reading-active'));
            
            let targetSpan = $('tr-read-text').querySelector(`.tr-sent[data-idx="${currentSentenceIndex}"]`);
            if (targetSpan) {
                targetSpan.classList.add('tr-reading-active');
                if(!isUserScrolling) targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
            }
            updateProgressBar(); 
        };
    
        const handleChapterFinished = () => {
            isReading = false; saveCloudHistory(); 
            if(currentChapter < currentStory.total) {
                speakSystemMsg(`Đã đọc xong chương ${currentChapter}, chuyển sang chương mới.`, async () => {
                    isResuming = false; 
                    shouldReadChapterTitle = true; 
                    
                    await loadAndDisplayChapter(currentChapter + 1, false); 
                    
                    isReading = true; 
                    updatePlayPauseUI(true);
                    requestWakeLock(); 
                    speakNextSentence();
                });
            } else { 
                speakSystemMsg("Đã đọc xong bộ truyện. Cảm ơn bạn.", () => { alert("Bạn đã đọc hết truyện!"); }); 
                updatePlayPauseUI(false);
                releaseWakeLock();
            }
        };
    
        const stopTTS = () => { 
            isReading = false; 
            synth.cancel(); 
            updatePlayPauseUI(false);
            releaseWakeLock();
        };
    
        $('btn-read-toggle').onclick = () => { 
            if (!isReading) { 
                isReading = true; 
                synth.getVoices(); 
                requestWakeLock();
                speakNextSentence(); 
                updatePlayPauseUI(true);
            } else {
                isReading = false; 
                synth.cancel(); 
                releaseWakeLock();
                saveCloudHistory();
                updatePlayPauseUI(false);
            }
        };
    
        loadDataFromSheet();
    };
    
    return {
        name: "Đọc Truyện",
        icon: `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.15C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" fill="white"/></svg>`,
        bgColor: "#0984e3",
        action: runTool
    };
})
