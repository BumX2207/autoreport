/* 
   MODULE: NANO BANANA AI - GEN ẢNH TỪ PROMPT & ẢNH GỐC
   - Upload: Chân dung, Bối cảnh, Sản phẩm.
   - Chọn Theme (Preset Prompts).
   - Gọi API tạo ảnh và trả về kết quả.
*/
((context) => {
    const { UI, UTILS, DATA } = context;

    // --- CẤU HÌNH API (MÀY SỬA LẠI CHO ĐÚNG THÔNG SỐ CỦA TOOL NANO BANANA) ---
    const API_CONFIG = {
        URL: "https://api.banana.dev/start/v4/...", // Điền Endpoint API của mày vào đây
        API_KEY: "YOUR_API_KEY_HERE",               // Điền API Key nếu có
        MODEL_KEY: "YOUR_MODEL_KEY"                 // Key của Model (nếu dùng Banana.dev)
    };

    // --- DANH SÁCH THEME (MAPPING PROMPT) ---
    const THEMES = {
        "cyberpunk": "cyberpunk style, neon lights, futuristic city, high tech, detailed",
        "studio": "professional studio lighting, clean background, 8k, product photography, commercial",
        "nature": "sunlight, forest background, natural lighting, fresh atmosphere, cinematic",
        "vintage": "retro style, film grain, 1980s aesthetic, warm tones, nostalgic"
    };

    // --- 1. CSS GIAO DIỆN ---
    const MY_CSS = `
        /* Tận dụng lại CSS của module trước, thêm các class mới */
        .ai-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .ai-upload-box { 
            border: 2px dashed #ccc; border-radius: 10px; padding: 10px; 
            text-align: center; cursor: pointer; transition: 0.2s; background: #fafafa;
            display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100px;
        }
        .ai-upload-box:hover { border-color: #007bff; background: #eef6ff; }
        .ai-upload-box input { display: none; }
        .ai-upload-icon { font-size: 24px; color: #666; margin-bottom: 5px; }
        .ai-upload-label { font-size: 11px; font-weight: bold; color: #444; }
        .ai-upload-preview { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: none; }
        
        .ai-section-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #333; }
        
        .ai-select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 15px; outline: none; }
        
        .ai-result-area {
            width: 100%; min-height: 250px; background: #000; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
            border: 2px solid #333;
        }
        .ai-result-img { max-width: 100%; max-height: 100%; display: none; }
        .ai-loading { color: white; font-family: monospace; display: none; text-align: center; }
        
        /* Animation xoay loading */
        .ai-spinner { width: 30px; height: 30px; border: 4px solid #fff; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;

    // --- 2. HÀM HỖ TRỢ ---
    // Chuyển file ảnh sang Base64 để gửi qua API
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result); // Kết quả dạng "data:image/png;base64,..."
            reader.onerror = error => reject(error);
        });
    };

    // --- 3. LOGIC CHÍNH ---
    const runTool = async () => {
        const modalId = 'nano-banana-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            // Tận dụng style modal cũ, đổi ID và nội dung
            modal.style.cssText = `display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483647; justify-content:center; align-items:center;`;
            
            modal.innerHTML = `
                <div class="qr-content" style="max-width: 500px;">
                    <div class="qr-header">
                        <span>🍌 NANO BANANA GENERATOR</span>
                        <div class="qr-close" id="btn-ai-close">×</div>
                    </div>
                    
                    <div class="qr-body">
                        <!-- 1. KHU VỰC UPLOAD -->
                        <div class="ai-section-title">1. Upload tài nguyên</div>
                        <div class="ai-grid">
                            <label class="ai-upload-box" id="box-portrait">
                                <span class="ai-upload-icon">👤</span>
                                <span class="ai-upload-label">Chân dung</span>
                                <input type="file" accept="image/*" id="inp-portrait">
                                <img class="ai-upload-preview" id="prev-portrait">
                            </label>
                            <label class="ai-upload-box" id="box-bg">
                                <span class="ai-upload-icon">🌄</span>
                                <span class="ai-upload-label">Bối cảnh</span>
                                <input type="file" accept="image/*" id="inp-bg">
                                <img class="ai-upload-preview" id="prev-bg">
                            </label>
                            <label class="ai-upload-box" id="box-product">
                                <span class="ai-upload-icon">📦</span>
                                <span class="ai-upload-label">Sản phẩm</span>
                                <input type="file" accept="image/*" id="inp-product">
                                <img class="ai-upload-preview" id="prev-product">
                            </label>
                        </div>

                        <!-- 2. CẤU HÌNH -->
                        <div class="ai-section-title">2. Cấu hình Prompt</div>
                        
                        <select class="ai-select" id="sel-theme">
                            <option value="">-- Chọn Theme mẫu --</option>
                            ${Object.keys(THEMES).map(k => `<option value="${k}">${k.toUpperCase()}</option>`).join('')}
                        </select>

                        <input type="text" class="qr-input" id="inp-prompt-extra" placeholder="Nhập thêm prompt (VD: red shirt, smiling)...">

                        <!-- 3. NÚT TẠO -->
                        <button class="qr-btn qr-btn-dl" id="btn-ai-gen" style="background:#6c5ce7; margin-bottom: 15px;">
                            ✨ TẠO ẢNH NGAY
                        </button>

                        <!-- 4. KẾT QUẢ -->
                        <div class="ai-result-area" id="ai-result-container">
                            <div class="ai-loading" id="ai-loading-stt">
                                <div class="ai-spinner"></div>
                                <span>Đang kết nối Banana Server...<br>Vui lòng chờ 10-20s</span>
                            </div>
                            <img class="ai-result-img" id="ai-final-img">
                        </div>
                        
                        <button class="qr-btn qr-btn-dl" id="btn-ai-download" style="margin-top:10px; display:none;">
                            💾 Tải ảnh về
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Sự kiện đóng
            document.getElementById('btn-ai-close').onclick = () => { modal.style.display = 'none'; };

            // Sự kiện preview ảnh khi upload
            const handlePreview = (inputId, imgId, boxId) => {
                document.getElementById(inputId).onchange = function(e) {
                    const file = e.target.files[0];
                    if(file){
                        const url = URL.createObjectURL(file);
                        const img = document.getElementById(imgId);
                        img.src = url;
                        img.style.display = 'block';
                        document.querySelector(`#${boxId} .ai-upload-icon`).style.display = 'none';
                        document.querySelector(`#${boxId} .ai-upload-label`).style.display = 'none';
                    }
                }
            };
            handlePreview('inp-portrait', 'prev-portrait', 'box-portrait');
            handlePreview('inp-bg', 'prev-bg', 'box-bg');
            handlePreview('inp-product', 'prev-product', 'box-product');

            // Sự kiện nút Tạo
            document.getElementById('btn-ai-gen').onclick = async () => {
                const pFile = document.getElementById('inp-portrait').files[0];
                const bFile = document.getElementById('inp-bg').files[0];
                const prFile = document.getElementById('inp-product').files[0];
                const themeKey = document.getElementById('sel-theme').value;
                const extraPrompt = document.getElementById('inp-prompt-extra').value;

                if (!pFile || !bFile || !prFile) return alert("Vui lòng upload đủ 3 ảnh!");
                
                // UI Loading
                const loading = document.getElementById('ai-loading-stt');
                const resultImg = document.getElementById('ai-final-img');
                const dlBtn = document.getElementById('btn-ai-download');
                
                loading.style.display = 'block';
                resultImg.style.display = 'none';
                dlBtn.style.display = 'none';

                try {
                    // Convert ảnh sang Base64
                    const [p64, b64, pr64] = await Promise.all([
                        fileToBase64(pFile),
                        fileToBase64(bFile),
                        fileToBase64(prFile)
                    ]);

                    // Gộp Prompt
                    let finalPrompt = extraPrompt;
                    if(themeKey && THEMES[themeKey]) {
                        finalPrompt = `${THEMES[themeKey]}, ${extraPrompt}`;
                    }

                    // --- CHUẨN BỊ PAYLOAD GỬI API ---
                    // QUAN TRỌNG: Mày phải sửa cấu trúc json này theo đúng API Nano Banana của mày
                    const payload = {
                        "apiKey": API_CONFIG.API_KEY,
                        "modelKey": API_CONFIG.MODEL_KEY,
                        "task_payload": {
                            "prompt": finalPrompt,
                            "negative_prompt": "ugly, low quality, blurry",
                            "init_images": {
                                "portrait": p64,  // Tên key này tuỳ API của mày định nghĩa
                                "background": b64,
                                "product": pr64
                            },
                            "width": 512,
                            "height": 768
                        }
                    };

                    // GỌI API BẰNG GM_xmlhttpRequest ĐỂ TRÁNH CORS
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: API_CONFIG.URL,
                        headers: {
                            "Content-Type": "application/json"
                            // "Authorization": "Bearer " + API_CONFIG.API_KEY // Nếu API cần Bearer Token
                        },
                        data: JSON.stringify(payload),
                        onload: function(response) {
                            if (response.status === 200) {
                                // GIẢ SỬ API TRẢ VỀ JSON CÓ DẠNG: { output: { image_base64: "..." } }
                                // HOẶC API TRẢ VỀ URL ẢNH. MÀY CẦN LOG RA ĐỂ XEM CẤU TRÚC.
                                console.log("API Response:", response.responseText);
                                
                                try {
                                    const data = JSON.parse(response.responseText);
                                    
                                    // Sửa dòng này để lấy đúng dữ liệu ảnh từ response
                                    // Ví dụ: const imgSrc = "data:image/png;base64," + data.modelOutputs[0].image_base64;
                                    // Ở đây tao đang giả lập
                                    const imgSrc = data.image_url || data.output_url; 

                                    if(imgSrc) {
                                        resultImg.src = imgSrc;
                                        resultImg.style.display = 'block';
                                        loading.style.display = 'none';
                                        dlBtn.style.display = 'flex';
                                        
                                        // Gán sự kiện download
                                        dlBtn.onclick = () => {
                                            const a = document.createElement('a');
                                            a.href = imgSrc;
                                            a.download = `NANO_BANANA_${Date.now()}.png`;
                                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        };
                                    } else {
                                        alert("API không trả về ảnh. Check Console (F12)!");
                                        loading.style.display = 'none';
                                    }
                                } catch(e) {
                                    alert("Lỗi parse JSON kết quả API");
                                    console.error(e);
                                    loading.style.display = 'none';
                                }
                            } else {
                                alert("Lỗi gọi API: " + response.status);
                                loading.style.display = 'none';
                            }
                        },
                        onerror: function(err) {
                            alert("Lỗi kết nối mạng!");
                            loading.style.display = 'none';
                        }
                    });

                } catch (e) {
                    alert("Lỗi xử lý ảnh đầu vào!");
                    console.error(e);
                    loading.style.display = 'none';
                }
            };
        }

        // Mở modal
        modal.style.display = 'flex';
    };

    return {
        name: "Tạo ảnh AI",
        icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="yellow"/></svg>`,
        bgColor: "#6c5ce7",
        css: MY_CSS,
        action: runTool
    };
})
