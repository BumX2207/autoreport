/* 
   MODULE: KIỂM KÊ KHO (INVENTORY) - V4.3 (FIX VAR UNDEFINED)
   - Fix: Lỗi "userConfig is not defined".
   - Fix: Chuẩn hóa biến currentUser vào STORE để tránh mất scope.
   - Core: Giữ nguyên tính năng Cloud/Multi-Shop V4.0.
*/
((context) => {
    const UI = context.UI || {};
    const UTILS = context.UTILS || {};
    const AUTH_STATE = context.AUTH_STATE || {};
    const CONSTANTS = context.CONSTANTS || {};
    const GM_xmlhttpRequest = context.GM_xmlhttpRequest;

    let API_URL = "";
    try { API_URL = CONSTANTS.GSHEET.API_URL; } catch(e) {}

    // --- CSS ---
    const MY_CSS = `
        #tgdd-inventory-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483700; justify-content:center; align-items:center; }
        .inv-content { background:#fff; width:98%; max-width:1100px; height:92vh; border-radius:15px; box-shadow:0 20px 60px rgba(0,0,0,0.4); display:flex; flex-direction:column; overflow:hidden; animation: popIn 0.3s; font-family: sans-serif; position: relative; }
        @media (max-width: 768px) { .inv-content { width: 100% !important; height: 100% !important; max-width: none !important; border-radius: 0 !important; } }

        .inv-header { display:flex; background:#f8f9fa; border-bottom:1px solid #ddd; padding:0 10px; align-items:center; justify-content:space-between; height: 50px; flex-shrink: 0; }
        .inv-title { font-weight:800; font-size:16px; color:#333; display:flex; align-items:center; gap:10px; }
        .inv-close { font-size:24px; cursor:pointer; color:#999; padding:0 15px; font-weight:bold; transition: 0.2s; } .inv-close:hover { color:red; transform: scale(1.1); }
        .inv-shop-select { padding: 5px; border-radius: 5px; border: 2px solid #007bff; font-weight: bold; color: #0056b3; outline: none; font-size: 13px; max-width: 150px; }

        .inv-tabs { display:flex; gap:5px; height:100%; align-items:flex-end; }
        .inv-tab { padding:10px 20px; cursor:pointer; font-weight:bold; color:#666; border-bottom:3px solid transparent; transition:0.2s; font-size:13px; white-space:nowrap; }
        .inv-tab:hover { background:#eee; }
        .inv-tab.active { color:#007bff; border-bottom:3px solid #007bff; background:white; border-radius: 5px 5px 0 0; }

        .inv-body { flex:1; overflow:hidden; position:relative; background:white; }
        .inv-view { display:none; height:100%; flex-direction:column; padding:15px; box-sizing:border-box; }
        .inv-view.active { display:flex; }

        .inv-controls { display:flex; gap:5px; margin-bottom:15px; align-items:center; flex-wrap: nowrap; }
        .inv-input { padding:8px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
        .inv-search-box { position:relative; flex: 1; min-width: 0; } 
        #inp-search-sku { width: 100%; box-sizing: border-box; }
        .inv-btn { padding:8px 12px; border:none; border-radius:6px; font-weight:bold; color:white; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s; white-space:nowrap; font-size: 13px; }
        .inv-btn:active { transform:scale(0.95); }
        .btn-import { background:#28a745; }
        .btn-scan { background:#343a40; }
        .btn-sync { background:#17a2b8; }
        .btn-cloud-load { background:#6f42c1; }
        .btn-danger { background:#dc3545; }
        .inv-chk-manual { font-size:12px; font-weight:bold; color:#555; display:flex; align-items:center; gap:4px; cursor:pointer; padding:0 5px; white-space: nowrap; user-select: none; }
        
        .inv-table-wrapper { flex:1; overflow:auto; border:1px solid #eee; border-radius:8px; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); }
        .inv-table { width:100%; border-collapse:collapse; font-size:12px; }
        .inv-table th { background:#f1f1f1; position:sticky; top:0; z-index:10; padding:10px; text-align:left; border-bottom:2px solid #ddd; color:#444; vertical-align: top; white-space: nowrap; }
        .inv-table td { padding:8px 10px; border-bottom:1px solid #eee; color:#333; }
        .inv-table tr:hover { background:#f9f9f9; cursor: pointer; }
        .inv-table tr.highlight { background:#fff9c4; animation: highlightFade 2s forwards; }
        @keyframes highlightFade { from {background:#fff9c4;} to {background:transparent;} }

        .st-surplus { color:#28a745; font-weight:bold; }
        .st-missing { color:#dc3545; font-weight:bold; }
        .st-ok { color:#007bff; font-weight:bold; }

        #inv-edit-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2147483750; justify-content:center; align-items:center; backdrop-filter:blur(2px); }
        .inv-edit-content { background:white; width:90%; max-width:400px; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); animation: popIn 0.2s; display:flex; flex-direction:column; }
        .inv-edit-header { display:flex; justify-content:space-between; align-items:center; font-weight:bold; font-size:16px; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px; color:#333; }
        .inv-edit-close { cursor:pointer; font-size:20px; color:#999; width:30px; height:30px; display:flex; justify-content:center; align-items:center; border-radius:50%; transition:0.2s; }
        .inv-edit-close:hover { background:#eee; color:#333; }
        .inv-edit-input { width:60px; padding:4px; text-align:center; border:1px solid #ccc; border-radius:4px; margin-left: 10px; font-weight:bold; font-size:16px; color:#007bff; }
        .inv-edit-actions { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top: 15px; }
        .inv-btn-del-all { background:#dc3545; flex:1; justify-content:center; }
        .inv-btn-save { background:#007bff; flex:1; justify-content:center; }

        .inv-status-group { display:flex; flex-wrap:wrap; gap:8px; padding:10px; background:#f1f8ff; border-radius:8px; margin-bottom:15px; border:1px solid #cce5ff; }
        .inv-radio-lbl { font-size:11px; font-weight:bold; color:#0056b3; cursor:pointer; display:flex; align-items:center; gap:5px; background:white; padding:6px 12px; border-radius:15px; border:1px solid #b8daff; transition:0.2s; }
        .inv-radio-lbl:hover { background:#e2e6ea; }
        .inv-radio-lbl:has(input:checked) { background:#007bff; color:white; border-color:#0056b3; box-shadow:0 2px 5px rgba(0,123,255,0.3); }
        .inv-radio-lbl input { display:none; }
        
        .inv-suggestions { position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #ddd; border-radius:0 0 8px 8px; box-shadow:0 10px 20px rgba(0,0,0,0.2); z-index:2000; max-height:300px; overflow-y:auto; display:none; }
        .inv-sug-item { padding:10px; border-bottom:1px solid #f0f0f0; cursor:pointer; font-size:12px; }
        .inv-sug-item:hover { background:#f0f8ff; color:#007bff; }
        .inv-sug-code { font-weight:bold; color:#d63031; }

        .inv-loading { font-size:12px; color:#666; font-style:italic; margin-left:10px; display:none; }
        .inv-filter-select { padding:4px; border:1px solid #ccc; border-radius:4px; font-size:11px; width:100%; box-sizing:border-box; margin-top:4px; }
        
        #inv-scanner-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:black; z-index:200; display:none; flex-direction:column; }
        #inv-reader { width:100%; height:100%; object-fit:cover; }
        .inv-scan-close { position:absolute; top:20px; right:20px; background:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; z-index:201; box-shadow:0 0 10px rgba(0,0,0,0.5); }
    `;

    // STATE
    let STORE = {
        importData: [],
        serverCountData: [],
        myCountData: [],
        currentStatus: "Mới",
        currentShopId: "",
        currentUser: "Guest", // LƯU USER VÀO ĐÂY ĐỂ DÙNG CHUNG
        isScannerRunning: false,
        scannerObj: null,
        editingItem: null,
        isManualInput: false
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

    // --- API FUNCTIONS ---
    const API = {
        call: (params, cb) => {
            if(!API_URL) { if(UI.showToast) UI.showToast("❌ Chưa có API URL"); return; }
            const ind = document.getElementById('inv-loading-indicator');
            if(ind) { ind.style.display = 'inline'; ind.innerText = "Đang kết nối..."; }
            
            params.shopId = STORE.currentShopId;

            GM_xmlhttpRequest({
                method: "POST", url: API_URL, data: JSON.stringify(params),
                onload: (res) => {
                    if(ind) ind.style.display = 'none';
                    if (res.status === 200) {
                        try { cb(JSON.parse(res.responseText)); } catch(e) { if(UI.showToast) UI.showToast("❌ Lỗi dữ liệu server"); }
                    } else if(UI.showToast) UI.showToast("❌ Lỗi HTTP " + res.status);
                },
                onerror: () => { if(ind) ind.style.display = 'none'; if(UI.showToast) UI.showToast("❌ Mất kết nối"); }
            });
        },
        getStock: (cb) => { 
            if(!API_URL) return;
            const ind = document.getElementById('inv-loading-indicator');
            if(ind) ind.style.display = 'inline';
            GM_xmlhttpRequest({
                method: "GET", url: `${API_URL}?action=get_stock&shopId=${encodeURIComponent(STORE.currentShopId)}&t=${Date.now()}`,
                onload: (res) => {
                    if(ind) ind.style.display = 'none';
                    if(res.status===200) try{ cb(JSON.parse(res.responseText)); } catch(e){}
                }
            });
        }, 
        saveStock: (data, cb) => { API.call({action: 'save_stock', data: data}, cb); },
        getCount: (cb) => { 
            if(!API_URL) return;
            const ind = document.getElementById('inv-loading-indicator');
            if(ind) ind.style.display = 'inline';
            GM_xmlhttpRequest({
                method: "GET", url: `${API_URL}?action=get_count&shopId=${encodeURIComponent(STORE.currentShopId)}&t=${Date.now()}`,
                onload: (res) => {
                    if(ind) ind.style.display = 'none';
                    if(res.status===200) try{ cb(JSON.parse(res.responseText)); } catch(e){}
                }
            });
        },
        saveCount: (data, cb) => { API.call({action: 'save_count', user: STORE.currentUser, data: data}, cb); },
        deleteData: (mode, cb) => { API.call({action: 'delete_data', mode: mode}, cb); }
    };

    // --- MAIN EXECUTOR ---
    const runTool = async () => {
        try {
            // 1. Tự động đóng Modal Tiện Ích (Menu) nếu đang mở
            const toolsModal = document.getElementById('tgdd-tools-modal');
            if (toolsModal) toolsModal.classList.remove('show');

            // 2. Định danh User (Lưu vào STORE)
            if (AUTH_STATE && AUTH_STATE.userName) STORE.currentUser = AUTH_STATE.userName;

            // 3. Lấy Config Shop an toàn (CHUẨN HÓA BIẾN THÀNH userConfig)
            let userConfig = {};
            if (UTILS && typeof UTILS.getPersistentConfig === 'function') {
                userConfig = UTILS.getPersistentConfig();
            }

            const shops = [];
            if(userConfig.shop1) shops.push({id: '1', name: userConfig.shop1});
            if(userConfig.shop2) shops.push({id: '2', name: userConfig.shop2});
            if(userConfig.shop3) shops.push({id: '3', name: userConfig.shop3});
            
            if(shops.length > 0) STORE.currentShopId = shops[0].name;
            else STORE.currentShopId = "SHOP_UNK";

            // 4. Ẩn Bottom Nav
            const bottomNav = document.getElementById('tgdd-bottom-nav');
            if(bottomNav) bottomNav.style.display = 'none';

            // 5. Tạo Modal
            const modalId = 'tgdd-inventory-modal';
            let oldModal = document.getElementById(modalId);
            if (oldModal) oldModal.remove();

            let shopOpts = shops.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            if(!shopOpts) shopOpts = `<option value="SHOP_UNK">Mặc định</option>`;

            const modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="inv-content">
                    <div class="inv-header">
                        <div class="inv-title">
                            📦
                            <select id="inv-shop-select" class="inv-shop-select">${shopOpts}</select>
                            <span id="inv-loading-indicator" class="inv-loading">Đang tải...</span>
                        </div>
                        <div class="inv-tabs">
                            <div class="inv-tab active" data-tab="tab-input">Nhập liệu</div>
                            <div class="inv-tab" data-tab="tab-count">Kiểm kê</div>
                            <div class="inv-tab" data-tab="tab-sum">Tổng hợp</div>
                        </div>
                        <div class="inv-close" id="btn-inv-close" title="Đóng">×</div>
                    </div>

                    <div class="inv-body">
                        <!-- TAB 1 -->
                        <div class="inv-view active" id="tab-input">
                            <div class="inv-controls">
                                <label class="inv-btn btn-import">📂 Excel File <input type="file" id="inp-excel-file" accept=".xlsx, .xls" style="display:none;"></label>
                                <button class="inv-btn btn-cloud-load" id="btn-load-stock-cloud">☁️ Tải Tồn kho Cloud</button>
                                <span id="lbl-file-name" style="font-size:12px; color:#666; margin-left: auto;"></span>
                            </div>
                            <div class="inv-table-wrapper">
                                <table class="inv-table" id="tbl-import">
                                    <thead><tr><th>#</th><th>Nhóm</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn kho</th></tr></thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- TAB 2 -->
                        <div class="inv-view" id="tab-count">
                            <div class="inv-status-group" id="inv-status-container"></div>
                            <div class="inv-controls">
                                <div class="inv-search-box">
                                    <input type="text" id="inp-search-sku" class="inv-input" placeholder="Nhập tên/mã..." autocomplete="off">
                                    <div class="inv-suggestions" id="box-suggestions"></div>
                                </div>
                                <label class="inv-chk-manual"><input type="checkbox" id="chk-manual-input"> Nhập tay</label>
                                <button class="inv-btn btn-scan" id="btn-open-scan">📷 Scan</button>
                                <button class="inv-btn btn-sync" id="btn-sync-cloud">☁️ Đồng bộ</button>
                            </div>
                            <div class="inv-table-wrapper">
                                <table class="inv-table" id="tbl-counting">
                                    <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>SL Kiểm</th><th>Sửa</th></tr></thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <div id="inv-scanner-overlay"><div class="inv-scan-close" id="btn-close-scan">×</div><div id="inv-reader"></div></div>
                        </div>

                        <!-- TAB 3 -->
                        <div class="inv-view" id="tab-sum">
                            <div class="inv-controls" style="justify-content:space-between; background:#f8f9fa; padding:5px; border-radius:5px;">
                                <span style="font-size:12px; font-weight:bold; color:#0056b3;">Dữ liệu tổng hợp từ Cloud</span>
                                <div style="display:flex; gap:5px;">
                                    <select id="sel-delete-mode" class="inv-input" style="padding:4px; font-size:11px;">
                                        <option value="none">-- Chọn hành động xóa --</option>
                                        <option value="count">Xóa Dữ liệu Kiểm kê</option>
                                        <option value="stock">Xóa Dữ liệu Tồn kho</option>
                                        <option value="all">Xóa TẤT CẢ (Reset Shop)</option>
                                    </select>
                                    <button class="inv-btn btn-danger" id="btn-delete-exec" style="padding:4px 10px;">Thực hiện</button>
                                </div>
                            </div>
                            <div class="inv-table-wrapper">
                                <table class="inv-table" id="tbl-summary">
                                    <thead>
                                        <tr>
                                            <th>Nhóm <select class="inv-filter-select" data-col="group"><option value="all">Tất cả</option></select></th>
                                            <th>Mã SP</th>
                                            <th>Tên <select class="inv-filter-select" data-col="name"><option value="all">Tất cả</option></select></th>
                                            <th>Trạng thái <select class="inv-filter-select" data-col="status"><option value="all">Tất cả</option></select></th>
                                            <th>Tồn kho</th>
                                            <th>Thực tế</th>
                                            <th>Lệch <select class="inv-filter-select" data-col="diff"><option value="all">All</option><option value="ok">Đủ</option><option value="fail">Lệch</option><option value="thua">Thừa</option><option value="thieu">Thiếu</option></select></th>
                                            <th>User</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="inv-edit-modal">
                    <div class="inv-edit-content">
                        <div class="inv-edit-header"><span>Nhập số lượng</span><span class="inv-edit-close" id="btn-edit-close-x">×</span></div>
                        <div style="font-size:13px; margin-bottom:5px;">Sản phẩm: <b id="edit-prod-name">...</b></div>
                        <div style="font-size:12px; color:#666; margin-bottom:20px;">Mã: <span id="edit-prod-sku"></span> | TT: <span id="edit-prod-status"></span></div>
                        <div style="display:flex; justify-content:center; align-items:center; margin-bottom:20px;">
                            <span style="font-size:14px; font-weight:bold;">Số lượng:</span><input type="number" id="inp-edit-qty" class="inv-edit-input" min="0" value="1">
                        </div>
                        <div class="inv-edit-actions">
                            <button class="inv-btn inv-btn-del-all" id="btn-edit-delete">🗑️ Xóa</button>
                            <button class="inv-btn inv-btn-save" id="btn-edit-save">💾 Lưu</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 6. HIỂN THỊ NGAY LẬP TỨC
            modal.style.display = 'flex';
            document.body.classList.add('tgdd-body-lock');

            // 7. Render UI phụ
            const statusList = ["Mới", "Trưng bày", "Trưng bày bỏ mẫu", "Đã sử dụng", "Lỗi (Mới)", "Lỗi (Đã sử dụng)", "Cũ thu mua", "Mới (Giảm giá)"];
            const radioContainer = document.getElementById('inv-status-container');
            statusList.forEach((st, idx) => radioContainer.innerHTML += `<label class="inv-radio-lbl"><input type="radio" name="inv-status-radio" value="${st}" ${idx===0?'checked':''}> ${st}</label>`);

            // 8. Tải thư viện ASYNC
            const indicator = document.getElementById('inv-loading-indicator');
            if(indicator) indicator.innerText = "Đang tải thư viện...";
            try { 
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'); 
                await loadScript('https://unpkg.com/html5-qrcode');
                if(indicator) indicator.style.display = 'none';
            } catch (e) { 
                if(indicator) indicator.innerText = "Lỗi tải thư viện!";
            }

            // 9. BINDING EVENTS
            document.getElementById('inv-shop-select').onchange = (e) => {
                STORE.currentShopId = e.target.value;
                STORE.importData = []; STORE.myCountData = []; STORE.serverCountData = [];
                renderImportTable(); renderCountTable(); renderSummary();
                if(UI.showToast) UI.showToast(`Đã chuyển sang: ${STORE.currentShopId}`);
                API.getStock((data) => { STORE.importData = data; renderImportTable(); });
                API.getCount((data) => { STORE.serverCountData = data; STORE.myCountData = data.filter(i => i.user === STORE.currentUser); renderCountTable(); });
            };

            document.getElementById('inp-excel-file').addEventListener('change', (e) => {
                const file = e.target.files[0]; if (!file) return;
                document.getElementById('lbl-file-name').innerText = file.name;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
                    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                    STORE.importData = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const r = jsonData[i];
                        if (r && r[6]) STORE.importData.push({ group: r[4]||'', sku: String(r[6]).trim(), name: r[7]||'', status: normalizeStatus(r[8]), stock: parseInt(r[9])||0 });
                    }
                    renderImportTable();
                    if(UI.showToast) UI.showToast(`✅ Đã nhập ${STORE.importData.length} dòng!`);
                    updateFilters();
                    
                    if(STORE.importData.length > 0) {
                        API.saveStock(STORE.importData, (res) => {
                            if(res.status==='success' && UI.showToast) UI.showToast("☁️ Đã lưu Tồn kho lên Cloud!");
                        });
                    }
                };
                reader.readAsArrayBuffer(file);
            }, false);

            document.getElementById('btn-load-stock-cloud').onclick = () => {
                API.getStock((data) => {
                    STORE.importData = data; renderImportTable(); updateFilters();
                    if(UI.showToast) UI.showToast(`✅ Đã tải ${data.length} dòng từ Cloud!`);
                });
            };

            document.getElementById('btn-delete-exec').onclick = () => {
                const mode = document.getElementById('sel-delete-mode').value;
                if(mode === 'none') return;
                if(!confirm(`⚠️ Xóa dữ liệu "${mode.toUpperCase()}" của Shop "${STORE.currentShopId}"?`)) return;
                API.deleteData(mode, (res) => {
                    if(res.status === 'success') {
                        if(UI.showToast) UI.showToast("✅ " + res.msg);
                        if(mode === 'stock' || mode === 'all') { STORE.importData = []; renderImportTable(); }
                        if(mode === 'count' || mode === 'all') { STORE.serverCountData = []; STORE.myCountData = []; renderCountTable(); renderSummary(); }
                    }
                });
            };

            document.getElementById('btn-sync-cloud').onclick = () => {
                API.saveCount(STORE.myCountData, (res) => {
                    if(res.status==='success') {
                        if(UI.showToast) UI.showToast("✅ Đã đồng bộ!");
                        API.getCount((data) => { STORE.serverCountData = data; STORE.myCountData = data.filter(i => i.user === STORE.currentUser); renderCountTable(); });
                    }
                });
            };

            document.getElementById('btn-inv-close').onclick = () => { 
                if(STORE.isScannerRunning) stopScanner(); 
                modal.style.display = 'none'; 
                if(bottomNav) bottomNav.style.display = 'flex'; 
                document.body.classList.remove('tgdd-body-lock'); 
            };
            
            const tabs = modal.querySelectorAll('.inv-tab');
            tabs.forEach(t => {
                t.onclick = () => {
                    tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
                    document.querySelectorAll('.inv-view').forEach(v => v.classList.remove('active'));
                    document.getElementById(t.dataset.tab).classList.add('active');
                    if (t.dataset.tab === 'tab-count') setTimeout(() => document.getElementById('inp-search-sku').focus(), 100);
                    if (t.dataset.tab === 'tab-sum') API.getCount((data) => { STORE.serverCountData = data; renderSummary(); });
                };
            });

            document.querySelectorAll('input[name="inv-status-radio"]').forEach(r => r.onchange = (e) => { STORE.currentStatus = e.target.value; document.getElementById('inp-search-sku').value = ''; });
            document.getElementById('chk-manual-input').onchange = (e) => STORE.isManualInput = e.target.checked;
            document.getElementById('btn-open-scan').onclick = startScanner;
            document.getElementById('btn-close-scan').onclick = stopScanner;
            document.querySelectorAll('.inv-filter-select').forEach(el => el.addEventListener('change', renderSummary));

            document.getElementById('btn-edit-close-x').onclick = () => document.getElementById('inv-edit-modal').style.display = 'none';
            document.getElementById('btn-edit-save').onclick = () => {
                const qty = parseInt(document.getElementById('inp-edit-qty').value) || 0;
                if (qty < 0) return;
                const idx = STORE.myCountData.findIndex(i => i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status);
                if(qty === 0) { if(idx !== -1) STORE.myCountData.splice(idx, 1); } 
                else { if(idx !== -1) STORE.myCountData[idx].qty = qty; else STORE.myCountData.push({ ...STORE.editingItem, qty }); }
                API.saveCount(STORE.myCountData, () => { document.getElementById('inv-edit-modal').style.display = 'none'; renderCountTable(); });
            };
            document.getElementById('btn-edit-delete').onclick = () => {
                if(confirm("Xóa dòng này?")) {
                    STORE.myCountData = STORE.myCountData.filter(i => !(i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status));
                    API.saveCount(STORE.myCountData, () => { document.getElementById('inv-edit-modal').style.display = 'none'; renderCountTable(); });
                }
            };

            const searchInput = document.getElementById('inp-search-sku');
            const sugBox = document.getElementById('box-suggestions');
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();
                if (val.length < 2) { sugBox.style.display = 'none'; return; }
                const matches = STORE.importData.filter(item => item.status === STORE.currentStatus && (item.sku.toLowerCase().includes(val) || item.name.toLowerCase().includes(val))).slice(0, 10);
                if (matches.length > 0) {
                    sugBox.innerHTML = matches.map(item => `<div class="inv-sug-item" data-sku="${item.sku}"><span class="inv-sug-code">${item.sku}</span> - ${item.name}</div>`).join('');
                    sugBox.style.display = 'block';
                    sugBox.querySelectorAll('.inv-sug-item').forEach(el => {
                        el.onclick = () => { addCountItem(el.dataset.sku); searchInput.value = ''; sugBox.style.display = 'none'; searchInput.focus(); };
                    });
                } else sugBox.style.display = 'none';
            });

            // 10. Load Dữ Liệu Ban Đầu
            API.getStock((data) => {
                STORE.importData = data; renderImportTable();
                API.getCount((cData) => { STORE.serverCountData = cData; STORE.myCountData = cData.filter(i => i.user === STORE.currentUser); renderCountTable(); });
            });

        } catch (err) {
            alert("Lỗi Khởi động Tool: " + err.message);
            console.error(err);
        }

        // --- INTERNAL FUNCTIONS ---
        function normalizeStatus(raw) { if (!raw) return ""; const cleanRaw = String(raw).trim(); if (STATUS_MAP[cleanRaw]) return STATUS_MAP[cleanRaw]; for (let key in STATUS_MAP) { if (cleanRaw.includes(key) || key.includes(cleanRaw)) return STATUS_MAP[key]; } return cleanRaw; }
        function updateFilters() { const getUnique = (key) => [...new Set(STORE.importData.map(i => i[key]))].filter(Boolean); const fillSelect = (col, vals) => { const sel = document.querySelector(`.inv-filter-select[data-col="${col}"]`); const options = ['all', ...vals]; if(sel) sel.innerHTML = options.map(v => `<option value="${v}">${v==='all'?'Tất cả':v}</option>`).join(''); }; fillSelect('status', getUnique('status')); fillSelect('group', getUnique('group')); fillSelect('name', getUnique('name').sort()); }
        function renderImportTable() { const tbody = document.querySelector('#tbl-import tbody'); let html = ''; STORE.importData.slice(0, 200).forEach((item, idx) => { html += `<tr><td>${idx+1}</td><td>${item.group}</td><td style="font-weight:bold;color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${item.stock}</td></tr>`; }); tbody.innerHTML = html; }
        function renderCountTable() { const tbody = document.querySelector('#tbl-counting tbody'); let html = ''; STORE.myCountData.forEach((item, idx) => { html += `<tr data-idx="${idx}"><td style="font-weight:bold;color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td style="font-weight:bold;font-size:14px;color:#007bff">${item.qty}</td><td><button style="cursor:pointer" onclick="document.getElementById('btn-edit-row-${idx}').click()">Sửa</button><button id="btn-edit-row-${idx}" style="display:none"></button></td></tr>`; }); tbody.innerHTML = html; STORE.myCountData.forEach((item, idx) => { document.getElementById(`btn-edit-row-${idx}`).onclick = () => { STORE.editingItem = {...item}; document.getElementById('edit-prod-name').innerText = item.name; document.getElementById('edit-prod-sku').innerText = item.sku; document.getElementById('edit-prod-status').innerText = item.status; document.getElementById('inp-edit-qty').value = item.qty; document.getElementById('inv-edit-modal').style.display = 'flex'; document.getElementById('inp-edit-qty').focus(); }; }); }
        function renderSummary() { const aggMap = {}; STORE.serverCountData.forEach(rec => { const key = `${rec.sku}|${rec.status}`; if (!aggMap[key]) aggMap[key] = { qty: 0, details: [] }; aggMap[key].qty += (parseInt(rec.qty) || 0); aggMap[key].details.push(`${rec.user}: ${rec.qty}`); }); const fGroup = document.querySelector('.inv-filter-select[data-col="group"]').value; const fName = document.querySelector('.inv-filter-select[data-col="name"]').value; const fStatus = document.querySelector('.inv-filter-select[data-col="status"]').value; const fDiff = document.querySelector('.inv-filter-select[data-col="diff"]').value; const tbody = document.querySelector('#tbl-summary tbody'); let html = ''; STORE.importData.forEach(item => { if (fGroup !== 'all' && item.group !== fGroup) return; if (fName !== 'all' && item.name !== fName) return; if (fStatus !== 'all' && item.status !== fStatus) return; const agg = aggMap[`${item.sku}|${item.status}`] || { qty: 0, details: [] }; const diff = item.stock - agg.qty; if (fDiff === 'ok' && diff !== 0) return; if (fDiff === 'fail' && diff === 0) return; if (fDiff === 'thua' && diff >= 0) return; if (fDiff === 'thieu' && diff <= 0) return; let diffText = `<span class="st-ok">0</span>`; if (diff > 0) diffText = `<span class="st-missing">Thiếu ${diff}</span>`; else if (diff < 0) diffText = `<span class="st-surplus">Thừa ${Math.abs(diff)}</span>`; const users = [...new Set(agg.details.map(d => d.split(':')[0].trim()))].join(', '); html += `<tr style="${agg.qty===0?'background:#fff5f5':''}"><td>${item.group}</td><td style="font-weight:bold;">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${item.stock}</td><td style="font-weight:bold;">${agg.qty}</td><td>${diffText}</td><td title="${agg.details.join('\n')}" style="font-size:10px; cursor:help;">${users}</td></tr>`; }); tbody.innerHTML = html; }
        function addCountItem(sku) { const stockItem = STORE.importData.find(i => i.sku === sku && i.status === STORE.currentStatus); if (!stockItem) { if(UI.showToast) UI.showToast(`⚠️ Mã ${sku} (${STORE.currentStatus}) không có trong tồn kho!`); return; } let qty = 1; if (STORE.isManualInput) { const i = prompt(`SL cho ${stockItem.name}?`, "1"); if(i===null) return; qty = parseInt(i)||0; if(qty<=0) return; } const exist = STORE.myCountData.find(i => i.sku === sku && i.status === STORE.currentStatus); if (exist) { exist.qty += qty; } else { STORE.myCountData.unshift({ user: STORE.currentUser, sku: stockItem.sku, name: stockItem.name, status: stockItem.status, qty: qty, group: stockItem.group }); } renderCountTable(); if(UI.showToast) UI.showToast(`Đã thêm ${qty}: ${stockItem.name}`); }
        function startScanner() { const overlay = document.getElementById('inv-scanner-overlay'); if(STORE.isScannerRunning) return; overlay.style.display = 'flex'; STORE.isScannerRunning = true; const html5QrCode = new Html5Qrcode("inv-reader"); STORE.scannerObj = html5QrCode; html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, (txt) => { if(navigator.vibrate) navigator.vibrate(200); addCountItem(txt); stopScanner(); }, () => {}).catch(err => { alert("Lỗi Camera"); stopScanner(); }); }
        function stopScanner() { const overlay = document.getElementById('inv-scanner-overlay'); if (STORE.scannerObj) { STORE.scannerObj.stop().then(() => { STORE.scannerObj.clear(); STORE.scannerObj = null; STORE.isScannerRunning = false; overlay.style.display = 'none'; }).catch(()=>{}); } else { overlay.style.display = 'none'; STORE.isScannerRunning = false; } }
    };

    return { name: "Kiểm kê (Enterprise)", icon: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="white"/></svg>`, bgColor: "#6610f2", css: MY_CSS, action: runTool };
})
