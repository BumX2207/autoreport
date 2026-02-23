/* 
   MODULE: TẠO & QUÉT MÃ (GENERATE & SCAN) - V6
   - Fix lỗi tràn khung (Responsive).
   - Tải ảnh siêu nét (Full HD).
   - Ẩn cảnh báo đỏ khi tải ảnh để ảnh sạch đẹp.
   - Tự động ẩn Bottom Nav khi mở tool.
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE } = context;

    // --- 1. CSS GIAO DIỆN ---
    const MY_CSS = `
        /* MODAL */
        #tgdd-qrcode-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483646; justify-content:center; align-items:center; }
        .qr-content { background:#fff; width:95%; max-width:450px; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.4); animation: popIn 0.3s; display:flex; flex-direction:column; max-height:90vh; overflow:hidden; }
        
        /* HEADER */
        .qr-header { padding:15px; text-align:center; font-size:18px; font-weight:800; color:#333; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#fff; }
        .qr-close { font-size:24px; color:#999; cursor:pointer; width:30px; height:30px; line-height:30px; transition:0.2s; }
        .qr-close:hover { color:#d63031; }
        
        /* TABS */
        .qr-tabs { display:flex; background:#f8f9fa; padding:10px; gap:10px; border-bottom:1px solid #eee; }
        .qr-tab { flex:1; text-align:center; padding:10px; border-radius:10px; font-weight:bold; font-size:13px; color:#666; cursor:pointer; transition:0.2s; border:1px solid transparent; }
        .qr-tab.active { background:#fff; color:#007bff; border-color:#ddd; box-shadow:0 2px 5px rgba(0,0,0,0.05); }

        /* BODY */
        .qr-body { padding:20px; overflow-y:auto; flex:1; }
        .qr-view { display:none; flex-direction:column; align-items:center; }
        .qr-view.active { display:flex; }

        /* INPUTS */
        .qr-input { width:100%; padding:12px; border:2px solid #eee; border-radius:10px; font-size:15px; margin-bottom:15px; box-sizing:border-box; outline:none; transition:0.2s; text-align:center; }
        .qr-input:focus { border-color:#007bff; background:#f0f8ff; }
        
        .qr-type-select { display:flex; gap:10px; margin-bottom:15px; width:100%; }
        .qr-radio-label { flex:1; padding:10px; border:1px solid #eee; border-radius:8px; text-align:center; cursor:pointer; font-weight:bold; font-size:13px; color:#555; background:#fff; transition:0.2s; }
        .qr-radio-label:has(input:checked) { border-color:#007bff; background:#007bff; color:#fff; box-shadow:0 4px 10px rgba(0,123,255,0.3); }
        .qr-radio-label input { display:none; }

        /* PREVIEW AREA */
        .qr-preview-area { 
            width: 100%; 
            min-height: 220px; 
            background: #fff; 
            border: 2px dashed #ddd; 
            border-radius: 15px; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center; 
            margin-bottom: 15px; 
            position: relative;
            padding: 20px; 
            box-sizing: border-box;
            overflow: hidden; 
        }
        
        canvas#main-canvas { 
            max-width: 100% !important; 
            height: auto !important;
            object-fit: contain;
        }

        .qr-warning { color:#d63031; font-size:11px; margin-top:10px; font-style:italic; display:none; text-align:center; background:#fff0f0; padding:5px; border-radius:5px; width:100%; }

        /* BUTTONS */
        .qr-btn { width:100%; padding:12px; border:none; border-radius:10px; font-weight:bold; color:white; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px; transition:0.2s; }
        .qr-btn:active { transform:scale(0.98); }
        .qr-btn-dl { background:#28a745; box-shadow:0 4px 15px rgba(40,167,69,0.3); }
        .qr-btn-dl:hover { background:#218838; }

        /* SCANNER */
        #qr-reader { width:100%; border-radius:15px; overflow:hidden; border:2px solid #333; background:black; margin-bottom:15px; }
        .qr-result-box { width:100%; background:#f1f3f5; padding:15px; border-radius:10px; display:flex; gap:10px; align-items:center; box-sizing:border-box; }
        .qr-res-text { flex:1; font-family:monospace; font-size:14px; color:#333; word-break:break-all; font-weight:bold; }
        .qr-btn-copy { background:#007bff; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:11px; white-space:nowrap; }
    `;

    // --- 2. CÁC HÀM HỖ TRỢ ---
    const sanitizeForBarcode = (str) => {
        if(!str) return "";
        let s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                   .replace(/đ/g, "d").replace(/Đ/g, "D");
        s = s.replace(/[^\x20-\x7E]/g, ""); 
        return s;
    };

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // --- 3. LOGIC CHÍNH ---
    const runTool = async () => {
        const modalId = 'tgdd-qrcode-modal';
        let modal = document.getElementById(modalId);

        // --- LOGIC ẨN/HIỆN BOTTOM NAV ---
        const toggleBottomNav = (show) => {
            const bottomNav = document.getElementById('tgdd-bottom-nav');
            if (bottomNav) {
                if (show) {
                    bottomNav.classList.add('show-nav'); // Hiện lại
                } else {
                    bottomNav.classList.remove('show-nav'); // Ẩn đi
                }
            }
        };

        // A. Render HTML
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="qr-content">
                    <div class="qr-header">
                        <span>TẠO & QUÉT MÃ</span>
                        <div class="qr-close" id="btn-qr-close">×</div>
                    </div>
                    <div class="qr-tabs">
                        <div class="qr-tab active" data-tab="create">🖊️ TẠO MÃ</div>
                        <div class="qr-tab" data-tab="scan">📷 QUÉT CAMERA</div>
                    </div>

                    <div class="qr-body">
                        <!-- TAB TẠO MÃ -->
                        <div class="qr-view active" id="view-create">
                            <div class="qr-type-select">
                                <label class="qr-radio-label">
                                    <input type="radio" name="qr-type" value="qrcode" checked> QR Code
                                </label>
                                <label class="qr-radio-label">
                                    <input type="radio" name="qr-type" value="code128"> Barcode 128
                                </label>
                            </div>

                            <input type="text" id="qr-input-text" class="qr-input" placeholder="Nhập nội dung...">

                            <!-- Vùng vẽ Canvas -->
                            <div class="qr-preview-area" id="qr-result-container">
                                <canvas id="main-canvas" style="display:none;"></canvas>
                                <span id="qr-placeholder" style="color:#999; font-size:12px;">Mã sẽ hiện ở đây...</span>
                                <div class="qr-warning" id="qr-warning-msg"></div>
                            </div>

                            <button class="qr-btn qr-btn-dl" id="btn-qr-download">
                                <svg style="width:20px;height:20px;fill:white" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                Tải ảnh về
                            </button>
                        </div>

                        <!-- TAB QUÉT MÃ -->
                        <div class="qr-view" id="view-scan">
                            <div id="qr-reader"></div>
                            <div style="font-size:11px; color:#666; margin-bottom:5px; text-align:center;">Đưa camera vào mã QR hoặc Mã vạch</div>
                            <div class="qr-result-box">
                                <div class="qr-res-text" id="scan-result">...</div>
                                <button class="qr-btn-copy" id="btn-scan-copy">COPY</button>
                            </div>
                            <button id="btn-scan-stop" style="margin-top:15px; background:#dc3545; color:white; border:none; padding:10px; border-radius:8px; width:100%; cursor:pointer; display:none;">Dừng Camera</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // --- SỰ KIỆN ĐÓNG MODAL (Nút X) ---
            document.getElementById('btn-qr-close').onclick = () => { 
                stopScanner(); 
                modal.style.display = 'none'; 
                document.body.classList.remove('tgdd-body-lock');
                toggleBottomNav(true); // Hiện lại Nav
            };

            const tabs = modal.querySelectorAll('.qr-tab');
            tabs.forEach(t => {
                t.onclick = () => {
                    tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
                    document.querySelectorAll('.qr-view').forEach(v => v.classList.remove('active'));
                    document.getElementById(`view-${t.dataset.tab}`).classList.add('active');
                    if (t.dataset.tab === 'scan') startScanner(); else stopScanner();
                };
            });

            UI.showToast("⏳ Đang tải module xử lý mã...");
            try {
                await loadScript('https://unpkg.com/bwip-js@3.0.4/dist/bwip-js-min.js');
                await loadScript('https://unpkg.com/html5-qrcode');
                UI.showToast("✅ Đã sẵn sàng!");
            } catch (e) {
                alert("Lỗi tải thư viện. Kiểm tra mạng!");
                return;
            }
        }

        // B. Logic TẠO MÃ
        const inputEl = document.getElementById('qr-input-text');
        const canvas = document.getElementById('main-canvas');
        const placeholder = document.getElementById('qr-placeholder');
        const warningEl = document.getElementById('qr-warning-msg');
        const radios = document.querySelectorAll('input[name="qr-type"]');

        const generateCode = () => {
            const rawText = inputEl.value;
            const type = document.querySelector('input[name="qr-type"]:checked').value;
            
            warningEl.style.display = 'none';
            warningEl.innerText = "";

            if (!rawText.trim()) {
                canvas.style.display = 'none';
                placeholder.style.display = 'block';
                return;
            }

            try {
                placeholder.style.display = 'none';
                canvas.style.display = 'block';

                let finalOptions = {
                    bcid: type,
                    text: rawText,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                };

                if (type === 'qrcode') {
                    finalOptions.height = 30; 
                    finalOptions.width = 30;
                    finalOptions.includetext = false; 
                } else {
                    const safeText = sanitizeForBarcode(rawText);
                    if (safeText !== rawText) {
                        warningEl.innerText = "⚠️ Đã tự động chuyển Tiếng Việt có dấu thành không dấu.";
                        warningEl.style.display = 'block';
                    }
                    if (safeText.length === 0) throw "Vui lòng nhập ký tự hợp lệ.";
                    finalOptions.text = safeText;
                }

                bwipjs.toCanvas(canvas, finalOptions);

            } catch (e) {
                canvas.style.display = 'none';
                placeholder.style.display = 'block';
                placeholder.innerText = "❌ Lỗi: Nội dung không hỗ trợ!";
            }
        };

        inputEl.oninput = generateCode;
        radios.forEach(r => r.onchange = () => { generateCode(); });

        // Nút Tải ảnh (CẬP NHẬT: ẨN CẢNH BÁO)
        document.getElementById('btn-qr-download').onclick = () => {
            if (canvas.style.display === 'none') return UI.showToast("Chưa có mã để tải!");
            
            const container = document.getElementById('qr-result-container');
            const originalBorder = container.style.border;
            
            // 1. Tạm ẩn border
            container.style.border = 'none';
            
            // 2. Tạm ẩn dòng cảnh báo đỏ (NẾU CÓ)
            const warningEl = document.getElementById('qr-warning-msg');
            const originalWarningDisplay = warningEl.style.display; 
            warningEl.style.display = 'none'; 

            // 3. Mở rộng Canvas để chụp nét
            const originalMaxWidth = canvas.style.maxWidth;
            const originalHeight = canvas.style.height;
            canvas.style.maxWidth = 'none';
            canvas.style.height = 'auto'; 

            if (window.html2canvas) {
                UI.showToast("📸 Đang tạo ảnh...");
                html2canvas(container, {
                    backgroundColor: "#ffffff",
                    scale: 3 
                }).then(c => {
                    // 4. Khôi phục lại mọi thứ như cũ
                    container.style.border = originalBorder;
                    canvas.style.maxWidth = originalMaxWidth;
                    canvas.style.height = originalHeight;
                    warningEl.style.display = originalWarningDisplay; 

                    const a = document.createElement('a');
                    a.href = c.toDataURL("image/png");
                    a.download = `CODE_${Date.now()}.png`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    UI.showToast("✅ Đã lưu ảnh!");
                }).catch(() => {
                    // Khôi phục nếu lỗi
                    container.style.border = originalBorder;
                    canvas.style.maxWidth = originalMaxWidth;
                    canvas.style.height = originalHeight;
                    warningEl.style.display = originalWarningDisplay;
                    UI.showToast("❌ Lỗi!");
                });
            } else {
                alert("Thiếu thư viện html2canvas!");
            }
        };

        // C. Logic QUÉT MÃ
        let html5QrcodeScanner = null;

        const startScanner = () => {
            const resultEl = document.getElementById('scan-result');
            const stopBtn = document.getElementById('btn-scan-stop');
            if (html5QrcodeScanner) return;

            resultEl.innerText = "Đang chờ quét...";
            stopBtn.style.display = "block";

            html5QrcodeScanner = new Html5Qrcode("qr-reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrcodeScanner.start({ facingMode: "environment" }, config, (decodedText) => {
                resultEl.innerText = decodedText;
                if (navigator.vibrate) navigator.vibrate(200);
                UI.showToast("✅ Đã quét thành công!");
            }, () => {}).catch(err => {
                resultEl.innerText = "Lỗi Camera: " + err;
            });
        };

        const stopScanner = () => {
            const stopBtn = document.getElementById('btn-scan-stop');
            if (html5QrcodeScanner) {
                html5QrcodeScanner.stop().then(() => {
                    html5QrcodeScanner.clear();
                    html5QrcodeScanner = null;
                    stopBtn.style.display = "none";
                }).catch(err => console.log("Stop failed", err));
            }
        };

        document.getElementById('btn-scan-stop').onclick = stopScanner;
        document.getElementById('btn-scan-copy').onclick = () => {
            const text = document.getElementById('scan-result').innerText;
            if (text && !text.includes("...")) UI.copyToClipboard(text, "Mã");
            else UI.showToast("Chưa có nội dung!");
        };

        // --- START ---
        modal.style.display = 'flex';
        toggleBottomNav(false); // Ẩn Nav ngay khi mở modal
        document.querySelector('.qr-tab[data-tab="create"]').click();
        inputEl.focus();
    };

    return {
        name: "Tạo Mã / Quét Mã",
        icon: `<svg viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v3h-3v-3zm-6-3h2v2h-2v-2zm3 3h2v3h-2v-3zm-3 3h2v3h-2v-3z" fill="white"/></svg>`,
        bgColor: "#343a40",
        css: MY_CSS,
        action: runTool
    };
})
