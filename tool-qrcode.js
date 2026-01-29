/* 
   MODULE: TẠO & QUÉT MÃ (GENERATE & SCAN) - V3 (FIX TIẾNG VIỆT)
   - Fix lỗi UTF-8 cho QR Code (Hỗ trợ Tiếng Việt).
   - Tự động chuyển Tiếng Việt có dấu thành không dấu cho Barcode 128 (để không bị lỗi).
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE } = context;

    // --- 1. CSS GIAO DIỆN ---
    const MY_CSS = `
        /* MODAL & LAYOUT */
        #tgdd-qrcode-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(5px); z-index:2147483646; justify-content:center; align-items:center; }
        .qr-content { background:#f8f9fa; width:95%; max-width:450px; border-radius:20px; padding:0; box-shadow:0 15px 50px rgba(0,0,0,0.3); animation: popIn 0.3s; display:flex; flex-direction:column; max-height:90vh; overflow:hidden; position:relative; }
        
        .qr-header { background:white; padding:15px; text-align:center; font-size:18px; font-weight:800; color:#333; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
        .qr-close { font-size:24px; color:#999; cursor:pointer; width:30px; height:30px; line-height:30px; }
        
        .qr-tabs { display:flex; background:white; padding:0 15px 15px 15px; border-bottom:1px solid #eee; gap:10px; }
        .qr-tab { flex:1; text-align:center; padding:10px; border-radius:10px; font-weight:bold; font-size:13px; color:#666; background:#f0f0f0; cursor:pointer; transition:0.2s; }
        .qr-tab.active { background:#007bff; color:white; box-shadow:0 4px 10px rgba(0,123,255,0.3); }

        .qr-body { padding:20px; overflow-y:auto; flex:1; display:flex; flex-direction:column; align-items:center; }
        .qr-view { display:none; width:100%; flex-direction:column; align-items:center; }
        .qr-view.active { display:flex; }

        .qr-input-group { width:100%; margin-bottom:15px; }
        .qr-input { width:100%; padding:12px; border:2px solid #ddd; border-radius:12px; font-size:16px; box-sizing:border-box; outline:none; transition:0.2s; text-align:center; }
        .qr-input:focus { border-color:#007bff; background:white; }
        
        .qr-type-select { display:flex; gap:10px; margin-bottom:15px; width:100%; }
        .qr-radio-label { flex:1; padding:8px; border:1px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-weight:bold; font-size:12px; color:#555; background:white; transition:0.2s; }
        .qr-radio-label:has(input:checked) { border-color:#007bff; background:#e7f1ff; color:#007bff; }
        .qr-radio-label input { display:none; }

        /* Vùng hiển thị ảnh (có padding 30px) */
        .qr-preview-area { 
            background:white; 
            padding:30px; 
            border-radius:15px; 
            box-shadow:0 5px 20px rgba(0,0,0,0.05); 
            margin-bottom:15px; 
            display:flex; 
            flex-direction:column;
            justify-content:center; 
            align-items:center; 
            min-height:200px; 
            width:100%; 
            box-sizing:border-box; 
            border:1px dashed #ccc; 
        }
        .qr-preview-area img, .qr-preview-area canvas { max-width:100%; height:auto; }
        .qr-warning { color: #d63031; font-size: 11px; margin-top: 10px; font-style: italic; display: none; text-align: center;}

        .qr-btn { width:100%; padding:12px; border:none; border-radius:12px; font-weight:bold; color:white; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px; transition:transform 0.1s; }
        .qr-btn:active { transform:scale(0.98); }
        .qr-btn-dl { background:#28a745; box-shadow:0 4px 15px rgba(40,167,69,0.3); }

        #qr-reader { width:100%; border-radius:15px; overflow:hidden; border:2px solid #333; background:black; margin-bottom:15px; }
        .qr-result-box { width:100%; background:white; padding:15px; border-radius:12px; border:1px solid #ddd; display:flex; gap:10px; align-items:center; }
        .qr-res-text { flex:1; font-family:monospace; font-size:14px; color:#333; word-break:break-all; }
        .qr-btn-copy { background:#007bff; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px; white-space:nowrap; }
    `;

    // --- 2. HÀM HELPER: XÓA DẤU TIẾNG VIỆT (Cho Barcode) ---
    const removeAccents = (str) => {
        if(!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/đ/g, "d").replace(/Đ/g, "D");
    };

    // --- 3. HÀM LOAD THƯ VIỆN ---
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

    // --- 4. LOGIC CHÍNH ---
    const runTool = async () => {
        const modalId = 'tgdd-qrcode-modal';
        let modal = document.getElementById(modalId);

        // A. Render khung HTML
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
                            <div class="qr-input-group">
                                <input type="text" id="qr-input-text" class="qr-input" placeholder="Nhập nội dung...">
                            </div>
                            
                            <div class="qr-type-select">
                                <label class="qr-radio-label">
                                    <input type="radio" name="qr-type" value="qrcode" checked> QR Code
                                </label>
                                <label class="qr-radio-label">
                                    <input type="radio" name="qr-type" value="barcode"> Barcode 128
                                </label>
                            </div>

                            <div class="qr-preview-area" id="qr-result-container">
                                <span style="color:#999; font-size:12px;">Mã sẽ hiện ở đây...</span>
                            </div>
                            <div class="qr-warning" id="qr-warning-msg"></div>

                            <button class="qr-btn qr-btn-dl" id="btn-qr-download" style="margin-top:15px;">
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

            document.getElementById('btn-qr-close').onclick = () => { 
                stopScanner(); 
                modal.style.display = 'none'; 
                document.body.classList.remove('tgdd-body-lock');
            };

            const tabs = modal.querySelectorAll('.qr-tab');
            tabs.forEach(t => {
                t.onclick = () => {
                    tabs.forEach(x => x.classList.remove('active'));
                    t.classList.add('active');
                    const tabId = t.dataset.tab;
                    document.querySelectorAll('.qr-view').forEach(v => v.classList.remove('active'));
                    document.getElementById(`view-${tabId}`).classList.add('active');
                    if (tabId === 'scan') startScanner(); else stopScanner();
                };
            });

            UI.showToast("⏳ Đang tải thư viện mã...");
            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
                await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
                await loadScript('https://unpkg.com/html5-qrcode');
                UI.showToast("✅ Đã sẵn sàng!");
            } catch (e) {
                alert("Lỗi tải thư viện. Vui lòng kiểm tra mạng.");
                return;
            }
        }

        // B. Logic TẠO MÃ
        const inputEl = document.getElementById('qr-input-text');
        const container = document.getElementById('qr-result-container');
        const warningEl = document.getElementById('qr-warning-msg');
        const radios = document.querySelectorAll('input[name="qr-type"]');

        const generateCode = () => {
            let text = inputEl.value; // Giữ nguyên khoảng trắng
            const type = document.querySelector('input[name="qr-type"]:checked').value;
            
            container.innerHTML = '';
            warningEl.style.display = 'none';

            if (!text.trim()) {
                container.innerHTML = '<span style="color:#999; font-size:12px;">Nhập nội dung để tạo mã...</span>';
                return;
            }

            try {
                if (type === 'qrcode') {
                    // FIX UTF-8 CHO QR CODE
                    // Encode URI Component giúp thư viện hiểu được tiếng Việt
                    const safeText = unescape(encodeURIComponent(text));
                    
                    new QRCode(container, {
                        text: safeText,
                        width: 200,
                        height: 200,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                } else {
                    // XỬ LÝ BARCODE 128
                    // Barcode 128 KHÔNG hỗ trợ dấu tiếng Việt -> Phải chuyển về không dấu
                    const safeText = removeAccents(text);
                    
                    // Nếu text gốc khác text sau khi xóa dấu -> Thông báo cho người dùng
                    if (safeText !== text) {
                        warningEl.innerHTML = "⚠️ Lưu ý: Mã vạch không hỗ trợ có dấu. Đã tự động chuyển thành không dấu.";
                        warningEl.style.display = 'block';
                    }

                    const canvas = document.createElement('canvas');
                    JsBarcode(canvas, safeText, {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 16,
                        height: 80,
                        width: 2,
                        margin: 10,
                        background: "#ffffff"
                    });
                    container.appendChild(canvas);
                }
            } catch (e) {
                container.innerHTML = '<span style="color:red; font-size:12px;">Lỗi: Nội dung không hợp lệ!</span>';
                console.error(e);
            }
        };

        inputEl.oninput = generateCode;
        radios.forEach(r => r.onchange = generateCode);

        // Nút Tải ảnh (Giữ nguyên logic lấy Padding)
        document.getElementById('btn-qr-download').onclick = () => {
            if (!inputEl.value.trim()) return UI.showToast("Chưa có mã để tải!");
            const originalBorder = container.style.border;
            container.style.border = 'none';

            if (window.html2canvas) {
                UI.showToast("📸 Đang xử lý ảnh...");
                html2canvas(container, {
                    backgroundColor: "#ffffff",
                    scale: 3
                }).then(canvas => {
                    container.style.border = originalBorder;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL("image/png");
                    a.download = `CODE_${Date.now()}.png`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    UI.showToast("✅ Đã lưu ảnh!");
                }).catch(err => {
                    container.style.border = originalBorder;
                    UI.showToast("❌ Lỗi tạo ảnh!");
                });
            } else {
                alert("Lỗi: Không tìm thấy thư viện html2canvas!");
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
            
            html5QrcodeScanner.start({ facingMode: "environment" }, config, (decodedText, decodedResult) => {
                console.log(`Code matched = ${decodedText}`, decodedResult);
                
                // Giải mã UTF-8 nếu là QR tiếng Việt
                try {
                    resultEl.innerText = decodeURIComponent(escape(decodedText));
                } catch(e) {
                    resultEl.innerText = decodedText;
                }
                
                if (navigator.vibrate) navigator.vibrate(200);
                UI.showToast("✅ Đã quét được mã!");
            }, (errorMessage) => {}).catch(err => {
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
            if (text && text !== "..." && text !== "Đang chờ quét...") {
                UI.copyToClipboard(text, "Mã vừa quét");
            } else {
                UI.showToast("Chưa có nội dung để copy!");
            }
        };

        // --- MỞ MODAL ---
        modal.style.display = 'flex';
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
