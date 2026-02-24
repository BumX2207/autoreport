((context) => {
// ===============================================================
// 1. CẤU HÌNH DATA SHEET
// ===============================================================
const SHEET_ID = '1iuApMwdKYx9ofo0oJR84AlzXka0PmTQPudXzx0Uub0o';
const SHEET_GID = '984479015';
// Dùng API tải CSV trực tiếp từ Google Sheet để lấy data cực nhanh
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// ===============================================================
// 2. CSS GIAO DIỆN (UI/UX CHUYÊN NGHIỆP)
// ===============================================================
const MY_CSS = `
    #truyen-app { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f8f9fa; z-index:2147483800; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; flex-direction:column; overflow:hidden; }
    
    /* HEADER TỔNG */
    .tr-header { background:#fff; padding:10px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; z-index:20; flex-shrink:0; }
    .tr-logo { font-size:20px; font-weight:900; color:#e17055; display:flex; align-items:center; gap:8px; cursor:pointer;}
    .tr-btn-close { background:#fab1a0; color:#d63031; border:none; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; }
    
    /* TOOLBAR TÌM KIẾM & LỌC (TRANG CHỦ) */
    .tr-toolbar { background:#fff; padding:15px 20px; border-bottom:1px solid #eee; display:flex; gap:15px; z-index:15; flex-wrap:wrap; }
    .tr-search-box { flex:1; min-width:200px; display:flex; }
    .tr-search-box input { width:100%; padding:10px 15px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; transition:0.3s; }
    .tr-search-box input:focus { border-color:#e17055; box-shadow:0 0 5px rgba(225,112,85,0.3); }
    .tr-filter { padding:10px 15px; border:1px solid #ddd; border-radius:20px; outline:none; font-size:14px; background:#fff; cursor:pointer; min-width:150px;}
    
    /* LƯỚI TRUYỆN (TRANG CHỦ) */
    .tr-home-body { flex:1; overflow-y:auto; padding:20px; background:#f4f5f7; display:flex; flex-wrap:wrap; gap:20px; align-content: flex-start;}
    .tr-card { background:#fff; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.05); width:calc(25% - 15px); min-width:200px; overflow:hidden; cursor:pointer; transition:transform 0.2s; display:flex; flex-direction:column;}
    .tr-card:hover { transform:translateY(-5px); box-shadow:0 8px 15px rgba(0,0,0,0.1); }
    .tr-card-cover { background:#e17055; height:120px; display:flex; align-items:center; justify-content:center; color:white; font-size:40px; }
    .tr-card-info { padding:15px; flex:1; display:flex; flex-direction:column; }
    .tr-card-title { font-size:16px; font-weight:bold; color:#2d3436; margin-bottom:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .tr-card-genre { font-size:12px; color:#00b894; background:#e8f8f5; padding:3px 8px; border-radius:12px; align-self:flex-start; margin-bottom:10px;}
    .tr-card-chap { font-size:13px; color:#636e72; margin-top:auto; font-weight:500;}

    /* KHU VỰC ĐỌC TRUYỆN */
    .tr-reader-view { display:none; flex:1; flex-direction:column; background:#f4f5f7; overflow:hidden; position:relative; }
    .tr-reader-tools { background:#2d3436; padding:10px 20px; display:flex; justify-content:center; gap:15px; z-index:10; }
    .tr-btn-tool { background:#636e72; color:white; border:none; padding:8px 15px; border-radius:20px; font-size:13px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s;}
    .tr-btn-tool:hover { background:#b2bec3; color:#2d3436; }
    .tr-btn-play { background:#00b894; }
    .tr-btn-play:hover { background:#55efc4; }
    .tr-btn-stop { background:#d63031; }
    
    .tr-reader-content-wrap { flex:1; overflow-y:auto; padding:20px; display:flex; justify-content:center; scroll-behavior: smooth; }
    .tr-paper { background:#fff; max-width:800px; width:100%; padding:30px 40px; border-radius:8px; box-shadow:0 5px 20px rgba(0,0,0,0.05); }
    .tr-story-title { font-size:24px; font-weight:bold; color:#2d3436; text-align:center; margin-bottom:5px;}
    .tr-chapter-title { font-size:18px; color:#e17055; text-align:center; margin-bottom:30px; font-weight:600;}
    .tr-text { font-size:18px; line-height:1.7; color:#2d3436; text-align:justify; }
    .tr-text p { margin-bottom: 15px; }
    .tr-reading-active { background: #ffeaa7; color: #d63031; border-radius: 3px; } /* Highlight câu đang đọc */

    /* SYSTEM OVERLAY */
    .tr-loading-overlay { position:absolute; top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:50; font-weight:bold; font-size:16px; color:#e17055;}
    
    @media (max-width: 768px) {
        .tr-card { width:calc(50% - 10px); }
        .tr-paper { padding: 20px; }
        .tr-text { font-size: 16px; }
        .tr-btn-tool span { display: none; }
    }
    @media (max-width: 480px) {
        .tr-card { width:100%; }
        .tr-toolbar { flex-direction:column; }
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
            if(htmlText.includes('Cloudflare') && htmlText.includes('Attention Required!')) continue; 
            return htmlText;
        } catch (e) { console.warn("Proxy failed", proxy); }
    }
    throw new Error("Lỗi tải trang. Các Proxy đã bị web truyện chặn.");
};

// Hàm đọc CSV bỏ qua dấu phẩy trong ngoặc kép
const parseCSV = (text) => {
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

    const $ = (id) => document.getElementById(id);
    let synth = window.speechSynthesis;
    
    // STATE APP
    let stories = [];
    let genres = new Set();
    let currentStory = null;
    let currentChapter = 1;
    let isReading = false;
    let currentSentences = [];
    let currentSentenceIndex = 0;

    // TẠO DOM APP
    let app = $('truyen-app');
    if (!app) {
        app = document.createElement('div');
        app.id = 'truyen-app';
        app.innerHTML = `
            <div class="tr-header">
                <div class="tr-logo" id="tr-btn-home">📖 Đọc Truyện Online</div>
                <button class="tr-btn-close" id="tr-btn-close">✖</button>
            </div>
            
            <!-- VIEW TRANG CHỦ -->
            <div id="tr-view-home" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                <div class="tr-toolbar">
                    <div class="tr-search-box">
                        <input type="text" id="tr-search" placeholder="🔍 Tìm kiếm tên truyện...">
                    </div>
                    <select class="tr-filter" id="tr-filter">
                        <option value="all">Tất cả thể loại</option>
                    </select>
                </div>
                <div class="tr-home-body" id="tr-grid">
                    <div style="width:100%; text-align:center; padding:50px; color:#888;">⏳ Đang tải danh sách truyện từ Google Sheet...</div>
                </div>
            </div>

            <!-- VIEW ĐỌC TRUYỆN -->
            <div id="tr-view-reader" class="tr-reader-view">
                <div class="tr-reader-tools">
                    <button class="tr-btn-tool" id="btn-back-home">⬅️ <span>Trở lại</span></button>
                    <button class="tr-btn-tool tr-btn-play" id="btn-read-play">▶️ <span>AI Đọc</span></button>
                    <button class="tr-btn-tool" id="btn-read-pause">⏸️ <span>Tạm Dừng</span></button>
                    <button class="tr-btn-tool tr-btn-stop" id="btn-read-stop">⏹️ <span>Tắt AI</span></button>
                </div>
                <div class="tr-reader-content-wrap" id="tr-content-wrap">
                    <div class="tr-paper">
                        <div class="tr-story-title" id="tr-read-title">Tên Truyện</div>
                        <div class="tr-chapter-title" id="tr-read-chap">Chương 1</div>
                        <div class="tr-text" id="tr-read-text">Nội dung...</div>
                    </div>
                </div>
                <div class="tr-loading-overlay" id="tr-loading">
                    <div style="font-size:40px; margin-bottom:10px;">⏳</div>
                    <span id="tr-load-msg">Đang tải dữ liệu truyện...</span>
                </div>
            </div>
        `;
        document.body.appendChild(app);
        
        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);

        $('tr-btn-close').onclick = () => { app.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; stopTTS(); };
        $('tr-btn-home').onclick = $('btn-back-home').onclick = () => { 
            stopTTS();
            $('tr-view-reader').style.display = 'none'; 
            $('tr-view-home').style.display = 'flex'; 
        };
    }
    app.style.display = 'flex';

    // -----------------------------------------------------
    // LOAD DỮ LIỆU TỪ GOOGLE SHEET
    // -----------------------------------------------------
    const loadDataFromSheet = async () => {
        try {
            const res = await fetch(CSV_URL);
            const csvText = await res.text();
            const rows = parseCSV(csvText);
            
            stories = [];
            genres.clear();

            // Bỏ qua dòng tiêu đề (i=1 bắt đầu)
            for(let i = 1; i < rows.length; i++) {
                const r = rows[i];
                if(r.length >= 4 && r[0].trim() !== "") {
                    const ten = r[0].trim();
                    const theLoai = r[1].trim();
                    const link = r[2].trim();
                    const soChuong = parseInt(r[3].trim()) || 1;
                    
                    genres.add(theLoai);
                    stories.push({ name: ten, genre: theLoai, link: link, total: soChuong });
                }
            }
            renderFilters();
            renderStories(stories);
        } catch (e) {
            $('tr-grid').innerHTML = `<div style="color:red; width:100%; text-align:center;">Lỗi tải dữ liệu: ${e.message}</div>`;
        }
    };

    const renderFilters = () => {
        const filterEl = $('tr-filter');
        filterEl.innerHTML = `<option value="all">Tất cả thể loại</option>`;
        genres.forEach(g => {
            if(g) filterEl.innerHTML += `<option value="${g}">${g}</option>`;
        });
    };

    const renderStories = (list) => {
        const grid = $('tr-grid');
        grid.innerHTML = '';
        if(list.length === 0) return grid.innerHTML = `<div style="width:100%; text-align:center;">Không tìm thấy truyện nào.</div>`;
        
        list.forEach((story, idx) => {
            const card = document.createElement('div');
            card.className = 'tr-card';
            // Lấy chữ cái đầu làm Cover
            const firstLetter = story.name.charAt(0).toUpperCase();
            card.innerHTML = `
                <div class="tr-card-cover">${firstLetter}</div>
                <div class="tr-card-info">
                    <div class="tr-card-title">${story.name}</div>
                    <div class="tr-card-genre">${story.genre}</div>
                    <div class="tr-card-chap">Tổng: ${story.total} Chương</div>
                </div>
            `;
            card.onclick = () => openStory(story);
            grid.appendChild(card);
        });
    };

    // Bắt sự kiện Lọc & Tìm kiếm
    $('tr-search').oninput = () => {
        const keyword = $('tr-search').value.toLowerCase();
        const genre = $('tr-filter').value;
        const filtered = stories.filter(s => s.name.toLowerCase().includes(keyword) && (genre === 'all' || s.genre === genre));
        renderStories(filtered);
    };
    $('tr-filter').onchange = $('tr-search').oninput;

    // -----------------------------------------------------
    // LOGIC ĐỌC TRUYỆN & AUTO NEXT
    // -----------------------------------------------------
    const showLoading = (msg) => { $('tr-load-msg').innerText = msg; $('tr-loading').style.display = 'flex'; };
    const hideLoading = () => { $('tr-loading').style.display = 'none'; };

    // Tạo Link cho chương hiện tại dựa vào base link (Chương 1)
    const getChapterUrl = (baseLink, chapNum) => {
        // Thay thế 'chuong-xyz' thành 'chuong-[chapNum]'
        if(baseLink.match(/chuong-\d+/)) {
            return baseLink.replace(/chuong-\d+/, `chuong-${chapNum}`);
        }
        // Nếu không có chuong- thì tự nối đuôi (Tuỳ trang, nhưng chuẩn truyenfull là có)
        let cleanLink = baseLink.endsWith('/') ? baseLink.slice(0, -1) : baseLink;
        return `${cleanLink}/chuong-${chapNum}/`;
    };

    const openStory = async (story) => {
        currentStory = story;
        currentChapter = 1;
        $('tr-view-home').style.display = 'none';
        $('tr-view-reader').style.display = 'flex';
        await loadAndDisplayChapter();
    };

    const loadAndDisplayChapter = async () => {
        stopTTS();
        showLoading(`Đang tải dữ liệu: ${currentStory.name} - Chương ${currentChapter}...`);
        
        const targetUrl = getChapterUrl(currentStory.link, currentChapter);
        
        try {
            const htmlText = await fetchWithFallbacks(targetUrl);
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            const contentHtml = doc.querySelector('#chapter-c') || doc.querySelector('.chapter-c');
            if(!contentHtml) throw new Error("Không tìm thấy nội dung chữ. Có thể web đã đổi cấu trúc.");

            // Dọn dẹp rác quảng cáo
            contentHtml.querySelectorAll('.ads, script, iframe').forEach(el => el.remove());

            $('tr-read-title').innerText = currentStory.name;
            $('tr-read-chap').innerText = `Chương ${currentChapter} / ${currentStory.total}`;
            
            // Format HTML đẹp hơn và bóc Text cho AI đọc
            const paragraphs = Array.from(contentHtml.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 0);
            
            // Nếu truyện không dùng thẻ P, lấy text thô băm ra
            let cleanTextArray = [];
            if(paragraphs.length > 0) {
                $('tr-read-text').innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
                cleanTextArray = paragraphs;
            } else {
                let rawParts = contentHtml.innerHTML.split(/<br\s*\/?>/i).map(t => t.replace(/<[^>]*>?/gm, '').trim()).filter(t => t.length > 0);
                $('tr-read-text').innerHTML = rawParts.map(p => `<p>${p}</p>`).join('');
                cleanTextArray = rawParts;
            }

            // Gộp text thành các câu nhỏ để AI không bị nghẹn
            currentSentences = cleanTextArray.join('. ').match(/[^.!?\n]+[.!?\n]+/g) || cleanTextArray;
            currentSentenceIndex = 0;

            hideLoading();
            $('tr-content-wrap').scrollTop = 0; // Cuộn lên đầu
        } catch (e) {
            hideLoading();
            $('tr-read-text').innerHTML = `<p style="color:red;">Lỗi tải chương này: ${e.message}</p>`;
        }
    };

    // -----------------------------------------------------
    // LOGIC TTS (GIỌNG AI CHUẨN TIẾNG VIỆT & EDGE FIX)
    // -----------------------------------------------------
    // Hàm ép chọn giọng Tiếng Việt
    const getVietnameseVoice = () => {
        const voices = synth.getVoices();
        // Tìm giọng có chữ "vi", ưu tiên giọng của Microsoft (Edge) hoặc Google
        let viVoice = voices.find(v => v.lang === 'vi-VN' || v.lang === 'vi_VN');
        if(!viVoice) viVoice = voices.find(v => v.lang.includes('vi'));
        return viVoice;
    };

    // Mẹo: Kích hoạt load Voice trước (Edge/Chrome cần gọi getVoices một lần để khởi tạo)
    synth.getVoices();
    if(speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = synth.getVoices;
    }

    const speakSystemMsg = (text, callback) => {
        let u = new SpeechSynthesisUtterance(text);
        const voice = getVietnameseVoice();
        if(voice) u.voice = voice;
        u.lang = 'vi-VN';
        u.rate = 1.1; // Đọc thông báo nhanh tí
        u.onend = () => { if(callback) callback(); };
        synth.speak(u);
    };

    const speakNextSentence = () => {
        if(currentSentenceIndex >= currentSentences.length) {
            // ĐÃ ĐỌC XONG CHƯƠNG!
            handleChapterFinished();
            return;
        }

        let sentence = currentSentences[currentSentenceIndex];
        let u = new SpeechSynthesisUtterance(sentence);
        const voice = getVietnameseVoice();
        if(voice) u.voice = voice; // CHỐNG LỖI EDGE ĐỌC TIẾNG ANH
        u.lang = 'vi-VN';
        u.rate = 1.0;

        u.onend = () => {
            currentSentenceIndex++;
            if(isReading) speakNextSentence();
        };

        synth.speak(u);
        
        // Highlight đoạn đang đọc (Tính năng UX bổ sung)
        const pTags = $('tr-read-text').querySelectorAll('p');
        pTags.forEach(p => p.style.background = 'transparent');
        // Tìm P chứa câu này (mang tính tương đối)
        for(let p of pTags) {
            if(p.innerText.includes(sentence.substring(0, 10))) {
                p.style.background = '#ffeaa7';
                p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    };

    const handleChapterFinished = () => {
        isReading = false;
        if(currentChapter < currentStory.total) {
            // Thông báo chuyển chương
            showLoading(`Đang chuyển sang Chương ${currentChapter + 1}...`);
            speakSystemMsg(`Đã đọc xong chương ${currentChapter}, đang tải chương mới.`, async () => {
                currentChapter++;
                await loadAndDisplayChapter();
                // Tự động đọc tiếp
                isReading = true;
                speakNextSentence();
            });
        } else {
            speakSystemMsg("Đã đọc xong toàn bộ truyện. Cảm ơn bạn đã lắng nghe.", () => {
                alert("Chúc mừng! Bạn đã hoàn thành bộ truyện này.");
            });
        }
    };

    const stopTTS = () => { isReading = false; synth.cancel(); };

    $('btn-read-play').onclick = () => {
        if (!isReading) {
            isReading = true;
            if(synth.paused) synth.resume();
            else speakNextSentence();
        }
    };

    $('btn-read-pause').onclick = () => { isReading = false; synth.pause(); };
    $('btn-read-stop').onclick = () => { stopTTS(); currentSentenceIndex = 0; };

    // Khởi chạy App: Tải dữ liệu từ Sheet
    loadDataFromSheet();
};

return {
    name: "Đọc Truyện App",
    icon: `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.15C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" fill="white"/></svg>`,
    bgColor: "#0984e3", // Màu xanh nhẹ nhàng cho web truyện
    css: MY_CSS,
    action: runTool
};
})
