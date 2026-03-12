((context) => {
    const { UI, UTILS, CONSTANTS } = context;
    const GM_xmlhttpRequest = typeof context.GM_xmlhttpRequest !== 'undefined' ? context.GM_xmlhttpRequest : window.GM_xmlhttpRequest;

    const universalFetch = async (options) => { /* Giữ nguyên hàm fetch mày đang dùng */ 
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

    // ==========================================
    // CẤU HÌNH API
    // ==========================================
    const API_URL_MAIN = "https://script.google.com/macros/s/AKfycbxDRSg1JDNTyuYf2TSQovNIWhFk3ls9hPXxtRSMu6xI0oNjql53nJo0G1H5k1b2iq_3/exec"; // Xử lý đăng nhập, lấy lưu config cột J,K,L
    const API_URL_REPORT = "https://script.google.com/macros/s/AKfycbz7Hv3FHg_XiA4g-ujO8bXkLSohxzB2HJvzsOuKZbkGdr-E33vwRJB4Etl-eCtKh5Xr/exec"; // Xử lý tạo folder, up ảnh (Code ở Bước 1)

    // Trạng thái user
    let IS_MWG_USER = context.AUTH_STATE && context.AUTH_STATE.isAuthorized && context.AUTH_STATE.userName !== "---";
    let CURRENT_USER = IS_MWG_USER ? context.AUTH_STATE.userName : "";
    
    // Lưu trữ thông tin sau khi NV đăng nhập thành công
    let SESSION_DATA = { user: "", folderId: "", sheetId: "" };
    
    // State của quản lý
    let MANAGER_EMPLOYEES =[];

    // CSS gộp chung (Lược bỏ bớt để ngắn gọn, mày lấy CSS cũ ốp vào thêm nhé)
    const MY_CSS = `
        #bc-app-wrapper { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.95); backdrop-filter:blur(10px); z-index:2147483647; font-family:'Segoe UI'; color:#fff; overflow-y:auto;}
        .bc-screen { display:none; max-width: 800px; margin: 40px auto; padding: 20px; animation: fadeIn 0.3s ease-out; }
        .bc-screen.active { display:block; }
        .bc-card { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin-bottom: 20px; }
        .bc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; margin-bottom:15px; outline:none;}
        .bc-btn { width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border:none; color:#fff; transition:0.2s;}
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .btn-success { background: linear-gradient(135deg, #10b981, #047857); }
        .btn-danger { background: #ef4444; padding:5px 10px; border-radius:4px;}
        .employee-row { display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px; align-items:center;}
        .warning-text { color:#fbbf24; font-size:13px; margin-bottom:15px; background:rgba(251,191,36,0.1); padding:10px; border-radius:8px;}
        @keyframes fadeIn { from {opacity:0} to {opacity:1} }
    `;

    // Hàm nén ảnh (giữ nguyên của m)
    const processImages = async (files) => { /* ... Giữ nguyên như tao đã viết lần trước ... */ return[]; };

    const runTool = () => {
        if (document.getElementById('bc-app-wrapper')) { document.getElementById('bc-app-wrapper').style.display = 'block'; return; }

        const app = document.createElement('div'); app.id = 'bc-app-wrapper';
        app.innerHTML = `
            <!-- SCREEN 1: QUẢN LÝ (Chỉ hiện khi IS_MWG_USER = true) -->
            <div class="bc-screen" id="sc-manager">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <h2 style="color:#FFD700;">⚙️ QUẢN LÝ HỆ THỐNG BÁO CÁO</h2>
                    <button class="bc-btn btn-danger" style="width:auto;" id="btn-close-mgr">Đóng</button>
                </div>
                
                <div class="bc-card">
                    <h3 style="margin-bottom:15px;">1. Cấu hình Lưu trữ</h3>
                    <div class="warning-text">⚠️ <b>LƯU Ý QUAN TRỌNG:</b> Folder và Sheet bạn tạo ra PHẢI bật chia sẻ "Bất kỳ ai có liên kết đều có thể chỉnh sửa" thì hệ thống mới đẩy ảnh lên được.</div>
                    <label>ID Thư mục Google Drive (Cột J):</label>
                    <input type="text" id="inp-folder-id" class="bc-input" placeholder="VD: 1A2b3C4d5E...">
                    
                    <label>ID Google Sheet (Cột K):</label>
                    <input type="text" id="inp-sheet-id" class="bc-input" placeholder="VD: 1xYz_789abc...">
                </div>

                <div class="bc-card">
                    <h3 style="margin-bottom:15px;">2. Danh sách Nhân viên (Cột L)</h3>
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
                <div class="bc-card" style="max-width:400px; margin: 100px auto;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <h2 style="color:#38bdf8;">ĐĂNG NHẬP BÁO CÁO</h2>
                        <p style="color:#94a3b8; font-size:13px;">Dành cho nhân viên</p>
                    </div>
                    <!-- Yêu cầu nhập mã Quản lý để code biết dòng nào ở Script gốc mà lấy Cột J,K,L -->
                    <input type="text" id="inp-login-manager" class="bc-input" placeholder="User của Quản Lý (Người tạo tài khoản)">
                    <input type="text" id="inp-login-user" class="bc-input" placeholder="Tên User của bạn">
                    <input type="password" id="inp-login-pass" class="bc-input" placeholder="Mật khẩu">
                    <button class="bc-btn btn-primary" id="btn-nv-login">ĐĂNG NHẬP</button>
                    <button class="bc-btn btn-danger" style="margin-top:15px; background:transparent; border:1px solid #ef4444" id="btn-close-login">Hủy</button>
                </div>
            </div>

            <!-- SCREEN 3: FORM BÁO CÁO (Giống bản trước tao viết cho m) -->
            <div class="bc-screen" id="sc-report">
                <!-- Nội dung Form HTML báo cáo: Phát tờ rơi, Link bài, Livestream (Bê code cũ vào đây) -->
                <!-- Nhớ thêm id="btn-close-report" cho nút X -->
                <h2>BÁO CÁO TRUYỀN THÔNG</h2>
                <div class="bc-card">... (HTML Form báo cáo) ...</div>
                <button class="bc-btn btn-primary" id="btn-submit-report">🚀 GỬI BÁO CÁO</button>
            </div>
        `;
        document.body.appendChild(app);
        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
        const $ = (id) => document.getElementById(id);
        const switchSc = (id) => { document.querySelectorAll('.bc-screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

        // Nút Đóng App
        $('btn-close-mgr').onclick = () => app.style.display = 'none';
        $('btn-close-login').onclick = () => app.style.display = 'none';

        // ==========================================
        // LOGIC DÀNH CHO QUẢN LÝ
        // ==========================================
        if (IS_MWG_USER) {
            switchSc('sc-manager');
            
            // 1. Lấy dữ liệu cũ từ Script gốc
            const loadConfig = async () => {
                try {
                    // Giả định API gốc của m nhận action get_config_manager
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({action:"get_config_manager", user: CURRENT_USER})});
                    let data = JSON.parse(res);
                    if(data.status === 'success') {
                        $('inp-folder-id').value = data.folderId || "";
                        $('inp-sheet-id').value = data.sheetId || "";
                        MANAGER_EMPLOYEES = data.employees ? JSON.parse(data.employees) :[];
                        renderNV();
                    }
                } catch(e) { console.log(e); }
            };
            loadConfig();

            // 2. Render danh sách NV
            const renderNV = () => {
                $('nv-list-container').innerHTML = MANAGER_EMPLOYEES.map((nv, idx) => `
                    <div class="employee-row">
                        <span>👤 ${nv.u} (Pass: ${nv.p})</span>
                        <button class="bc-btn btn-danger" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('delNV', {detail:${idx}}))">Xóa</button>
                    </div>
                `).join('');
            };

            app.addEventListener('delNV', (e) => { MANAGER_EMPLOYEES.splice(e.detail, 1); renderNV(); });

            $('btn-add-nv').onclick = () => {
                let u = $('inp-nv-user').value.trim(), p = $('inp-nv-pass').value.trim();
                if(!u || !p) return alert("Nhập đủ user và mật khẩu!");
                if(MANAGER_EMPLOYEES.some(x => x.u === u)) return alert("User này đã tồn tại!");
                MANAGER_EMPLOYEES.push({u, p}); renderNV();
                $('inp-nv-user').value = ''; $('inp-nv-pass').value = '';
            };

            // 3. Lưu lên Script Gốc
            $('btn-save-config').onclick = async () => {
                let fId = $('inp-folder-id').value.trim(), sId = $('inp-sheet-id').value.trim();
                if(!fId || !sId) return alert("Vui lòng nhập ID Folder và ID Sheet!");
                $('btn-save-config').innerText = "⏳ Đang lưu...";
                
                try {
                    await universalFetch({ 
                        method:"POST", url: API_URL_MAIN, 
                        // Payload gửi lên Script gốc để lưu vào J, K, L
                        data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: fId, sheetId: sId, employees: JSON.stringify(MANAGER_EMPLOYEES) })
                    });
                    alert("✅ Đã lưu cấu hình thành công!");
                } catch(e) { alert("❌ Lỗi mạng!"); }
                $('btn-save-config').innerText = "💾 LƯU CẤU HÌNH LÊN HỆ THỐNG";
            };

        } else {
        // ==========================================
        // LOGIC DÀNH CHO NHÂN VIÊN
        // ==========================================
            switchSc('sc-login');

            $('btn-nv-login').onclick = async () => {
                let mgr = $('inp-login-manager').value.trim(), u = $('inp-login-user').value.trim(), p = $('inp-login-pass').value.trim();
                if(!mgr || !u || !p) return alert("Nhập đủ thông tin!");
                $('btn-nv-login').innerText = "⏳ Đang kiểm tra...";

                try {
                    // Gọi sang Script gốc yêu cầu dò tìm
                    let res = await universalFetch({
                        method:"POST", url: API_URL_MAIN,
                        data: JSON.stringify({ action: "login_employee", managerUser: mgr, empUser: u, empPass: p })
                    });
                    let data = JSON.parse(res);

                    if(data.status === 'success') {
                        SESSION_DATA = { user: u, folderId: data.folderId, sheetId: data.sheetId };
                        alert(`✅ Đăng nhập thành công! Chào ${u}`);
                        switchSc('sc-report'); // Mở form báo cáo
                    } else {
                        alert("❌ Sai tài khoản, mật khẩu hoặc Quản lý chưa cấp quyền!");
                    }
                } catch(e) { alert("Lỗi kết nối"); }
                $('btn-nv-login').innerText = "ĐĂNG NHẬP";
            };

            // Form Submit Báo cáo (Gửi qua API Báo Cáo, KÈM ID CỦA QUẢN LÝ)
            // Lấy logic cũ nhét vào đây, lưu ý đoạn payload gửi đi:
            /*
                const payload = {
                    action: 'submit_report',
                    user: SESSION_DATA.user,
                    folderId: SESSION_DATA.folderId, // Bắn ID động của QL lên
                    sheetId: SESSION_DATA.sheetId,   // Bắn ID động của QL lên
                    data: { ... }
                };
            */
        }
    };

    return { name: "Báo Cáo TT", bgColor: "#0284c7", action: runTool };
})
