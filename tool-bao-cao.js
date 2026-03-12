((context) => {
    const { UI, UTILS, CONSTANTS } = context;
    const GM_xmlhttpRequest = typeof context.GM_xmlhttpRequest !== 'undefined' ? context.GM_xmlhttpRequest : window.GM_xmlhttpRequest;

    // ===============================================================
    // 0. UNIVERSAL FETCH
    // ===============================================================
    const universalFetch = async (options) => {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: options.method || "GET", url: options.url, data: options.data, headers: options.headers,
                    onload: (res) => { if (res.status >= 200 && res.status < 300) resolve(res.responseText); else reject(new Error(`HTTP Error: ${res.status}`)); },
                    onerror: (err) => reject(err)
                });
            } else {
                const fetchOpts = { method: options.method || "GET", headers: options.headers || {} };
                if (options.data) fetchOpts.body = options.data;
                fetch(options.url, fetchOpts).then(r => { if (!r.ok) throw new Error(`HTTP Error`); return r.text(); }).then(resolve).catch(reject);
            }
        });
    };

    // CẤU HÌNH API (THAY LINK WEB APP CỦA BẠN VÀO ĐÂY)
    const API_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL"; 
    
    let USER_NAME = context.AUTH_STATE?.userName && context.AUTH_STATE.userName !== "---" 
                    ? context.AUTH_STATE.userName 
                    : (JSON.parse(localStorage.getItem('tgdd_guest_account') || '{}').user || "Tester");

    // ===============================================================
    // 1. CSS GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        #bc-app-wrapper { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.95); backdrop-filter:blur(10px); z-index:2147483647; font-family: 'Segoe UI', sans-serif; overflow-y:auto; color: #f8fafc; }
        #bc-app-wrapper * { box-sizing:border-box; }
        
        .bc-container { max-width: 800px; margin: 40px auto; padding: 20px; animation: fadeIn 0.3s ease-out; }
        .bc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px; }
        .bc-title { font-size: 24px; font-weight: bold; color: #38bdf8; display:flex; align-items:center; gap:10px;}
        .bc-close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; transition: 0.2s; font-size: 16px; }
        .bc-close-btn:hover { background: #ef4444; }

        .bc-section { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .bc-sec-title { font-size: 18px; font-weight: 600; color: #FFD700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        
        .bc-input-group { margin-bottom: 15px; }
        .bc-label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
        .bc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; outline: none; transition: 0.2s; }
        .bc-input:focus { border-color: #38bdf8; }

        .bc-file-upload { position: relative; display: inline-block; width: 100%; }
        .bc-file-input { display: none; }
        .bc-file-label { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 15px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; color: #94a3b8; transition: 0.2s; background: rgba(255,255,255,0.02); }
        .bc-file-label:hover { border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
        
        .bc-preview-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
        .bc-preview-item { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2); }
        
        .bc-submit-btn { width: 100%; padding: 15px; border-radius: 8px; border: none; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 20px; }
        .bc-submit-btn:hover { background: linear-gradient(135deg, #0369a1, #075985); box-shadow: 0 5px 15px rgba(2, 132, 199, 0.4); }
        .bc-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        #bc-loading { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; flex-direction:column; color:#fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #38bdf8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;

    // ===============================================================
    // 2. HÀM NÉN ẢNH VÀ CHUYỂN BASE64 (Rất quan trọng để tối ưu mạng)
    // ===============================================================
    const processImages = async (files) => {
        const base64Array =[];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let base64 = await new Promise((resolve) => {
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    let img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        let canvas = document.createElement("canvas");
                        let max_size = 1000; // Resize ảnh tối đa 1000px
                        let width = img.width, height = img.height;
                        if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } } 
                        else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                        canvas.width = width; canvas.height = height;
                        let ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Nén JPEG quality 70%
                    };
                };
            });
            base64Array.push(base64);
        }
        return base64Array;
    };

    // ===============================================================
    // 3. MAIN LOGIC
    // ===============================================================
    const runTool = () => {
        if (document.getElementById('bc-app-wrapper')) {
            document.getElementById('bc-app-wrapper').style.display = 'block';
            return;
        }

        const app = document.createElement('div');
        app.id = 'bc-app-wrapper';
        app.innerHTML = `
            <div id="bc-loading">
                <div class="spinner"></div>
                <h3 id="bc-load-text">Đang tải dữ liệu lên hệ thống... Vui lòng không đóng cửa sổ.</h3>
            </div>

            <div class="bc-container">
                <div class="bc-header">
                    <div class="bc-title">📊 BÁO CÁO TRUYỀN THÔNG</div>
                    <div>
                        <span style="color:#94a3b8; font-size:14px; margin-right:15px;">👤 ${USER_NAME}</span>
                        <button class="bc-close-btn" id="bc-btn-close">✕</button>
                    </div>
                </div>

                <!-- SECTION 1: PHÁT TỜ RƠI -->
                <div class="bc-section">
                    <div class="bc-sec-title">📄 1. Phát Tờ Rơi</div>
                    <div class="bc-input-group">
                        <label class="bc-label">Số lượng tờ rơi đã phát</label>
                        <input type="number" id="inp-toroi-sl" class="bc-input" placeholder="Nhập số lượng..." min="0">
                    </div>
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh minh chứng</label>
                        <label for="file-toroi" class="bc-file-label">
                            <span>📸 Nhấn để chọn nhiều ảnh</span>
                        </label>
                        <input type="file" id="file-toroi" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-toroi"></div>
                    </div>
                </div>

                <!-- SECTION 2: ĐĂNG BÀI TRUYỀN THÔNG -->
                <div class="bc-section">
                    <div class="bc-sec-title">🌐 2. Đăng Bài Truyền Thông</div>
                    <div class="bc-input-group">
                        <label class="bc-label">Link bài đăng (Facebook, Zalo...)</label>
                        <input type="text" id="inp-dangbai-link" class="bc-input" placeholder="Dán link bài đăng vào đây...">
                    </div>
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh chụp màn hình bài đăng</label>
                        <label for="file-dangbai" class="bc-file-label">
                            <span>📸 Nhấn để chọn nhiều ảnh</span>
                        </label>
                        <input type="file" id="file-dangbai" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-dangbai"></div>
                    </div>
                </div>

                <!-- SECTION 3: LIVESTREAM -->
                <div class="bc-section">
                    <div class="bc-sec-title">🎥 3. Livestream</div>
                    <div class="bc-input-group">
                        <label class="bc-label">Link Livestream</label>
                        <input type="text" id="inp-live-link" class="bc-input" placeholder="Dán link livestream vào đây...">
                    </div>
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh chụp màn hình lúc Live</label>
                        <label for="file-live" class="bc-file-label">
                            <span>📸 Nhấn để chọn nhiều ảnh</span>
                        </label>
                        <input type="file" id="file-live" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-live"></div>
                    </div>
                </div>

                <button class="bc-submit-btn" id="bc-btn-submit">🚀 GỬI BÁO CÁO</button>
            </div>
        `;
        document.body.appendChild(app);

        const style = document.createElement('style');
        style.innerHTML = MY_CSS;
        document.head.appendChild(style);

        const $ = (id) => document.getElementById(id);

        // Nút đóng
        $('bc-btn-close').onclick = () => app.style.display = 'none';

        // Xử lý Preview ảnh khi người dùng chọn file
        const handlePreview = (inputId, previewId) => {
            $(inputId).addEventListener('change', (e) => {
                const previewContainer = $(previewId);
                previewContainer.innerHTML = ''; // Reset preview
                const files = e.target.files;
                if(files.length > 0) {
                    Array.from(files).forEach(file => {
                        const url = URL.createObjectURL(file);
                        previewContainer.innerHTML += `<img src="${url}" class="bc-preview-item">`;
                    });
                }
            });
        };

        handlePreview('file-toroi', 'prev-toroi');
        handlePreview('file-dangbai', 'prev-dangbai');
        handlePreview('file-live', 'prev-live');

        // Submit form
        $('bc-btn-submit').onclick = async () => {
            // Validate sơ bộ
            if (API_URL === "YOUR_GOOGLE_SCRIPT_WEB_APP_URL") {
                alert("❌ Bạn chưa cấu hình API_URL trong code!"); return;
            }

            $('bc-loading').style.display = 'flex';
            $('bc-btn-submit').disabled = true;

            try {
                // 1. Nén ảnh và chuyển sang Base64 song song
                $('bc-load-text').innerText = "Đang xử lý và nén hình ảnh (Vui lòng chờ)...";
                const[imgToRoi, imgDangBai, imgLive] = await Promise.all([
                    processImages($('file-toroi').files),
                    processImages($('file-dangbai').files),
                    processImages($('file-live').files)
                ]);

                // 2. Gom dữ liệu
                $('bc-load-text').innerText = "Đang tải dữ liệu và tạo thư mục trên hệ thống...";
                const payload = {
                    action: 'submit_report',
                    user: USER_NAME,
                    data: {
                        phatToRoi: {
                            quantity: $('inp-toroi-sl').value,
                            images: imgToRoi
                        },
                        dangBai: {
                            link: $('inp-dangbai-link').value,
                            images: imgDangBai
                        },
                        livestream: {
                            link: $('inp-live-link').value,
                            images: imgLive
                        }
                    }
                };

                // 3. Gửi API
                const response = await universalFetch({
                    method: "POST",
                    url: API_URL,
                    data: JSON.stringify(payload),
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });

                const resJson = JSON.parse(response);
                if(resJson.status === 'success') {
                    alert("✅ Báo cáo thành công! Dữ liệu đã được lưu trữ tự động.");
                    app.style.display = 'none';
                    // Clear form
                    $('inp-toroi-sl').value = ''; $('inp-dangbai-link').value = ''; $('inp-live-link').value = '';
                    $('prev-toroi').innerHTML = ''; $('prev-dangbai').innerHTML = ''; $('prev-live').innerHTML = '';
                    $('file-toroi').value = ''; $('file-dangbai').value = ''; $('file-live').value = '';
                } else {
                    alert("❌ Lỗi từ server: " + resJson.message);
                }

            } catch (err) {
                console.error(err);
                alert("❌ Lỗi mạng hoặc lỗi hệ thống. Không thể gửi báo cáo!");
            } finally {
                $('bc-loading').style.display = 'none';
                $('bc-btn-submit').disabled = false;
            }
        };
    };

    return {
        name: "Báo Cáo TT",
        icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>`,
        bgColor: "#0284c7", 
        action: runTool
    };
})
