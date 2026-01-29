/* 
   MODULE: KIỂM KÊ KHO (INVENTORY)
   - Import Excel (SheetJS).
   - Kiểm kê: Search gợi ý, Scan Barcode, Cộng dồn số lượng.
   - Tổng hợp: Báo cáo chênh lệch, Filter dữ liệu.
*/
((context) => {
    const { UI, UTILS } = context;

    // --- 1. CSS ---
    const MY_CSS = `
        #tgdd-inventory-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(5px); z-index:2147483646; justify-content:center; align-items:center; }
        .inv-content { background:#fff; width:98%; max-width:900px; height:90vh; border-radius:15px; box-shadow:0 20px 60px rgba(0,0,0,0.4); display:flex; flex-direction:column; overflow:hidden; animation: popIn 0.3s; font-family: sans-serif; }
        
        /* HEADER & TABS */
        .inv-header { display:flex; background:#f8f9fa; border-bottom:1px solid #ddd; padding:0 10px; align-items:center; justify-content:space-between; height: 50px; flex-shrink: 0; }
        .inv-title { font-weight:800; font-size:16px; color:#333; display:flex; align-items:center; gap:5px; }
        .inv-close { font-size:24px; cursor:pointer; color:#999; padding:0 10px; } .inv-close:hover { color:red; }
        
        .inv-tabs { display:flex; gap:5px; height:100%; align-items:flex-end; }
        .inv-tab { padding:10px 20px; cursor:pointer; font-weight:bold; color:#666; border-bottom:3px solid transparent; transition:0.2s; font-size:13px; }
        .inv-tab:hover { background:#eee; }
        .inv-tab.active { color:#007bff; border-bottom:3px solid #007bff; background:white; border-radius: 5px 5px 0 0; }

        /* BODY VIEWS */
        .inv-body { flex:1; overflow:hidden; position:relative; background:white; }
        .inv-view { display:none; height:100%; flex-direction:column; padding:15px; box-sizing:border-box; }
        .inv-view.active { display:flex; }

        /* TABLE STYLES */
        .inv-table-wrapper { flex:1; overflow:auto; border:1px solid #eee; border-radius:8px; box-shadow:inset 0 0 10px rgba(0,0,0,0.05); }
        .inv-table { width:100%; border-collapse:collapse; font-size:12px; }
        .inv-table th { background:#f1f1f1; position:sticky; top:0; z-index:10; padding:10px; text-align:left; border-bottom:2px solid #ddd; color:#444; }
        .inv-table td { padding:8px 10px; border-bottom:1px solid #eee; color:#333; }
        .inv-table tr:hover { background:#f9f9f9; }
        .inv-table tr.highlight { background:#e3f2fd; animation: highlightFade 2s forwards; }
        @keyframes highlightFade { from {background:#fff9c4;} to {background:transparent;} }

        /* STATUS COLORS */
        .st-thua { color:#28a745; font-weight:bold; }
        .st-thieu { color:#dc3545; font-weight:bold; }
        .st-du { color:#007bff; font-weight:bold; }

        /* INPUTS & CONTROLS */
        .inv-controls { display:flex; gap:10px; margin-bottom:15px; align-items:center; }
        .inv-input { padding:10px; border:1px solid #ccc; border-radius:6px; flex:1; font-size:14px; }
        .inv-btn { padding:10px 15px; border:none; border-radius:6px; font-weight:bold; color:white; cursor:pointer; display:flex; align-items:center; gap:5px; transition:0.2s; white-space:nowrap; }
        .inv-btn:active { transform:scale(0.95); }
        .btn-import { background:#28a745; }
        .btn-scan { background:#343a40; }
        
        /* SUGGESTIONS DROPDOWN */
        .inv-search-box { position:relative; flex:1; }
        .inv-suggestions { position:absolute; top:100%; left:0; width:100%; background:white; border:1px solid #ddd; border-radius:0 0 8px 8px; box-shadow:0 10px 20px rgba(0,0,0,0.1); z-index:100; max-height:300px; overflow-y:auto; display:none; }
        .inv-sug-item { padding:10px; border-bottom:1px solid #f0f0f0; cursor:pointer; font-size:12px; }
        .inv-sug-item:hover { background:#f0f8ff; color:#007bff; }
        .inv-sug-code { font-weight:bold; color:#d63031; }
        .inv-sug-name { font-weight:bold; }

        /* SCANNER OVERLAY */
        #inv-scanner-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:black; z-index:200; display:none; flex-direction:column; }
        #inv-reader { width:100%; height:100%; object-fit:cover; }
        .inv-scan-close { position:absolute; top:20px; right:20px; background:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; z-index:201; box-shadow:0 0 10px rgba(0,0,0,0.5); }

        /* FILTERS */
        .inv-filter-select { padding:5px; border:1px solid #ccc; border-radius:4px; font-size:11px; max-width:100px; }
    `;

    // --- 2. GLOBAL STATE ---
    // Lưu trữ dữ liệu trong RAM. Nếu muốn lưu lâu dài cần localStorage.
    let STORE = {
        importData: [], // Dữ liệu từ Excel
        countData: [],  // Dữ liệu đã kiểm kê: [{ sku, name, status, stock, counted }]
        isScannerRunning: false,
        scannerObj: null
    };

    // Helper: Load Script
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
        const modalId = 'tgdd-inventory-modal';
        let modal = document.getElementById(modalId);

        // A. Render HTML
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="inv-content">
                    <div class="inv-header">
                        <div class="inv-title">
                            <svg style="width:20px;height:20px;fill:#007bff" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
                            KIỂM KÊ HÀNG HÓA
                        </div>
                        <div class="inv-tabs">
                            <div class="inv-tab active" data-tab="tab-input">1. Nhập liệu</div>
                            <div class="inv-tab" data-tab="tab-count">2. Kiểm kê</div>
                            <div class="inv-tab" data-tab="tab-sum">3. Tổng hợp</div>
                        </div>
                        <div class="inv-close" id="btn-inv-close">×</div>
                    </div>

                    <div class="inv-body">
                        <!-- TAB 1: NHẬP LIỆU -->
                        <div class="inv-view active" id="tab-input">
                            <div class="inv-controls">
                                <label class="inv-btn btn-import">
                                    <svg style="width:18px;height:18px;fill:white" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                                    Chọn file Excel tồn kho
                                    <input type="file" id="inp-excel-file" accept=".xlsx, .xls" style="display:none;">
                                </label>
                                <span id="lbl-file-name" style="font-size:12px; color:#666; font-style:italic;">Chưa có dữ liệu</span>
                            </div>
                            <div class="inv-table-wrapper">
                                <table class="inv-table" id="tbl-import">
                                    <thead><tr><th>STT</th><th>Nhóm hàng</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn kho</th></tr></thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- TAB 2: KIỂM KÊ -->
                        <div class="inv-view" id="tab-count">
                            <div class="inv-controls">
                                <div class="inv-search-box">
                                    <input type="text" id="inp-search-sku" class="inv-input" placeholder="Nhập tên hoặc mã sản phẩm..." autocomplete="off">
                                    <div class="inv-suggestions" id="box-suggestions"></div>
                                </div>
                                <button class="inv-btn btn-scan" id="btn-open-scan">
                                    <svg style="width:18px;height:18px;fill:white" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v3h-3v-3zm-6-3h2v2h-2v-2zm3 3h2v3h-2v-3zm-3 3h2v3h-2v-3z"/></svg>
                                    Quét mã
                                </button>
                            </div>
                            <div class="inv-table-wrapper">
                                <table class="inv-table" id="tbl-counting">
                                    <thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Trạng thái</th><th>Tồn</th><th>Đã kiểm</th><th>Chênh lệch</th></tr></thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                            <!-- Scanner Overlay -->
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
                                            <th>Nhóm hàng</th>
                                            <th>Mã SP</th>
                                            <th>Tên sản phẩm</th>
                                            <th>
                                                Trạng thái<br>
                                                <select class="inv-filter-select" data-col="status"><option value="all">Tất cả</option></select>
                                            </th>
                                            <th>Tồn kho</th>
                                            <th>
                                                Kiểm kê<br>
                                                <select class="inv-filter-select" data-col="count"><option value="all">Tất cả</option><option value="checked">Đã kiểm</option><option value="unchecked">Chưa kiểm</option></select>
                                            </th>
                                            <th>
                                                Chênh lệch<br>
                                                <select class="inv-filter-select" data-col="diff"><option value="all">Tất cả</option><option value="ok">Đủ</option><option value="fail">Lệch (Thừa/Thiếu)</option><option value="thua">Thừa</option><option value="thieu">Thiếu</option></select>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // --- LOAD LIBRARIES ---
            UI.showToast("⏳ Đang tải thư viện Excel & Camera...");
            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
                await loadScript('https://unpkg.com/html5-qrcode');
                UI.showToast("✅ Đã sẵn sàng!");
            } catch (e) {
                alert("Lỗi tải thư viện. Kiểm tra kết nối mạng!");
                return;
            }

            // --- EVENTS ---
            
            // 1. Close Modal
            document.getElementById('btn-inv-close').onclick = () => {
                if(STORE.isScannerRunning) stopScanner();
                modal.style.display = 'none';
                document.body.classList.remove('tgdd-body-lock');
            };

            // 2. Tabs Switch
            const tabs = modal.querySelectorAll('.inv-tab');
            tabs.forEach(t => {
                t.onclick = () => {
                    tabs.forEach(x => x.classList.remove('active'));
                    t.classList.add('active');
                    document.querySelectorAll('.inv-view').forEach(v => v.classList.remove('active'));
                    document.getElementById(t.dataset.tab).classList.add('active');
                    
                    if (t.dataset.tab === 'tab-input') document.getElementById('inp-search-sku').focus();
                    if (t.dataset.tab === 'tab-sum') renderSummary();
                };
            });

            // 3. Import Excel
            document.getElementById('inp-excel-file').addEventListener('change', handleFileImport, false);

            // 4. Search Suggestion
            const searchInput = document.getElementById('inp-search-sku');
            const sugBox = document.getElementById('box-suggestions');
            
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();
                if (val.length < 2) { sugBox.style.display = 'none'; return; }
                
                // Search Logic: Tìm theo Mã hoặc Tên
                const matches = STORE.importData.filter(item => 
                    item.sku.toLowerCase().includes(val) || 
                    item.name.toLowerCase().includes(val)
                ).slice(0, 10); // Lấy tối đa 10 kết quả

                if (matches.length > 0) {
                    sugBox.innerHTML = matches.map(item => `
                        <div class="inv-sug-item" data-sku="${item.sku}">
                            <span class="inv-sug-code">${item.sku}</span> - <span class="inv-sug-name">${item.name}</span>
                            <div style="color:#666; font-size:11px;">${item.status} | Tồn: ${item.stock}</div>
                        </div>
                    `).join('');
                    sugBox.style.display = 'block';
                    
                    // Click Suggestion
                    sugBox.querySelectorAll('.inv-sug-item').forEach(el => {
                        el.onclick = () => {
                            addCountItem(el.dataset.sku);
                            searchInput.value = '';
                            sugBox.style.display = 'none';
                            searchInput.focus();
                        };
                    });
                } else {
                    sugBox.style.display = 'none';
                }
            });

            // Hide suggestion when click outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.inv-search-box')) sugBox.style.display = 'none';
            });

            // 5. Scanner Events
            document.getElementById('btn-open-scan').onclick = startScanner;
            document.getElementById('btn-close-scan').onclick = stopScanner;

            // 6. Filter Events (Summary)
            document.querySelectorAll('.inv-filter-select').forEach(sel => {
                sel.addEventListener('change', renderSummary);
            });
        }

        // --- FUNCTIONS ---

        // A. Xử lý File Excel
        function handleFileImport(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            document.getElementById('lbl-file-name').innerText = file.name;
            const reader = new FileReader();
            
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON (mảng các mảng)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Parse Data (Bỏ dòng 1 header, lấy từ dòng 2)
                // Cột: E(4)=Group, G(6)=SKU, H(7)=Name, I(8)=Status, J(9)=Stock
                STORE.importData = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[6]) { // Phải có Mã sản phẩm
                        STORE.importData.push({
                            group: row[4] || '',
                            sku: String(row[6]).trim(),
                            name: row[7] || '',
                            status: row[8] || '',
                            stock: parseInt(row[9]) || 0
                        });
                    }
                }
                
                renderImportTable();
                UI.showToast(`✅ Đã nhập ${STORE.importData.length} sản phẩm!`);
                
                // Update Filters Status
                const statuses = [...new Set(STORE.importData.map(i => i.status))].filter(Boolean);
                const statusSel = document.querySelector('.inv-filter-select[data-col="status"]');
                statusSel.innerHTML = '<option value="all">Tất cả</option>' + statuses.map(s => `<option value="${s}">${s}</option>`).join('');
            };
            reader.readAsArrayBuffer(file);
        }

        function renderImportTable() {
            const tbody = document.querySelector('#tbl-import tbody');
            let html = '';
            STORE.importData.forEach((item, idx) => {
                html += `<tr><td>${idx+1}</td><td>${item.group}</td><td style="font-weight:bold; color:#d63031">${item.sku}</td><td>${item.name}</td><td>${item.status}</td><td style="font-weight:bold">${item.stock}</td></tr>`;
            });
            tbody.innerHTML = html;
        }

        // B. Xử lý Kiểm kê
        function addCountItem(sku) {
            // 1. Tìm trong kho
            const stockItem = STORE.importData.find(i => i.sku === sku);
            if (!stockItem) {
                UI.showToast("⚠️ Mã này không có trong danh sách tồn kho!");
                // Logic mở rộng: Có thể cho phép thêm hàng ngoài luồng, nhưng tạm thời block theo yêu cầu.
                return;
            }

            // 2. Tìm xem đã kiểm chưa
            const existIdx = STORE.countData.findIndex(i => i.sku === sku);
            
            if (existIdx !== -1) {
                // Đã có -> Tăng số lượng, Đưa lên đầu
                const item = STORE.countData.splice(existIdx, 1)[0];
                item.counted += 1;
                STORE.countData.unshift(item);
            } else {
                // Chưa có -> Thêm mới vào đầu
                STORE.countData.unshift({
                    ...stockItem,
                    counted: 1
                });
            }

            // 3. Render lại bảng kiểm kê
            renderCountTable();
            UI.showToast(`Đã thêm: ${stockItem.name}`);
        }

        function renderCountTable() {
            const tbody = document.querySelector('#tbl-counting tbody');
            let html = '';
            
            STORE.countData.forEach((item, idx) => {
                const diff = item.counted - item.stock;
                let diffText = `<span class="st-du">Đủ</span>`;
                if (diff > 0) diffText = `<span class="st-thua">Thừa ${diff}</span>`;
                else if (diff < 0) diffText = `<span class="st-thieu">Thiếu ${Math.abs(diff)}</span>`;

                // Highlight dòng đầu tiên (vừa thêm)
                const hlClass = idx === 0 ? 'highlight' : '';

                html += `<tr class="${hlClass}">
                    <td style="font-weight:bold; color:#d63031">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.status}</td>
                    <td>${item.stock}</td>
                    <td style="font-weight:bold; font-size:14px;">${item.counted}</td>
                    <td>${diffText}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
        }

        // C. Xử lý Tổng hợp
        function renderSummary() {
            // Map countData vào ImportData để có bảng tổng hợp
            // Logic: Duyệt ImportData, tìm count tương ứng.
            
            // Lấy giá trị bộ lọc
            const fStatus = document.querySelector('.inv-filter-select[data-col="status"]').value;
            const fCount = document.querySelector('.inv-filter-select[data-col="count"]').value;
            const fDiff = document.querySelector('.inv-filter-select[data-col="diff"]').value;

            const tbody = document.querySelector('#tbl-summary tbody');
            let html = '';

            STORE.importData.forEach(item => {
                // Tìm số lượng đã kiểm
                const countedItem = STORE.countData.find(c => c.sku === item.sku);
                const countedVal = countedItem ? countedItem.counted : 0;
                const diff = countedVal - item.stock;

                // --- FILTER LOGIC ---
                if (fStatus !== 'all' && item.status !== fStatus) return;
                
                if (fCount === 'checked' && countedVal === 0) return;
                if (fCount === 'unchecked' && countedVal > 0) return;

                if (fDiff === 'ok' && diff !== 0) return;
                if (fDiff === 'fail' && diff === 0) return;
                if (fDiff === 'thua' && diff <= 0) return;
                if (fDiff === 'thieu' && diff >= 0) return;

                // --- DISPLAY LOGIC ---
                let diffText = `<span class="st-du">0</span>`;
                if (diff > 0) diffText = `<span class="st-thua">+${diff}</span>`;
                else if (diff < 0) diffText = `<span class="st-thieu">${diff}</span>`;

                // Tô nền đỏ cho hàng chưa kiểm (counted = 0)
                const bgRow = countedVal === 0 ? 'background:#fff5f5;' : '';

                html += `<tr style="${bgRow}">
                    <td>${item.group}</td>
                    <td style="font-weight:bold;">${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.status}</td>
                    <td>${item.stock}</td>
                    <td style="font-weight:bold;">${countedVal}</td>
                    <td>${diffText}</td>
                </tr>`;
            });

            if (html === '') html = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Không có dữ liệu phù hợp bộ lọc</td></tr>';
            tbody.innerHTML = html;
        }

        // D. SCANNER LOGIC
        function startScanner() {
            const overlay = document.getElementById('inv-scanner-overlay');
            if(STORE.isScannerRunning) return;

            overlay.style.display = 'flex';
            STORE.isScannerRunning = true;

            const html5QrCode = new Html5Qrcode("inv-reader");
            STORE.scannerObj = html5QrCode;

            html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // Success Scan
                    console.log("Scanned: " + decodedText);
                    // Play sound logic if needed
                    if (navigator.vibrate) navigator.vibrate(200);
                    
                    // Add item
                    addCountItem(decodedText);
                    
                    // Không stop scanner để quét liên tục
                },
                (errorMessage) => {}
            ).catch(err => {
                alert("Lỗi Camera: " + err);
                stopScanner();
            });
        }

        function stopScanner() {
            const overlay = document.getElementById('inv-scanner-overlay');
            if (STORE.scannerObj) {
                STORE.scannerObj.stop().then(() => {
                    STORE.scannerObj.clear();
                    STORE.scannerObj = null;
                    STORE.isScannerRunning = false;
                    overlay.style.display = 'none';
                }).catch(err => console.log(err));
            } else {
                overlay.style.display = 'none';
                STORE.isScannerRunning = false;
            }
        }

        // --- START ---
        modal.style.display = 'flex';
        // Focus tab nhập liệu nếu chưa có dữ liệu, ngược lại focus tab kiểm kê
        if(STORE.importData.length > 0) {
            modal.querySelector('.inv-tab[data-tab="tab-count"]').click();
        } else {
            modal.querySelector('.inv-tab[data-tab="tab-input"]').click();
        }
    };

    return {
        name: "Kiểm kê",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" fill="white"/></svg>`,
        bgColor: "#6c757d",
        css: MY_CSS,
        action: runTool
    };
})
