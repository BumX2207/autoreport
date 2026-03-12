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
    // 1. CẤU HÌNH LINK API & BIẾN STATE (FIX NHẬN DIỆN QUẢN LÝ)
    // ===============================================================
    const API_URL_MAIN = "https://script.google.com/macros/s/AKfycbxDRSg1JDNTyuYf2TSQovNIWhFk3ls9hPXxtRSMu6xI0oNjql53nJo0G1H5k1b2iq_3/exec";   
    const API_URL_REPORT = "https://script.google.com/macros/s/AKfycbz7Hv3FHg_XiA4g-ujO8bXkLSohxzB2HJvzsOuKZbkGdr-E33vwRJB4Etl-eCtKh5Xr/exec"; 

    // Lấy User đang đăng nhập ở Hệ thống (Bất kể từ hệ thống ERP nội bộ hay web ngoài)
    let SYSTEM_USER = "---";
    if (context.AUTH_STATE && context.AUTH_STATE.isAuthorized && context.AUTH_STATE.userName && context.AUTH_STATE.userName !== "---") {
        SYSTEM_USER = context.AUTH_STATE.userName; // User Nội bộ
    } else {
        let savedGuest = localStorage.getItem('tgdd_guest_account');
        if (savedGuest) {
            SYSTEM_USER = JSON.parse(savedGuest).user || "---"; // User Tự đăng ký
        }
    }

    // 💡 SỬ DỤNG REGEX ĐỂ PHÂN BIỆT QUẢN LÝ DỰA VÀO CÚ PHÁP: "Số - Tên"
    const managerRegex = /^\d+\s*-\s*.+$/;
    let IS_MANAGER = managerRegex.test(SYSTEM_USER);
    let CURRENT_USER = IS_MANAGER ? SYSTEM_USER : "";
    
    // Phiên đăng nhập riêng của Nhân viên Báo Cáo
    let EMP_SESSION = JSON.parse(localStorage.getItem('bc_emp_session') || "null");
    let MANAGER_EMPLOYEES =[];

    // ... (Phần 2 và Phần 3 mày giữ nguyên) ...
    // ===============================================================
    // 2. CSS GIAO DIỆN CHUNG
    // ===============================================================
    const MY_CSS = `
        #bc-app-wrapper { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.95); backdrop-filter:blur(10px); z-index:2147483647; font-family: 'Segoe UI', sans-serif; overflow-y:auto; color: #f8fafc; }
        #bc-app-wrapper * { box-sizing:border-box; }
        
        .bc-screen { display:none; max-width: 800px; margin: 40px auto; padding: 20px; animation: fadeIn 0.3s ease-out; }
        .bc-screen.active { display:block; }

        .bc-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px; }
        .bc-title { font-size: 24px; font-weight: bold; color: #38bdf8; }
        .bc-close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; transition: 0.2s; font-size: 16px; }
        .bc-close-btn:hover { background: #ef4444; }

        .bc-card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .bc-sec-title { font-size: 18px; font-weight: 600; color: #FFD700; margin-bottom: 15px; }
        
        .bc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; margin-bottom:15px; outline:none; transition:0.2s; }
        .bc-input:focus { border-color: #38bdf8; }
        .bc-label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }

        .bc-btn { width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border:none; color:#fff; transition:0.2s; }
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .btn-primary:hover { background: linear-gradient(135deg, #0369a1, #075985); }
        .btn-success { background: linear-gradient(135deg, #10b981, #047857); }
        .btn-danger { background: #ef4444; }

        /* File Upload */
        .bc-file-upload { position: relative; display: inline-block; width: 100%; margin-bottom:15px; }
        .bc-file-input { display: none; }
        .bc-file-label { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 15px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; color: #94a3b8; background: rgba(255,255,255,0.02); }
        .bc-preview-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
        .bc-preview-item { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2); }

        /* Loader */
        #bc-loading { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; flex-direction:column; color:#fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #38bdf8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        
        .employee-row { display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px; align-items:center; }
        .warning-text { color:#fbbf24; font-size:13px; margin-bottom:15px; background:rgba(251,191,36,0.1); padding:10px; border-radius:8px; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;

    // ===============================================================
    // 3. HÀM NÉN ẢNH VÀ CHUYỂN BASE64
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
                        let max_size = 1000; 
                        let width = img.width, height = img.height;
                        if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } } 
                        else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                        canvas.width = width; canvas.height = height;
                        let ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7)); 
                    };
                };
            });
            base64Array.push(base64);
        }
        return base64Array;
    };

    // ===============================================================
    // 4. MAIN LOGIC (CHẠY KHI MỞ TOOL)
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
                <h3 id="bc-load-text">Đang tải dữ liệu...</h3>
            </div>

            <!-- SCREEN 1: QUẢN LÝ (Chỉ hiện khi IS_MWG_USER = true) -->
            <div class="bc-screen" id="sc-manager">
                <div class="bc-header">
                    <div class="bc-title">⚙️ CẤU HÌNH BÁO CÁO</div>
                    <div>
                        <span style="color:#94a3b8; font-size:14px; margin-right:15px;">🏢 Quản lý: ${CURRENT_USER}</span>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>
                
                <div class="bc-card">
                    <h3 class="bc-sec-title">1. Cấu hình Lưu trữ</h3>
                    <div class="warning-text">⚠️ <b>LƯU Ý QUAN TRỌNG:</b> Thư mục và File Sheet bạn tạo ra PHẢI bật chia sẻ "Bất kỳ ai có liên kết đều có thể chỉnh sửa".</div>
                    <label class="bc-label">ID Thư mục Google Drive (Chứa ảnh):</label>
                    <input type="text" id="inp-folder-id" class="bc-input" placeholder="VD: 1A2b3C4d5E...">
                    
                    <label class="bc-label">ID Google Sheet (Lưu báo cáo):</label>
                    <input type="text" id="inp-sheet-id" class="bc-input" placeholder="VD: 1xYz_789abc...">
                </div>

                <div class="bc-card">
                    <h3 class="bc-sec-title">2. Danh sách Nhân viên</h3>
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <input type="text" id="inp-nv-user" class="bc-input" style="margin:0;" placeholder="Tên User (VD: nv_01)">
                        <input type="text" id="inp-nv-pass" class="bc-input" style="margin:0;" placeholder="Mật khẩu">
                        <button class="bc-btn btn-success" id="btn-add-nv" style="width:120px;">+ Thêm</button>
                    </div>
                    <div id="nv-list-container"></div>
                </div>

                <button class="bc-btn btn-primary" id="btn-save-config">💾 LƯU CẤU HÌNH LÊN HỆ THỐNG</button>
            </div>

            <!-- SCREEN 2: ĐĂNG NHẬP NHÂN VIÊN (Khi IS_MWG_USER = false) -->
            <div class="bc-screen" id="sc-login">
                <div class="bc-header" style="justify-content:flex-end; border:none;">
                    <button class="bc-close-btn btn-close-app">✕</button>
                </div>
                <div class="bc-card" style="max-width:400px; margin: 50px auto; text-align:center;">
                    <h2 style="color:#38bdf8; margin-bottom:5px;">ĐĂNG NHẬP BÁO CÁO</h2>
                    <p style="color:#94a3b8; font-size:13px; margin-bottom:20px;">Dành cho nhân viên</p>
                    
                    <!-- Đã bỏ ô inp-login-manager -->
                    <input type="text" id="inp-login-user" class="bc-input" placeholder="Tên User của bạn">
                    <input type="password" id="inp-login-pass" class="bc-input" placeholder="Mật khẩu">
                    
                    <button class="bc-btn btn-primary" id="btn-nv-login">VÀO BÁO CÁO</button>
                </div>
            </div>

            <!-- SCREEN 3: FORM BÁO CÁO (Dành cho nhân viên) -->
            <div class="bc-screen" id="sc-report">
                <div class="bc-header">
                    <div class="bc-title">📊 BÁO CÁO CÔNG VIỆC</div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span style="color:#94a3b8; font-size:13px;" id="lbl-emp-name">👤 ---</span>
                        <button class="bc-btn btn-danger" id="btn-nv-logout" style="padding:5px 10px; width:auto; font-size:12px;">Đăng xuất</button>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>

                <div class="bc-card">
                    <div class="bc-sec-title">📄 1. Phát Tờ Rơi</div>
                    <label class="bc-label">Số lượng tờ rơi đã phát</label>
                    <input type="number" id="inp-toroi-sl" class="bc-input" placeholder="Nhập số lượng..." min="0">
                    
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh minh chứng</label>
                        <label for="file-toroi" class="bc-file-label">📸 Nhấn để chọn nhiều ảnh</label>
                        <input type="file" id="file-toroi" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-toroi"></div>
                    </div>
                </div>

                <div class="bc-card">
                    <div class="bc-sec-title">🌐 2. Đăng Bài Truyền Thông</div>
                    <label class="bc-label">Link bài đăng</label>
                    <input type="text" id="inp-dangbai-link" class="bc-input" placeholder="Dán link bài đăng vào đây...">
                    
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh bài đăng</label>
                        <label for="file-dangbai" class="bc-file-label">📸 Nhấn để chọn nhiều ảnh</label>
                        <input type="file" id="file-dangbai" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-dangbai"></div>
                    </div>
                </div>

                <div class="bc-card">
                    <div class="bc-sec-title">🎥 3. Livestream</div>
                    <label class="bc-label">Link Livestream</label>
                    <input type="text" id="inp-live-link" class="bc-input" placeholder="Dán link livestream vào đây...">
                    
                    <div class="bc-file-upload">
                        <label class="bc-label">Hình ảnh Livestream</label>
                        <label for="file-live" class="bc-file-label">📸 Nhấn để chọn nhiều ảnh</label>
                        <input type="file" id="file-live" class="bc-file-input" multiple accept="image/*">
                        <div class="bc-preview-grid" id="prev-live"></div>
                    </div>
                </div>

                <button class="bc-btn btn-primary" id="btn-submit-report" style="padding:15px; font-size:16px;">🚀 GỬI BÁO CÁO</button>
            </div>
        `;
        document.body.appendChild(app);

        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
        const $ = (id) => document.getElementById(id);
        const switchSc = (id) => { document.querySelectorAll('.bc-screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

        // Xử lý nút Đóng app
        document.querySelectorAll('.btn-close-app').forEach(btn => {
            btn.onclick = () => app.style.display = 'none';
        });

        // Xử lý Preview Ảnh
        const handlePreview = (inputId, previewId) => {
            $(inputId).addEventListener('change', (e) => {
                const previewContainer = $(previewId); previewContainer.innerHTML = '';
                if(e.target.files.length > 0) {
                    Array.from(e.target.files).forEach(file => {
                        previewContainer.innerHTML += `<img src="${URL.createObjectURL(file)}" class="bc-preview-item">`;
                    });
                }
            });
        };
        handlePreview('file-toroi', 'prev-toroi');
        handlePreview('file-dangbai', 'prev-dangbai');
        handlePreview('file-live', 'prev-live');

        // ==========================================
        // ĐIỀU HƯỚNG MÀN HÌNH CHÍNH
        // ==========================================
        if (IS_MANAGER) {
            switchSc('sc-manager');
            
            // Tải cấu hình từ Script Gốc
            const loadConfig = async () => {
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang tải cấu hình...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({action:"get_config_manager", user: CURRENT_USER})});
                    let data = JSON.parse(res);
                    if(data.status === 'success') {
                        $('inp-folder-id').value = data.folderId || "";
                        $('inp-sheet-id').value = data.sheetId || "";
                        MANAGER_EMPLOYEES = data.employees && data.employees !== "[]" ? JSON.parse(data.employees) :[];
                        renderNV();
                    }
                } catch(e) { console.log("Lỗi tải config quản lý", e); }
                $('bc-loading').style.display = 'none';
            };
            loadConfig();

            // Render DS Nhân viên
            const renderNV = () => {
                $('nv-list-container').innerHTML = MANAGER_EMPLOYEES.map((nv, idx) => `
                    <div class="employee-row">
                        <span>👤 ${nv.u} <span style="color:#94a3b8; font-size:12px;">(Pass: ${nv.p})</span></span>
                        <button class="bc-btn btn-danger" style="width:auto; padding:5px 10px;" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('delNV', {detail:${idx}}))">Xóa</button>
                    </div>
                `).join('');
            };
            app.addEventListener('delNV', (e) => { MANAGER_EMPLOYEES.splice(e.detail, 1); renderNV(); });

            $('btn-add-nv').onclick = () => {
                let u = $('inp-nv-user').value.trim(), p = $('inp-nv-pass').value.trim();
                if(!u || !p) return alert("Vui lòng nhập đủ User và Mật khẩu!");
                if(MANAGER_EMPLOYEES.some(x => x.u === u)) return alert("User này đã tồn tại!");
                MANAGER_EMPLOYEES.push({u, p}); renderNV();
                $('inp-nv-user').value = ''; $('inp-nv-pass').value = '';
            };

            // Lưu lên Script Gốc
            $('btn-save-config').onclick = async () => {
                let fId = $('inp-folder-id').value.trim(), sId = $('inp-sheet-id').value.trim();
                if(!fId || !sId) return alert("Vui lòng nhập đủ ID Folder và ID Sheet!");
                
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang lưu cấu hình...";
                try {
                    let res = await universalFetch({ 
                        method:"POST", url: API_URL_MAIN, 
                        data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: fId, sheetId: sId, employees: JSON.stringify(MANAGER_EMPLOYEES) })
                    });
                    if(JSON.parse(res).status === 'success') alert("✅ Đã lưu cấu hình thành công!");
                    else alert("❌ Lỗi lưu dữ liệu!");
                } catch(e) { alert("❌ Lỗi mạng!"); }
                $('bc-loading').style.display = 'none';
            };

        } else {
            // ---> LUỒNG NHÂN VIÊN (KHÁCH NGOÀI NETLIFY)
            
            // Nếu đã lưu phiên đăng nhập trước đó -> Vào thẳng Form báo cáo
            if (EMP_SESSION && EMP_SESSION.user) {
                switchSc('sc-report');
                $('lbl-emp-name').innerText = `👤 ${EMP_SESSION.user}`;
            } else {
                switchSc('sc-login'); // Nếu chưa thì mở Form Login
            }

            // Xử lý Đăng nhập NV
            $('btn-nv-login').onclick = async () => {
                let u = $('inp-login-user').value.trim(), p = $('inp-login-pass').value.trim();
                if(!u || !p) return alert("Vui lòng nhập đủ thông tin!");
                
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang kiểm tra tài khoản...";
                try {
                    let res = await universalFetch({
                        method:"POST", url: API_URL_MAIN,
                        // Chỉ gửi lên empUser và empPass
                        data: JSON.stringify({ action: "login_employee", empUser: u, empPass: p })
                    });
                    let data = JSON.parse(res);

                    if(data.status === 'success') {
                        EMP_SESSION = { user: u, folderId: data.folderId, sheetId: data.sheetId };
                        localStorage.setItem('bc_emp_session', JSON.stringify(EMP_SESSION)); // Lưu phiên
                        $('lbl-emp-name').innerText = `👤 ${u}`;
                        switchSc('sc-report');
                    } else {
                        alert("❌ Lỗi: " + data.message);
                    }
                } catch(e) { alert("❌ Lỗi kết nối máy chủ!"); }
                $('bc-loading').style.display = 'none';
            };

            // Nút Đăng xuất
            $('btn-nv-logout').onclick = () => {
                localStorage.removeItem('bc_emp_session');
                EMP_SESSION = null;
                switchSc('sc-login');
            };

            // Xử lý Submit Form Báo Cáo
            $('btn-submit-report').onclick = async () => {
                if(!EMP_SESSION || !EMP_SESSION.folderId || !EMP_SESSION.sheetId) {
                    alert("❌ Quản lý của bạn chưa cài đặt Thư mục hoặc Sheet lưu trữ. Hãy báo lại cho quản lý!");
                    return;
                }

                $('bc-loading').style.display = 'flex';
                
                try {
                    // 1. Nén ảnh
                    $('bc-load-text').innerText = "Đang xử lý và nén hình ảnh...";
                    const[imgToRoi, imgDangBai, imgLive] = await Promise.all([
                        processImages($('file-toroi').files), processImages($('file-dangbai').files), processImages($('file-live').files)
                    ]);

                    // 2. Gửi Data (Đẩy ID Folder và ID Sheet của quản lý lên)
                    $('bc-load-text').innerText = "Đang đẩy dữ liệu lên hệ thống...";
                    const payload = {
                        action: 'submit_report',
                        user: EMP_SESSION.user,
                        folderId: EMP_SESSION.folderId, 
                        sheetId: EMP_SESSION.sheetId,
                        data: {
                            phatToRoi: { quantity: $('inp-toroi-sl').value, images: imgToRoi },
                            dangBai: { link: $('inp-dangbai-link').value, images: imgDangBai },
                            livestream: { link: $('inp-live-link').value, images: imgLive }
                        }
                    };

                    const response = await universalFetch({
                        method: "POST", url: API_URL_REPORT,
                        data: JSON.stringify(payload),
                        headers: { "Content-Type": "application/x-www-form-urlencoded" }
                    });

                    const resJson = JSON.parse(response);
                    if(resJson.status === 'success') {
                        alert("✅ Gửi báo cáo thành công!");
                        app.style.display = 'none'; // Ẩn tool
                        // Xóa trắng form['inp-toroi-sl', 'inp-dangbai-link', 'inp-live-link', 'file-toroi', 'file-dangbai', 'file-live'].forEach(id => $(id).value = '');['prev-toroi', 'prev-dangbai', 'prev-live'].forEach(id => $(id).innerHTML = '');
                    } else {
                        alert("❌ Server báo lỗi: " + resJson.message);
                    }
                } catch (err) {
                    alert("❌ Lỗi mạng. Không thể gửi báo cáo lúc này!");
                } finally {
                    $('bc-loading').style.display = 'none';
                }
            };
        }
    };

    return {
        name: "Báo Cáo TT",
        icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>`,
        bgColor: "#0284c7", 
        action: runTool
    };
})
