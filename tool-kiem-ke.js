/* 
   MODULE: KIỂM KÊ KHO (V2 - MULTI-USER & SESSION CODE)
*/
((context) => {
    const { UI, UTILS, AUTH_STATE, CONSTANTS, GM_xmlhttpRequest } = context;

    const SHEET_CONFIG = { STOCK: "Inventory_Stock", COUNT: "Inventory_Count" };
    let API_URL = "";
    try { API_URL = CONSTANTS.GSHEET.CONFIG_API; } catch(e) {}

    // --- 1. CSS ---
    const MY_CSS = `
        #tgdd-inventory-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483600; justify-content:center; align-items:center; }
        #tgdd-toast-notification { z-index: 2147483705 !important; }

        .inv-content { background:#fff; width:100%; height:100%; box-shadow:0 20px 60px rgba(0,0,0,0.4); display:flex; flex-direction:column; overflow:hidden; animation: popIn 0.3s; font-family: sans-serif; position: relative; }
        @media (max-width: 768px) { .inv-content { width: 100% !important; height: 100% !important; max-width: none !important; border-radius: 0 !important; } }

        .inv-header { display:flex; background:#f8f9fa; border-bottom:1px solid #ddd; padding:0 10px; align-items:center; justify-content:space-between; height: 50px; flex-shrink: 0; }
        .inv-title { font-weight:800; font-size:16px; color:#333; display:flex; align-items:center; gap:5px; }
        .inv-close { font-size:24px; cursor:pointer; color:#999; padding:0 15px; font-weight:bold; transition: 0.2s; } .inv-close:hover { color:red; transform: scale(1.1); }
        
        .inv-sub-header { background:#e9ecef; padding:8px 15px; font-size:12px; color:#333; border-bottom:1px solid #ddd; display:flex; align-items:center; flex-wrap: wrap; gap: 10px; }
        .inv-shop-select { padding: 4px; border-radius: 4px; border: 1px solid #007bff; font-weight: bold; color: #0056b3; outline: none; font-size: 12px; max-width: 110px; }
        
        /* User Bar */
        .inv-user-info { display:flex; align-items:center; gap:10px; margin-left: auto; }
        .inv-user-name { color:#d63031; font-weight:bold; } .inv-user-name.ready { color:#007bff; }
        .inv-auth-btns { display:flex; gap:5px; }
        .inv-btn-auth { border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold; color:white; }

        .inv-tabs { display:flex; gap:5px; height:100%; align-items:flex-end; }
        .inv-tab { padding:10px 20px; cursor:pointer; font-weight:bold; color:#666; border-bottom:3px solid transparent; transition:0.2s; font-size:13px; white-space:nowrap; }
        .inv-tab:hover { background:#eee; }
        .inv-tab.active { color:#007bff; border-bottom:3px solid #007bff; background:white; border-radius: 5px 5px 0 0; }

        .inv-body { flex:1; overflow:hidden; position:relative; background:white; }
        .inv-view { display:none; height:100%; flex-direction:column; padding:15px; box-sizing:border-box; }
        .inv-view.active { display:flex; }

        /* OVERLAYS - BLACK STYLE (Split UI) */
        #inv-startup-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:2005; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:15px; animation:fadeIn 0.3s; color: white; overflow-y:auto; padding: 20px;}
        .inv-startup-title { font-size:22px; font-weight:900; color:#FFD700; text-transform:uppercase; letter-spacing:1px; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(255,215,0,0.5);}
        
        .inv-session-code-display { font-size: 16px; background: rgba(40,167,69,0.2); border: 1px solid #28a745; color: #00e676; padding: 8px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 10px; display:none; letter-spacing: 2px;}

        .inv-split-box { display:flex; flex-direction:column; gap:20px; width: 100%; max-width: 400px;}
        .inv-box-panel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; display:flex; flex-direction:column; gap:10px;}
        .inv-panel-title { font-size: 14px; font-weight: bold; color: #81d4fa; margin-bottom: 5px; text-transform: uppercase;}
        
        .inv-input-group { display: flex; gap: 8px; width: 100%; }
        .inv-overlay-input { flex: 1; padding: 12px; border-radius: 6px; border: none; font-family: monospace; font-size: 14px; outline:none; background:rgba(255,255,255,0.9); color:#333; }
        .inv-overlay-input:disabled { background: #bbb; cursor: not-allowed; }
        
        .inv-btn-overlay { padding:12px 20px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; white-space:nowrap; transition:0.2s; font-size: 14px; }
        .btn-mode-join { background: #28a745; color: white; } .btn-mode-join:hover { background: #218838; }
        .btn-mode-save { background: #007bff; color: white; } .btn-mode-save:hover { background: #0056b3; }
        .btn-mode-edit { background: #ffc107; color: #333; } .btn-mode-edit:hover { background: #e0a800; }
        .btn-mode-new { background: #dc3545; color: white; margin-top: 5px;} .btn-mode-new:hover { background: #c82333; }
        .btn-mode-continue { background: #17a2b8; color: white; margin-top: 5px;} .btn-mode-continue:hover { background: #138496; }

        /* CONTROLS & TABLES */
        .inv-controls { display:flex; gap:10px; margin-bottom:15px; align-items:center; flex-wrap: nowrap; position: relative; }
        .inv-input { padding:8px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
        .inv-search-box { position:relative; flex: 1; min-width: 0; } 
        #inp-search-sku { width: 100%; box-sizing: border-box; }

        .inv-status-group { display:flex; gap:8px; padding:10px 5px; background:#fff; border-bottom:1px solid #eee; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
        .inv-status-group::-webkit-scrollbar { display: none; } 
        .inv-radio-lbl { flex: 0 0 auto; font-size:12px; font-weight:bold; color:#555; cursor:pointer; display:flex; align-items:center; gap:5px; background:#f1f3f5; padding:6px 12px; border-radius:20px; border:1px solid #ddd; transition:0.2s; }
        .inv-radio-lbl:hover { background:#e2e6ea; }
        .inv-radio-lbl:has(input:checked) { background:#007bff; color:white; border-color:#0056b3; box-shadow:0 2px 5px rgba(0,123,255,0.3); }
        .inv-radio-lbl input { display:none; }

        .inv-table-wrapper { flex:1; overflow:auto; border:1px solid #eee; border-radius:8px; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); }
        .inv-table { width:100%; border-collapse:collapse; font-size:12px; }
        .inv-table th { background:#f1f1f1; position:sticky; top:0; z-index:10; padding:10px; text-align:left; border-bottom:2px solid #ddd; color:#444; vertical-align: top; white-space: nowrap; }
        .inv-table td { padding:8px 10px; border-bottom:1px solid #eee; color:#333; }
        .inv-table tr:hover { background:#f9f9f9; cursor: pointer; }
        .inv-table tr.highlight { background:#fff9c4; animation: highlightFade 2s forwards; }
        
        .inv-btn { padding:8px 12px; border:none; border-radius:6px; font-weight:bold; color:white; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s; white-space:nowrap; font-size: 13px; height: 36px; }
        .inv-btn:active { transform:scale(0.95); }
        .btn-import { background:#28a745; } .btn-scan { background:#343a40; } .btn-cloud-load { background:#6f42c1; } .btn-sync { background:#17a2b8; } .btn-danger { background:#dc3545; } .btn-export { background:#218838; }
        
        /* SEARCH SUGGESTIONS & POPUPS */
        .inv-suggestions { position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #ddd; border-radius:0 0 8px 8px; box-shadow:0 10px 20px rgba(0,0,0,0.2); z-index:2000; max-height:300px; overflow-y:auto; display:none; }
        .inv-sug-item { padding:8px 10px; border-bottom:1px solid #f0f0f0; cursor:pointer; font-size:13px; line-height: 1.4; }
        .inv-sug-item:hover { background:#f0f8ff; color:#007bff; }
        .inv-sug-code { font-weight:bold; color:#d63031; }
        .inv-sug-sub { font-size:11px; color:#666; font-style: italic; }

        #inv-edit-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2147483750; justify-content:center; align-items:center; backdrop-filter:blur(2px); }
        .inv-edit-content { background:white; width:90%; max-width:400px; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); animation: popIn 0.2s; display:flex; flex-direction:column; }
        .inv-chk-manual { font-size:12px; font-weight:bold; color:#555; display:flex; align-items:center; gap:4px; cursor:pointer; padding:0 5px; white-space: nowrap; user-select: none; }
        .inv-chk-manual input { width:16px; height:16px; accent-color:#007bff; cursor:pointer; }
        
        .inv-edit-list { max-height:200px; overflow-y:auto; border:1px solid #eee; border-radius:6px; margin-bottom:15px; }
        .inv-edit-item { display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #f9f9f9; align-items:center; font-size:13px; }
        .inv-edit-input { width:60px; padding:4px; text-align:center; border:1px solid #ccc; border-radius:4px; }
        .inv-edit-actions { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top: auto; }
        .inv-btn-del-all { background:#dc3545; flex:1; justify-content:center; } .inv-btn-fill { background:#28a745; flex:1; justify-content:center; } .inv-btn-save { background:#007bff; flex:1; justify-content:center; }
        
        #inv-scanner-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:black; z-index:200; display:none; flex-direction:column; }
        #inv-reader { width:100%; height:100%; object-fit:cover; }
        .inv-scan-close { position:absolute; top:20px; right:20px; background:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; z-index:201; box-shadow:0 0 10px rgba(0,0,0,0.5); }
        
        .st-surplus { color:#28a745; font-weight:bold; } .st-missing { color:#dc3545; font-weight:bold; } .st-ok { color:#007bff; font-weight:bold; }
    `;

    // --- 2. GLOBAL STATE ---
    let STORE = {
        importData: [],
        countData:[],    // Dữ liệu kiểm kê của USER HIỆN TẠI
        allCountData:[], // Dữ liệu kiểm kê của TẤT CẢ USER (Dùng cho tab Tổng hợp)
        currentStatus: "Mới",
        currentShopId: "",
        currentUser: "---", 
        isLoggedIn: false,
        isScannerRunning: false,
        scannerObj: null,
        editingItem: null,
        isManualInput: false,
        syncCounter: 0,
        customSheetId: "",
        sessionCode: "" 
    };

    const STATUS_MAP = { "1-Mới": "Mới", "3-Trưng bày": "Trưng bày", "7-Trưng bày (bỏ mẫu)": "Trưng bày bỏ mẫu", "2-Đã sử dụng": "Đã sử dụng", "5-Lỗi (Mới)": "Lỗi (Mới)", "6Lỗi (ĐSD)": "Lỗi (Đã sử dụng)", "6-Lỗi (ĐSD)": "Lỗi (Đã sử dụng)", "7-Cũ thu mua": "Cũ thu mua", "8-Mới (Giảm giá)": "Mới (Giảm giá)" };

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const script = document.createElement('script');
            script.src = src; script.onload = resolve; script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

    // --- 3. API MODULE ---
    const API = {
        call: (params, cb) => {
            if(!API_URL) { if(UI.showToast) UI.showToast("❌ Chưa có API URL."); return; }
            if(params.loadingMsg && UI.showToast) UI.showToast(params.loadingMsg);

            // Bỏ qua check User nếu là tạo tài khoản
            if (params.action !== 'get_stock' && !params.action.includes('user_sheet_id') && !params.action.includes('inv_session') && !params.action.includes('_guest') && (STORE.currentUser === "---" || !STORE.currentUser)) {
                if(UI.showToast) UI.showToast("❌ Lỗi: Chưa xác định được Nhân viên!");
                return;
            }

            params.shopId = STORE.currentShopId;
            params.sheet_stock = SHEET_CONFIG.STOCK;
            params.sheet_count = SHEET_CONFIG.COUNT;

            if (STORE.customSheetId && !params.forceMainConfig) {
                params.custom_spreadsheet_id = STORE.customSheetId;
            }

            GM_xmlhttpRequest({
                method: "POST", url: API_URL, data: JSON.stringify(params),
                onload: (res) => {
                    if (res.status === 200) {
                        try { cb(JSON.parse(res.responseText)); } catch(e) { if(UI.showToast) UI.showToast("❌ Lỗi Server (Parse Error)"); }
                    } else if(UI.showToast) UI.showToast("❌ Lỗi HTTP " + res.status);
                },
                onerror: () => { if(UI.showToast) UI.showToast("❌ Mất kết nối mạng!"); }
            });
        },
        
        // --- CÁC HÀM CŨ ---
        getUserSheetId: (cb) => { API.call({ action: 'get_user_sheet_id', user: STORE.currentUser, forceMainConfig: true }, cb); },
        saveUserSheetId: (sheetId, cb) => { API.call({ action: 'save_user_sheet_id', user: STORE.currentUser, new_sheet_id: sheetId, forceMainConfig: true, loadingMsg: "💾 Đang lưu cấu hình..." }, cb); },
        initCustomSheet: (sheetId, cb) => { API.call({ action: 'init_custom_sheet', target_id: sheetId, loadingMsg: "⚙️ Đang khởi tạo các Sheet..." }, cb); },
        
        getStock: (cb) => { 
            if(!API_URL) return;
            if(!STORE.customSheetId) return;
            let url = `${API_URL}?action=get_stock&shopId=${encodeURIComponent(STORE.currentShopId)}&sheet_stock=${encodeURIComponent(SHEET_CONFIG.STOCK)}&t=${Date.now()}&custom_spreadsheet_id=${encodeURIComponent(STORE.customSheetId)}`;
            GM_xmlhttpRequest({ method: "GET", url: url, onload: (res) => { if(res.status===200) try{ cb(JSON.parse(res.responseText)); } catch(e){} } });
        }, 
        saveStock: (data, cb) => { if(!STORE.customSheetId) return; API.call({action: 'save_stock', data: data, loadingMsg: "☁️ Đang lưu Tồn kho..."}, cb); },
        
        getCount: (cb) => { 
            if(!API_URL || !STORE.customSheetId) return;
            let url = `${API_URL}?action=get_count&shopId=${encodeURIComponent(STORE.currentShopId)}&sheet_count=${encodeURIComponent(SHEET_CONFIG.COUNT)}&t=${Date.now()}&custom_spreadsheet_id=${encodeURIComponent(STORE.customSheetId)}`;
            GM_xmlhttpRequest({ method: "GET", url: url, onload: (res) => { if(res.status===200) try{ cb(JSON.parse(res.responseText)); } catch(e){} } });
        },
        saveCount: (data, cb) => { 
            if(!STORE.customSheetId) return;
            const flatData = data.map(item => ({ sku: item.sku, name: item.name, status: item.status, group: item.group, qty: item.totalCount }));
            API.call({ action: 'save_count', user: STORE.currentUser, data: flatData }, cb); 
        },
        deleteData: (mode, cb) => { if(!STORE.customSheetId) return; API.call({action: 'delete_data', mode: mode, loadingMsg: "⏳ Đang xóa dữ liệu..."}, cb); },

        // --- CÁC HÀM MỚI ---
        createSession: (sheetId, cb) => {
            API.call({ action: 'create_inv_session', sheet_id: sheetId, user: STORE.currentUser, forceMainConfig: true, loadingMsg: "⏳ Đang tạo Mã kỳ kiểm kê..." }, cb);
        },
        joinSession: (code, cb) => {
            API.call({ action: 'join_inv_session', code: code, forceMainConfig: true, loadingMsg: "⏳ Đang tham gia..." }, cb);
        }
    };

    // --- 4. LOGIC CHÍNH ---
    const runTool = async () => {
        let userConfig = {};
        if (UTILS && typeof UTILS.getPersistentConfig === 'function') userConfig = UTILS.getPersistentConfig();

        const shops =[];
        if(userConfig.shop1) shops.push({id: '1', name: userConfig.shop1Short || userConfig.shop1});
        if(userConfig.shop2) shops.push({id: '2', name: userConfig.shop2Short || userConfig.shop2});
        if(userConfig.shop3) shops.push({id: '3', name: userConfig.shop3Short || userConfig.shop3});
        
        if(shops.length > 0) STORE.currentShopId = shops[0].name;
        else STORE.currentShopId = "SHOP_UNK";

        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';

        const modalId = 'tgdd-inventory-modal';
        const oldModal = document.getElementById(modalId);
        if (oldModal) oldModal.remove();

        let shopOpts = shops.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        if(!shopOpts) shopOpts = `<option value="SHOP_UNK">Mặc định</option>`;

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.innerHTML = `
            <div class="inv-content">
                <div class="inv-header">
                    <div class="inv-title">📦Hệ thống Kiểm kê V2</div>
                    <div class="inv-tabs">
                        <div class="inv-tab active" data-tab="tab-input">Nhập liệu</div>
                        <div class="inv-tab" data-tab="tab-count">Kiểm kê</div>
                        <div class="inv-tab" id="tab-btn-sum" data-tab="tab-sum">Tổng hợp</div>
                    </div>
                    <div class="inv-close" id="btn-inv-close" title="Đóng">×</div>
                </div>
                
                <div class="inv-sub-header">
                    <select id="inv-shop-select" class="inv-shop-select">${shopOpts}</select>
                    <span id="lbl-header-session" style="font-weight:bold; color:#28a745; margin-left:10px; display:none;">Mã Phiên: <span id="val-header-session"></span></span>
                    
                    <div class="inv-user-info">
                        👤 <span id="lbl-current-user" class="inv-user-name">...</span>
                        <div id="inv-auth-btns" class="inv-auth-btns"></div>
                    </div>
                </div>

                <div class="inv-body">
                    <!-- STARTUP OVERLAY -->
                    <div id="inv-startup-overlay" style="display:flex;">
                        <div class="inv-startup-title">ĐĂNG NHẬP KIỂM KÊ</div>
                        <div id="lbl-startup-session" class="inv-session-code-display"></div>
                        
                        <div class="inv-split-box">
                            <!-- KHU VỰC NHÂN VIÊN (JOIN) -->
                            <div class="inv-box-panel">
                                <div class="inv-panel-title">👥 Dành cho Nhân viên</div>
                                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">Nhập mã 6 số do Quản lý cung cấp để cùng kiểm kê:</div>
                                <div class="inv-input-group">
                                    <input type="number" id="inp-join-code" class="inv-overlay-input" placeholder="Ví dụ: 123456" autocomplete="off">
                                    <button id="btn-join-session" class="inv-btn-overlay btn-mode-join">Tham gia</button>
                                </div>
                            </div>

                            <!-- KHU VỰC QUẢN LÝ (CREATE/LOAD) -->
                            <div class="inv-box-panel">
                                <div class="inv-panel-title">👑 Dành cho Quản lý</div>
                                <div style="font-size:12px; color:#aaa; margin-bottom:5px;">ID File Sheet chứa dữ liệu Tồn kho:</div>
                                <div class="inv-input-group">
                                    <input type="text" id="inp-startup-sheet-id" class="inv-overlay-input" placeholder="ID Google Sheet..." autocomplete="off">
                                    <button id="btn-startup-save-id" class="inv-btn-overlay btn-mode-save">Lưu ID</button>
                                </div>
                                <div id="startup-actions" style="display:none; flex-direction:column; margin-top:10px;">
                                    <button class="inv-btn-overlay btn-mode-continue" id="btn-start-load">📥 Tiếp tục kỳ cũ</button>
                                    <button class="inv-btn-overlay btn-mode-new" id="btn-start-new">🆕 Tạo kỳ kiểm kê mới (Phát sinh Mã)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 1: NHẬP LIỆU -->
                    <div class="inv-view active" id="tab-input">
                        <div class="inv-controls tab1-controls">
                            <label class="inv-btn btn-import">📂 Nhập Excel<input type="file" id="inp-excel-file" accept=".xlsx, .xls" style="display:none;"></label>
                            <button class="inv-btn btn-cloud-load" id="btn-load-stock-cloud">☁️ Tải tồn kho</button>
                        </div>
                        <div style="padding:0 10px 10px; font-size:12px; color:#666;" id="lbl-file-name">Chưa có dữ liệu</div>
                        <div class="inv-table-wrapper"><table class="inv-table" id="tbl-import"><thead><tr><th>#</th><th>Nhóm</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn kho</th></tr></thead><tbody></tbody></table></div>
                    </div>
                    <!-- TAB 2: KIỂM KÊ -->
                    <div class="inv-view" id="tab-count">
                        <div class="inv-status-group" id="inv-status-container">
                            <label class="inv-radio-lbl"><input type="radio" name="inv-status-radio" value="All"> Tất cả</label>
                        </div>
                        <div class="inv-controls">
                            <div class="inv-search-box"><input type="text" id="inp-search-sku" class="inv-input" placeholder="Nhập tên/mã..." autocomplete="off"><div class="inv-suggestions" id="box-suggestions"></div></div>
                            <label class="inv-chk-manual"><input type="checkbox" id="chk-manual-input"> Nhập tay</label>
                            <button class="inv-btn btn-scan" id="btn-open-scan">📷</button>
                            <button class="inv-btn btn-sync" id="btn-sync-cloud">☁️ Lưu</button>
                        </div>
                        <div class="inv-table-wrapper"><table class="inv-table" id="tbl-counting"><thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn</th><th>Đã kiểm</th><th>Lệch</th></tr></thead><tbody></tbody></table></div>
                        <div id="inv-scanner-overlay"><div class="inv-scan-close" id="btn-close-scan">×</div><div id="inv-reader"></div></div>
                    </div>
                    <!-- TAB 3: TỔNG HỢP -->
                    <div class="inv-view" id="tab-sum">
                        <div class="inv-controls" style="justify-content:space-between; background:#f8f9fa; padding:5px; border-radius:5px;">
                            <div style="display:flex; gap:5px;">
                                <select id="sel-delete-mode" class="inv-input" style="padding:4px; font-size:11px;"><option value="none">-- Chọn hành động xóa --</option><option value="stock">Xóa dữ liệu tồn kho</option><option value="count">Xóa dữ liệu kiểm kê</option><option value="all">Xóa tất cả</option></select>
                                <button class="inv-btn btn-danger" id="btn-delete-exec" style="padding:4px 10px;">Xóa dữ liệu</button>
                            </div>
                            <button class="inv-btn btn-export" id="btn-export-excel">📤 Xuất Excel</button>
                        </div>
                        <div style="font-size:11px; color:#888; margin-bottom:10px; font-style:italic;">* Dữ liệu Tổng hợp là tổng số lượng của TẤT CẢ nhân viên trong kỳ kiểm kê này.</div>
                        <div class="inv-table-wrapper">
                            <table class="inv-table" id="tbl-summary">
                                <thead><tr><th>Nhóm hàng<br><select class="inv-filter-select" data-col="group"><option value="all">Tất cả</option></select></th><th>Mã SP</th><th>Tên sản phẩm<br><select class="inv-filter-select" data-col="name"><option value="all">Tất cả</option></select></th><th>Trạng thái<br><select class="inv-filter-select" data-col="status"><option value="all">Tất cả</option></select></th><th>Tồn kho</th><th>Tổng đã kiểm<br><select class="inv-filter-select" data-col="count"><option value="all">Tất cả</option><option value="checked">Đã kiểm</option><option value="unchecked">Chưa kiểm</option></select></th><th>Chênh lệch<br><select class="inv-filter-select" data-col="diff"><option value="all">Tất cả</option><option value="ok">Đủ</option><option value="thua">Thừa</option><option value="thieu">Thiếu</option></select></th></tr></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <!-- CÁC POPUP KHÁC GIỮ NGUYÊN -->
            <div id="inv-edit-modal">
                <div class="inv-edit-content">
                    <div class="inv-edit-header"><span>Điều chỉnh số lượng</span><span class="inv-edit-close" id="btn-edit-close-x" title="Đóng">×</span></div>
                    <div style="font-size:13px; margin-bottom:5px;">Sản phẩm: <b id="edit-prod-name">...</b></div>
                    <div style="font-size:12px; color:#666; margin-bottom:10px;">Mã: <span id="edit-prod-sku"></span> | Trạng thái: <span id="edit-prod-status"></span></div>
                    <div style="font-size:12px; color:blue; margin-bottom:10px;">Tồn kho: <b id="edit-prod-stock">0</b> | Đã kiểm: <b id="edit-prod-count">0</b></div>
                    <div class="inv-edit-list" id="edit-history-list"></div>
                    <div class="inv-edit-actions"><button class="inv-btn inv-btn-del-all" id="btn-edit-delete">🗑️ Xóa</button><button class="inv-btn inv-btn-fill" id="btn-edit-fill" style="display:none;">⚡ Nhập đủ</button><button class="inv-btn inv-btn-save" id="btn-edit-save">Lưu</button></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // --- INIT DATA ---
        const statusList =["Mới", "Trưng bày", "Trưng bày bỏ mẫu", "Đã sử dụng", "Lỗi (Mới)", "Lỗi (Đã sử dụng)", "Cũ thu mua", "Mới (Giảm giá)"];
        const radioContainer = document.getElementById('inv-status-container');
        statusList.forEach((st, idx) => { radioContainer.innerHTML += `<label class="inv-radio-lbl"><input type="radio" name="inv-status-radio" value="${st}" ${idx === 0 ? 'checked' : ''}> ${st}</label>`; });

        try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'); await loadScript('https://unpkg.com/html5-qrcode'); } catch (e) { }

        // --- AUTH & GUEST LOGIC ---
        const updateAuthUI = () => {
            const lblUser = document.getElementById('lbl-current-user');
            const btnContainer = document.getElementById('inv-auth-btns');
            
            if(AUTH_STATE && AUTH_STATE.isAuthorized && AUTH_STATE.userName !== "---") {
                STORE.currentUser = AUTH_STATE.userName;
                STORE.isLoggedIn = true;
            } else {
                let savedGuest = localStorage.getItem('tgdd_guest_account');
                if(savedGuest) {
                    let acc = JSON.parse(savedGuest);
                    STORE.currentUser = acc.user;
                    STORE.isLoggedIn = true;
                } else {
                    STORE.currentUser = "Chưa đăng nhập";
                    STORE.isLoggedIn = false;
                }
            }

            lblUser.innerText = STORE.currentUser;
            if (STORE.isLoggedIn) lblUser.classList.add('ready'); else lblUser.classList.remove('ready');

            if (!STORE.isLoggedIn) {
                btnContainer.innerHTML = `<button id="inv-btn-login" class="inv-btn-auth" style="background:#0984e3;">Đăng nhập</button><button id="inv-btn-register" class="inv-btn-auth" style="background:#28a745;">Đăng ký</button>`;
                document.getElementById('inv-btn-login').onclick = () => showAuthModal('login');
                document.getElementById('inv-btn-register').onclick = () => showAuthModal('register');
            } else {
                // Nếu không phải là user MWG gốc thì cho phép Đăng xuất
                if (!(AUTH_STATE && AUTH_STATE.isAuthorized)) {
                    btnContainer.innerHTML = `<button id="inv-btn-logout" class="inv-btn-auth" style="background:#dc3545;">Đăng xuất</button>`;
                    document.getElementById('inv-btn-logout').onclick = () => {
                        if(confirm("Bạn muốn đăng xuất?")) {
                            localStorage.removeItem('tgdd_guest_account');
                            updateAuthUI();
                            document.getElementById('inv-startup-overlay').style.display = 'flex';
                        }
                    };
                } else { btnContainer.innerHTML = ''; }
                
                // Tự động kiểm tra Config nếu đã đăng nhập
                fetchUserConfig();
            }
        };

        const showAuthModal = (mode) => {
            const isLogin = mode === 'login'; const title = isLogin ? '🔐 ĐĂNG NHẬP' : '📝 TẠO TÀI KHOẢN';
            const htmlContent = `<div style="text-align:left; font-size:13px; margin-bottom:10px;"><div style="margin-bottom:8px;"><label style="font-weight:bold; color:#555;">Tài khoản:</label><input type="text" id="inv-auth-user" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-top:4px;" placeholder="Tên đăng nhập không dấu..."></div><div style="margin-bottom:20px;"><label style="font-weight:bold; color:#555;">Mật khẩu:</label><input type="password" id="inv-auth-pass" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-top:4px;" placeholder="Nhập mật khẩu..."></div><button id="inv-auth-submit" style="width:100%; padding: 10px; border:none; border-radius: 8px; color: white; font-weight: bold; cursor:pointer; background: ${isLogin ? '#0984e3' : '#28a745'};">${isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</button></div>`;
            UI.showMsg(title, htmlContent, 'info');

            setTimeout(() => {
                const btnSubmit = document.getElementById('inv-auth-submit');
                if(btnSubmit) {
                    btnSubmit.onclick = () => {
                        const u = document.getElementById('inv-auth-user').value.trim(); const p = document.getElementById('inv-auth-pass').value.trim();
                        if(!u || !p) { alert("⚠️ Vui lòng nhập đầy đủ!"); return; }
                        btnSubmit.innerText = "⏳ Đang xử lý..."; btnSubmit.disabled = true;

                        GM_xmlhttpRequest({
                            method: "POST", url: API_URL, data: JSON.stringify({ action: isLogin ? 'login_guest' : 'register_guest', user: u, password: p }),
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            onload: (res) => { 
                                try {
                                    const json = JSON.parse(res.responseText);
                                    if(json.status === 'success') {
                                        document.getElementById('tgdd-msg-modal').style.display = 'none';
                                        localStorage.setItem('tgdd_guest_account', JSON.stringify({user: u, pass: p}));
                                        UI.showToast("✅ Thành công!");
                                        updateAuthUI();
                                    } else { alert("❌ Lỗi: " + json.message); btnSubmit.innerText = isLogin ? 'Đăng Nhập' : 'Đăng Ký'; btnSubmit.disabled = false; }
                                } catch(e) { alert("❌ Lỗi mạng!"); btnSubmit.disabled = false; }
                            }, onerror: () => { alert("❌ Lỗi kết nối!"); btnSubmit.disabled = false; }
                        });
                    };
                }
            }, 100);
        };

        // --- OVERLAY LOGIC ---
        const overlay = document.getElementById('inv-startup-overlay');
        const inpSheetId = document.getElementById('inp-startup-sheet-id');
        const btnSaveId = document.getElementById('btn-startup-save-id');
        const startupActions = document.getElementById('startup-actions');
        const inpJoinCode = document.getElementById('inp-join-code');
        const lblSessionDisplay = document.getElementById('lbl-startup-session');

        const showSessionInfo = (code) => {
            STORE.sessionCode = code;
            document.getElementById('lbl-header-session').style.display = 'inline';
            document.getElementById('val-header-session').innerText = code;
            
            lblSessionDisplay.style.display = 'block';
            lblSessionDisplay.innerText = "KỲ KIỂM KÊ: " + code;
        };

        const fetchUserConfig = () => {
            if(!STORE.isLoggedIn) return;
            API.getUserSheetId((res) => {
                if (res.status === 'success' && res.sheet_id) {
                    STORE.customSheetId = res.sheet_id;
                    inpSheetId.value = res.sheet_id;
                    inpSheetId.disabled = true;
                    btnSaveId.innerText = "Sửa"; btnSaveId.className = "inv-btn-overlay btn-mode-edit";
                    startupActions.style.display = 'flex'; 
                } else {
                    STORE.customSheetId = "";
                    inpSheetId.value = "";
                    inpSheetId.disabled = false;
                    btnSaveId.innerText = "Lưu ID"; btnSaveId.className = "inv-btn-overlay btn-mode-save";
                    startupActions.style.display = 'none';
                }
            });
        };

        // EVENT QUẢN LÝ
        btnSaveId.onclick = function() {
            if(!STORE.isLoggedIn) { UI.showToast("❌ Vui lòng đăng nhập!"); return; }
            if(this.innerText === "Sửa") {
                inpSheetId.disabled = false; inpSheetId.focus();
                this.innerText = "Lưu ID"; this.className = "inv-btn-overlay btn-mode-save";
                startupActions.style.display = 'none';
            } else {
                const val = inpSheetId.value.trim();
                if(!val) return UI.showToast("❌ Vui lòng nhập ID!");
                API.saveUserSheetId(val, (res) => {
                    if(res.status === 'success') {
                        STORE.customSheetId = val; inpSheetId.disabled = true;
                        this.innerText = "Sửa"; this.className = "inv-btn-overlay btn-mode-edit";
                        API.initCustomSheet(val, (initRes) => {
                            if(initRes.status === 'success') { UI.showToast("✅ Đã kết nối ID Sheet!"); startupActions.style.display = 'flex'; }
                            else alert("Lỗi tạo Sheet: " + initRes.msg);
                        });
                    } else alert("Lỗi lưu ID: " + res.msg);
                });
            }
        };

        document.getElementById('btn-start-load').onclick = () => { 
            if(!STORE.customSheetId) return;
            // Tiếp tục kỳ cũ -> Check localStorage xem có mã session không
            const oldCode = localStorage.getItem('inv_active_session_code_' + STORE.currentUser);
            if(oldCode) showSessionInfo(oldCode);
            overlay.style.display = 'none'; 
            autoLoadData(); 
        };
        
        document.getElementById('btn-start-new').onclick = () => {
            if(!STORE.customSheetId) return;
            if(confirm(`TẠO KỲ KIỂM KÊ MỚI?\n\nDữ liệu CŨ trong file Sheet sẽ bị xóa để đếm lại từ đầu.`)) {
                // Xóa dữ liệu cũ -> Tạo session mới
                API.deleteData('all', (res) => {
                    if(res.status === 'success') { 
                        API.createSession(STORE.customSheetId, (sessionRes) => {
                            if(sessionRes.status === 'success') {
                                localStorage.setItem('inv_active_session_code_' + STORE.currentUser, sessionRes.code);
                                showSessionInfo(sessionRes.code);
                                overlay.style.display = 'none'; 
                                STORE.countData = []; STORE.importData =[]; STORE.allCountData =[];
                                renderImportTable(); renderCountTable(); renderSummary(); 
                                modal.querySelector('.inv-tab[data-tab="tab-input"]').click(); 
                                UI.showToast(`✅ Đã tạo Mã kiểm kê mới: ${sessionRes.code}`); 
                            } else {
                                alert("Lỗi tạo mã: " + sessionRes.message);
                            }
                        });
                    } 
                    else { UI.showToast("❌ Lỗi: " + res.msg); }
                });
            }
        };

        // EVENT NHÂN VIÊN (JOIN)
        document.getElementById('btn-join-session').onclick = () => {
            if(!STORE.isLoggedIn) { UI.showToast("❌ Vui lòng đăng nhập!"); return; }
            const code = inpJoinCode.value.trim();
            if(!code || code.length !== 6) { alert("Vui lòng nhập đúng 6 số!"); return; }
            
            API.joinSession(code, (res) => {
                if (res.status === 'success') {
                    STORE.customSheetId = res.sheet_id;
                    showSessionInfo(code);
                    UI.showToast(`✅ Đã tham gia phòng của: ${res.owner}`);
                    overlay.style.display = 'none';
                    autoLoadData();
                    modal.querySelector('.inv-tab[data-tab="tab-count"]').click(); 
                } else {
                    alert("❌ Lỗi: " + res.message);
                }
            });
        };

        // --- CHUYỂN SHOP ---
        document.getElementById('inv-shop-select').onchange = (e) => { 
            STORE.currentShopId = e.target.value; 
            STORE.importData = []; STORE.countData =[]; STORE.allCountData =[];
            renderImportTable(); renderCountTable(); renderSummary(); 
            UI.showToast(`Đã chuyển: ${STORE.currentShopId}`); 
            autoLoadData();
        };

        // --- BUTTONS ---
        document.getElementById('btn-load-stock-cloud').onclick = () => { 
            if(!STORE.customSheetId) { UI.showToast("⛔ Lỗi ID Sheet"); return; }
            API.getStock((data) => { STORE.importData = data; renderImportTable(); updateFilters(); syncStockToCountData(); renderCountTable(); renderSummary(); if(UI.showToast) UI.showToast(`✅ Đã tải ${data.length} dòng Tồn kho!`); }); 
        };
        
        document.getElementById('btn-sync-cloud').onclick = () => { 
            if(!STORE.customSheetId) return;
            API.saveCount(STORE.countData, (res) => { if(res.status==='success') UI.showToast("✅ Đã lưu dữ liệu đếm của bạn!"); }); 
        };
        
        document.getElementById('btn-delete-exec').onclick = () => { 
            if(!STORE.customSheetId) return;
            const mode = document.getElementById('sel-delete-mode').value; 
            if(mode === 'none') return; 
            if(!confirm(`⚠️ Bạn đang xóa dữ liệu trên file Sheet dùng chung.\nXác nhận xóa?`)) return; 
            
            API.deleteData(mode, (res) => { 
                if(res.status === 'success') { 
                    UI.showToast("✅ Đã xóa dữ liệu thành công!"); 
                    if(mode === 'stock' || mode === 'all') { STORE.importData =[]; renderImportTable(); } 
                    if(mode === 'count' || mode === 'all') { STORE.countData =[]; STORE.allCountData =[]; renderCountTable(); renderSummary(); } 
                } else {
                    UI.showToast("❌ Lỗi: " + (res.message || "Không xác định"));
                }
            }); 
        };

        document.getElementById('btn-export-excel').onclick = exportToExcel;
        document.getElementById('btn-inv-close').onclick = () => { if(STORE.isScannerRunning) stopScanner(); if(STORE.countData.length > 0 && STORE.isLoggedIn && STORE.customSheetId) { API.saveCount(STORE.countData, () => { modal.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; document.body.classList.remove('tgdd-body-lock'); }); } else { modal.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; document.body.classList.remove('tgdd-body-lock'); } };

        // TABS LOGIC
        const tabs = modal.querySelectorAll('.inv-tab'); 
        tabs.forEach(t => { 
            t.onclick = () => { 
                tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); 
                document.querySelectorAll('.inv-view').forEach(v => v.classList.remove('active')); 
                document.getElementById(t.dataset.tab).classList.add('active'); 
                
                if (t.dataset.tab === 'tab-count') setTimeout(() => document.getElementById('inp-search-sku').focus(), 100); 
                
                // LOGIC MỚI: Bấm qua Tổng hợp -> Đồng bộ -> Tải dữ liệu của tất cả -> Tính toán
                if (t.dataset.tab === 'tab-sum') { 
                    if(!STORE.customSheetId) return;
                    t.innerText = "⏳ Đang gộp...";
                    // 1. Lưu dữ liệu của mình lên trước
                    API.saveCount(STORE.countData, () => {
                        // 2. Kéo dữ liệu của TẤT CẢ mọi người về
                        API.getCount((cData) => {
                            STORE.allCountData = cData; // Lưu raw list của tất cả user
                            
                            // Cập nhật lại list của mình nhỡ có người khác sửa
                            STORE.countData = cData.filter(i => i.user === STORE.currentUser).map(i => ({ ...i, history:[{ts:i.time, qty:i.qty}], totalCount: i.qty, stock: (STORE.importData.find(s => s.sku === i.sku && s.status === i.status) || {}).stock || 0 }));
                            
                            renderSummary(); 
                            t.innerText = "Tổng hợp";
                            UI.showToast("✅ Đã cập nhật số liệu tổng hợp!");
                        });
                    });
                } 
            }; 
        });

        document.querySelectorAll('input[name="inv-status-radio"]').forEach(r => { r.onchange = (e) => { STORE.currentStatus = e.target.value; document.getElementById('inp-search-sku').value = ''; document.getElementById('box-suggestions').style.display = 'none'; }; });
        document.getElementById('chk-manual-input').onchange = (e) => STORE.isManualInput = e.target.checked;
        document.getElementById('inp-excel-file').addEventListener('change', handleFileImport, false);

        // --- SEARCH LOGIC ---
        const searchInput = document.getElementById('inp-search-sku');
        const sugBox = document.getElementById('box-suggestions');
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (val.length < 1) { sugBox.style.display = 'none'; return; }
            const matches = STORE.importData.filter(item => {
                const statusMatch = STORE.currentStatus === 'All' ? true : item.status === STORE.currentStatus;
                const textMatch = item.sku.toLowerCase().includes(val) || item.name.toLowerCase().includes(val);
                return statusMatch && textMatch;
            }).slice(0, 10);
            if (matches.length > 0) {
                sugBox.innerHTML = matches.map(item => `<div class="inv-sug-item" data-sku="${item.sku}" data-status="${item.status}"><div><span class="inv-sug-code">${item.sku}</span> - ${item.name}</div><div class="inv-sug-sub">Trạng thái: ${item.status} | Tồn: ${formatNumber(item.stock)}</div></div>`).join('');
                sugBox.style.display = 'block';
                sugBox.querySelectorAll('.inv-sug-item').forEach(el => { el.onclick = () => { addCountItem(el.dataset.sku, el.dataset.status); searchInput.value = ''; sugBox.style.display = 'none'; searchInput.focus(); }; });
            } else sugBox.style.display = 'none';
        });
        document.addEventListener('click', (e) => { if (!e.target.closest('.inv-search-box')) sugBox.style.display = 'none'; });
        document.getElementById('btn-open-scan').onclick = startScanner;
        document.getElementById('btn-close-scan').onclick = stopScanner;
        document.querySelectorAll('.inv-filter-select').forEach(el => el.addEventListener('change', renderSummary));
        
        // --- EDIT MODAL ---
        document.getElementById('btn-edit-close-x').onclick = () => document.getElementById('inv-edit-modal').style.display = 'none';
        document.getElementById('btn-edit-delete').onclick = () => { if(confirm("Xóa sản phẩm này khỏi danh sách CỦA BẠN?")) { STORE.countData = STORE.countData.filter(i => !(i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status)); document.getElementById('inv-edit-modal').style.display = 'none'; renderCountTable(); UI.showToast("Đã xóa!"); triggerAutoSync(); } };
        document.getElementById('btn-edit-fill').onclick = () => { const item = STORE.editingItem; const diff = item.stock - item.totalCount; if (diff !== 0) { if(confirm(`Xác nhận bù ${Math.abs(diff)} cái?`)) { const nowTime = new Date().toTimeString().split(' ')[0]; const existIdx = STORE.countData.findIndex(i => i.sku === item.sku && i.status === item.status); if (existIdx === -1) { STORE.countData.unshift({ ...item, history: [{ ts: nowTime, qty: diff }], totalCount: diff, counted: diff }); } else { const realItem = STORE.countData[existIdx]; realItem.history.unshift({ ts: nowTime, qty: diff }); realItem.totalCount += diff; } document.getElementById('inv-edit-modal').style.display = 'none'; renderCountTable(); UI.showToast("Đã cập nhật!"); triggerAutoSync(); } } };
        document.getElementById('btn-edit-save').onclick = () => { const inputs = document.querySelectorAll('.inv-history-qty'); let newHistory =[]; let newTotal = 0; const nowTime = new Date().toTimeString().split(' ')[0]; inputs.forEach((inp, idx) => { const val = parseInt(inp.value) || 0; if (val !== 0) { let currentTs = nowTime; if (STORE.editingItem.history && STORE.editingItem.history[idx]) currentTs = STORE.editingItem.history[idx].ts; newHistory.push({ ts: currentTs, qty: val }); newTotal += val; } }); if (newTotal === 0) { if(confirm("Số lượng bằng 0. Xóa?")) STORE.countData = STORE.countData.filter(i => !(i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status)); else return; } else { const existIdx = STORE.countData.findIndex(i => i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status); if (existIdx !== -1) { STORE.countData[existIdx].history = newHistory; STORE.countData[existIdx].totalCount = newTotal; } else { STORE.countData.unshift({ ...STORE.editingItem, history: newHistory, totalCount: newTotal }); } } document.getElementById('inv-edit-modal').style.display = 'none'; renderCountTable(); UI.showToast("Đã lưu thay đổi!"); triggerAutoSync(); };

        // --- CORE FUNCTIONS ---
        function triggerAutoSync() { if(!STORE.customSheetId) return; STORE.syncCounter++; if (STORE.syncCounter >= 5) { STORE.syncCounter = 0; API.saveCount(STORE.countData, () => { console.log("Auto synced"); }); } }
        function syncStockToCountData() { if (STORE.importData.length === 0) return; STORE.countData.forEach(cItem => { const stockItem = STORE.importData.find(s => s.sku === cItem.sku && s.status === cItem.status); if (stockItem) { cItem.stock = stockItem.stock; cItem.group = stockItem.group; } }); }
        
        function autoLoadData() {
            if (!STORE.isLoggedIn) return;
            if (!STORE.customSheetId) return;

            API.getStock((data) => {
                if(data.length > 0) { 
                    STORE.importData = data; renderImportTable(); updateFilters();
                } 
                API.getCount((cData) => {
                    STORE.allCountData = cData;
                    STORE.countData = cData.filter(i => i.user === STORE.currentUser).map(i => ({ ...i, history:[{ts:i.time, qty:i.qty}], totalCount: i.qty, stock: (STORE.importData.find(s => s.sku === i.sku && s.status === i.status) || {}).stock || 0 }));
                    renderCountTable(); renderSummary(); 
                });
            });
        }

        // Xuất Excel GỘP của tất cả nhân viên (Lấy từ STORE.allCountData)
        function exportToExcel() {
            if (STORE.importData.length === 0 && STORE.allCountData.length === 0) { UI.showToast("⚠️ Không có dữ liệu để xuất!"); return; }
            
            // Gộp data của tất cả nhân viên
            let aggregatedCount = {};
            STORE.allCountData.forEach(item => {
                let key = item.sku + '_' + item.status;
                if(!aggregatedCount[key]) aggregatedCount[key] = 0;
                aggregatedCount[key] += parseInt(item.qty) || 0;
            });

            const dataToExport =[];
            STORE.importData.forEach(item => { 
                let key = item.sku + '_' + item.status;
                const qty = aggregatedCount[key] || 0; 
                dataToExport.push({ "Nhóm": item.group, "Mã SP": item.sku, "Tên Sản Phẩm": item.name, "Trạng Thái": item.status, "Tồn Kho": item.stock, "Thực Tế": qty, "Lệch": item.stock - qty }); 
                delete aggregatedCount[key]; // Đánh dấu đã map
            });
            
            // Những mã đếm được mà KHÔNG CÓ TRONG KHO
            for(let key in aggregatedCount) {
                let parts = key.split('_');
                let sku = parts[0]; let status = parts[1];
                // Lấy tạm name từ allCountData
                let name = "N/A"; let group = "N/A";
                let matched = STORE.allCountData.find(i => i.sku === sku && i.status === status);
                if(matched) { name = matched.name; group = matched.group; }
                
                dataToExport.push({ "Nhóm": group, "Mã SP": sku, "Tên Sản Phẩm": name, "Trạng Thái": status, "Tồn Kho": 0, "Thực Tế": aggregatedCount[key], "Lệch": 0 - aggregatedCount[key] });
            }

            if (typeof XLSX === 'undefined') { UI.showToast("❌ Lỗi thư viện Excel!"); return; }
            const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(dataToExport); XLSX.utils.book_append_sheet(wb, ws, "TongHop");
            XLSX.writeFile(wb, `KiemKe_TongHop_${STORE.currentShopId}.xlsx`); UI.showToast("✅ Đã xuất file Excel!");
        }

        function normalizeStatus(raw) { if (!raw) return ""; const cleanRaw = String(raw).trim(); if (STATUS_MAP[cleanRaw]) return STATUS_MAP[cleanRaw]; for (let key in STATUS_MAP) { if (cleanRaw.includes(key) || key.includes(cleanRaw)) return STATUS_MAP[key]; } return cleanRaw; }
        
        function handleFileImport(e) { 
            const file = e.target.files[0]; if (!file) return; 
            if(!STORE.customSheetId) { alert("⛔ Lỗi: Mất kết nối ID Sheet!"); return; }
            document.getElementById('lbl-file-name').innerText = file.name; 
            const reader = new FileReader(); 
            reader.onload = (evt) => { 
                const data = new Uint8Array(evt.target.result); 
                const workbook = XLSX.read(data, { type: 'array' }); 
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }); 
                STORE.importData =[]; 
                for (let i = 1; i < jsonData.length; i++) { const row = jsonData[i]; if (row && row[6]) { STORE.importData.push({ group: row[4] || '', sku: String(row[6]).trim(), name: row[7] || '', status: normalizeStatus(row[8]), stock: parseInt(row[9]) || 0 }); } } 
                renderImportTable(); updateFilters(); syncStockToCountData(); renderCountTable(); renderSummary(); 
                UI.showToast(`✅ Đã nhập ${STORE.importData.length} dòng!`); 
                if(STORE.importData.length > 0) { API.saveStock(STORE.importData, (res) => { if(res.status==='success') UI.showToast("✅ Đã lưu Tồn kho lên File Sheet Riêng!"); else UI.showToast("❌ Lỗi lưu: " + res.msg); }); } 
            }; 
            reader.readAsArrayBuffer(file); 
        }

        function updateFilters() { const getUnique = (key) => [...new Set(STORE.importData.map(i => i[key]))].filter(Boolean); const fillSelect = (col, vals) => { const sel = document.querySelector(`.inv-filter-select[data-col="${col}"]`); const options = ['all', ...vals]; if(sel) sel.innerHTML = options.map(v => `<option value="${v}">${v === 'all' ? 'Tất cả' : v}</option>`).join(''); }; fillSelect('status', getUnique('status')); fillSelect('group', getUnique('group')); fillSelect('name', getUnique('name').sort()); }
        function renderImportTable() { const tbody = document.querySelector('#tbl-import tbody'); let html = ''; STORE.importData.slice(0, 200).forEach((item, idx) => { html += `<tr><td>${idx+1}</td><td>${item.group}</td><td style="font-weight:bold;color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${item.stock}</td></tr>`; }); tbody.innerHTML = html; }
        
        function addCountItem(sku, specificStatus) {
            if(!STORE.customSheetId) return;
            if (!STORE.isLoggedIn) { UI.showToast("❌ Cần đăng nhập!"); return; }
            let stockItem;
            if (specificStatus) stockItem = STORE.importData.find(i => i.sku === sku && i.status === specificStatus);
            else if (STORE.currentStatus !== 'All') stockItem = STORE.importData.find(i => i.sku === sku && i.status === STORE.currentStatus);
            else stockItem = STORE.importData.find(i => i.sku === sku);

            let itemToAdd = stockItem;
            if (!stockItem) {
                const existing = STORE.countData.find(i => i.sku === sku && (specificStatus ? i.status === specificStatus : (STORE.currentStatus !== 'All' ? i.status === STORE.currentStatus : true)));
                if (existing) itemToAdd = existing;
                else if (STORE.importData.length > 0) { UI.showToast(`⚠️ Không tìm thấy mã ${sku}!`); return; } 
                else { itemToAdd = { sku: sku, name: 'Mới thêm', status: specificStatus || STORE.currentStatus, stock: 0, group: '' }; }
            }

            let qty = 1;
            if (STORE.isManualInput) { const inputQty = prompt(`Nhập số lượng cho: ${itemToAdd.name}\n(Trạng thái: ${itemToAdd.status})`, "1"); if (inputQty === null) return; qty = parseInt(inputQty) || 0; if (qty <= 0) return; }
            const existItem = STORE.countData.find(i => i.sku === sku && i.status === itemToAdd.status);
            const nowTime = new Date().toTimeString().split(' ')[0];
            if (existItem) { existItem.history.unshift({ ts: nowTime, qty: qty }); existItem.totalCount += qty; STORE.countData = STORE.countData.filter(i => i !== existItem); STORE.countData.unshift(existItem); } 
            else { STORE.countData.unshift({ ...itemToAdd, history:[{ ts: nowTime, qty: qty }], totalCount: qty }); }
            renderCountTable(); UI.showToast(`Đã thêm ${qty}: ${itemToAdd.name}`); triggerAutoSync(); 
        }

        function openEditPopup(item) {
            if (!STORE.isLoggedIn) return;
            const modal = document.getElementById('inv-edit-modal'); const list = document.getElementById('edit-history-list');
            let realItem = STORE.countData.find(i => i.sku === item.sku && i.status === item.status);
            if (!realItem) { const importItem = STORE.importData.find(i => i.sku === item.sku && i.status === item.status); if(importItem) realItem = { ...importItem, history:[], totalCount: 0 }; }
            if(!realItem) return;
            STORE.editingItem = realItem;
            document.getElementById('edit-prod-name').innerText = realItem.name; document.getElementById('edit-prod-sku').innerText = realItem.sku; document.getElementById('edit-prod-status').innerText = realItem.status; document.getElementById('edit-prod-stock').innerText = realItem.stock || 0; document.getElementById('edit-prod-count').innerText = realItem.totalCount;
            const btnFill = document.getElementById('btn-edit-fill'); const diff = (realItem.stock || 0) - realItem.totalCount;
            if (diff !== 0) { btnFill.style.display = 'flex'; const sign = diff > 0 ? '+' : ''; btnFill.innerText = `⚡ Nhập đủ (${sign}${diff})`; } else { btnFill.style.display = 'none'; }
            let html = '';
            if (realItem.history.length === 0) { html = '<div style="text-align:center; padding:10px; color:#999; font-style:italic;">Chưa có lịch sử nhập.</div>'; } 
            else { realItem.history.forEach((h, idx) => { html += `<div class="inv-edit-item"><span>Lần nhập lúc ${h.ts}</span><input type="number" class="inv-edit-input inv-history-qty" value="${h.qty}"></div>`; }); }
            html += `<div class="inv-edit-item" style="background:#e3f2fd"><span style="font-weight:bold; color:#007bff">Nhập mới:</span><input type="number" class="inv-edit-input inv-history-qty" value="" placeholder="SL"></div>`;
            list.innerHTML = html; modal.style.display = 'flex';
        }

        // TẠO BẢNG COUNT CHO CÁ NHÂN
        function renderCountTable() {
            const tbody = document.querySelector('#tbl-counting tbody'); let html = '';
            STORE.countData.forEach((item, idx) => {
                const stockVal = item.stock || 0;
                const diff = stockVal - item.totalCount;
                let diffText = `<span class="st-ok">Đủ</span>`;
                if (stockVal > 0) { if (diff > 0) diffText = `<span class="st-missing">Thiếu ${formatNumber(diff)}</span>`; else if (diff < 0) diffText = `<span class="st-surplus">Thừa ${formatNumber(Math.abs(diff))}</span>`; } 
                else if (stockVal === 0 && item.totalCount > 0) { diffText = `<span class="st-surplus">Thừa ${formatNumber(item.totalCount)}</span>`; }
                html += `<tr class="${idx===0?'highlight':''}" onclick="document.getElementById('edit-trigger-${idx}').click()"><td style="font-weight:bold;color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${formatNumber(stockVal)}</td><td style="font-weight:bold;font-size:14px;color:#007bff">${formatNumber(item.totalCount)}</td><td>${diffText}</td><td style="display:none"><button id="edit-trigger-${idx}"></button></td></tr>`;
            });
            tbody.innerHTML = html;
            STORE.countData.forEach((item, idx) => { document.getElementById(`edit-trigger-${idx}`).onclick = () => openEditPopup(item); });
        }

        // TẠO BẢNG TỔNG HỢP CỦA TẤT CẢ USER
        function renderSummary() {
            const fGroup = document.querySelector('.inv-filter-select[data-col="group"]').value; const fName = document.querySelector('.inv-filter-select[data-col="name"]').value; const fStatus = document.querySelector('.inv-filter-select[data-col="status"]').value; const fCount = document.querySelector('.inv-filter-select[data-col="count"]').value; const fDiff = document.querySelector('.inv-filter-select[data-col="diff"]').value;
            const tbody = document.querySelector('#tbl-summary tbody'); let html = '';
            
            // Gộp tất cả data đếm được (allCountData)
            let aggregatedCount = {};
            STORE.allCountData.forEach(item => {
                let key = item.sku + '_' + item.status;
                if(!aggregatedCount[key]) aggregatedCount[key] = 0;
                aggregatedCount[key] += parseInt(item.qty) || 0;
            });

            STORE.importData.forEach((item, idx) => {
                if (fGroup !== 'all' && item.group !== fGroup) return; if (fName !== 'all' && item.name !== fName) return; if (fStatus !== 'all' && item.status !== fStatus) return;
                
                let key = item.sku + '_' + item.status;
                const countedVal = aggregatedCount[key] || 0;
                const diff = item.stock - countedVal;
                
                if (fCount === 'checked' && countedVal === 0) return; if (fCount === 'unchecked' && countedVal > 0) return; 
                if (fDiff === 'ok' && diff !== 0) return; if (fDiff === 'thua' && diff >= 0) return; if (fDiff === 'thieu' && diff <= 0) return;
                
                let diffText = `<span class="st-ok">0</span>`; if (diff > 0) diffText = `<span class="st-missing">Thiếu ${formatNumber(diff)}</span>`; else if (diff < 0) diffText = `<span class="st-surplus">Thừa ${formatNumber(Math.abs(diff))}</span>`;
                html += `<tr style="${countedVal === 0 ? 'background:#fff5f5;' : ''}"><td>${item.group}</td><td style="font-weight:bold;">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${formatNumber(item.stock)}</td><td style="font-weight:bold; color: #007bff;">${formatNumber(countedVal)}</td><td>${diffText}</td></tr>`;
            });
            tbody.innerHTML = html;
        }

        function startScanner() { const overlay = document.getElementById('inv-scanner-overlay'); if(STORE.isScannerRunning) return; overlay.style.display = 'flex'; STORE.isScannerRunning = true; const html5QrCode = new Html5Qrcode("inv-reader"); STORE.scannerObj = html5QrCode; html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, (txt) => { if(navigator.vibrate) navigator.vibrate(200); addCountItem(txt); stopScanner(); }, () => {}).catch(err => { alert("Lỗi Camera: " + err); stopScanner(); }); }
        function stopScanner() { const overlay = document.getElementById('inv-scanner-overlay'); if (STORE.scannerObj) { STORE.scannerObj.stop().then(() => { STORE.scannerObj.clear(); STORE.scannerObj = null; STORE.isScannerRunning = false; overlay.style.display = 'none'; }).catch(() => {}); } else { overlay.style.display = 'none'; STORE.isScannerRunning = false; } }

        const toastEl = document.getElementById('tgdd-toast-notification');
        if (toastEl) { toastEl.style.zIndex = '2147483705'; document.body.appendChild(toastEl); }

        modal.style.display = 'flex';
        updateAuthUI();
    };

    return {
        name: "Kiểm kê",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="white"/></svg>`,
        bgColor: "#6c757d",
        css: MY_CSS,
        action: runTool
    };
})
