/* 
   MODULE: KIỂM KÊ KHO (INVENTORY) - V2.6
   - Fix: Mất gợi ý (Do xung đột phiên bản cũ).
   - Fix: Nút Lưu không hoạt động (Tích hợp bản vá).
   - Fix: Focus nhầm tab.
   - UI: Nâng cấp Z-Index bảng gợi ý.
*/
((context) => {
    const { UI, UTILS } = context;

    // --- 1. CSS ---
    const MY_CSS = `
        #tgdd-inventory-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483646; justify-content:center; align-items:center; }
        
        /* RESPONSIVE LAYOUT */
        .inv-content { background:#fff; width:98%; max-width:1100px; height:92vh; border-radius:15px; box-shadow:0 20px 60px rgba(0,0,0,0.4); display:flex; flex-direction:column; overflow:hidden; animation: popIn 0.3s; font-family: sans-serif; position: relative; }
        @media (max-width: 768px) {
            .inv-content { width: 100% !important; height: 100% !important; max-width: none !important; border-radius: 0 !important; }
        }

        /* HEADER & TABS */
        .inv-header { display:flex; background:#f8f9fa; border-bottom:1px solid #ddd; padding:0 10px; align-items:center; justify-content:space-between; height: 50px; flex-shrink: 0; }
        .inv-title { font-weight:800; font-size:16px; color:#333; display:flex; align-items:center; gap:5px; }
        .inv-close { font-size:24px; cursor:pointer; color:#999; padding:0 15px; font-weight:bold; transition: 0.2s; } .inv-close:hover { color:red; transform: scale(1.1); }
        
        .inv-tabs { display:flex; gap:5px; height:100%; align-items:flex-end; }
        .inv-tab { padding:10px 20px; cursor:pointer; font-weight:bold; color:#666; border-bottom:3px solid transparent; transition:0.2s; font-size:13px; white-space:nowrap; }
        .inv-tab:hover { background:#eee; }
        .inv-tab.active { color:#007bff; border-bottom:3px solid #007bff; background:white; border-radius: 5px 5px 0 0; }

        /* BODY */
        .inv-body { flex:1; overflow:hidden; position:relative; background:white; }
        .inv-view { display:none; height:100%; flex-direction:column; padding:15px; box-sizing:border-box; }
        .inv-view.active { display:flex; }

        /* RADIO STATUS */
        .inv-status-group { display:flex; flex-wrap:wrap; gap:8px; padding:10px; background:#f1f8ff; border-radius:8px; margin-bottom:15px; border:1px solid #cce5ff; }
        .inv-radio-lbl { font-size:11px; font-weight:bold; color:#0056b3; cursor:pointer; display:flex; align-items:center; gap:5px; background:white; padding:6px 12px; border-radius:15px; border:1px solid #b8daff; transition:0.2s; }
        .inv-radio-lbl:hover { background:#e2e6ea; }
        .inv-radio-lbl:has(input:checked) { background:#007bff; color:white; border-color:#0056b3; box-shadow:0 2px 5px rgba(0,123,255,0.3); }
        .inv-radio-lbl input { display:none; }

        /* TABLE */
        .inv-table-wrapper { flex:1; overflow:auto; border:1px solid #eee; border-radius:8px; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); }
        .inv-table { width:100%; border-collapse:collapse; font-size:12px; }
        .inv-table th { background:#f1f1f1; position:sticky; top:0; z-index:10; padding:10px; text-align:left; border-bottom:2px solid #ddd; color:#444; vertical-align: top; white-space: nowrap; }
        .inv-table td { padding:8px 10px; border-bottom:1px solid #eee; color:#333; }
        .inv-table tr:hover { background:#f9f9f9; cursor: pointer; }
        .inv-table tr.highlight { background:#fff9c4; animation: highlightFade 2s forwards; }
        @keyframes highlightFade { from {background:#fff9c4;} to {background:transparent;} }

        /* STATUS COLORS */
        .st-surplus { color:#28a745; font-weight:bold; }
        .st-missing { color:#dc3545; font-weight:bold; }
        .st-ok { color:#007bff; font-weight:bold; }

        /* CONTROLS & SEARCH */
        .inv-controls { display:flex; gap:5px; margin-bottom:15px; align-items:center; flex-wrap: nowrap; }
        .inv-input { padding:8px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
        
        .inv-search-box { position:relative; flex: 1; min-width: 0; } 
        #inp-search-sku { width: 100%; box-sizing: border-box; }

        .inv-btn { padding:8px 12px; border:none; border-radius:6px; font-weight:bold; color:white; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s; white-space:nowrap; font-size: 13px; }
        .inv-btn:active { transform:scale(0.95); }
        .btn-import { background:#28a745; }
        .btn-scan { background:#343a40; }
        
        .inv-chk-manual { font-size:12px; font-weight:bold; color:#555; display:flex; align-items:center; gap:4px; cursor:pointer; padding:0 5px; white-space: nowrap; user-select: none; }
        .inv-chk-manual input { width:16px; height:16px; accent-color:#007bff; cursor:pointer; }

        /* SUGGESTIONS - Fix Z-Index */
        .inv-suggestions { position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #ddd; border-radius:0 0 8px 8px; box-shadow:0 10px 20px rgba(0,0,0,0.2); z-index:2000; max-height:300px; overflow-y:auto; display:none; }
        .inv-sug-item { padding:10px; border-bottom:1px solid #f0f0f0; cursor:pointer; font-size:12px; }
        .inv-sug-item:hover { background:#f0f8ff; color:#007bff; }
        .inv-sug-code { font-weight:bold; color:#d63031; }

        /* EDIT MODAL */
        #inv-edit-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2147483650; justify-content:center; align-items:center; backdrop-filter:blur(2px); }
        .inv-edit-content { background:white; width:90%; max-width:400px; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); animation: popIn 0.2s; }
        .inv-edit-header { font-weight:bold; font-size:16px; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px; color:#333; }
        .inv-edit-list { max-height:200px; overflow-y:auto; border:1px solid #eee; border-radius:6px; margin-bottom:15px; }
        .inv-edit-item { display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #f9f9f9; align-items:center; font-size:13px; }
        .inv-edit-input { width:60px; padding:4px; text-align:center; border:1px solid #ccc; border-radius:4px; }
        .inv-edit-actions { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
        .inv-btn-del-all { background:#dc3545; flex:1; justify-content:center; }
        .inv-btn-fill { background:#28a745; flex:1; justify-content:center; }
        .inv-btn-save { background:#007bff; flex:1; justify-content:center; }

        /* FILTERS */
        .inv-filter-select { padding:4px; border:1px solid #ccc; border-radius:4px; font-size:11px; width:100%; box-sizing:border-box; margin-top:4px; }
        
        /* SCANNER */
        #inv-scanner-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:black; z-index:200; display:none; flex-direction:column; }
        #inv-reader { width:100%; height:100%; object-fit:cover; }
        .inv-scan-close { position:absolute; top:20px; right:20px; background:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; z-index:201; box-shadow:0 0 10px rgba(0,0,0,0.5); }
    `;

    // --- 2. GLOBAL STATE ---
    let STORE = {
        importData: [], 
        countData: [],
        currentStatus: "Mới",
        isScannerRunning: false,
        scannerObj: null,
        editingItem: null,
        isManualInput: false
    };

    const STATUS_MAP = {
        "1-Mới": "Mới",
        "3-Trưng bày": "Trưng bày",
        "7-Trưng bày (bỏ mẫu)": "Trưng bày bỏ mẫu",
        "2-Đã sử dụng": "Đã sử dụng",
        "5-Lỗi (Mới)": "Lỗi (Mới)",
        "6Lỗi (ĐSD)": "Lỗi (Đã sử dụng)",
        "6-Lỗi (ĐSD)": "Lỗi (Đã sử dụng)",
        "7-Cũ thu mua": "Cũ thu mua",
        "8-Mới (Giảm giá)": "Mới (Giảm giá)"
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

    // --- 3. MAIN LOGIC ---
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';

        const modalId = 'tgdd-inventory-modal';
        
        // CLEANUP: Xóa modal cũ nếu tồn tại để đảm bảo logic mới nhất được áp dụng
        const oldModal = document.getElementById(modalId);
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.innerHTML = `
            <div class="inv-content">
                <div class="inv-header">
                    <div class="inv-title">📦 KIỂM KÊ HÀNG HÓA</div>
                    <div class="inv-tabs">
                        <div class="inv-tab active" data-tab="tab-input">Nhập liệu</div>
                        <div class="inv-tab" data-tab="tab-count">Kiểm kê</div>
                        <div class="inv-tab" data-tab="tab-sum">Tổng hợp</div>
                    </div>
                    <div class="inv-close" id="btn-inv-close" title="Đóng">×</div>
                </div>

                <div class="inv-body">
                    <!-- TAB 1: NHẬP LIỆU -->
                    <div class="inv-view active" id="tab-input">
                        <div class="inv-controls">
                            <label class="inv-btn btn-import">
                                📂 Chọn file Excel
                                <input type="file" id="inp-excel-file" accept=".xlsx, .xls" style="display:none;">
                            </label>
                            <span id="lbl-file-name" style="font-size:12px; color:#666;">Chưa có dữ liệu</span>
                        </div>
                        <div class="inv-table-wrapper">
                            <table class="inv-table" id="tbl-import">
                                <thead><tr><th>#</th><th>Nhóm</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn kho</th></tr></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TAB 2: KIỂM KÊ -->
                    <div class="inv-view" id="tab-count">
                        <div class="inv-status-group" id="inv-status-container"></div>

                        <div class="inv-controls">
                            <div class="inv-search-box">
                                <input type="text" id="inp-search-sku" class="inv-input" placeholder="Nhập tên/mã..." autocomplete="off">
                                <div class="inv-suggestions" id="box-suggestions"></div>
                            </div>
                            <label class="inv-chk-manual">
                                <input type="checkbox" id="chk-manual-input"> Nhập tay
                            </label>
                            <button class="inv-btn btn-scan" id="btn-open-scan">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M3 4H5V20H3V4ZM7 4H8V20H7V4ZM10 4H12V20H10V4ZM14 4H15V20H14V4ZM17 4H19V20H17V4ZM21 4H22V20H21V4Z"/></svg>
                                Quét mã
                            </button>
                        </div>
                        
                        <div class="inv-table-wrapper">
                            <table class="inv-table" id="tbl-counting">
                                <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn</th><th>Đã kiểm</th><th>Lệch</th></tr></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                        <div id="inv-scanner-overlay">
                            <div class="inv-scan-close" id="btn-close-scan">×</div>
                            <div id="inv-reader"></div>
                        </div>
                    </div>

                    <!-- TAB 3: TỔNG HỢP -->
                    <div class="inv-view" id="tab-sum">
                        <div class="inv-table-wrapper">
                            <table class="inv-table" id="tbl-summary">
                                <thead>
                                    <tr>
                                        <th>Nhóm hàng<br><select class="inv-filter-select" data-col="group"><option value="all">Tất cả</option></select></th>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm<br><select class="inv-filter-select" data-col="name"><option value="all">Tất cả</option></select></th>
                                        <th>Trạng thái<br><select class="inv-filter-select" data-col="status"><option value="all">Tất cả</option></select></th>
                                        <th>Tồn kho</th>
                                        <th>Kiểm được<br><select class="inv-filter-select" data-col="count"><option value="all">All</option><option value="checked">Rồi</option><option value="unchecked">Chưa</option></select></th>
                                        <th>Chênh lệch<br><select class="inv-filter-select" data-col="diff"><option value="all">All</option><option value="ok">Đủ</option><option value="fail">Lệch</option><option value="thua">Thừa</option><option value="thieu">Thiếu</option></select></th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- EDIT POPUP -->
            <div id="inv-edit-modal">
                <div class="inv-edit-content">
                    <div class="inv-edit-header">Điều chỉnh số lượng</div>
                    <div style="font-size:13px; margin-bottom:5px;">Sản phẩm: <b id="edit-prod-name">...</b></div>
                    <div style="font-size:12px; color:#666; margin-bottom:10px;">Mã: <span id="edit-prod-sku"></span> | Trạng thái: <span id="edit-prod-status"></span></div>
                    <div style="font-size:12px; color:blue; margin-bottom:10px;">Tồn kho: <b id="edit-prod-stock">0</b> | Đã kiểm: <b id="edit-prod-count">0</b></div>
                    
                    <div class="inv-edit-list" id="edit-history-list"></div>
                    
                    <div class="inv-edit-actions">
                        <button class="inv-btn inv-btn-del-all" id="btn-edit-delete">🗑️ Xóa</button>
                        <button class="inv-btn inv-btn-fill" id="btn-edit-fill" style="display:none;">⚡ Nhập đủ</button>
                        <button class="inv-btn inv-btn-save" id="btn-edit-save">Lưu</button>
                    </div>
                    <div style="text-align:center; margin-top:10px;"><a href="#" id="btn-edit-cancel" style="font-size:12px; color:#999;">Hủy bỏ</a></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const statusList = ["Mới", "Trưng bày", "Trưng bày bỏ mẫu", "Đã sử dụng", "Lỗi (Mới)", "Lỗi (Đã sử dụng)", "Cũ thu mua", "Mới (Giảm giá)"];
        const radioContainer = document.getElementById('inv-status-container');
        statusList.forEach((st, idx) => {
            const checked = idx === 0 ? 'checked' : '';
            radioContainer.innerHTML += `
                <label class="inv-radio-lbl">
                    <input type="radio" name="inv-status-radio" value="${st}" ${checked}> ${st}
                </label>`;
        });

        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
            await loadScript('https://unpkg.com/html5-qrcode');
        } catch (e) { alert("Lỗi tải thư viện!"); }

        // EVENTS
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
                // Fix focus đúng tab
                if (t.dataset.tab === 'tab-count') setTimeout(() => document.getElementById('inp-search-sku').focus(), 100);
                if (t.dataset.tab === 'tab-sum') renderSummary();
            };
        });

        document.querySelectorAll('input[name="inv-status-radio"]').forEach(r => {
            r.onchange = (e) => {
                STORE.currentStatus = e.target.value;
                document.getElementById('inp-search-sku').value = ''; 
                document.getElementById('box-suggestions').style.display = 'none';
            };
        });

        document.getElementById('chk-manual-input').onchange = (e) => {
            STORE.isManualInput = e.target.checked;
        };

        document.getElementById('inp-excel-file').addEventListener('change', handleFileImport, false);

        const searchInput = document.getElementById('inp-search-sku');
        const sugBox = document.getElementById('box-suggestions');
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (val.length < 2) { sugBox.style.display = 'none'; return; }
            
            const matches = STORE.importData.filter(item => 
                item.status === STORE.currentStatus && 
                (item.sku.toLowerCase().includes(val) || item.name.toLowerCase().includes(val))
            ).slice(0, 10);

            if (matches.length > 0) {
                sugBox.innerHTML = matches.map(item => `
                    <div class="inv-sug-item" data-sku="${item.sku}">
                        <span class="inv-sug-code">${item.sku}</span> - ${item.name} <span style="font-size:10px;color:#999">(${item.stock})</span>
                    </div>
                `).join('');
                sugBox.style.display = 'block';
                sugBox.querySelectorAll('.inv-sug-item').forEach(el => {
                    el.onclick = () => {
                        addCountItem(el.dataset.sku);
                        searchInput.value = '';
                        sugBox.style.display = 'none';
                        searchInput.focus();
                    };
                });
            } else sugBox.style.display = 'none';
        });
        document.addEventListener('click', (e) => { if (!e.target.closest('.inv-search-box')) sugBox.style.display = 'none'; });

        document.getElementById('btn-open-scan').onclick = startScanner;
        document.getElementById('btn-close-scan').onclick = stopScanner;

        document.querySelectorAll('.inv-filter-select').forEach(el => el.addEventListener('change', renderSummary));

        // EDIT MODAL ACTIONS
        document.getElementById('btn-edit-cancel').onclick = () => document.getElementById('inv-edit-modal').style.display = 'none';
        
        document.getElementById('btn-edit-delete').onclick = () => {
            if(confirm("Xóa sản phẩm này khỏi danh sách đã kiểm?")) {
                STORE.countData = STORE.countData.filter(i => !(i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status));
                document.getElementById('inv-edit-modal').style.display = 'none';
                renderCountTable();
                renderSummary(); 
            }
        };

        document.getElementById('btn-edit-fill').onclick = () => {
            const item = STORE.editingItem;
            const missing = item.stock - item.totalCount;
            if (missing > 0) {
                if(confirm(`Xác nhận nhập thêm ${missing} cái để đủ tồn kho?`)) {
                    const nowTime = new Date().toTimeString().split(' ')[0];
                    const existIdx = STORE.countData.findIndex(i => i.sku === item.sku && i.status === item.status);
                    if (existIdx === -1) {
                        STORE.countData.unshift({
                            ...item,
                            history: [{ ts: nowTime, qty: missing }],
                            totalCount: missing,
                            counted: missing 
                        });
                    } else {
                        const realItem = STORE.countData[existIdx];
                        realItem.history.unshift({ ts: nowTime, qty: missing });
                        realItem.totalCount += missing;
                    }
                    
                    document.getElementById('inv-edit-modal').style.display = 'none';
                    renderCountTable();
                    renderSummary();
                    UI.showToast("Đã nhập đủ!");
                }
            }
        };

        // --- FIXED SAVE BUTTON ---
        document.getElementById('btn-edit-save').onclick = () => {
            const inputs = document.querySelectorAll('.inv-history-qty');
            let newHistory = [];
            let newTotal = 0;
            const nowTime = new Date().toTimeString().split(' ')[0];

            inputs.forEach((inp, idx) => {
                const val = parseInt(inp.value) || 0;
                if (val > 0) {
                    let currentTs = nowTime;
                    if (STORE.editingItem.history && STORE.editingItem.history[idx]) {
                        currentTs = STORE.editingItem.history[idx].ts;
                    }
                    newHistory.push({ ts: currentTs, qty: val });
                    newTotal += val;
                }
            });

            if (newTotal === 0) {
                if(confirm("Số lượng bằng 0. Xóa sản phẩm khỏi danh sách?")) {
                    STORE.countData = STORE.countData.filter(i => !(i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status));
                } else return;
            } else {
                const existIdx = STORE.countData.findIndex(i => i.sku === STORE.editingItem.sku && i.status === STORE.editingItem.status);
                if (existIdx !== -1) {
                    STORE.countData[existIdx].history = newHistory;
                    STORE.countData[existIdx].totalCount = newTotal;
                } else {
                    STORE.countData.unshift({
                        ...STORE.editingItem,
                        history: newHistory,
                        totalCount: newTotal
                    });
                }
            }
            
            document.getElementById('inv-edit-modal').style.display = 'none';
            renderCountTable();
            renderSummary();
            UI.showToast("Đã lưu!");
        };

        // --- FUNCTIONS ---
        function normalizeStatus(raw) {
            if (!raw) return "";
            const cleanRaw = String(raw).trim();
            if (STATUS_MAP[cleanRaw]) return STATUS_MAP[cleanRaw];
            for (let key in STATUS_MAP) { if (cleanRaw.includes(key) || key.includes(cleanRaw)) return STATUS_MAP[key]; }
            return cleanRaw; 
        }

        function handleFileImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('lbl-file-name').innerText = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                
                STORE.importData = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[6]) { 
                        STORE.importData.push({
                            group: row[4] || '',
                            sku: String(row[6]).trim(),
                            name: row[7] || '',
                            status: normalizeStatus(row[8]),
                            stock: parseInt(row[9]) || 0
                        });
                    }
                }
                renderImportTable();
                UI.showToast(`✅ Đã nhập ${STORE.importData.length} dòng!`);
                updateFilters();
            };
            reader.readAsArrayBuffer(file);
        }

        function updateFilters() {
            const getUnique = (key) => [...new Set(STORE.importData.map(i => i[key]))].filter(Boolean);
            const fillSelect = (col, vals) => {
                const sel = document.querySelector(`.inv-filter-select[data-col="${col}"]`);
                const options = ['all', ...vals]; 
                if(sel) sel.innerHTML = options.map(v => `<option value="${v}">${v === 'all' ? 'Tất cả' : v}</option>`).join('');
            };
            fillSelect('status', getUnique('status'));
            fillSelect('group', getUnique('group'));
            fillSelect('name', getUnique('name').sort());
        }

        function renderImportTable() {
            const tbody = document.querySelector('#tbl-import tbody');
            let html = '';
            STORE.importData.slice(0, 200).forEach((item, idx) => {
                html += `<tr><td>${idx+1}</td><td>${item.group}</td><td style="font-weight:bold;color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td>${item.stock}</td></tr>`;
            });
            tbody.innerHTML = html;
        }

        function addCountItem(sku) {
            const stockItem = STORE.importData.find(i => i.sku === sku && i.status === STORE.currentStatus);
            if (!stockItem) { UI.showToast(`⚠️ Không tìm thấy mã ${sku} với trạng thái ${STORE.currentStatus}`); return; }

            let qty = 1;
            if (STORE.isManualInput) {
                const inputQty = prompt(`Nhập số lượng cho: ${stockItem.name}`, "1");
                if (inputQty === null) return; 
                qty = parseInt(inputQty) || 0;
                if (qty <= 0) return;
            }

            const existItem = STORE.countData.find(i => i.sku === sku && i.status === STORE.currentStatus);
            const nowTime = new Date().toTimeString().split(' ')[0];

            if (existItem) {
                existItem.history.unshift({ ts: nowTime, qty: qty });
                existItem.totalCount += qty;
                STORE.countData = STORE.countData.filter(i => i !== existItem);
                STORE.countData.unshift(existItem);
            } else {
                STORE.countData.unshift({
                    ...stockItem,
                    history: [{ ts: nowTime, qty: qty }],
                    totalCount: qty
                });
            }
            renderCountTable();
            UI.showToast(`Đã thêm ${qty}: ${stockItem.name}`);
        }

        function openEditPopup(item) {
            const modal = document.getElementById('inv-edit-modal');
            const list = document.getElementById('edit-history-list');
            
            let realItem = STORE.countData.find(i => i.sku === item.sku && i.status === item.status);
            if (!realItem) {
                const importItem = STORE.importData.find(i => i.sku === item.sku && i.status === item.status);
                realItem = { ...importItem, history: [], totalCount: 0 };
            }
            STORE.editingItem = realItem;

            document.getElementById('edit-prod-name').innerText = realItem.name;
            document.getElementById('edit-prod-sku').innerText = realItem.sku;
            document.getElementById('edit-prod-status').innerText = realItem.status;
            document.getElementById('edit-prod-stock').innerText = realItem.stock;
            document.getElementById('edit-prod-count').innerText = realItem.totalCount;

            const btnFill = document.getElementById('btn-edit-fill');
            if (realItem.totalCount < realItem.stock) {
                btnFill.style.display = 'flex';
                btnFill.innerText = `⚡ Nhập đủ (+${realItem.stock - realItem.totalCount})`;
            } else {
                btnFill.style.display = 'none';
            }

            let html = '';
            if (realItem.history.length === 0) {
                html = '<div style="text-align:center; padding:10px; color:#999; font-style:italic;">Chưa có lịch sử nhập.</div>';
            } else {
                realItem.history.forEach((h, idx) => {
                    html += `
                        <div class="inv-edit-item">
                            <span>Lần nhập lúc ${h.ts}</span>
                            <input type="number" class="inv-edit-input inv-history-qty" value="${h.qty}" min="0">
                        </div>`;
                });
            }
            // Dòng nhập mới luôn hiển thị
            html += `<div class="inv-edit-item" style="background:#e3f2fd">
                        <span style="font-weight:bold; color:#007bff">Nhập mới:</span>
                        <input type="number" class="inv-edit-input inv-history-qty" value="" placeholder="SL" min="1">
                     </div>`;

            list.innerHTML = html;
            modal.style.display = 'flex';
        }

        function renderCountTable() {
            const tbody = document.querySelector('#tbl-counting tbody');
            let html = '';
            STORE.countData.forEach((item, idx) => {
                const diff = item.stock - item.totalCount;
                let diffText = `<span class="st-ok">Đủ</span>`;
                if (diff > 0) diffText = `<span class="st-missing">Thiếu ${diff}</span>`;
                else if (diff < 0) diffText = `<span class="st-surplus">Thừa ${Math.abs(diff)}</span>`;

                html += `<tr class="${idx===0?'highlight':''}">
                    <td style="font-weight:bold;color:#d63031">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.status}</td>
                    <td>${item.stock}</td>
                    <td style="font-weight:bold;font-size:14px;color:#007bff">${item.totalCount}</td>
                    <td>${diffText}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
            tbody.querySelectorAll('tr').forEach((tr, idx) => {
                tr.onclick = () => { openEditPopup(STORE.countData[idx]); };
            });
        }

        function renderSummary() {
            const fGroup = document.querySelector('.inv-filter-select[data-col="group"]').value;
            const fName = document.querySelector('.inv-filter-select[data-col="name"]').value;
            const fStatus = document.querySelector('.inv-filter-select[data-col="status"]').value;
            const fCount = document.querySelector('.inv-filter-select[data-col="count"]').value;
            const fDiff = document.querySelector('.inv-filter-select[data-col="diff"]').value;

            const tbody = document.querySelector('#tbl-summary tbody');
            let html = '';

            STORE.importData.forEach(item => {
                if (fGroup !== 'all' && item.group !== fGroup) return;
                if (fName !== 'all' && item.name !== fName) return;
                if (fStatus !== 'all' && item.status !== fStatus) return;

                const countedItem = STORE.countData.find(c => c.sku === item.sku && c.status === item.status);
                const countedVal = countedItem ? countedItem.totalCount : 0;
                
                const diff = item.stock - countedVal;

                if (fCount === 'checked' && countedVal === 0) return;
                if (fCount === 'unchecked' && countedVal > 0) return;
                if (fDiff === 'ok' && diff !== 0) return;
                if (fDiff === 'fail' && diff === 0) return;
                if (fDiff === 'thua' && diff >= 0) return; 
                if (fDiff === 'thieu' && diff <= 0) return; 

                let diffText = `<span class="st-ok">0</span>`;
                if (diff > 0) diffText = `<span class="st-missing">Thiếu ${diff}</span>`;
                else if (diff < 0) diffText = `<span class="st-surplus">Thừa ${Math.abs(diff)}</span>`;

                const bgRow = countedVal === 0 ? 'background:#fff5f5;' : '';

                html += `<tr style="${bgRow}" data-sku="${item.sku}" data-status="${item.status}">
                    <td>${item.group}</td>
                    <td style="font-weight:bold;">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.status}</td>
                    <td>${item.stock}</td>
                    <td style="font-weight:bold;">${countedVal}</td>
                    <td>${diffText}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.onclick = () => { openEditPopup({ sku: tr.dataset.sku, status: tr.dataset.status }); };
            });
        }

        function startScanner() {
            const overlay = document.getElementById('inv-scanner-overlay');
            if(STORE.isScannerRunning) return;
            overlay.style.display = 'flex';
            STORE.isScannerRunning = true;
            const html5QrCode = new Html5Qrcode("inv-reader");
            STORE.scannerObj = html5QrCode;
            html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    if (navigator.vibrate) navigator.vibrate(200);
                    addCountItem(decodedText);
                    stopScanner();
                }, () => {}).catch(err => { alert("Lỗi Camera: " + err); stopScanner(); });
        }

        function stopScanner() {
            const overlay = document.getElementById('inv-scanner-overlay');
            if (STORE.scannerObj) {
                STORE.scannerObj.stop().then(() => {
                    STORE.scannerObj.clear(); STORE.scannerObj = null; STORE.isScannerRunning = false; overlay.style.display = 'none';
                }).catch(() => {});
            } else { overlay.style.display = 'none'; STORE.isScannerRunning = false; }
        }

        modal.style.display = 'flex';
        if(STORE.importData.length > 0) modal.querySelector('.inv-tab[data-tab="tab-count"]').click();
        else modal.querySelector('.inv-tab[data-tab="tab-input"]').click();
    };

    return {
        name: "Kiểm kê V1",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="white"/></svg>`,
        bgColor: "#6c757d",
        css: MY_CSS,
        action: runTool
    };
})
