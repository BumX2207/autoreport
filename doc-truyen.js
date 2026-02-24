((context) => {
// ===============================================================
// CSS STYLE GIAO DIỆN ĐỌC TRUYỆN
// ===============================================================
const MY_CSS = `
    #reader-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#f4f4f4; z-index:2147483800; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; flex-direction:column; }
    .rd-header { background:#fff; padding:15px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10; }
    .rd-top-bar { display:flex; align-items:center; justify-content:space-between; }
    .rd-title { font-size:18px; font-weight:bold; color:#e17055; display:flex; align-items:center; gap:5px; }
    .rd-actions { display:flex; gap:8px; align-items:center; }
    .rd-btn { border:none; border-radius:4px; padding:8px 12px; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:5px; transition:0.2s; color:white; }
    .rd-btn-close { background:#fab1a0; color:#d63031; }
    .rd-btn-play { background:#00b894; }
    .rd-btn-pause { background:#fdcb6e; color:#2d3436;}
    .rd-btn-stop { background:#d63031; }
    
    .rd-input-group { display:flex; gap:10px; margin-top:10px; }
    .rd-input { flex:1; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:14px; outline:none; }
    .rd-input:focus { border-color:#e17055; }
    .rd-btn-fetch { background:#e17055; color:white; border:none; border-radius:4px; padding:0 15px; font-weight:bold; cursor:pointer; }

    .rd-body { flex:1; overflow:auto; padding:20px; background:#f4f4f4; display:flex; justify-content:center; }
    .rd-paper { max-width: 800px; width:100%; background:#fff; padding:30px; border-radius:8px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    .rd-story-title { font-size:24px; font-weight:bold; margin-bottom:20px; text-align:center; color:#2d3436; }
    .rd-story-content { font-size:18px; line-height:1.6; color:#2d3436; text-align: justify; }
    .rd-loading { text-align:center; padding:20px; color:#636e72; display:none; font-style: italic; }
    
    @media (max-width: 600px) {
        .rd-paper { padding: 15px; }
        .rd-story-content { font-size: 16px; }
        .rd-actions span { display: none; } /* Ẩn chữ trên nút ở mobile */
    }
`;

// ===============================================================
// LOGIC CỦA TOOL
// ===============================================================
const runTool = async () => {
    // Ẩn thanh nav dưới cùng nếu có
    const bottomNav = document.getElementById('tgdd-bottom-nav');
    if(bottomNav) bottomNav.style.display = 'none';

    const $ = (id) => document.getElementById(id);
    let synth = window.speechSynthesis;
    let utterance = null;

    // 1. TẠO GIAO DIỆN (NẾU CHƯA CÓ)
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
                        <button class="rd-btn rd-btn-pause" id="btn-rd-pause" style="display:none;">⏸️ <span>Tạm dừng</span></button>
                        <button class="rd-btn rd-btn-stop" id="btn-rd-stop" style="display:none;">⏹️ <span>Tắt</span></button>
                        <button class="rd-btn rd-btn-close" id="btn-rd-close">✖</button>
                    </div>
                </div>
                <div class="rd-input-group">
                    <input type="text" id="rd-url-input" class="rd-input" placeholder="Dán link chương truyện từ truyenfull.vision vào đây...">
                    <button class="rd-btn-fetch" id="btn-rd-fetch">Tải Truyện</button>
                </div>
            </div>
            <div class="rd-body" id="rd-body">
                <div class="rd-loading" id="rd-loading">⏳ Đang tải dữ liệu, vui lòng đợi...</div>
                <div class="rd-paper" id="rd-paper" style="display:none;">
                    <div class="rd-story-title" id="rd-story-title">Chưa có dữ liệu</div>
                    <div class="rd-story-content" id="rd-story-content">Vui lòng dán link và bấm "Tải Truyện"</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Thêm Style
        const style = document.createElement('style');
        style.innerHTML = MY_CSS;
        document.head.appendChild(style);

        // Sự kiện Đóng modal
        $('btn-rd-close').onclick = () => { 
            modal.style.display = 'none'; 
            if(bottomNav) bottomNav.style.display = 'flex'; 
            if(synth.speaking) synth.cancel(); // Tắt đọc khi đóng
        };

        // ===============================================================
        // XỬ LÝ LẤY DỮ LIỆU TỪ TRUYENFULL QUA PROXY
        // ===============================================================
        $('btn-rd-fetch').onclick = async () => {
            const urlInput = $('rd-url-input').value.trim();
            if(!urlInput || !urlInput.includes('truyenfull')) {
                alert('Vui lòng nhập link hợp lệ từ truyenfull!');
                return;
            }

            $('rd-paper').style.display = 'none';
            $('rd-loading').style.display = 'block';
            if(synth.speaking) synth.cancel(); // Dừng giọng đọc cũ

            try {
                // Dùng CORS Proxy để vượt tường lửa trình duyệt
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlInput)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();
                
                // Parse HTML lấy được
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');

                // Tùy thuộc vào cấu trúc DOM của Truyenfull.vision (Thường nội dung nằm trong class chapter-c)
                const chapterTitle = doc.querySelector('.chapter-title')?.innerText || "Chương truyện";
                const storyTitle = doc.querySelector('a.truyen-title')?.innerText || "";
                
                // Lấy nội dung chữ và format lại bằng thẻ <p>
                const contentHtml = doc.querySelector('#chapter-c, .chapter-c');
                
                if (!contentHtml) {
                    throw new Error("Không tìm thấy nội dung chương! Có thể trang đã chặn Proxy hoặc sai cấu trúc.");
                }

                // Chuyển đổi để hiển thị
                $('rd-story-title').innerText = `${storyTitle} - ${chapterTitle}`;
                $('rd-story-content').innerHTML = contentHtml.innerHTML;

                // Chuẩn bị Text cho AI đọc (loại bỏ các thẻ HTML)
                const textToRead = contentHtml.innerText;
                setupTTS(textToRead);

                $('rd-loading').style.display = 'none';
                $('rd-paper').style.display = 'block';

            } catch (error) {
                alert("Lỗi tải truyện: " + error.message);
                $('rd-loading').style.display = 'none';
            }
        };
    }

    modal.style.display = 'flex';

    // ===============================================================
    // XỬ LÝ GIỌNG ĐỌC AI (WEB SPEECH API)
    // ===============================================================
    const setupTTS = (text) => {
        $('btn-rd-play').style.display = 'flex';
        $('btn-rd-pause').style.display = 'flex';
        $('btn-rd-stop').style.display = 'flex';

        $('btn-rd-play').onclick = () => {
            if (synth.paused) {
                synth.resume();
            } else if (!synth.speaking) {
                // Web Speech API giới hạn độ dài text một lần đọc, nên an toàn nhất là cắt đoạn hoặc đọc toàn bộ nếu trình duyệt hỗ trợ tốt
                utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'vi-VN'; // Set ngôn ngữ Tiếng Việt (Giọng Google nếu dùng Chrome)
                utterance.rate = 1.0;     // Tốc độ đọc
                utterance.pitch = 1.0;    // Độ trầm bổng
                synth.speak(utterance);
            }
        };

        $('btn-rd-pause').onclick = () => {
            if (synth.speaking && !synth.paused) {
                synth.resume(); // Tạm dừng
                synth.pause(); 
            }
        };

        $('btn-rd-stop').onclick = () => {
            if (synth.speaking) {
                synth.cancel(); // Hủy đọc
            }
        };
    };
};

return {
    name: "Đọc Truyện",
    icon: `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.15C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" fill="white"/></svg>`,
    bgColor: "#e17055", // Màu cam phù hợp với đọc truyện
    css: MY_CSS,
    action: runTool
};
})
