((context) => {
// ===============================================================
// CSS GIAO DIỆN
// ===============================================================
const MY_CSS = `
    #reader-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f4f4; z-index:2147483800; font-family: sans-serif; flex-direction:column; }
    .rd-header { background:#fff; padding:15px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10; }
    .rd-top-bar { display:flex; align-items:center; justify-content:space-between; }
    .rd-title { font-size:18px; font-weight:bold; color:#e17055; display:flex; align-items:center; gap:5px; }
    .rd-actions { display:flex; gap:8px; align-items:center; flex-wrap: wrap; }
    .rd-btn { border:none; border-radius:4px; padding:8px 12px; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:5px; transition:0.2s; color:white; }
    .rd-btn-close { background:#fab1a0; color:#d63031; }
    .rd-btn-play { background:#00b894; }
    .rd-btn-pause { background:#fdcb6e; color:#2d3436;}
    .rd-btn-stop { background:#d63031; }
    .rd-input-group { display:flex; gap:10px; margin-top:10px; }
    .rd-input { flex:1; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:14px; outline:none; }
    .rd-btn-fetch { background:#e17055; color:white; border:none; border-radius:4px; padding:0 15px; font-weight:bold; cursor:pointer; white-space:nowrap; }
    .rd-body { flex:1; overflow:auto; padding:20px; background:#f4f4f4; display:flex; justify-content:center; }
    .rd-paper { max-width: 800px; width:100%; background:#fff; padding:30px; border-radius:8px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    .rd-story-title { font-size:24px; font-weight:bold; margin-bottom:20px; text-align:center; color:#2d3436; }
    .rd-story-content { font-size:18px; line-height:1.6; color:#2d3436; text-align: justify; }
    .rd-loading { text-align:center; padding:20px; color:#636e72; display:none; font-style: italic; }
    #rd-status-msg { font-size: 13px; color: #d63031; margin-top: 5px; font-weight: bold; }
    @media (max-width: 600px) { .rd-paper { padding: 15px; } .rd-actions span { display: none; } }
`;

// ===============================================================
// HÀM FETCH VƯỢT RÀO (ĐA PROXY)
// ===============================================================
const fetchWithFallbacks = async (targetUrl) => {
    // Các proxy mạnh giúp lách luật CORS
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
    ];

    for (let proxy of proxies) {
        try {
            const res = await fetch(proxy);
            if (!res.ok) continue; // Nếu proxy này xịt, thử proxy tiếp theo
            const htmlText = await res.text();
            
            // Nếu trả về trang chặn của Cloudflare thì cũng coi như thất bại
            if(htmlText.includes('Cloudflare') && htmlText.includes('Attention Required!')) {
                continue; 
            }
            return htmlText;
        } catch (e) {
            console.warn("Proxy failed: ", proxy);
        }
    }
    throw new Error("Tất cả server trung gian đều bị truyenfull chặn (Do Cloudflare). Vui lòng dùng giải pháp vào trực tiếp trang truyện!");
};

// ===============================================================
// LOGIC CỦA TOOL
// ===============================================================
const runTool = async () => {
    const bottomNav = document.getElementById('tgdd-bottom-nav');
    if(bottomNav) bottomNav.style.display = 'none';

    const $ = (id) => document.getElementById(id);
    let synth = window.speechSynthesis;
    let utterance = null;
    let isSameOrigin = window.location.hostname.includes('truyenfull');

    let modal = $('reader-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reader-modal';
        modal.innerHTML = `
            <div class="rd-header">
                <div class="rd-top-bar">
                    <div class="rd-title">📖 Trợ lý Đọc Truyện AI</div>
                    <div class="rd-actions">
                        <button class="rd-btn rd-btn-play" id="btn-rd-play" style="display:none;">▶️ <span>Đọc</span></button>
                        <button class="rd-btn rd-btn-pause" id="btn-rd-pause" style="display:none;">⏸️ <span>Dừng</span></button>
                        <button class="rd-btn rd-btn-stop" id="btn-rd-stop" style="display:none;">⏹️ <span>Tắt</span></button>
                        <button class="rd-btn rd-btn-close" id="btn-rd-close">✖</button>
                    </div>
                </div>
                
                ${!isSameOrigin ? `
                <div class="rd-input-group">
                    <input type="text" id="rd-url-input" class="rd-input" placeholder="Dán link chương truyện truyenfull vào đây...">
                    <button class="rd-btn-fetch" id="btn-rd-fetch">Tải Truyện</button>
                </div>
                <div id="rd-status-msg"></div>
                ` : `<div style="color:#00b894; font-weight:bold; margin-top:10px;">✅ Đã phát hiện bạn đang ở trang truyenfull, tự động bắt nội dung!</div>`}
            </div>
            
            <div class="rd-body">
                <div class="rd-loading" id="rd-loading">⏳ Đang lấy dữ liệu, vui lòng đợi...</div>
                <div class="rd-paper" id="rd-paper" style="display:none;">
                    <div class="rd-story-title" id="rd-story-title">Chưa có dữ liệu</div>
                    <div class="rd-story-content" id="rd-story-content"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const style = document.createElement('style');
        style.innerHTML = MY_CSS;
        document.head.appendChild(style);

        $('btn-rd-close').onclick = () => { 
            modal.style.display = 'none'; 
            if(bottomNav) bottomNav.style.display = 'flex'; 
            if(synth.speaking) synth.cancel(); 
        };

        // Hàm bóc tách nội dung HTML dùng chung
        const parseAndDisplayStory = (htmlString) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            
            const chapterTitle = doc.querySelector('.chapter-title')?.innerText || "Chương truyện";
            const storyTitle = doc.querySelector('a.truyen-title')?.innerText || doc.querySelector('.truyen-title')?.innerText || "";
            const contentHtml = doc.querySelector('#chapter-c') || doc.querySelector('.chapter-c');
            
            if (!contentHtml || contentHtml.innerText.trim() === '') {
                throw new Error("Không tìm thấy nội dung chữ. Có thể web đã đổi cấu trúc hoặc chặn Bot!");
            }

            // Xóa quảng cáo rác bên trong truyện (nếu có)
            const ads = contentHtml.querySelectorAll('.ads, script, iframe');
            ads.forEach(ad => ad.remove());

            $('rd-story-title').innerText = `${storyTitle} - ${chapterTitle}`;
            $('rd-story-content').innerHTML = contentHtml.innerHTML;

            const textToRead = contentHtml.innerText;
            setupTTS(textToRead);

            $('rd-loading').style.display = 'none';
            $('rd-paper').style.display = 'block';
        };

        // --- NẾU ĐANG CHẠY TRÊN WEB KHÁC (DÙNG PROXY) ---
        if (!isSameOrigin) {
            $('btn-rd-fetch').onclick = async () => {
                const urlInput = $('rd-url-input').value.trim();
                if(!urlInput || !urlInput.includes('truyenfull')) return alert('Vui lòng nhập link từ truyenfull!');

                $('rd-paper').style.display = 'none';
                $('rd-loading').style.display = 'block';
                $('rd-status-msg').innerText = '';
                if(synth.speaking) synth.cancel();

                try {
                    const htmlText = await fetchWithFallbacks(urlInput);
                    parseAndDisplayStory(htmlText);
                } catch (error) {
                    $('rd-status-msg').innerText = "❌ " + error.message;
                    $('rd-loading').style.display = 'none';
                }
            };
        } 
        // --- NẾU ĐANG CHẠY TRỰC TIẾP TRÊN TRUYENFULL (CODE THUẦN AUTO LẤY) ---
        else {
            setTimeout(() => {
                try {
                    // Lấy thẳng toàn bộ HTML của trang hiện tại ném vào hàm xử lý
                    parseAndDisplayStory(document.documentElement.outerHTML);
                } catch (err) {
                    $('rd-loading').innerText = "❌ Lỗi: Bạn hãy mở đúng trang có Nội dung chương (Đang đọc) rồi mới bật Tool nhé!";
                }
            }, 500);
        }
    }

    modal.style.display = 'flex';

    // ===============================================================
    // XỬ LÝ TTS (GIỌNG AI)
    // ===============================================================
    const setupTTS = (text) => {
        $('btn-rd-play').style.display = 'flex';
        $('btn-rd-pause').style.display = 'flex';
        $('btn-rd-stop').style.display = 'flex';

        // Xử lý cắt câu để AI đọc trơn tru và không bị ngắt quãng giới hạn của Chrome
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let currentSentenceIndex = 0;

        const speakNext = () => {
            if (currentSentenceIndex >= sentences.length) return;
            utterance = new SpeechSynthesisUtterance(sentences[currentSentenceIndex]);
            utterance.lang = 'vi-VN';
            utterance.rate = 1.0; 
            
            utterance.onend = () => {
                currentSentenceIndex++;
                speakNext();
            };
            synth.speak(utterance);
        };

        $('btn-rd-play').onclick = () => {
            if (synth.paused) {
                synth.resume();
            } else if (!synth.speaking) {
                currentSentenceIndex = 0;
                speakNext();
            }
        };

        $('btn-rd-pause').onclick = () => { if (synth.speaking && !synth.paused) synth.pause(); };
        $('btn-rd-stop').onclick = () => { if (synth.speaking) { synth.cancel(); currentSentenceIndex = 0; }};
    };
};

return {
    name: "Đọc Truyện V1",
    icon: `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.15C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" fill="white"/></svg>`,
    bgColor: "#e17055",
    css: MY_CSS,
    action: runTool
};
})
