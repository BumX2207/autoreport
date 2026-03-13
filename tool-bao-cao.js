((context) => {
    const { UI, UTILS, CONSTANTS } = context;
    const GM_xmlhttpRequest = typeof context.GM_xmlhttpRequest !== 'undefined' ? context.GM_xmlhttpRequest : window.GM_xmlhttpRequest;

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

    // ===============================================================
    // 1. CẤU HÌNH API
    // ===============================================================
    const API_URL_MAIN = "https://script.google.com/macros/s/AKfycbxDRSg1JDNTyuYf2TSQovNIWhFk3ls9hPXxtRSMu6xI0oNjql53nJo0G1H5k1b2iq_3/exec";   
    const API_URL_REPORT = "https://script.google.com/macros/s/AKfycbz7Hv3FHg_XiA4g-ujO8bXkLSohxzB2HJvzsOuKZbkGdr-E33vwRJB4Etl-eCtKh5Xr/exec";

    let SYSTEM_USER = "---";
    if (context.AUTH_STATE && context.AUTH_STATE.isAuthorized && context.AUTH_STATE.userName && context.AUTH_STATE.userName !== "---") {
        SYSTEM_USER = context.AUTH_STATE.userName;
    } else {
        let savedGuest = localStorage.getItem('tgdd_guest_account');
        if (savedGuest) SYSTEM_USER = JSON.parse(savedGuest).user || "---";
    }

    const managerRegex = /^\d+\s*-\s*.+$/;
    let IS_MANAGER = managerRegex.test(SYSTEM_USER);
    let CURRENT_USER = IS_MANAGER ? SYSTEM_USER : "";
    
    let EMP_SESSION = JSON.parse(localStorage.getItem('bc_emp_session') || "null");
    let MANAGER_EMPLOYEES =[];
    let MANAGER_SHEET_ID = ""; 

    const parseDateFromSheet = (rawStr) => {
        if (!rawStr) return { date: "N/A", time: "N/A" };
        let str = String(rawStr).trim();
        
        let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/);
        if (match) {
            let dd = String(match[1]).padStart(2, '0');
            let mm = String(match[2]).padStart(2, '0');
            let yyyy = match[3];
            let hh = String(match[4]).padStart(2, '0');
            let min = String(match[5]).padStart(2, '0');
            return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${min}` };
        }
        
        let d = new Date(str);
        if (!isNaN(d.getTime())) {
            let dd = String(d.getDate()).padStart(2, '0');
            let mm = String(d.getMonth() + 1).padStart(2, '0');
            let yyyy = d.getFullYear();
            let hh = String(d.getHours()).padStart(2, '0');
            let min = String(d.getMinutes()).padStart(2, '0');
            return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${min}` };
        }
        
        return { date: "N/A", time: "N/A" };
    };

    // ===============================================================
    // 2. CSS GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        #bc-app-wrapper { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.95); backdrop-filter:blur(10px); z-index:2147483647; font-family: 'Segoe UI', sans-serif; color: #f8fafc; display:flex; justify-content:center; align-items:flex-start; padding-top:20px; }
        #bc-app-wrapper * { box-sizing:border-box; }
        
        .bc-screen { display:none; flex-direction:column; width:95%; max-width:800px; height:80vh; max-height:80vh; background:rgba(30, 41, 59, 0.7); border-radius:12px; border:1px solid rgba(255,255,255,0.1); overflow:hidden; animation: fadeIn 0.3s ease-out; box-shadow:0 15px 40px rgba(0,0,0,0.5);}
        .bc-screen.active { display:flex; }
        
        .bc-header { flex-shrink:0; display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:rgba(15, 23, 42, 0.8); border-bottom:1px solid rgba(255,255,255,0.1); }
        .bc-footer { flex-shrink:0; padding:15px 20px; background:rgba(15, 23, 42, 0.8); border-top:1px solid rgba(255,255,255,0.1); }
        
        .bc-screen-body { flex:1; overflow-y:auto; padding:20px; }
        .bc-screen-body::-webkit-scrollbar { width: 6px; }
        .bc-screen-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

        .bc-title { font-size: 18px; font-weight: bold; color: #38bdf8; display:flex; align-items:center; gap:8px;}
        .bc-header-right { display:flex; align-items:center; gap:15px; margin-left:auto; }
        .bc-close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: 0.2s; font-size: 14px; display:flex; justify-content:center; align-items:center;}
        .bc-close-btn:hover { background: #ef4444; }

        .bc-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .bc-sec-title { font-size: 15px; font-weight: 600; color: #FFD700; margin-bottom: 15px; }
        
        .bc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; margin-bottom:15px; outline:none; transition:0.2s; }
        .bc-input:focus { border-color: #38bdf8; }
        .bc-label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }

        .bc-btn { width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border:none; color:#fff; transition:0.2s; }
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .btn-primary:hover { background: linear-gradient(135deg, #0369a1, #075985); }
        .btn-success { background: linear-gradient(135deg, #10b981, #047857); }
        .btn-danger { background: #ef4444; }

        .bc-file-upload { position: relative; display: inline-block; width: 100%; margin-bottom:10px; }
        .bc-file-input { display: none; }
        .bc-file-label { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; color: #94a3b8; background: rgba(255,255,255,0.02); transition:0.2s; font-size:14px;}
        .bc-file-label:hover { border-color:#38bdf8; color:#38bdf8;}
        .bc-preview-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .bc-preview-item { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2); }

        .bc-tabs { display: flex; gap: 10px; padding:10px 20px; background: rgba(15, 23, 42, 0.5); flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.05);}
        .bc-tab-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; background: rgba(0,0,0,0.2); color: #94a3b8; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .bc-tab-btn.active { background: #38bdf8; color: #0f172a; }
        .bc-tab-content { display: none; flex-direction:column; flex:1; overflow:hidden;}
        .bc-tab-content.active { display: flex; animation: fadeIn 0.3s; }

        .stat-dash { display:flex; gap:10px; margin-bottom:15px; }
        .stat-box { flex:1; padding:15px; border-radius:8px; text-align:center; border: 1px solid transparent;}
        .sb-blue { background:rgba(56, 189, 248, 0.1); border-color:#38bdf8; }
        .sb-red { background:rgba(239, 68, 68, 0.1); border-color:#ef4444; }
        .date-group-wrapper { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .date-group-title { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 12px 20px; font-weight: bold; font-size: 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; gap: 10px; }
        .date-group-content { padding: 15px; }

        .rp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; transition: 0.2s; }
        .rp-card:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
        .rp-card:last-child { margin-bottom: 0; }
        .rp-header-row { display:flex; justify-content:space-between; align-items:center; cursor: pointer; }
        .rp-detail { display: none; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); font-size:13px; color:#cbd5e1;}
        .rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 10px; }
        
        .rp-img { width: 100%; height: 70px; object-fit: cover; border-radius: 6px; cursor: zoom-in; border: 1px solid rgba(255,255,255,0.2); transition: 0.2s; }
        .rp-img:hover { transform: scale(1.05); border-color:#FFD700; z-index:2;}
        .rp-link { color:#38bdf8; text-decoration:none; word-break: break-all;}
        .rp-link:hover { text-decoration:underline;}

        #bc-lightbox { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 2147483648; justify-content: center; align-items: center; flex-direction: column; }
        #bc-lb-img { max-width: 95vw; max-height: 85vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); object-fit:contain;}
        #bc-lb-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px; transition:0.2s;}
        #bc-lb-close:hover { background: #ef4444; }

        #bc-loading { display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483649; justify-content:center; align-items:center; flex-direction:column; color:#fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #38bdf8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        .employee-row { display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px; align-items:center; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;

    const processImages = async (files) => {
        const base64Array =[];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let base64 = await new Promise((resolve) => {
                let reader = new FileReader(); reader.readAsDataURL(file);
                reader.onload = (event) => {
                    let img = new Image(); img.src = event.target.result;
                    img.onload = () => {
                        let canvas = document.createElement("canvas"); let max_size = 1000; 
                        let width = img.width, height = img.height;
                        if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } } 
                        else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                        canvas.width = width; canvas.height = height;
                        let ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7)); 
                    };
                };
            });
            base64Array.push(base64);
        }
        return base64Array;
    };

    const runTool = () => {
        if (document.getElementById('bc-app-wrapper')) { document.getElementById('bc-app-wrapper').style.display = 'flex'; return; }

        const app = document.createElement('div'); app.id = 'bc-app-wrapper';
        app.innerHTML = `
            <div id="bc-loading"><div class="spinner"></div><h3 id="bc-load-text">Đang tải dữ liệu...</h3></div>
            
            <!-- LIGHTBOX -->
            <div id="bc-lightbox">
                <button id="bc-lb-close">✕</button>
                <img id="bc-lb-img" src="">
            </div>

            <!-- SCREEN 1: QUẢN LÝ -->
            <div class="bc-screen" id="sc-manager">
                <div class="bc-header">
                    <div class="bc-title">⚙️ QUẢN LÝ</div>
                    <div class="bc-header-right">
                        <span style="color:#94a3b8; font-size:14px; font-weight:600;">👤 ${CURRENT_USER}</span>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>

                <div class="bc-tabs">
                    <button class="bc-tab-btn active" id="tab-btn-stat">📈 Thống Kê</button>
                    <button class="bc-tab-btn" id="tab-btn-config">⚙️ Cài Đặt</button>
                </div>

                <!-- TAB THỐNG KÊ -->
                <div class="bc-tab-content active" id="tab-stat">
                    <div class="bc-screen-body">
                        <div id="stat-summary-container"></div>
                        <div class="bc-card" style="margin-bottom:15px; padding:10px 15px;">
                            <select id="stat-date-filter" class="bc-input" style="margin:0; cursor:pointer;"></select>
                        </div>
                        <div id="stat-list-container">
                            <div style="text-align:center; color:#94a3b8; padding:20px;">Đang tải dữ liệu...</div>
                        </div>
                    </div>
                </div>
                
                <!-- TAB CÀI ĐẶT -->
                <div class="bc-tab-content" id="tab-config">
                    <div class="bc-screen-body">
                        <div class="bc-card">
                            <h3 class="bc-sec-title">1. Cấu hình Lưu trữ</h3>
                            <label class="bc-label">ID Thư mục Google Drive:</label>
                            <input type="text" id="inp-folder-id" class="bc-input" placeholder="VD: 1A2b3C4d5E...">
                            <label class="bc-label">ID Google Sheet:</label>
                            <input type="text" id="inp-sheet-id" class="bc-input" placeholder="VD: 1xYz_789abc...">
                        </div>
                        <div class="bc-card">
                            <h3 class="bc-sec-title">2. Danh sách Nhân viên</h3>
                            <div style="display:flex; gap:10px; margin-bottom:15px;">
                                <input type="text" id="inp-nv-shop" class="bc-input" style="margin:0; flex:1;" placeholder="Mã Shop">
                                <input type="text" id="inp-nv-user" class="bc-input" style="margin:0; flex:1;" placeholder="Tên User">
                                <input type="text" id="inp-nv-pass" class="bc-input" style="margin:0; flex:1;" placeholder="Mật khẩu">
                                <button class="bc-btn btn-success" id="btn-add-nv" style="width:75px; flex-shrink:0;">+ Thêm</button>
                            </div>
                            <div id="nv-list-container"></div>
                        </div>
                    </div>
                    <div class="bc-footer">
                        <button class="bc-btn btn-primary" id="btn-save-config">💾 LƯU CẤU HÌNH</button>
                    </div>
                </div>
            </div>

            <!-- SCREEN 2: LOGIN NHÂN VIÊN -->
            <div class="bc-screen" id="sc-login" style="height:auto; max-height:none;">
                <div class="bc-header" style="justify-content:flex-end; border:none; background:transparent;">
                    <button class="bc-close-btn btn-close-app">✕</button>
                </div>
                <div style="padding: 0 30px 40px; text-align:center;">
                    <h2 style="color:#38bdf8; margin-bottom:5px;">ĐĂNG NHẬP</h2>
                    <p style="color:#94a3b8; font-size:13px; margin-bottom:25px;">Hệ thống Báo cáo Truyền thông</p>
                    <input type="text" id="inp-login-shop" class="bc-input" placeholder="Mã Shop của bạn">
                    <input type="text" id="inp-login-user" class="bc-input" placeholder="Tên User của bạn">
                    <input type="password" id="inp-login-pass" class="bc-input" placeholder="Mật khẩu">
                    <button class="bc-btn btn-primary" id="btn-nv-login">VÀO BÁO CÁO</button>
                </div>
            </div>

            <!-- SCREEN 3: FORM BÁO CÁO -->
            <div class="bc-screen" id="sc-report">
                <div class="bc-header">
                    <div class="bc-title">📊 BÁO CÁO</div>
                    <div class="bc-header-right">
                        <span style="color:#94a3b8; font-size:14px; font-weight:600;" id="lbl-emp-name">👤 ---</span>
                        <button class="bc-btn btn-danger" id="btn-nv-logout" style="padding:5px 10px; width:auto; font-size:12px;">Thoát</button>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>

                <div class="bc-screen-body">
                    <div class="bc-card">
                        <div class="bc-sec-title">📄 1. Phát Tờ Rơi</div>
                        <label class="bc-label">Số lượng tờ rơi đã phát</label>
                        <input type="number" id="inp-toroi-sl" class="bc-input" placeholder="Nhập số lượng..." min="0">
                        <div class="bc-file-upload">
                            <label for="file-toroi" class="bc-file-label">📸 Nhấn để chọn ảnh phát tờ rơi</label>
                            <input type="file" id="file-toroi" class="bc-file-input" multiple accept="image/*">
                            <div class="bc-preview-grid" id="prev-toroi"></div>
                        </div>
                    </div>

                    <div class="bc-card">
                        <div class="bc-sec-title">🌐 2. Đăng Bài Truyền Thông</div>
                        <label class="bc-label">Link bài đăng</label>
                        <input type="text" id="inp-dangbai-link" class="bc-input" placeholder="Dán link bài đăng vào đây...">
                        <div class="bc-file-upload">
                            <label for="file-dangbai" class="bc-file-label">📸 Nhấn để chọn ảnh bài đăng</label>
                            <input type="file" id="file-dangbai" class="bc-file-input" multiple accept="image/*">
                            <div class="bc-preview-grid" id="prev-dangbai"></div>
                        </div>
                    </div>

                    <div class="bc-card">
                        <div class="bc-sec-title">🎥 3. Livestream</div>
                        <label class="bc-label">Link Livestream</label>
                        <input type="text" id="inp-live-link" class="bc-input" placeholder="Dán link livestream vào đây...">
                        <div class="bc-file-upload">
                            <label for="file-live" class="bc-file-label">📸 Nhấn để chọn ảnh Livestream</label>
                            <input type="file" id="file-live" class="bc-file-input" multiple accept="image/*">
                            <div class="bc-preview-grid" id="prev-live"></div>
                        </div>
                    </div>
                </div>

                <div class="bc-footer">
                    <button class="bc-btn btn-primary" id="btn-submit-report" style="padding:15px; font-size:16px;">🚀 GỬI BÁO CÁO</button>
                </div>
            </div>
        `;
        document.body.appendChild(app);

        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
        const $ = (id) => document.getElementById(id);
        const switchSc = (id) => { document.querySelectorAll('.bc-screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

        // Nút Đóng App
        document.querySelectorAll('.btn-close-app').forEach(btn => btn.onclick = () => app.style.display = 'none');

        // Xử lý Phóng to ảnh (Lightbox)
        app.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('rp-img')) {
                e.stopPropagation();
                $('bc-lb-img').src = e.target.getAttribute('src');
                $('bc-lightbox').style.display = 'flex';
            }
        });
        $('bc-lb-close').onclick = () => $('bc-lightbox').style.display = 'none';

        // Preview Ảnh Báo cáo
        const handlePreview = (inputId, previewId) => {
            $(inputId).addEventListener('change', (e) => {
                const con = $(previewId); con.innerHTML = '';
                if(e.target.files.length > 0) Array.from(e.target.files).forEach(f => con.innerHTML += `<img src="${URL.createObjectURL(f)}" class="bc-preview-item">`);
            });
        };
        handlePreview('file-toroi', 'prev-toroi'); handlePreview('file-dangbai', 'prev-dangbai'); handlePreview('file-live', 'prev-live');

        // ==========================================
        // LUỒNG QUẢN LÝ
        // ==========================================
        if (IS_MANAGER) {
            switchSc('sc-manager');
            
            $('tab-btn-stat').onclick = () => { $('tab-btn-stat').classList.add('active'); $('tab-btn-config').classList.remove('active'); $('tab-stat').classList.add('active'); $('tab-config').classList.remove('active'); };
            $('tab-btn-config').onclick = () => { $('tab-btn-config').classList.add('active'); $('tab-btn-stat').classList.remove('active'); $('tab-config').classList.add('active'); $('tab-stat').classList.remove('active'); };

            const loadConfig = async () => {
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang tải dữ liệu...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({action:"get_config_manager", user: CURRENT_USER})});
                    let data = JSON.parse(res);
                    if(data.status === 'success') {
                        $('inp-folder-id').value = data.folderId || "";
                        MANAGER_SHEET_ID = data.sheetId || ""; 
                        $('inp-sheet-id').value = MANAGER_SHEET_ID;
                        MANAGER_EMPLOYEES = data.employees && data.employees !== "[]" ? JSON.parse(data.employees) :[];
                        renderNV();
                        if(MANAGER_SHEET_ID) loadStatistics(); 
                        else $('stat-list-container').innerHTML = `<div style="text-align:center; color:#fbbf24; padding:20px;">Vui lòng cài đặt ID Sheet ở tab Cài Đặt trước!</div>`;
                    }
                } catch(e) { console.log(e); $('stat-list-container').innerHTML = `<div style="color:#ef4444; text-align:center;">Lỗi mạng! Không tải được cấu hình.</div>`; }
                $('bc-loading').style.display = 'none';
            };
            loadConfig();

            const renderNV = () => {
                $('nv-list-container').innerHTML = MANAGER_EMPLOYEES.map((nv, idx) => `
                    <div class="employee-row">
                        <span>🏬 ${nv.s || 'N/A'} - 👤 ${nv.u} <span style="color:#94a3b8; font-size:12px;">(Pass: ${nv.p})</span></span>
                        <button class="bc-btn btn-danger" style="width:auto; padding:5px 10px;" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('delNV', {detail:${idx}}))">Xóa</button>
                    </div>
                `).join('');
            };
            app.addEventListener('delNV', (e) => { MANAGER_EMPLOYEES.splice(e.detail, 1); renderNV(); });
            
            $('btn-add-nv').onclick = () => {
                let s = $('inp-nv-shop').value.trim(), u = $('inp-nv-user').value.trim(), p = $('inp-nv-pass').value.trim();
                if(!s || !u || !p) return alert("Nhập đủ Mã Shop, User và Mật khẩu!");
                if(MANAGER_EMPLOYEES.some(x => x.s === s && x.u === u)) return alert("User này đã tồn tại trong Shop!");
                MANAGER_EMPLOYEES.push({s, u, p}); renderNV(); 
                $('inp-nv-shop').value = ''; $('inp-nv-user').value = ''; $('inp-nv-pass').value = '';
            };

            $('btn-save-config').onclick = async () => {
                let fId = $('inp-folder-id').value.trim(), sId = $('inp-sheet-id').value.trim();
                if(!fId || !sId) return alert("Nhập đủ ID Folder và ID Sheet!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang lưu cấu hình...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: fId, sheetId: sId, employees: JSON.stringify(MANAGER_EMPLOYEES) }) });
                    if(JSON.parse(res).status === 'success') { alert("✅ Đã lưu cấu hình!"); MANAGER_SHEET_ID = sId; loadStatistics(); }
                } catch(e) { alert("❌ Lỗi mạng!"); }
                $('bc-loading').style.display = 'none';
            };

            let STAT_DATA =[];
            const loadStatistics = async () => {
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "get_manager_reports", sheetId: MANAGER_SHEET_ID }) });
                    let json = JSON.parse(res);
                    if(json.status === 'success' && Array.isArray(json.data) && json.data.length > 1) {
                        STAT_DATA = json.data.slice(1).map(r => {
                            let parsed = parseDateFromSheet(r[0]);
                            return { dateStr: parsed.date, timeStr: parsed.time, user: String(r[1] || "").trim(), slToRoi: r[2], linkDB: r[3], linkLive: r[4], imgToRoi: r[5], imgDB: r[6], imgLive: r[7], rootLink: r[8] };
                        });
                        STAT_DATA.reverse(); 
                        renderStatSummary();
                        renderStatFilter();
                        renderStatList("ALL");
                    } else {
                        renderStatSummary(true);
                        $('stat-list-container').innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">Chưa có báo cáo nào.</div>`;
                    }
                } catch(e) { $('stat-list-container').innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px;">Lỗi tải thống kê! File Sheet cấu hình bị sai hoặc chưa được cấp quyền truy cập.</div>`; }
            };

            const renderStatSummary = (empty = false) => {
                let d = new Date();
                let todayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
                
                let reportedUsers =[];
                if(!empty) {
                    let todayReports = STAT_DATA.filter(r => r.dateStr === todayStr);
                    reportedUsers = [...new Set(todayReports.map(r => r.user))]; 
                }
                
                let notReportedUsers = MANAGER_EMPLOYEES.filter(emp => !reportedUsers.includes(String(emp.u).trim())).map(e => e.u);
                let totalEmps = MANAGER_EMPLOYEES.length;

                $('stat-summary-container').innerHTML = `
                    <div class="stat-dash">
                        <div class="stat-box sb-blue">
                            <div style="font-size:26px; font-weight:bold; color:#38bdf8;">${reportedUsers.length}</div>
                            <div style="font-size:12px; color:#94a3b8;">Đã báo cáo (Hôm nay)</div>
                        </div>
                        <div class="stat-box sb-red">
                            <div style="font-size:26px; font-weight:bold; color:#ef4444;">${notReportedUsers.length}</div>
                            <div style="font-size:12px; color:#94a3b8;">Chưa báo cáo</div>
                        </div>
                    </div>
                    ${notReportedUsers.length > 0 
                        ? `<div style="font-size:12px; color:#ef4444; margin-bottom:15px; padding:10px; background:rgba(239, 68, 68, 0.1); border-radius:6px;"><b>⏳ Chưa báo cáo:</b> ${notReportedUsers.join(', ')}</div>` 
                        : (totalEmps > 0 ? `<div style="font-size:12px; color:#10b981; margin-bottom:15px; padding:10px; background:rgba(16, 185, 129, 0.1); border-radius:6px;">✅ Tất cả nhân viên đã nộp báo cáo hôm nay!</div>` : '')}
                `;
            };

            const renderStatFilter = () => {
                let dates =[...new Set(STAT_DATA.map(r => r.dateStr))]; 
                let opts = `<option value="ALL">Tất cả các ngày</option>`;
                dates.forEach(d => opts += `<option value="${d}">${d}</option>`);
                $('stat-date-filter').innerHTML = opts;
            };

            $('stat-date-filter').onchange = (e) => renderStatList(e.target.value);

            const renderStatList = (dateFilter) => {
                let filtered = dateFilter === "ALL" ? STAT_DATA : STAT_DATA.filter(r => r.dateStr === dateFilter);
                if(filtered.length === 0) { $('stat-list-container').innerHTML = `<div style="text-align:center; padding:20px;">Không có dữ liệu.</div>`; return; }
                
                let grouped = {};
                filtered.forEach(item => { if(!grouped[item.dateStr]) grouped[item.dateStr] = []; grouped[item.dateStr].push(item); });

                let html = '';
                
                // Hàm render Grid hình ảnh dùng chung
                const renderImgGrid = (str) => {
                    if(!str) return '';
                    if(str.includes('ảnh') && !str.includes('http')) return `<span style="color:#fbbf24; font-size:12px;">${str} (Cũ)</span>`;
                    let links = str.split('|||').filter(l => l.trim() !== '');
                    if(links.length === 0) return '';
                    return `<div class="rp-grid">` + links.map(l => {
                        let match = l.match(/id=([a-zA-Z0-9_-]+)/);
                        let imgUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : l;
                        return `<img src="${imgUrl}" class="rp-img">`; 
                    }).join('') + `</div>`;
                };

                for(let date in grouped) {
                    
                    // --- TÍNH TỔNG SỐ LIỆU TRONG NGÀY ---
                    let totalToRoi = 0;
                    let allLinksDB = [];
                    let allLinksLive =[];
                    let allImgToRoi = [];
                    let allImgDB =[];
                    let allImgLive = [];
                    
                    grouped[date].forEach(row => {
                        totalToRoi += parseInt(row.slToRoi) || 0;
                        if(row.linkDB) allLinksDB.push(`<a href="${row.linkDB}" target="_blank" class="rp-link">${row.linkDB}</a>`);
                        if(row.linkLive) allLinksLive.push(`<a href="${row.linkLive}" target="_blank" class="rp-link">${row.linkLive}</a>`);
                        
                        if(row.imgToRoi) allImgToRoi.push(row.imgToRoi);
                        if(row.imgDB) allImgDB.push(row.imgDB);
                        if(row.imgLive) allImgLive.push(row.imgLive);
                    });

                    let combinedImgToRoi = allImgToRoi.filter(s => s).join('|||');
                    let combinedImgDB = allImgDB.filter(s => s).join('|||');
                    let combinedImgLive = allImgLive.filter(s => s).join('|||');

                    html += `
                    <div class="date-group-wrapper">
                        <div class="date-group-title">📅 Báo cáo ngày: ${date}</div>
                        <div class="date-group-content">
                    `;
                    
                    // --- CARD TỔNG CỘNG ---
                    let uniqueIdSum = `rp-det-${date.replace(/\//g,'-')}-SUM`;
                    html += `
                        <div class="rp-card" style="border-color: #FFD700; background: rgba(255, 215, 0, 0.05); margin-bottom: 20px;">
                            <div class="rp-header-row" onclick="document.getElementById('${uniqueIdSum}').style.display = document.getElementById('${uniqueIdSum}').style.display === 'block' ? 'none' : 'block'">
                                <div><b style="color:#FFD700; font-size:15px;">🌟 TẤT CẢ</b></div>
                                <span style="font-size:12px; color:#FFD700;">▼ Xem chi tiết</span>
                            </div>
                            <div class="rp-detail" id="${uniqueIdSum}" style="border-top-color:rgba(255,215,0,0.3);">
                                <div style="margin-bottom:10px;"><b>📄 Tổng Phát Tờ Rơi:</b> ${totalToRoi} tờ</div>
                                ${renderImgGrid(combinedImgToRoi)}
                                
                                <div style="margin:15px 0 10px;"><b>🌐 Tổng Link Đăng Bài:</b> <div style="margin-top:5px; font-size:12px;">${allLinksDB.length > 0 ? allLinksDB.join('<br>') : 'Không có link'}</div></div>
                                ${renderImgGrid(combinedImgDB)}
                                
                                <div style="margin:15px 0 10px;"><b>🎥 Tổng Link Livestream:</b> <div style="margin-top:5px; font-size:12px;">${allLinksLive.length > 0 ? allLinksLive.join('<br>') : 'Không có link'}</div></div>
                                ${renderImgGrid(combinedImgLive)}
                            </div>
                        </div>
                    `;

                    // --- CÁC CARD CỦA NHÂN VIÊN ---
                    grouped[date].forEach((row, idx) => {
                        let uniqueId = `rp-det-${date.replace(/\//g,'-')}-${idx}`;
                        html += `
                            <div class="rp-card">
                                <div class="rp-header-row" onclick="document.getElementById('${uniqueId}').style.display = document.getElementById('${uniqueId}').style.display === 'block' ? 'none' : 'block'">
                                    <div><b style="color:#38bdf8;">👤 ${row.user}</b> <span style="font-size:12px; color:#64748b; margin-left:10px;">🕒 ${row.timeStr}</span></div>
                                    <span style="font-size:12px; color:#FFD700;">▼ Chi tiết</span>
                                </div>
                                <div class="rp-detail" id="${uniqueId}">
                                    <div style="margin-bottom:10px;"><b>📄 Phát Tờ Rơi:</b> ${row.slToRoi} tờ</div>
                                    ${renderImgGrid(row.imgToRoi)}
                                    
                                    <div style="margin:15px 0 10px;"><b>🌐 Đăng Bài:</b> ${row.linkDB ? `<a href="${row.linkDB}" target="_blank" class="rp-link">${row.linkDB}</a>` : 'Không có link'}</div>
                                    ${renderImgGrid(row.imgDB)}
                                    
                                    <div style="margin:15px 0 10px;"><b>🎥 Livestream:</b> ${row.linkLive ? `<a href="${row.linkLive}" target="_blank" class="rp-link">${row.linkLive}</a>` : 'Không có link'}</div>
                                    ${renderImgGrid(row.imgLive)}
                                    
                                    <div style="margin-top:15px; text-align:right;"><a href="${row.rootLink}" target="_blank" style="color:#10b981; font-size:12px; text-decoration:none;">📁 Mở Thư mục Drive ➡</a></div>
                                </div>
                            </div>
                        `;
                    });
                    html += `</div></div>`; 
                }
                $('stat-list-container').innerHTML = html;
            };

        } else {
            // ==========================================
            // LUỒNG NHÂN VIÊN
            // ==========================================
            if (EMP_SESSION && EMP_SESSION.user) { switchSc('sc-report'); $('lbl-emp-name').innerText = `👤 ${EMP_SESSION.user}`; } 
            else { switchSc('sc-login'); }

            $('btn-nv-login').onclick = async () => {
                let s = $('inp-login-shop').value.trim(), u = $('inp-login-user').value.trim(), p = $('inp-login-pass').value.trim();
                if(!s || !u || !p) return alert("Nhập đủ thông tin!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang kiểm tra tài khoản...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "login_employee", empShop: s, empUser: u, empPass: p }) });
                    let data = JSON.parse(res);
                    if(data.status === 'success') {
                        EMP_SESSION = { user: u, shop: s, folderId: data.folderId, sheetId: data.sheetId };
                        localStorage.setItem('bc_emp_session', JSON.stringify(EMP_SESSION));
                        $('lbl-emp-name').innerText = `👤 ${u}`; switchSc('sc-report');
                    } else alert("❌ Lỗi: " + data.message);
                } catch(e) { alert("❌ Lỗi máy chủ!"); }
                $('bc-loading').style.display = 'none';
            };

            $('btn-nv-logout').onclick = () => { localStorage.removeItem('bc_emp_session'); EMP_SESSION = null; switchSc('sc-login'); };

            $('btn-submit-report').onclick = async () => {
                if(!EMP_SESSION || !EMP_SESSION.folderId || !EMP_SESSION.sheetId) return alert("❌ Quản lý chưa cài Thư mục/Sheet. Hãy báo lại QL!");
                $('bc-loading').style.display = 'flex';
                try {
                    $('bc-load-text').innerText = "Đang nén hình ảnh...";
                    const[imgToRoi, imgDangBai, imgLive] = await Promise.all([ processImages($('file-toroi').files), processImages($('file-dangbai').files), processImages($('file-live').files) ]);
                    
                    $('bc-load-text').innerText = "Đang đẩy dữ liệu lên hệ thống...";
                    const payload = {
                        action: 'submit_report', user: EMP_SESSION.user, folderId: EMP_SESSION.folderId, sheetId: EMP_SESSION.sheetId,
                        data: {
                            phatToRoi: { quantity: $('inp-toroi-sl').value, images: imgToRoi },
                            dangBai: { link: $('inp-dangbai-link').value, images: imgDangBai },
                            livestream: { link: $('inp-live-link').value, images: imgLive }
                        }
                    };
                    const response = await universalFetch({ method: "POST", url: API_URL_REPORT, data: JSON.stringify(payload), headers: { "Content-Type": "application/x-www-form-urlencoded" }});
                    
                    if(JSON.parse(response).status === 'success') {
                        alert("✅ Gửi báo cáo thành công!"); 
                        
                        let textInputs =['inp-toroi-sl', 'inp-dangbai-link', 'inp-live-link', 'file-toroi', 'file-dangbai', 'file-live'];
                        textInputs.forEach(id => { if($(id)) $(id).value = ''; });
                        let prevBoxes =['prev-toroi', 'prev-dangbai', 'prev-live'];
                        prevBoxes.forEach(id => { if($(id)) $(id).innerHTML = ''; });

                        app.style.display = 'none';
                    } else alert("❌ Lỗi Server!");
                } catch (err) { alert("❌ Lỗi mạng. Không thể gửi lúc này!"); } 
                finally { $('bc-loading').style.display = 'none'; }
            };
        }
    };

    return { name: "Báo Cáo TT", icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>`, bgColor: "#0284c7", action: runTool };
})
