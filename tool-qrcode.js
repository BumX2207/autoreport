/* 
   MODULE: TẠO & QUÉT MÃ (GENERATE & SCAN) - V4 (BWIP-JS ENGINE)
   - Sử dụng BWIP-JS: Thư viện mã vạch chuyên nghiệp.
   - Hỗ trợ Tiếng Việt cho QR Code 100%.
   - Tự động lọc dấu triệt để cho Barcode (Chống crash).
   - Tải ảnh siêu nét.
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
            padding: 20px; /* Padding cho khung */
            box-sizing: border-box;
        }
        /* Canvas do thư viện vẽ ra */
        canvas.qr-canvas { max-width: 100%; height: auto !important; }

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
    
    // Hàm xóa dấu Tiếng Việt và ký tự lạ (Giữ lại số, chữ không dấu, khoảng trắng, gạch ngang)
    // Code 128 B hỗ trợ ASCII từ 32-126.
    const sanitizeForBarcode = (str) => {
        if(!str) return "";
        let s = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                   .replace(/đ/g, "d").replace(/Đ/g, "D");
        // Chỉ giữ lại các ký tự ASCII in được (từ 32 đến 126)
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

            // Close
            document.getElementById('btn-qr-close').onclick = () => { 
                stopScanner(); modal.style.display = 'none'; 
                document.body.classList.remove('tgdd-body-lock');
            };

            // Tabs
            const tabs = modal.querySelectorAll('.qr-tab');
            tabs.forEach(t => {
                t.onclick = () => {
                    tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
                    document.querySelectorAll('.qr-view').forEach(v => v.classList.remove('active'));
                    document.getElementById(`view-${t.dataset.tab}`).classList.add('active');
                    if (t.dataset.tab === 'scan') startScanner(); else stopScanner();
                };
            });

            // Tải thư viện
            UI.showToast("⏳ Đang tải module xử lý mã...");
            try {
                // BWIP-JS: Thư viện vẽ mã vạch/QR cực mạnh (Vẽ trực tiếp lên Canvas)
                await loadScript('https://unpkg.com/bwip-js@3.0.4/dist/bwip-js-min.js');
                // Html5-Qrcode: Để quét
                await loadScript('https://unpkg.com/html5-qrcode');
                UI.showToast("✅ Đã sẵn sàng!");
            } catch (e) {
                alert("Lỗi tải thư viện. Kiểm tra mạng!");
                return;
            }
        }

        // B. Logic TẠO MÃ (GENERATE) - Dùng BWIP-JS
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
                    bcid: type,       // 'qrcode' or 'code128'
                    text: rawText,
                    scale: 3,         // Độ nét
                    height: 10,       // Chiều cao (cho barcode)
                    includetext: true,// Hiện text bên dưới mã vạch
                    textxalign: 'center',
                };

                // Xử lý riêng cho từng loại
                if (type === 'qrcode') {
                    // QR Code: Giữ nguyên UTF-8, chỉnh lại kích thước
                    finalOptions.height = 30; // Aspect ratio cho QR
                    finalOptions.width = 30;
                    finalOptions.includetext = false; // QR không hiện text
                } else {
                    // Barcode 128: PHẢI LỌC DẤU
                    const safeText = sanitizeForBarcode(rawText);
                    
                    if (safeText !== rawText) {
                        warningEl.innerText = "⚠️ Đã tự động chuyển Tiếng Việt có dấu thành không dấu để tạo mã vạch hợp lệ.";
                        warningEl.style.display = 'block';
                    }
                    if (safeText.length === 0) {
                        throw "Vui lòng nhập ký tự không dấu hoặc số.";
                    }
                    
                    finalOptions.text = safeText; // Dùng text đã lọc
                }

                // VẼ LÊN CANVAS
                bwipjs.toCanvas(canvas, finalOptions);

            } catch (e) {
                // Nếu lỗi (thường do ký tự quá dị mà code128 không chịu nổi)
                canvas.style.display = 'none';
                placeholder.style.display = 'block';
                placeholder.innerText = "❌ Lỗi: " + e;
                if(e.toString().includes("bwipp")) placeholder.innerText = "❌ Nội dung chứa ký tự không hỗ trợ!";
            }
        };

        inputEl.oninput = generateCode;
        radios.forEach(r => r.onchange = () => { generateCode(); });

        // Nút Tải ảnh (Dùng html2canvas chụp cả khung Padding)
        document.getElementById('btn-qr-download').onclick = () => {
            if (canvas.style.display === 'none') return UI.showToast("Chưa có mã để tải!");
            
            const container = document.getElementById('qr-result-container');
            // Tạm ẩn border nét đứt
            const oldBorder = container.style.border;
            container.style.border = 'none';

            if (window.html2canvas) {
                UI.showToast("📸 Đang tạo ảnh...");
                html2canvas(container, {
                    backgroundColor: "#ffffff",
                    scale: 3 // Super high quality
                }).then(c => {
                    container.style.border = oldBorder;
                    const a = document.createElement('a');
                    a.href = c.toDataURL("image/png");
                    a.download = `CODE_${Date.now()}.png`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    UI.showToast("✅ Đã lưu ảnh!");
                }).catch(() => {
                    container.style.border = oldBorder;
                    UI.showToast("❌ Lỗi!");
                });
            } else {
                alert("Thiếu thư viện html2canvas!");
            }
        };

        // C. Logic QUÉT MÃ (Scanner)
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
                console.log(`Matched: ${decodedText}`);
                resultEl.innerText = decodedText;
                if (navigator.vibrate) navigator.vibrate(200);
                UI.showToast("✅ Đã quét thành công!");
                // stopScanner(); // Tự động dừng nếu muốn
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
