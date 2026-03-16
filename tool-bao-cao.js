((context) => {
    const { UI, UTILS, CONSTANTS, DATA } = context;
    const GM_xmlhttpRequest = typeof context.GM_xmlhttpRequest !== 'undefined' ? context.GM_xmlhttpRequest : window.GM_xmlhttpRequest;
    const GM_getValue = typeof context.GM_getValue !== 'undefined' ? context.GM_getValue : window.GM_getValue;

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
        if (!rawStr) return { date: "N/A", time: "N/A", month: "N/A" };
        let str = String(rawStr).trim();
        let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/);
        if (match) {
            let dd = String(match[1]).padStart(2, '0');
            let mm = String(match[2]).padStart(2, '0');
            return { date: `${dd}/${mm}/${match[3]}`, month: `${mm}/${match[3]}`, time: `${String(match[4]).padStart(2, '0')}:${String(match[5]).padStart(2, '0')}` };
        }
        let d = new Date(str);
        if (!isNaN(d.getTime())) {
            let dd = String(d.getDate()).padStart(2, '0');
            let mm = String(d.getMonth() + 1).padStart(2, '0');
            return { date: `${dd}/${mm}/${d.getFullYear()}`, month: `${mm}/${d.getFullYear()}`, time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
        }
        return { date: "N/A", time: "N/A", month: "N/A" };
    };

    const getEmpDisplayName = (u) => {
        const emp = MANAGER_EMPLOYEES.find(x => x.u === u);
        return (emp && emp.fn) ? `${emp.fn} - ${u}` : u;
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

        .bc-tabs { display: flex; gap: 10px; padding:10px 20px; background: rgba(15, 23, 42, 0.5); flex-shrink:0; border-bottom:1px solid rgba(255,255,255,0.05); overflow-x: auto;}
        .bc-tab-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; background: rgba(0,0,0,0.2); color: #94a3b8; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap;}
        .bc-tab-btn.active { background: #38bdf8; color: #0f172a; }
        .bc-tab-content { display: none; flex-direction:column; flex:1; overflow:hidden;}
        .bc-tab-content.active { display: flex; animation: fadeIn 0.3s; }

        .stat-dash { display:flex; gap:10px; margin-bottom:10px; transition:0.2s; }
        .stat-dash:hover { transform: translateY(-2px); }
        .stat-box { flex:1; padding:15px; border-radius:8px; text-align:center; border: 1px solid transparent;}
        .sb-blue { background:rgba(56, 189, 248, 0.1); border-color:#38bdf8; }
        .sb-red { background:rgba(239, 68, 68, 0.1); border-color:#ef4444; }
        
        .emp-status-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px dashed rgba(255,255,255,0.05); }
        .emp-status-row:last-child { border-bottom: none; }
        .emp-name.reported { font-weight: bold; background: linear-gradient(45deg, #38bdf8, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .emp-name.pending { font-weight: bold; color: #ef4444; opacity: 0.9; }
        
        .date-group-wrapper { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .date-group-title { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 12px 20px; font-weight: bold; font-size: 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; gap: 10px; }
        .date-group-content { padding: 15px; }

        .rp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; transition: 0.2s; }
        .rp-card:hover { border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
        .rp-card:last-child { margin-bottom: 0; }
        .rp-header-row { display:flex; justify-content:space-between; align-items:center; cursor: pointer; }
        .rp-detail { display: none; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); font-size:13px; color:#cbd5e1;}
        
        .rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 5px; }
        .rp-grid.scroll-x { display: flex; overflow-x: auto; padding-bottom: 10px; scrollbar-width: thin; scrollbar-color: #38bdf8 rgba(255,255,255,0.1); }
        .rp-grid.scroll-x::-webkit-scrollbar { height: 6px; }
        .rp-grid.scroll-x::-webkit-scrollbar-thumb { background: #38bdf8; border-radius: 10px; }
        
        .rp-img-wrap { position:relative; width: 100%; height: 70px; transition: 0.2s; border-radius: 6px; flex-shrink: 0;}
        .rp-grid.scroll-x .rp-img-wrap { width: 80px; height: 80px; }
        .rp-img-wrap:hover { transform: scale(1.05); z-index:2;}
        .rp-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; cursor: zoom-in; border: 1px solid rgba(255,255,255,0.2); transition: 0.2s; display: block;}
        .rp-img-wrap:hover .rp-img { border-color:#FFD700; }

        .rp-img-dl { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.7); border-radius: 4px; padding: 4px; font-size: 12px; line-height: 1; cursor: pointer; opacity: 0; transition: 0.2s; z-index: 3; }
        .rp-img-wrap:hover .rp-img-dl { opacity: 1; }
        .rp-img-dl:hover { background: #38bdf8; color: #fff; }
        
        .rp-link { color:#38bdf8; text-decoration:none; word-break: break-all;}
        .rp-link:hover { text-decoration:underline;}
        .link-list { margin-top:5px; margin-left: 15px; font-size:12px; }
        .link-list li { margin-bottom: 5px; }

        .leaderboard { display: flex; gap: 10px; margin-bottom: 25px; }
        .lb-card { flex: 1; background: linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(0,0,0,0.2) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; text-align: center; }
        .lb-title { font-size: 11px; text-transform: uppercase; color: #FFD700; font-weight: bold; margin-bottom: 5px; }
        .lb-name { font-size: 15px; font-weight: bold; color: #fff; margin-bottom: 5px; }
        .lb-score { font-size: 13px; color: #38bdf8; font-weight: bold; }

        #bc-lightbox { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 2147483648; justify-content: center; align-items: center; flex-direction: column; }
        #bc-lb-img { max-width: 95vw; max-height: 85vh; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); object-fit:contain;}
        #bc-lb-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px; transition:0.2s;}
        #bc-lb-close:hover { background: #ef4444; }

        #bc-loading { display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483649; justify-content:center; align-items:center; flex-direction:column; color:#fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #38bdf8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        .employee-row { display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px; align-items:center; flex-wrap: wrap; gap: 10px;}
        
        .filter-row { display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
        .filter-row select { flex: 1; min-width: 100px; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; color: #fff; cursor: pointer; outline: none; }
        .filter-row select:focus { border-color: #38bdf8; }
        .filter-row button { flex-shrink: 0; padding: 10px 15px; border-radius: 8px; background: #0284c7; border: none; color: white; font-size: 16px; cursor: pointer; transition: 0.2s; }
        .filter-row button:hover { background: #0369a1; transform: scale(1.05); }

        /* Khóa cứng Dropdown nhân viên trong bảng NLNV */
        #emp-nlnv-container * { color: #000; }
        #emp-nlnv-container .nlnv-staff-select, 
        #emp-nlnv-container #nlnv-daily-staff-selector { pointer-events: none !important; appearance: none !important; -webkit-appearance: none !important; background: transparent; border: none; font-weight: bold; color: #0070C0; text-align: center; }

        /* RESPONSIVE CHO HEADER VÀ LƯỚI NHẬP LIỆU */
        @media (max-width: 600px) {
            #emp-header { flex-wrap: wrap; flex-direction: column; align-items: flex-start; gap: 10px; padding-bottom: 15px;}
            #emp-header .bc-title { width: 100%; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px; }
            #emp-header .bc-header-right { width: 100%; justify-content: flex-end; margin-left: 0; }
            .emp-display-name { flex: 1; text-align: left; }
            .bc-tabs { flex-wrap: wrap; }
        }
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
            
            <div id="bc-lightbox"><button id="bc-lb-close">✕</button><img id="bc-lb-img" src=""></div>

            <!-- SCREEN 1: QUẢN LÝ -->
            <div class="bc-screen" id="sc-manager">
                <div class="bc-header">
                    <div class="bc-title">⚙️ QUẢN LÝ DASHBOARD</div>
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
                    <div class="bc-screen-body" style="padding-top: 10px;">
                        <div id="stat-summary-container"></div>
                        <div class="filter-row">
                            <select id="stat-month-filter" title="Chọn Tháng"></select>
                            <select id="stat-date-filter" title="Chọn Ngày"></select>
                            <select id="stat-emp-filter" title="Chọn Nhân viên"></select>
                            <button id="btn-refresh-stat" title="Load lại dữ liệu">🔄</button>
                        </div>
                        <div id="stat-list-container"></div>
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
                            <h3 class="bc-sec-title">2. Khai báo Nhân viên</h3>
                            <!-- LƯỚI KHAI BÁO 7 CỘT (CÓ THÊM DOB, ROLE, GROUP) -->
                            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                                <input type="text" id="inp-nv-shop" class="bc-input" style="margin:0; flex:1; min-width:80px;" placeholder="Mã Shop">
                                <input type="text" id="inp-nv-user" class="bc-input" style="margin:0; flex:1; min-width:80px;" placeholder="User">
                                <input type="text" id="inp-nv-fn" class="bc-input" style="margin:0; flex:2; min-width:140px;" placeholder="Họ và Tên">
                                <input type="text" id="inp-nv-dob" class="bc-input" style="margin:0; flex:1.5; min-width:120px;" placeholder="Ngày sinh (dd/mm/yyyy)">
                                <input type="text" id="inp-nv-pass" class="bc-input" style="margin:0; flex:1.5; min-width:100px;" placeholder="Mật khẩu">
                                <select id="inp-nv-role" class="bc-input" style="margin:0; flex:0.8; min-width:70px; padding:12px;"><option value="NV">NV</option><option value="PG">PG</option></select>
                                <input type="text" id="inp-nv-grp" class="bc-input" style="margin:0; flex:1.5; min-width:100px;" placeholder="Nhóm (Tự chọn)">
                                <button class="bc-btn btn-success" id="btn-add-nv" style="width:100%; flex-shrink:0; margin-top:5px;">+ Thêm Nhân Viên</button>
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
                    <h2 style="color:#38bdf8; margin-bottom:5px;">ĐĂNG NHẬP TÀI KHOẢN TRUYỀN THÔNG</h2>
                    <p style="color:#94a3b8; font-size:13px; margin-bottom:25px;">Hệ thống Báo cáo Truyền thông</p>
                    <input type="text" id="inp-login-shop" class="bc-input" placeholder="Mã Shop của bạn">
                    <input type="text" id="inp-login-user" class="bc-input" placeholder="Username QL khai báo cho bạn">
                    <input type="password" id="inp-login-pass" class="bc-input" placeholder="Mật khẩu QL khai báo cho bạn">
                    <button class="bc-btn btn-primary" id="btn-nv-login">VÀO BÁO CÁO</button>
                </div>
            </div>

            <!-- SCREEN 3: FORM BÁO CÁO NHÂN VIÊN -->
            <div class="bc-screen" id="sc-report">
                <div class="bc-header" id="emp-header">
                    <div class="bc-title">📊 BÁO CÁO</div>
                    <div class="bc-header-right">
                        <span class="emp-display-name" style="color:#94a3b8; font-size:14px; font-weight:600;" id="lbl-emp-name">👤 ---</span>
                        <button class="bc-btn btn-danger" id="btn-nv-logout" style="padding:5px 10px; width:auto; font-size:12px;">Thoát</button>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>

                <div class="bc-tabs">
                    <button class="bc-tab-btn active" id="tab-btn-emp-form">📝 Gửi Báo Cáo</button>
                    <button class="bc-tab-btn" id="tab-btn-emp-history">🕒 Lịch Sử</button>
                    <button class="bc-tab-btn" id="tab-btn-emp-personal" style="display:none; background: linear-gradient(135deg, #FFD700, #F59E0B); color:#0f172a;">👤 Cá nhân</button>
                </div>

                <div class="bc-tab-content active" id="tab-emp-form">
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

                <div class="bc-tab-content" id="tab-emp-history">
                    <div class="bc-screen-body">
                        <div style="text-align:right; margin-bottom: 15px;">
                            <button id="btn-refresh-emp-history" class="bc-btn btn-primary" style="width:auto; padding:8px 15px; font-size:13px;">🔄 Load lại lịch sử</button>
                        </div>
                        <div id="emp-history-container"></div>
                    </div>
                </div>

                <!-- TÍNH NĂNG CÁ NHÂN MỚI (BẢNG NLNV CỦA BI 8.3) -->
                <div class="bc-tab-content" id="tab-emp-personal">
                    <div class="bc-screen-body">
                        <div class="filter-row" style="justify-content: center; margin-bottom: 20px;">
                            <select id="emp-nlnv-view-select" style="max-width: 250px; font-weight: bold; text-align: center; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8;">
                                <option value="overview">Bảng Tổng Quan</option>
                                <option value="daily">Bảng Hàng Ngày</option>
                            </select>
                        </div>
                        <!-- Bọc nền trắng để bảng BI không bị lỗi màu đen -->
                        <div style="background:#fff; border-radius:8px; overflow-x:auto; padding:10px;">
                            <div id="emp-nlnv-container"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(app);

        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
        const $ = (id) => document.getElementById(id);
        const switchSc = (id) => { document.querySelectorAll('.bc-screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

        document.querySelectorAll('.btn-close-app').forEach(btn => btn.onclick = () => app.style.display = 'none');

        const fallbackDownload = (url, filename) => {
            fetch(url).then(r => r.blob()).then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }).catch(e => {
                console.log('Fetch blocked by CORS, opening in new tab...', e);
                window.open(url, '_blank');
            });
        };

        const executeDownload = (url, filename) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: "GET", url: url, responseType: "blob",
                    onload: (res) => {
                        if(res.status >= 200 && res.status < 300) {
                            const blob = res.response;
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = blobUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                        } else {
                            fallbackDownload(url, filename);
                        }
                    },
                    onerror: () => fallbackDownload(url, filename)
                });
            } else {
                fallbackDownload(url, filename);
            }
        };

        app.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('rp-img')) {
                e.stopPropagation();
                $('bc-lb-img').src = e.target.getAttribute('src');
                $('bc-lightbox').style.display = 'flex';
            }
            else if (e.target && e.target.id === 'bc-lb-close') {
                $('bc-lightbox').style.display = 'none';
            }
            else if (e.target && e.target.classList.contains('btn-dl-single')) {
                e.stopPropagation();
                let url = e.target.getAttribute('data-url');
                let filename = e.target.getAttribute('data-filename');
                executeDownload(url, filename);
            }
            else if (e.target && e.target.classList.contains('btn-dl-all')) {
                e.stopPropagation();
                let linksStr = e.target.getAttribute('data-links');
                let prefix = e.target.getAttribute('data-prefix');
                let links =[];
                try { links = JSON.parse(linksStr); } catch(err) { console.error("Lỗi parse JSON link", err); }
                
                if (links.length > 0) {
                    if(!confirm(`Bắt đầu tải về ${links.length} ảnh?\n(Lưu ý: Trình duyệt có thể hỏi quyền, hãy chọn "Allow/Cho phép Tải xuống nhiều tệp" nhé!)`)) return;
                    
                    links.forEach((l, idx) => {
                        let match = l.match(/id=([a-zA-Z0-9_-]+)/);
                        let imgUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : l;
                        setTimeout(() => {
                            executeDownload(imgUrl, `${prefix}_${idx + 1}.jpg`);
                        }, idx * 400); 
                    });
                }
            }
        });

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
                        if(MANAGER_SHEET_ID) {
                            await loadStatistics(); 
                        } else {
                            $('stat-list-container').innerHTML = `<div style="text-align:center; color:#fbbf24; padding:20px;">Vui lòng cài đặt ID Sheet ở tab Cài Đặt trước!</div>`;
                        }
                    }
                } catch(e) { $('stat-list-container').innerHTML = `<div style="color:#ef4444; text-align:center;">Lỗi mạng! Không tải được cấu hình.</div>`; }
                $('bc-loading').style.display = 'none';
            };
            loadConfig();

            $('btn-refresh-stat').onclick = async () => {
                if(!MANAGER_SHEET_ID) return alert("Vui lòng cài đặt ID Sheet trước!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang làm mới dữ liệu...";
                await loadStatistics();
                $('bc-loading').style.display = 'none';
            };

            const renderNV = () => {
                $('nv-list-container').innerHTML = MANAGER_EMPLOYEES.map((nv, idx) => `
                    <div class="employee-row">
                        <span style="flex:1;">
                            🏬 ${nv.s || 'N/A'} - 👤 ${nv.fn ? nv.fn + ' - ' : ''}${nv.u} <br>
                            <span style="color:#94a3b8; font-size:12px;">(Pass: ${nv.p} | Vai trò: <b style="color:#FFD700">${nv.role || 'NV'}</b> | NS: ${nv.dob || '---'} | Nhóm: ${nv.grp || '---'})</span>
                        </span>
                        <button class="bc-btn btn-danger" style="width:auto; padding:5px 10px; flex-shrink:0;" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('delNV', {detail:${idx}}))">Xóa</button>
                    </div>
                `).join('');
            };
            app.addEventListener('delNV', (e) => { MANAGER_EMPLOYEES.splice(e.detail, 1); renderNV(); });
            
            // XỬ LÝ NÚT THÊM NHÂN VIÊN VỚI 7 TRƯỜNG DỮ LIỆU
            $('btn-add-nv').onclick = () => {
                let s = $('inp-nv-shop').value.trim();
                let u = $('inp-nv-user').value.trim();
                let fn = $('inp-nv-fn').value.trim();
                let dob = $('inp-nv-dob').value.trim();
                let p = $('inp-nv-pass').value.trim();
                let role = $('inp-nv-role').value;
                let grp = $('inp-nv-grp').value.trim();

                if(!s || !u || !fn || !p) return alert("Vui lòng nhập đủ Mã Shop, User, Họ Tên và Mật khẩu!");
                
                if (!/^\d+$/.test(s)) return alert("Mã Shop chỉ được nhập số!");
                
                if (!/^[\p{L}\s]+$/u.test(fn)) {
                    return alert("Họ và tên chỉ được chứa chữ cái và khoảng trắng!");
                }

                if (dob && !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(dob)) {
                    return alert("Ngày sinh phải theo định dạng dd/mm/yyyy (Ví dụ: 05/09/1998)!");
                }

                if(MANAGER_EMPLOYEES.some(x => x.s === s && x.u === u)) return alert("User này đã tồn tại trong Shop!");
                
                MANAGER_EMPLOYEES.push({s, u, fn, dob, p, role, grp}); 
                renderNV(); 
                
                $('inp-nv-shop').value = ''; $('inp-nv-user').value = ''; $('inp-nv-fn').value = ''; $('inp-nv-dob').value = ''; $('inp-nv-pass').value = ''; $('inp-nv-grp').value = '';
            };

            $('btn-save-config').onclick = async () => {
                let fId = $('inp-folder-id').value.trim(), sId = $('inp-sheet-id').value.trim();
                if(!fId || !sId) return alert("Nhập đủ ID Folder và ID Sheet!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang lưu cấu hình...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: fId, sheetId: sId, employees: JSON.stringify(MANAGER_EMPLOYEES) }) });
                    if(JSON.parse(res).status === 'success') { alert("✅ Đã lưu cấu hình!"); MANAGER_SHEET_ID = sId; await loadStatistics(); }
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
                            return { dateStr: parsed.date, monthStr: parsed.month, timeStr: parsed.time, user: String(r[1] || "").trim(), slToRoi: r[2], linkDB: r[3], linkLive: r[4], imgToRoi: r[5], imgDB: r[6], imgLive: r[7], rootLink: r[8] };
                        });
                        STAT_DATA.reverse(); 
                        
                        renderTodaySummary();
                        updateFilters();
                        triggerRender();
                    } else {
                        renderTodaySummary(true);
                        $('stat-list-container').innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">Chưa có báo cáo nào.</div>`;
                    }
                } catch(e) { $('stat-list-container').innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px;">Lỗi tải thống kê! File Sheet cấu hình bị sai hoặc chưa được cấp quyền truy cập.</div>`; }
            };

            const renderTodaySummary = (empty = false) => {
                let d = new Date();
                let todayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
                
                let reportedUsers =[];
                if(!empty) {
                    let todayReports = STAT_DATA.filter(r => r.dateStr === todayStr);
                    reportedUsers =[...new Set(todayReports.map(r => r.user))]; 
                }
                
                let allEmps = MANAGER_EMPLOYEES.map(e => String(e.u).trim());
                let notReportedUsers = allEmps.filter(u => !reportedUsers.includes(u));

                let listHtml = `<div id="today-emp-list" style="display:none; margin-bottom: 25px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 15px 10px; max-height: 250px; overflow-y: auto;">
                                    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; text-align: center; font-weight: bold; text-transform: uppercase;">Danh sách NV đã/chưa báo cáo hôm nay</div>`;
                
                reportedUsers.forEach(u => {
                    listHtml += `<div class="emp-status-row">
                        <span class="emp-name reported">${getEmpDisplayName(u)}</span>
                        <span style="color:#10b981;">✅</span>
                    </div>`;
                });

                notReportedUsers.forEach(u => {
                    listHtml += `<div class="emp-status-row">
                        <span class="emp-name pending">${getEmpDisplayName(u)}</span>
                        <span style="color:#ef4444;">⏳</span>
                    </div>`;
                });

                if(allEmps.length === 0) {
                    listHtml += `<div style="text-align:center; padding: 10px; color:#94a3b8; font-size:13px;">Chưa có nhân viên nào trong danh sách.</div>`;
                }

                listHtml += `</div>`;

                $('stat-summary-container').innerHTML = `
                    <div class="stat-dash" style="cursor: pointer;" onclick="document.getElementById('today-emp-list').style.display = document.getElementById('today-emp-list').style.display === 'none' ? 'block' : 'none'" title="Bấm để xem danh sách chi tiết">
                        <div class="stat-box sb-blue">
                            <div style="font-size:26px; font-weight:bold; color:#38bdf8;">${reportedUsers.length}</div>
                            <div style="font-size:12px; color:#94a3b8;">Đã báo cáo (Hôm nay)</div>
                        </div>
                        <div class="stat-box sb-red">
                            <div style="font-size:26px; font-weight:bold; color:#ef4444;">${notReportedUsers.length}</div>
                            <div style="font-size:12px; color:#94a3b8;">Chưa báo cáo</div>
                        </div>
                    </div>
                    ${listHtml}
                `;
            };

            const updateFilters = () => {
                let months =[...new Set(STAT_DATA.map(r => r.monthStr))];
                let emps = MANAGER_EMPLOYEES.map(e => e.u);
                
                let curMonth = $('stat-month-filter').value;
                let curDate = $('stat-date-filter').value;
                let curEmp = $('stat-emp-filter').value;

                let htmlMonth = `<option value="ALL">Tất cả Tháng</option>`;
                months.forEach(m => htmlMonth += `<option value="${m}">${m}</option>`);
                $('stat-month-filter').innerHTML = htmlMonth;
                if(curMonth && months.includes(curMonth)) $('stat-month-filter').value = curMonth;

                let htmlEmp = `<option value="ALL">Tất cả Nhân Viên</option>`;
                emps.forEach(e => htmlEmp += `<option value="${e}">${getEmpDisplayName(e)}</option>`);
                $('stat-emp-filter').innerHTML = htmlEmp;
                if(curEmp && emps.includes(curEmp)) $('stat-emp-filter').value = curEmp;
                
                updateDateDropdown(); 
                if(curDate) $('stat-date-filter').value = curDate;
            };

            const updateDateDropdown = () => {
                let selectedMonth = $('stat-month-filter').value;
                let dates =[];
                if(selectedMonth === "ALL") {
                    dates =[...new Set(STAT_DATA.map(r => r.dateStr))];
                } else {
                    dates =[...new Set(STAT_DATA.filter(r => r.monthStr === selectedMonth).map(r => r.dateStr))];
                }
                let htmlDate = `<option value="ALL">Tất cả Ngày</option>`;
                dates.forEach(d => htmlDate += `<option value="${d}">${d}</option>`);
                $('stat-date-filter').innerHTML = htmlDate;
            };

            $('stat-month-filter').onchange = () => { updateDateDropdown(); triggerRender(); };
            $('stat-date-filter').onchange = () => triggerRender();
            $('stat-emp-filter').onchange = () => triggerRender();

            const triggerRender = () => {
                let m = $('stat-month-filter').value;
                let d = $('stat-date-filter').value;
                let e = $('stat-emp-filter').value;
                
                let filtered = STAT_DATA;
                if(m !== "ALL") filtered = filtered.filter(x => x.monthStr === m);
                if(d !== "ALL") filtered = filtered.filter(x => x.dateStr === d);
                if(e !== "ALL") filtered = filtered.filter(x => x.user === e);

                renderStatList(filtered, e, m, d);
            };

            const renderImgGrid = (str, horizontal = false, prefixName = "Anh") => {
                if(!str) return '';
                if(str.includes('ảnh') && !str.includes('http')) return `<span style="color:#fbbf24; font-size:12px;">${str} (Cũ)</span>`;
                let links = str.split('|||').filter(l => l.trim() !== '');
                if(links.length === 0) return '';
                
                let className = horizontal ? "rp-grid scroll-x" : "rp-grid";
                let linksJson = JSON.stringify(links).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                
                let downloadAllBtn = `<div style="text-align: right; margin-bottom: 5px; margin-top: 5px;">
                    <span class="btn-dl-all" style="font-size: 11px; color: #38bdf8; cursor: pointer; text-decoration: underline;" data-links="${linksJson}" data-prefix="${prefixName}">📥 Tải tất cả ${links.length} ảnh</span>
                </div>`;

                let gridHtml = `<div class="${className}">` + links.map((l, idx) => {
                    let match = l.match(/id=([a-zA-Z0-9_-]+)/);
                    let imgUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : l;
                    return `
                        <div class="rp-img-wrap">
                            <img src="${imgUrl}" class="rp-img">
                            <div class="rp-img-dl btn-dl-single" data-url="${imgUrl}" data-filename="${prefixName}_${idx+1}.jpg" title="Tải ảnh này">📥</div>
                        </div>`; 
                }).join('') + `</div>`;
                
                return downloadAllBtn + gridHtml;
            };

            const renderStatList = (filteredData, selectedEmp, selectedMonth, selectedDate) => {
                if(filteredData.length === 0) { 
                    $('stat-list-container').innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">Không có dữ liệu phù hợp với bộ lọc.</div>`; 
                    return; 
                }

                let finalHtml = '';

                if (selectedEmp === "ALL") {
                    let userStats = {};
                    filteredData.forEach(r => {
                        if(!userStats[r.user]) userStats[r.user] = { flyers: 0, posts: 0, lives: 0 };
                        userStats[r.user].flyers += parseInt(r.slToRoi) || 0;
                        if(r.linkDB || r.imgDB) userStats[r.user].posts += 1;
                        if(r.linkLive || r.imgLive) userStats[r.user].lives += 1;
                    });
                    
                    let topFlyer = Object.keys(userStats).sort((a,b) => userStats[b].flyers - userStats[a].flyers)[0];
                    let topPost = Object.keys(userStats).sort((a,b) => userStats[b].posts - userStats[a].posts)[0];
                    let topLive = Object.keys(userStats).sort((a,b) => userStats[b].lives - userStats[a].lives)[0];

                    if(Object.keys(userStats).length > 0) {
                        finalHtml += `
                            <div class="bc-sec-title">🏆 TOP TRUYỀN THÔNG</div>
                            <div class="leaderboard">
                                <div class="lb-card">
                                    <div class="lb-title">📄 Top Tờ Rơi</div>
                                    <div class="lb-name">${getEmpDisplayName(topFlyer) || '---'}</div>
                                    <div class="lb-score">${userStats[topFlyer]?.flyers || 0} tờ</div>
                                </div>
                                <div class="lb-card" style="border-color: #38bdf8; background: linear-gradient(180deg, rgba(56,189,248,0.15) 0%, rgba(0,0,0,0.2) 100%);">
                                    <div class="lb-title" style="color:#38bdf8;">🌐 Top Đăng/Share bài</div>
                                    <div class="lb-name">${getEmpDisplayName(topPost) || '---'}</div>
                                    <div class="lb-score" style="color:#FFD700;">${userStats[topPost]?.posts || 0} bài</div>
                                </div>
                                <div class="lb-card" style="border-color: #ef4444; background: linear-gradient(180deg, rgba(239,68,68,0.15) 0%, rgba(0,0,0,0.2) 100%);">
                                    <div class="lb-title" style="color:#ef4444;">🎥 Top Livestream</div>
                                    <div class="lb-name">${getEmpDisplayName(topLive) || '---'}</div>
                                    <div class="lb-score" style="color:#FFD700;">${userStats[topLive]?.lives || 0} lần</div>
                                </div>
                            </div>
                        `;
                    }
                } 
                else {
                    let totalFlyers = 0, postCount = 0, liveCount = 0;
                    let activeDays = new Set();
                    let allFlyerImgs = [], allPostImgs =[], allLiveImgs =[];
                    let allPostLinks = [], allLiveLinks =[];

                    filteredData.forEach(r => {
                        activeDays.add(r.dateStr);
                        totalFlyers += parseInt(r.slToRoi) || 0;
                        if (r.linkDB) { postCount++; allPostLinks.push(`<li><a href="${r.linkDB}" target="_blank" class="rp-link">${r.linkDB}</a></li>`); } 
                        else if (r.imgDB) { postCount++; } 

                        if (r.linkLive) { liveCount++; allLiveLinks.push(`<li><a href="${r.linkLive}" target="_blank" class="rp-link">${r.linkLive}</a></li>`); }
                        else if (r.imgLive) { liveCount++; }

                        if (r.imgToRoi) allFlyerImgs.push(r.imgToRoi);
                        if (r.imgDB) allPostImgs.push(r.imgDB);
                        if (r.imgLive) allLiveImgs.push(r.imgLive);
                    });

                    let timeLabel = selectedDate !== "ALL" ? `Ngày ${selectedDate}` : (selectedMonth !== "ALL" ? `Tháng ${selectedMonth}` : `Tất cả thời gian`);
                    let uId = "emp-portfolio-1";
                    
                    finalHtml += `
                        <div class="bc-sec-title">📋 TỔNG QUAN CÁ NHÂN - ${getEmpDisplayName(selectedEmp)}</div>
                        <div class="rp-card" style="border-color: #38bdf8; background: rgba(56, 189, 248, 0.05); margin-bottom: 25px;">
                            <div class="rp-header-row" onclick="document.getElementById('${uId}').style.display = document.getElementById('${uId}').style.display === 'block' ? 'none' : 'block'">
                                <div>
                                    <b style="color:#38bdf8; font-size:15px;">📊 Số liệu: ${timeLabel}</b>
                                    <div style="font-size:12px; color:#cbd5e1; margin-top:5px;">Số ngày báo cáo: ${activeDays.size}</div>
                                </div>
                                <span style="font-size:12px; color:#38bdf8;">▼ Chi tiết ảnh & link</span>
                            </div>
                            <div class="rp-detail" id="${uId}" style="border-top-color:rgba(56,189,248,0.3); display:block;">
                                
                                <div style="margin-bottom:15px;">
                                    <b style="color:#fff;">📄 Tổng Tờ Rơi Đã Phát: <span style="color:#FFD700; font-size:16px;">${totalFlyers}</span> tờ</b>
                                    ${renderImgGrid(allFlyerImgs.filter(s=>s).join('|||'), true, `PhatToRoi_${selectedEmp}`)}
                                </div>
                                
                                <div style="margin-bottom:15px;">
                                    <b style="color:#fff;">🌐 Tổng Lượt Đăng Bài: <span style="color:#FFD700; font-size:16px;">${postCount}</span> lần</b>
                                    <ul class="link-list">${allPostLinks.join('')}</ul>
                                    ${renderImgGrid(allPostImgs.filter(s=>s).join('|||'), true, `DangBai_${selectedEmp}`)}
                                </div>
                                
                                <div style="margin-bottom:5px;">
                                    <b style="color:#fff;">🎥 Tổng Lượt Livestream: <span style="color:#FFD700; font-size:16px;">${liveCount}</span> lần</b>
                                    <ul class="link-list">${allLiveLinks.join('')}</ul>
                                    ${renderImgGrid(allLiveImgs.filter(s=>s).join('|||'), true, `Livestream_${selectedEmp}`)}
                                </div>
                            </div>
                        </div>
                    `;
                }

                let grouped = {};
                filteredData.forEach(item => { if(!grouped[item.dateStr]) grouped[item.dateStr] = []; grouped[item.dateStr].push(item); });

                for(let date in grouped) {
                    finalHtml += `
                    <div class="date-group-wrapper">
                        <div class="date-group-title">📅 Nhật ký báo cáo ngày: ${date}</div>
                        <div class="date-group-content">
                    `;

                    // ==========================================
                    // TỔNG CỘNG TRONG NGÀY
                    // ==========================================
                    let totalToRoi = 0;
                    let allLinksDB =[];
                    let allLinksLive =[];
                    let allImgToRoi =[];
                    let allImgDB =[];
                    let allImgLive = [];

                    grouped[date].forEach(row => {
                        totalToRoi += parseInt(row.slToRoi) || 0;
                        if (row.linkDB) allLinksDB.push(`<li><a href="${row.linkDB}" target="_blank" class="rp-link">${row.linkDB}</a></li>`);
                        if (row.linkLive) allLinksLive.push(`<li><a href="${row.linkLive}" target="_blank" class="rp-link">${row.linkLive}</a></li>`);

                        if (row.imgToRoi) allImgToRoi.push(row.imgToRoi);
                        if (row.imgDB) allImgDB.push(row.imgDB);
                        if (row.imgLive) allImgLive.push(row.imgLive);
                    });

                    let combinedImgToRoi = allImgToRoi.filter(s => s).join('|||');
                    let combinedImgDB = allImgDB.filter(s => s).join('|||');
                    let combinedImgLive = allImgLive.filter(s => s).join('|||');

                    let uniqueIdSum = `rp-det-${date.replace(/\//g,'-')}-SUM`;
                    let safeDate = date.replace(/\//g,'-');
                    
                    finalHtml += `
                        <div class="rp-card" style="border-color: #FFD700; background: rgba(255, 215, 0, 0.05); margin-bottom: 20px;">
                            <div class="rp-header-row" onclick="document.getElementById('${uniqueIdSum}').style.display = document.getElementById('${uniqueIdSum}').style.display === 'block' ? 'none' : 'block'">
                                <div><b style="color:#FFD700; font-size:15px;">🌟 TỔNG CỘNG TRONG NGÀY</b></div>
                                <span style="font-size:12px; color:#FFD700;">▼ Xem tổng hợp</span>
                            </div>
                            <div class="rp-detail" id="${uniqueIdSum}" style="border-top-color:rgba(255,215,0,0.3);">
                                <div style="margin-bottom:10px;"><b>📄 Tổng Phát Tờ Rơi:</b> <span style="color:#FFD700; font-size:14px; font-weight:bold;">${totalToRoi}</span> tờ</div>
                                ${renderImgGrid(combinedImgToRoi, true, `Tong_ToRoi_${safeDate}`)}
                                
                                <div style="margin:15px 0 10px;"><b>🌐 Tổng Link Đăng Bài:</b> <div style="margin-top:5px; font-size:12px;"><ul class="link-list">${allLinksDB.length > 0 ? allLinksDB.join('') : '<li>Không có link</li>'}</ul></div></div>
                                ${renderImgGrid(combinedImgDB, true, `Tong_DangBai_${safeDate}`)}
                                
                                <div style="margin:15px 0 10px;"><b>🎥 Tổng Link Livestream:</b> <div style="margin-top:5px; font-size:12px;"><ul class="link-list">${allLinksLive.length > 0 ? allLinksLive.join('') : '<li>Không có link</li>'}</ul></div></div>
                                ${renderImgGrid(combinedImgLive, true, `Tong_Livestream_${safeDate}`)}
                            </div>
                        </div>
                    `;
                    
                    grouped[date].forEach((row, idx) => {
                        let uniqueId = `rp-det-${date.replace(/\//g,'-')}-${idx}`;
                        finalHtml += `
                            <div class="rp-card">
                                <div class="rp-header-row" onclick="document.getElementById('${uniqueId}').style.display = document.getElementById('${uniqueId}').style.display === 'block' ? 'none' : 'block'">
                                    <div><b style="color:#38bdf8;">👤 ${getEmpDisplayName(row.user)}</b> <span style="font-size:12px; color:#64748b; margin-left:10px;">🕒 ${row.timeStr}</span></div>
                                    <span style="font-size:12px; color:#FFD700;">▼ Xem chi tiết</span>
                                </div>
                                <div class="rp-detail" id="${uniqueId}">
                                    <div style="margin-bottom:10px;"><b>📄 Phát Tờ Rơi:</b> ${row.slToRoi} tờ</div>
                                    ${renderImgGrid(row.imgToRoi, false, `ToRoi_${row.user}_${safeDate}`)}
                                    
                                    <div style="margin:15px 0 10px;"><b>🌐 Đăng Bài:</b> ${row.linkDB ? `<a href="${row.linkDB}" target="_blank" class="rp-link">${row.linkDB}</a>` : 'Không có link'}</div>
                                    ${renderImgGrid(row.imgDB, false, `DangBai_${row.user}_${safeDate}`)}
                                    
                                    <div style="margin:15px 0 10px;"><b>🎥 Livestream:</b> ${row.linkLive ? `<a href="${row.linkLive}" target="_blank" class="rp-link">${row.linkLive}</a>` : 'Không có link'}</div>
                                    ${renderImgGrid(row.imgLive, false, `Livestream_${row.user}_${safeDate}`)}
                                    
                                    <div style="margin-top:15px; text-align:right;"><a href="${row.rootLink}" target="_blank" style="color:#10b981; font-size:12px; text-decoration:none;">📁 Mở Thư mục Drive ➡</a></div>
                                </div>
                            </div>
                        `;
                    });
                    finalHtml += `</div></div>`; 
                }
                
                $('stat-list-container').innerHTML = finalHtml;
            };

        } else {
            // ==========================================
            // LUỒNG NHÂN VIÊN & RENDER BẢNG CÁ NHÂN
            // ==========================================
            const updateEmpTabs = () => {
                if (EMP_SESSION && EMP_SESSION.role === 'NV') {
                    $('tab-btn-emp-personal').style.display = 'block';
                } else {
                    $('tab-btn-emp-personal').style.display = 'none';
                }
            };

            if (EMP_SESSION && EMP_SESSION.user) { 
                switchSc('sc-report'); 
                $('lbl-emp-name').innerText = `👤 ${EMP_SESSION.fn ? EMP_SESSION.fn + ' - ' : ''}${EMP_SESSION.user}`; 
                updateEmpTabs();
            } 
            else { switchSc('sc-login'); }

            $('tab-btn-emp-form').onclick = () => {['tab-btn-emp-form', 'tab-btn-emp-history', 'tab-btn-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });['tab-emp-form', 'tab-emp-history', 'tab-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                $('tab-btn-emp-form').classList.add('active'); $('tab-emp-form').classList.add('active'); 
            };
            
            $('tab-btn-emp-history').onclick = () => {['tab-btn-emp-form', 'tab-btn-emp-history', 'tab-btn-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                ['tab-emp-form', 'tab-emp-history', 'tab-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                $('tab-btn-emp-history').classList.add('active'); $('tab-emp-history').classList.add('active'); 
                loadEmployeeHistory();
            };

            // TAB "CÁ NHÂN" CLICK
            $('tab-btn-emp-personal').onclick = () => {['tab-btn-emp-form', 'tab-btn-emp-history', 'tab-btn-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });['tab-emp-form', 'tab-emp-history', 'tab-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                $('tab-btn-emp-personal').classList.add('active'); $('tab-emp-personal').classList.add('active'); 
                renderNLNV('overview'); // Load bảng tổng quan đầu tiên
            };

            $('emp-nlnv-view-select').onchange = (e) => {
                renderNLNV(e.target.value);
            };

            // HÀM RENDER BẢNG NĂNG LỰC NHÂN VIÊN VÀO TAB CÁ NHÂN
            const renderNLNV = (mode) => {
                const container = $('emp-nlnv-container');
                container.innerHTML = `<div style="text-align:center; padding:20px; color:#000;"><div class="spinner" style="margin:0 auto; border-top-color:#0070C0;"></div><br>Đang tải dữ liệu BI...</div>`;
                
                // Lấy Data từ hệ sinh thái BI 8.3
                const userConfig = UTILS.getPersistentConfig();
                const configList = GM_getValue(context.CONSTANTS.KEYS.CONFIG_LIST) ||[];
                const dataCache = GM_getValue(context.CONSTANTS.KEYS.DATA_CACHE) || {};
                const useBITarget = true; // Mặc định dùng Target BI
                
                // Tìm kiếm nhân viên tương ứng trên hệ thống BI
                let staffNameInBI = EMP_SESSION.user; 
                const staffListBI = userConfig.staffList ||[];
                // Ưu tiên tìm theo Họ Tên, không thấy thì tìm theo User
                const matchedStaff = staffListBI.find(s => (EMP_SESSION.fn && s.name.includes(EMP_SESSION.fn)) || s.name.includes(EMP_SESSION.user));
                if (matchedStaff) staffNameInBI = matchedStaff.name;
                
                // Gán tên cho hàm của BI render
                window.tgdd_nlnv_selected_staff = staffNameInBI;

                // Vẽ Bảng Tổng Quan
                if (mode === 'overview') {
                    setTimeout(() => {
                        let html = UI.HTML.getNLNVReport(dataCache, configList, userConfig, useBITarget);
                        container.innerHTML = html;
                    }, 200);
                } 
                // Vẽ Bảng Hàng Ngày (Cần fetch Lịch sử Cloud)
                else if (mode === 'daily') {
                    if (window.tgdd_history_cache) {
                        let html = UI.HTML.getNLNVDailyReport(window.tgdd_history_cache, configList, userConfig, staffNameInBI, dataCache, useBITarget);
                        container.innerHTML = html;
                    } else {
                        DATA.fetchHistoryFromSheet(userConfig, (history) => {
                            window.tgdd_history_cache = history || {};
                            let html = UI.HTML.getNLNVDailyReport(window.tgdd_history_cache, configList, userConfig, staffNameInBI, dataCache, useBITarget);
                            container.innerHTML = html;
                        });
                    }
                }
            };

            const loadEmployeeHistory = async () => {
                if(!EMP_SESSION || !EMP_SESSION.sheetId) return;
                $('bc-loading').style.display = 'flex';
                $('bc-load-text').innerText = "Đang tải lịch sử của bạn...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "get_manager_reports", sheetId: EMP_SESSION.sheetId }) });
                    let json = JSON.parse(res);
                    if(json.status === 'success' && Array.isArray(json.data) && json.data.length > 1) {
                        let d = new Date();
                        let todayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
                        
                        let myData = json.data.slice(1).map(r => {
                            let parsed = parseDateFromSheet(r[0]);
                            return { dateStr: parsed.date, timeStr: parsed.time, user: String(r[1] || "").trim(), slToRoi: r[2], linkDB: r[3], linkLive: r[4], imgToRoi: r[5], imgDB: r[6], imgLive: r[7] };
                        }).filter(r => r.dateStr === todayStr && r.user === EMP_SESSION.user);
                        
                        myData.reverse(); 
                        
                        if(myData.length === 0) {
                            $('emp-history-container').innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">Bạn chưa có báo cáo nào trong hôm nay.</div>`;
                        } else {
                            let html = '';
                            const renderImgGrid = (str, horizontal = false, prefixName = "Anh") => {
                                if(!str) return '';
                                if(str.includes('ảnh') && !str.includes('http')) return `<span style="color:#fbbf24; font-size:12px;">${str} (Cũ)</span>`;
                                let links = str.split('|||').filter(l => l.trim() !== '');
                                if(links.length === 0) return '';
                                
                                let className = horizontal ? "rp-grid scroll-x" : "rp-grid";
                                let linksJson = JSON.stringify(links).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                                
                                let downloadAllBtn = `<div style="text-align: right; margin-bottom: 5px; margin-top: 5px;">
                                    <span class="btn-dl-all" style="font-size: 11px; color: #38bdf8; cursor: pointer; text-decoration: underline;" data-links="${linksJson}" data-prefix="${prefixName}">📥 Tải tất cả ${links.length} ảnh</span>
                                </div>`;

                                let gridHtml = `<div class="${className}">` + links.map((l, idx) => {
                                    let match = l.match(/id=([a-zA-Z0-9_-]+)/);
                                    let imgUrl = match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800` : l;
                                    return `
                                        <div class="rp-img-wrap">
                                            <img src="${imgUrl}" class="rp-img">
                                            <div class="rp-img-dl btn-dl-single" data-url="${imgUrl}" data-filename="${prefixName}_${idx+1}.jpg" title="Tải ảnh này">📥</div>
                                        </div>`; 
                                }).join('') + `</div>`;
                                
                                return downloadAllBtn + gridHtml;
                            };

                            myData.forEach((row, idx) => {
                                let uniqueId = `emp-rp-det-${idx}`;
                                html += `
                                    <div class="rp-card">
                                        <div class="rp-header-row" onclick="document.getElementById('${uniqueId}').style.display = document.getElementById('${uniqueId}').style.display === 'block' ? 'none' : 'block'">
                                            <div><b style="color:#38bdf8;">🕒 Báo cáo lúc: ${row.timeStr}</b></div>
                                            <span style="font-size:12px; color:#FFD700;">▼ Xem chi tiết</span>
                                        </div>
                                        <div class="rp-detail" id="${uniqueId}">
                                            <div style="margin-bottom:10px;"><b>📄 Lượt Phát Tờ Rơi:</b> ${row.slToRoi} tờ</div>
                                            ${renderImgGrid(row.imgToRoi, false, `ToRoi_ToiNay_${idx+1}`)}
                                            
                                            <div style="margin:15px 0 10px;"><b>🌐 Lượt Đăng/Share Bài:</b> ${row.linkDB ? `<a href="${row.linkDB}" target="_blank" class="rp-link">${row.linkDB}</a>` : 'Không có link'}</div>
                                            ${renderImgGrid(row.imgDB, false, `DangBai_ToiNay_${idx+1}`)}
                                            
                                            <div style="margin:15px 0 10px;"><b>🎥 Livestream:</b> ${row.linkLive ? `<a href="${row.linkLive}" target="_blank" class="rp-link">${row.linkLive}</a>` : 'Không có link'}</div>
                                            ${renderImgGrid(row.imgLive, false, `Livestream_ToiNay_${idx+1}`)}
                                        </div>
                                    </div>
                                `;
                            });
                            $('emp-history-container').innerHTML = html;
                        }
                    } else {
                        $('emp-history-container').innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">Bạn chưa có báo cáo nào trong hôm nay.</div>`;
                    }
                } catch(e) { 
                    $('emp-history-container').innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Lỗi tải dữ liệu lịch sử!</div>`;
                }
                $('bc-loading').style.display = 'none';
            };

            $('btn-refresh-emp-history').onclick = loadEmployeeHistory;

            $('btn-nv-login').onclick = async () => {
                let s = $('inp-login-shop').value.trim(), u = $('inp-login-user').value.trim(), p = $('inp-login-pass').value.trim();
                if(!s || !u || !p) return alert("Nhập đủ thông tin!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang kiểm tra tài khoản...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "login_employee", empShop: s, empUser: u, empPass: p }) });
                    let data = JSON.parse(res);
                    if(data.status === 'success') {
                        // LƯU THÊM fn (Họ Tên), dob, role, grp VÀO SESSION
                        EMP_SESSION = { user: u, shop: s, folderId: data.folderId, sheetId: data.sheetId, fn: data.fn || "", dob: data.dob || "", role: data.role || "NV", grp: data.grp || "" };
                        localStorage.setItem('bc_emp_session', JSON.stringify(EMP_SESSION));
                        $('lbl-emp-name').innerText = `👤 ${EMP_SESSION.fn ? EMP_SESSION.fn + ' - ' : ''}${u}`; 
                        
                        updateEmpTabs(); // Kiểm tra NV để hiện nút Cá nhân
                        switchSc('sc-report');
                        $('tab-btn-emp-form').click();
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

                        $('tab-btn-emp-history').click();

                    } else alert("❌ Lỗi Server!");
                } catch (err) { alert("❌ Lỗi mạng. Không thể gửi lúc này!"); } 
                finally { $('bc-loading').style.display = 'none'; }
            };
        }
    };

    return { name: "Báo Cáo", icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>`, bgColor: "#0284c7", action: runTool };
})
