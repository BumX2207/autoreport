((context) => {
    const { UI, UTILS, CONSTANTS, DATA } = context;
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
    const API_URL_HISTORY = "https://script.google.com/macros/s/AKfycbzL5rzzxfhSdX0WmFR3sB-BBimZgRsHT8v2RyzfZ_7RWG-bYuRTEwqmbwiImyZY5KgC/exec";

    // LẤY THÔNG TIN TỪ INDEX
    let savedGlobalUser = localStorage.getItem('tgdd_guest_account_v2');
    let GLOBAL_USER_OBJ = savedGlobalUser ? JSON.parse(savedGlobalUser) : null;
    let SYSTEM_USER = GLOBAL_USER_OBJ ? GLOBAL_USER_OBJ.user : "---";

    const managerRegex = /^\d+\s*-\s*.+$/;
    let IS_MANAGER = managerRegex.test(SYSTEM_USER);
    let CURRENT_USER = IS_MANAGER ? SYSTEM_USER : "";
    
    let EMP_SESSION = JSON.parse(localStorage.getItem('bc_emp_session') || "null");
    let MANAGER_EMPLOYEES =[];
    let MANAGER_SHEET_ID = ""; 
    let EDITING_EMP_INDEX = -1;

    // --- CÁC HÀM HELPER GIỮ NGUYÊN ---
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
            try {
                let formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
                let parts = formatter.formatToParts(d);
                let p = {}; parts.forEach(part => p[part.type] = part.value);
                let hh = p.hour === '24' ? '00' : p.hour;
                return { date: `${p.day}/${p.month}/${p.year}`, month: `${p.month}/${p.year}`, time: `${hh}:${p.minute}` };
            } catch (e) {
                let dd = String(d.getDate()).padStart(2, '0');
                let mm = String(d.getMonth() + 1).padStart(2, '0');
                return { date: `${dd}/${mm}/${d.getFullYear()}`, month: `${mm}/${d.getFullYear()}`, time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
            }
        }
        return { date: "N/A", time: "N/A", month: "N/A" };
    };

    const getEmpDisplayName = (u) => {
        if (!u) return '---';
        const emp = MANAGER_EMPLOYEES.find(x => String(x.u).toLowerCase() === String(u).toLowerCase());
        return (emp && emp.fn) ? `${emp.fn} - ${emp.u}` : u;
    };

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

    const setupTableZoom = (containerId) => {
        const wrapper = document.getElementById(containerId);
        if (!wrapper) return;
        const tableContent = wrapper.innerHTML;
        wrapper.innerHTML = `<div class="nlnv-zoom-area" id="nlnv-zoom-area">${tableContent}</div>`;
        const zoomArea = document.getElementById('nlnv-zoom-area');
        let scale = 1, lastScale = 1, startDist = 0;
        wrapper.addEventListener('touchstart', (e) => { if (e.touches.length === 2) startDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY); }, {passive: true});
        wrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                const delta = dist / startDist;
                scale = Math.min(Math.max(lastScale * delta, 0.4), 3);
                zoomArea.style.transform = `scale(${scale})`;
                zoomArea.style.marginBottom = `${Math.max(0, (scale - 1) * zoomArea.offsetHeight)}px`;
                zoomArea.style.marginRight = `${Math.max(0, (scale - 1) * zoomArea.offsetWidth)}px`;
            }
        }, {passive: false});
        wrapper.addEventListener('touchend', (e) => { if (e.touches.length < 2) lastScale = scale; }, {passive: true});
    };

    // ===============================================================
    // 2. CSS
    // ===============================================================
    const MY_CSS = `
        #bc-app-wrapper { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.95); backdrop-filter:blur(10px); z-index:2147483647; font-family: 'Segoe UI', sans-serif; color: #f8fafc; display:flex; justify-content:center; align-items:flex-start; padding-top:20px; }
        .bc-screen { display:none; flex-direction:column; width:98%; max-width:800px; height:83vh; background:rgba(30, 41, 59, 0.7); border-radius:12px; border:1px solid rgba(255,255,255,0.1); overflow:hidden; animation: fadeIn 0.3s ease-out; box-shadow:0 15px 40px rgba(0,0,0,0.5);}
        .bc-screen.active { display:flex; }
        .bc-header { flex-shrink:0; display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:rgba(15, 23, 42, 0.8); border-bottom:1px solid rgba(255,255,255,0.1); }
        .bc-footer { flex-shrink:0; padding:15px 20px; background:rgba(15, 23, 42, 0.8); border-top:1px solid rgba(255,255,255,0.1); }
        .bc-screen-body { flex:1; overflow-y:auto; padding:5px; }
        .bc-title { font-size: 18px; font-weight: bold; color: #38bdf8; display:flex; align-items:center; gap:8px;}
        .bc-close-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display:flex; justify-content:center; align-items:center;}
        .bc-close-btn:hover { background: #ef4444; }
        .bc-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .bc-sec-title { font-size: 15px; font-weight: 600; color: #FFD700; margin-bottom: 15px; }
        .bc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; margin-bottom:15px; outline:none; }
        .bc-input.locked { opacity: 0.5; background: rgba(255,255,255,0.05); }
        .bc-label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
        .btn-unlock { position: absolute; right: 10px; top: 10px; background: rgba(255,255,255,0.1); border: none; color: #38bdf8; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; }
        .input-wrapper { position: relative; margin-bottom: 15px; }
        .bc-btn { width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border:none; color:#fff; }
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .btn-success { background: linear-gradient(135deg, #10b981, #047857); }
        .btn-danger { background: #ef4444; }
        .btn-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .bc-tabs { display: flex; gap: 10px; padding:10px 20px; background: rgba(15, 23, 42, 0.5); overflow-x: auto;}
        .bc-tab-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; background: rgba(0,0,0,0.2); color: #94a3b8; font-weight: bold; cursor: pointer; white-space: nowrap;}
        .bc-tab-btn.active { background: #38bdf8; color: #0f172a; }
        .bc-tab-content { display: none; flex-direction:column; flex:1; overflow:hidden;}
        .bc-tab-content.active { display: flex; }
        .stat-dash { display:flex; gap:10px; margin-bottom:10px; }
        .stat-box { flex:1; padding:15px; border-radius:8px; text-align:center; border: 1px solid transparent;}
        .sb-blue { background:rgba(56, 189, 248, 0.1); border-color:#38bdf8; }
        .sb-red { background:rgba(239, 68, 68, 0.1); border-color:#ef4444; }
        .rp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .rp-header-row { display:flex; justify-content:space-between; align-items:center; cursor: pointer; }
        .rp-detail { display: none; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); font-size:13px;}
        .rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; margin-top: 5px; }
        .rp-img-wrap { position:relative; width: 100%; height: 70px; border-radius: 6px;}
        .rp-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; cursor: zoom-in; border: 1px solid rgba(255,255,255,0.2); }
        #bc-lightbox { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 2147483648; justify-content: center; align-items: center; }
        #bc-lb-img { max-width: 95vw; max-height: 85vh; object-fit:contain;}
        #bc-loading { display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:2147483649; justify-content:center; align-items:center; flex-direction:column; color:#fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #38bdf8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .employee-row { display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:6px; align-items:center;}
        .filter-row { display: flex; gap: 8px; margin-bottom: 15px; }
        .filter-row select { flex: 1; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #38bdf8; border-radius: 8px; color: #fff; }
        
        /* CSS NLNV */
        #emp-nlnv-scroll-wrapper { width: 100%; overflow: auto; background: #fff; border-radius: 8px; }
        .nlnv-zoom-area { transform-origin: 0 0; width: max-content;}
        .nlnv-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; border: 2px solid #000; color: #000;}
        .nlnv-table th, .nlnv-table td { border: 1px solid #000; padding: 6px 4px; }
        .nlnv-title-cell { background-color: #FFEB3B; font-weight: bold; font-size: 16px; }
        
        /* QUỸ */
        .fund-balance { font-size: 32px; font-weight: 900; color: #38bdf8; margin: 10px 0; }
        .fund-item-new { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; margin-bottom:10px; display:flex; flex-direction:column; gap:8px;}
        .fi-row-1 { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px; }
        .fi-row-2 { display: flex; align-items: center; gap: 10px; }
    `;

    // ===============================================================
    // 3. ENGINES (NLNV & FUND) GIỮ NGUYÊN
    // ===============================================================
    const LOCAL_BI_ENGINE = {
        formatNumber: (num) => new Intl.NumberFormat('en-US').format(Math.round(num || 0)),
        unflattenObject: (flatObj) => {
            const result = {};
            for (let flatKey in flatObj) {
                const keys = flatKey.split('|||');
                let current = result;
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    if (i === keys.length - 1) current[key] = flatObj[flatKey];
                    else { if (!current[key]) current[key] = {}; current = current[key]; }
                }
            }
            return result;
        },
        getNLNVReport: (dataCache, configList, userConfig, selectedStaffName, shopIdx, daysPassed, daysInMonth, latestDate = "") => {
            const staffList = userConfig.staffList ||[];
            const shopKey = `shop${shopIdx}`;
            const scrapedStaffData = dataCache.link6 || {};
            const crmData = dataCache.link8 || {};
            const staffRealMap = dataCache.staffReal || {};
            const currentShopStaffData = scrapedStaffData[shopKey] ? (scrapedStaffData[shopKey].competition || {}) : {};
            const revData = scrapedStaffData[shopKey] ? (scrapedStaffData[shopKey].revenue || {}) : {};
            const displayDate = latestDate ? latestDate : "N/A";

            let shopRevTarget = userConfig[`target${shopIdx}`] || 0;
            let personalRevTarget = 0;
            const shopStaffGroup = staffList.filter(s => s.shopIdx == shopIdx);
            const staffWithRate = shopStaffGroup.filter(s => s.rate && parseFloat(s.rate) > 0);
            const staffNoRate = shopStaffGroup.filter(s => !s.rate || parseFloat(s.rate) <= 0);

            let usedTarget = 0;
            staffWithRate.forEach(s => {
                const t = Math.round(shopRevTarget * parseFloat(s.rate) / 100);
                if(s.name === selectedStaffName) personalRevTarget = t;
                usedTarget += t;
            });
            if (staffNoRate.length > 0) {
                const remain = Math.max(0, shopRevTarget - usedTarget);
                const perStaff = Math.round(remain / staffNoRate.length);
                staffNoRate.forEach(s => { if(s.name === selectedStaffName) personalRevTarget = perStaff; });
            }

            const actualRev = revData[selectedStaffName] || 0;
            const serviceInfo = crmData[selectedStaffName] || { score: '-' };
            let activeGroups = userConfig.compData ? userConfig.compData.map(c => c.group) :[];

            let html = `
            <div class="nlnv-container">
                <table class="nlnv-table">
                    <tr><td colspan="5" class="nlnv-title-cell">BẢNG NĂNG LỰC NHÂN VIÊN<br><span style="font-size:12px">Ngày: ${displayDate}</span></td></tr>
                    <tr><td colspan="5" style="background:#fff; color:#0070C0; font-weight:bold; font-size:16px; padding:10px">${selectedStaffName}</td></tr>
                    <tr style="background:#f2f2f2"><td>Target DT</td><td>${LOCAL_BI_ENGINE.formatNumber(personalRevTarget)}</td><td colspan="2">Thực hiện</td><td>${LOCAL_BI_ENGINE.formatNumber(actualRev)}</td></tr>
                    <tr style="background:#00B0F0; color:#fff"><td>Nhóm hàng</td><td>Target</td><td>Thực hiện</td><td>%</td><td>Dự kiến</td></tr>
            `;

            activeGroups.forEach(cat => {
                const configItem = configList.find(c => c.short === cat) || { type: 'soluong' };
                const isRevenue = configItem.type.toLowerCase().includes('doanhthu') || configItem.type.toLowerCase().includes('tiền');
                const finalMult = isRevenue ? 1000 : 1;
                let shopTargetRaw = 0;
                const compRow = userConfig.compData.find(c => c.group === cat);
                if (compRow) shopTargetRaw = compRow[`t${shopIdx}`] || 0;

                let personalTarget = 0; let targetUsedRaw = 0;
                staffWithRate.forEach(s => {
                    let rawShare = shopTargetRaw * parseFloat(s.rate) / 100;
                    if (s.name === selectedStaffName) personalTarget = Math.round(rawShare) * finalMult;
                    targetUsedRaw += rawShare;
                });
                if (staffNoRate.length > 0) {
                    let remainingRaw = Math.max(0, shopTargetRaw - targetUsedRaw);
                    let rawPerStaff = remainingRaw / staffNoRate.length;
                    staffNoRate.forEach(s => { if(s.name === selectedStaffName) personalTarget = Math.round(rawPerStaff) * finalMult; });
                }

                let actual = (currentShopStaffData[selectedStaffName]?.[cat]) || (staffRealMap[selectedStaffName]?.[cat]) || 0;
                let pct = personalTarget > 0 ? Math.round(actual / personalTarget * 100) : (actual > 0 ? 100 : 0);
                let forecastPct = Math.round((actual / daysPassed) * daysInMonth / (personalTarget || 1) * 100);
                if (personalTarget === 0 && actual > 0) forecastPct = 100;

                html += `<tr><td>${cat}</td><td>${LOCAL_BI_ENGINE.formatNumber(personalTarget)}</td><td>${LOCAL_BI_ENGINE.formatNumber(actual)}</td><td>${pct}%</td><td style="color:${forecastPct >= 100 ? 'green':'red'}">${forecastPct}%</td></tr>`;
            });
            html += `</table></div>`;
            return html;
        }
    };

    const FUND_SYSTEM = {
        formatVNĐ: (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num),
        loadAndRender: async (containerId, isManager, sheetId, currentUser) => {
            const container = document.getElementById(containerId);
            container.innerHTML = `<div class="spinner" style="margin:20px auto;"></div>`;
            try {
                let res = await universalFetch({ method: "POST", url: API_URL_HISTORY, data: JSON.stringify({ action: "fund_get", sheetId: sheetId }) });
                let json = JSON.parse(res);
                let balance = 0;
                json.trans.forEach(t => { if (t.status === 'Approved') balance += (t.type === 'Thu' ? 1 : -1) * t.amount; });
                
                let html = `
                    <div class="bc-card">
                        <div style="color:#94a3b8; font-size:14px;">Tổng Quỹ Hiện Tại</div>
                        <div class="fund-balance">${FUND_SYSTEM.formatVNĐ(balance)}</div>
                        <div style="font-size:12px; color:#94a3b8; margin-top:10px;">Người giữ quỹ: <b>${json.keeper || 'Chưa có'}</b></div>
                    </div>
                `;
                
                if (isManager || (json.keeper && json.keeper.includes(currentUser))) {
                    html += `
                    <div style="display:flex; gap:10px; margin-bottom:20px;">
                        <button class="bc-btn btn-success" onclick="alert('Tính năng thêm phiếu đang bảo trì')">+ THU</button>
                        <button class="bc-btn btn-danger" onclick="alert('Tính năng thêm phiếu đang bảo trì')">- CHI</button>
                    </div>`;
                }

                html += `<div class="bc-sec-title">📝 LỊCH SỬ</div>`;
                json.trans.reverse().forEach(t => {
                    html += `
                        <div class="fund-item-new">
                            <div class="fi-row-1"><span>📅 ${t.time}</span><span style="color:${t.status==='Approved'?'#10b981':'#ef4444'}">${t.status}</span></div>
                            <div class="fi-row-2">
                                <div style="flex:1"><b>${t.reason}</b><br><small>Bởi: ${t.user}</small></div>
                                <div style="font-weight:bold; color:${t.type==='Thu'?'#10b981':'#ef4444'}">${t.type==='Thu'?'+':'-'}${FUND_SYSTEM.formatVNĐ(t.amount)}</div>
                            </div>
                        </div>`;
                });
                container.innerHTML = html;
            } catch (e) { container.innerHTML = "Lỗi tải dữ liệu quỹ."; }
        }
    };

    // ===============================================================
    // 4. MAIN RUN TOOL
    // ===============================================================
    const runTool = async () => {
        // KIỂM TRA ĐĂNG NHẬP INDEX
        if (!GLOBAL_USER_OBJ) {
            alert("Vui lòng đăng nhập tài khoản tại trang chủ trước khi mở tool!");
            return;
        }

        if (document.getElementById('bc-app-wrapper')) { 
            document.getElementById('bc-app-wrapper').style.display = 'flex'; 
            return; 
        }

        const app = document.createElement('div'); app.id = 'bc-app-wrapper';
        app.innerHTML = `
            <div id="bc-loading"><div class="spinner"></div><h3 id="bc-load-text">Đang kiểm tra quyền truy cập...</h3></div>
            <div id="bc-lightbox"><button class="bc-close-btn" style="position:absolute; top:20px; right:20px;" onclick="document.getElementById('bc-lightbox').style.display='none'">✕</button><img id="bc-lb-img" src=""></div>

            <!-- SCREEN QUẢN LÝ -->
            <div class="bc-screen" id="sc-manager">
                <div class="bc-header">
                    <div class="bc-title">⚙️ DASHBOARD</div>
                    <div class="bc-header-right">
                        <span style="color:#94a3b8; font-size:14px; font-weight:600;">👤 ${SYSTEM_USER}</span>
                        <button class="bc-close-btn btn-close-app">✕</button>
                    </div>
                </div>
                <div class="bc-tabs">
                    <button class="bc-tab-btn active" id="tab-btn-stat">📈 Truyền thông</button>
                    <button class="bc-tab-btn" id="tab-btn-fund">💰 Quỹ Siêu Thị</button>
                    <button class="bc-tab-btn" id="tab-btn-config">⚙️ Cài Đặt</button>
                </div>
                <div class="bc-tab-content active" id="tab-stat">
                    <div class="bc-screen-body">
                        <div id="stat-summary-container"></div>
                        <div class="filter-row">
                            <select id="stat-month-filter"></select>
                            <select id="stat-date-filter"></select>
                            <select id="stat-emp-filter"></select>
                            <button id="btn-refresh-stat" class="bc-btn" style="width:50px">🔄</button>
                        </div>
                        <div id="stat-list-container"></div>
                    </div>
                </div>
                <div class="bc-tab-content" id="tab-config">
                    <div class="bc-screen-body">
                        <div class="bc-card">
                            <h3 class="bc-sec-title">1. Cấu hình Lưu trữ</h3>
                            <label class="bc-label">ID Thư mục Drive:</label>
                            <div class="input-wrapper"><input type="text" id="inp-folder-id" class="bc-input locked" readonly><button class="btn-unlock" id="btn-edit-folder">✏️</button></div>
                            <label class="bc-label">ID Google Sheet:</label>
                            <div class="input-wrapper"><input type="text" id="inp-sheet-id" class="bc-input locked" readonly><button class="btn-unlock" id="btn-edit-sheet">✏️</button></div>
                        </div>
                        <div class="bc-card">
                            <h3 class="bc-sec-title">2. Khai báo Nhân viên</h3>
                            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                                <input type="text" id="inp-nv-shop" class="bc-input" style="flex:1" placeholder="Mã Shop">
                                <input type="text" id="inp-nv-user" class="bc-input" style="flex:1" placeholder="User">
                                <input type="text" id="inp-nv-fn" class="bc-input" style="flex:2" placeholder="Họ và Tên">
                                <input type="text" id="inp-nv-dob" class="bc-input" style="flex:1.5" placeholder="NS (dd/mm/yyyy)">
                                <input type="text" id="inp-nv-pass" class="bc-input" style="flex:1.5" placeholder="Mật khẩu">
                                <select id="inp-nv-role" class="bc-input" style="flex:1"><option value="NV">NV</option><option value="PG">PG</option></select>
                                <input type="text" id="inp-nv-grp" class="bc-input" style="flex:1" placeholder="Nhóm">
                                <button class="bc-btn btn-success" id="btn-add-nv">+ Thêm NV</button>
                            </div>
                            <div id="nv-list-container"></div>
                        </div>
                    </div>
                    <div class="bc-footer"><button class="bc-btn btn-primary" id="btn-save-config">💾 LƯU & ĐỒNG BỘ</button></div>
                </div>
                <div class="bc-tab-content" id="tab-fund"><div class="bc-screen-body" id="mgr-fund-container"></div></div>
            </div>

            <!-- SCREEN NHÂN VIÊN -->
            <div class="bc-screen" id="sc-report">
                <div class="bc-header"><div class="bc-title">📊 BÁO CÁO</div><button class="bc-close-btn btn-close-app">✕</button></div>
                <div style="padding:10px 20px; background:rgba(0,0,0,0.2); font-weight:bold; color:#38bdf8;" id="lbl-emp-name">👤 ---</div>
                <div class="bc-tabs">
                    <button class="bc-tab-btn active" id="tab-btn-emp-form">📝 Gửi</button>
                    <button class="bc-tab-btn" id="tab-btn-emp-history">🕒 Lịch sử</button>
                    <button class="bc-tab-btn" id="tab-btn-emp-fund">💰 Quỹ</button>
                    <button class="bc-tab-btn" id="tab-btn-emp-personal">👤 Cá nhân</button>
                </div>
                <div class="bc-tab-content active" id="tab-emp-form">
                    <div class="bc-screen-body">
                        <div class="bc-card"><div class="bc-sec-title">📄 1. Tờ Rơi</div><input type="number" id="inp-toroi-sl" class="bc-input" placeholder="Số lượng..."><input type="file" id="file-toroi" class="bc-file-input" multiple hidden><label for="file-toroi" class="bc-btn btn-primary">📸 Chọn ảnh</label><div class="bc-preview-grid" id="prev-toroi"></div></div>
                        <div class="bc-card"><div class="bc-sec-title">🌐 2. Truyền Thông</div><input type="text" id="inp-dangbai-link" class="bc-input" placeholder="Link bài..."><input type="file" id="file-dangbai" class="bc-file-input" multiple hidden><label for="file-dangbai" class="bc-btn btn-primary">📸 Chọn ảnh</label><div class="bc-preview-grid" id="prev-dangbai"></div></div>
                        <div class="bc-card"><div class="bc-sec-title">🎥 3. Livestream</div><input type="text" id="inp-live-link" class="bc-input" placeholder="Link live..."><input type="file" id="file-live" class="bc-file-input" multiple hidden><label for="file-live" class="bc-btn btn-primary">📸 Chọn ảnh</label><div class="bc-preview-grid" id="prev-live"></div></div>
                    </div>
                    <div class="bc-footer"><button class="bc-btn btn-primary" id="btn-submit-report">🚀 GỬI BÁO CÁO</button></div>
                </div>
                <div class="bc-tab-content" id="tab-emp-history"><div class="bc-screen-body" id="emp-history-container"></div></div>
                <div class="bc-tab-content" id="tab-emp-personal"><div class="bc-screen-body" id="emp-nlnv-scroll-wrapper"><div id="emp-nlnv-container"></div></div></div>
                <div class="bc-tab-content" id="tab-emp-fund"><div class="bc-screen-body" id="emp-fund-container"></div></div>
            </div>
        `;
        document.body.appendChild(app);
        const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
        const $ = (id) => document.getElementById(id);
        const switchSc = (id) => { document.querySelectorAll('.bc-screen').forEach(s => s.classList.remove('active')); if($(id)) $(id).classList.add('active'); };
        document.querySelectorAll('.btn-close-app').forEach(btn => btn.onclick = () => app.style.display = 'none');

        // ===============================================================
        // 5. LOGIC KIỂM TRA QUYỀN VÀ PHÂN LUỒNG
        // ===============================================================
        const checkPermission = async () => {
            $('bc-loading').style.display = 'flex';
            try {
                let res = await universalFetch({ method: "POST", url: API_URL_MAIN, data: JSON.stringify({ action: "check_tool_permission", user: SYSTEM_USER }) });
                let data = JSON.parse(res);
                if (data.status === 'success') {
                    // ĐÃ CÓ QUYỀN
                    if (IS_MANAGER) {
                        switchSc('sc-manager');
                        loadConfig();
                    } else {
                        EMP_SESSION = { 
                            user: data.userData.user, fn: data.userData.name, role: data.userData.role, 
                            mgrUser: data.userData.boss, shop: data.userData.shop, 
                            sheetId: data.userData.sheetId || "", folderId: data.userData.folderId || "" 
                        };
                        localStorage.setItem('bc_emp_session', JSON.stringify(EMP_SESSION));
                        switchSc('sc-report');
                        $('lbl-emp-name').innerText = `👤 ${data.userData.name} - ${data.userData.user}`;
                        updateEmpTabs();
                    }
                } else if (data.status === 'no_permission') {
                    $('bc-loading').innerHTML = `
                        <div style="text-align:center; padding:20px; color:white;">
                            <h2 style="color:#ef4444;">⚠️ TỪ CHỐI</h2>
                            <p>${data.message}</p>
                            <button class="bc-btn btn-primary" style="width:150px; margin-top:20px;" onclick="document.getElementById('bc-app-wrapper').remove()">Đóng</button>
                        </div>`;
                } else {
                    alert(data.message); app.remove();
                }
            } catch (e) { alert("Lỗi kết nối kiểm tra quyền!"); }
            finally { $('bc-loading').style.display = 'none'; }
        };

        checkPermission();

        // --- QUẢN LÝ ---
        const loadConfig = async () => {
            try {
                let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({action:"get_config_manager", user: CURRENT_USER})});
                let data = JSON.parse(res);
                if(data.status === 'success') {
                    $('inp-folder-id').value = data.folderId || ""; MANAGER_SHEET_ID = data.sheetId || ""; $('inp-sheet-id').value = MANAGER_SHEET_ID;
                    MANAGER_EMPLOYEES = data.employees ? JSON.parse(data.employees) :[];
                    renderNV(); if(MANAGER_SHEET_ID) loadStatistics();
                }
            } catch(e) {}
        };

        const renderNV = () => {
            $('nv-list-container').innerHTML = MANAGER_EMPLOYEES.map((nv, idx) => `
                <div class="employee-row">
                    <span style="flex:1">🏬 ${nv.s} - 👤 ${nv.fn} (${nv.u})</span>
                    <button class="bc-btn btn-warning" style="width:auto; padding:5px 10px" onclick="editNV(${idx})">Sửa</button>
                    <button class="bc-btn btn-danger" style="width:auto; padding:5px 10px; margin-left:5px" onclick="delNV(${idx})">Xóa</button>
                </div>`).join('');
        };

        window.editNV = (idx) => {
            EDITING_EMP_INDEX = idx; let nv = MANAGER_EMPLOYEES[idx];
            $('inp-nv-shop').value = nv.s; $('inp-nv-user').value = nv.u; $('inp-nv-fn').value = nv.fn;
            $('inp-nv-dob').value = nv.dob; $('inp-nv-pass').value = nv.p; $('inp-nv-role').value = nv.role; $('inp-nv-grp').value = nv.grp;
            $('btn-add-nv').innerText = "Cập nhật";
        };

        window.delNV = (idx) => { if(confirm("Xóa NV này?")) { MANAGER_EMPLOYEES.splice(idx, 1); renderNV(); } };

        $('btn-add-nv').onclick = () => {
            let s=$('inp-nv-shop').value, u=$('inp-nv-user').value, fn=$('inp-nv-fn').value, p=$('inp-nv-pass').value;
            if(!s || !u || !fn || !p) return alert("Thiếu thông tin!");
            let nv = {s, u, fn, dob:$('inp-nv-dob').value, p, role:$('inp-nv-role').value, grp:$('inp-nv-grp').value};
            if(EDITING_EMP_INDEX > -1) MANAGER_EMPLOYEES[EDITING_EMP_INDEX] = nv; else MANAGER_EMPLOYEES.push(nv);
            EDITING_EMP_INDEX = -1; $('btn-add-nv').innerText = "+ Thêm NV"; renderNV();
            ['inp-nv-shop','inp-nv-user','inp-nv-fn','inp-nv-dob','inp-nv-pass','inp-nv-grp'].forEach(id => $(id).value = '');
        };

        $('btn-save-config').onclick = async () => {
            $('bc-loading').style.display = 'flex';
            try {
                let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: $('inp-folder-id').value, sheetId: $('inp-sheet-id').value, employees: JSON.stringify(MANAGER_EMPLOYEES) }) });
                if(JSON.parse(res).status === 'success') { alert("✅ Đã lưu và đồng bộ nhân viên!"); loadConfig(); }
            } catch(e) { alert("Lỗi lưu cấu hình!"); }
            $('bc-loading').style.display = 'none';
        };

        // --- NHÂN VIÊN ---
        const updateEmpTabs = () => {
            const isNV = EMP_SESSION && EMP_SESSION.role === 'NV';
            $('tab-btn-emp-personal').style.display = isNV ? 'block' : 'none';
            $('tab-btn-emp-fund').style.display = isNV ? 'block' : 'none';
        };

        $('tab-btn-emp-form').onclick = () => { switchTab('emp-form'); };
        $('tab-btn-emp-history').onclick = () => { switchTab('emp-history'); loadEmployeeHistory(); };
        $('tab-btn-emp-fund').onclick = () => { switchTab('emp-fund'); FUND_SYSTEM.loadAndRender('emp-fund-container', false, EMP_SESSION.sheetId, EMP_SESSION.user); };
        $('tab-btn-emp-personal').onclick = () => { switchTab('emp-personal'); renderNLNV('overview'); };

        const switchTab = (id) => {
            document.querySelectorAll('#sc-report .bc-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#sc-report .bc-tab-content').forEach(c => c.classList.remove('active'));
            $('tab-btn-' + id).classList.add('active'); $('tab-' + id).classList.add('active');
        };

        $('btn-submit-report').onclick = async () => {
            if(!EMP_SESSION.sheetId) return alert("Boss chưa cài đặt hệ thống!");
            $('bc-loading').style.display = 'flex';
            try {
                const [imgT, imgD, imgL] = await Promise.all([processImages($('file-toroi').files), processImages($('file-dangbai').files), processImages($('file-live').files)]);
                let payload = { action: 'submit_report', user: EMP_SESSION.user, folderId: EMP_SESSION.folderId, sheetId: EMP_SESSION.sheetId, data: { phatToRoi:{quantity:$('inp-toroi-sl').value, images:imgT}, dangBai:{link:$('inp-dangbai-link').value, images:imgD}, livestream:{link:$('inp-live-link').value, images:imgL} } };
                let res = await universalFetch({ method: "POST", url: API_URL_REPORT, data: JSON.stringify(payload) });
                if(JSON.parse(res).status === 'success') { alert("✅ Gửi thành công!"); location.reload(); }
            } catch(e) { alert("Lỗi gửi báo cáo!"); }
            $('bc-loading').style.display = 'none';
        };

        // --- NLNV RENDER ---
        const renderNLNV = async (mode) => {
            const container = $('emp-nlnv-container');
            container.innerHTML = `<div class="spinner" style="margin:20px auto;"></div>`;
            try {
                let configRes = await universalFetch({ method: "GET", url: `${CONSTANTS.GSHEET.CONFIG_API}?user=${encodeURIComponent(EMP_SESSION.mgrUser)}` });
                let mgrConfig = JSON.parse(JSON.parse(configRes).data);
                let historyRes = await universalFetch({ method: "GET", url: `${API_URL_HISTORY}?sheetId=${mgrConfig.historySheetId}` });
                let historyCache = JSON.parse(historyRes).data;
                let dates = Object.keys(historyCache).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
                let latestDate = dates[dates.length - 1];
                let latestData = LOCAL_BI_ENGINE.unflattenObject(historyCache[latestDate]);
                
                let staffName = EMP_SESSION.user;
                let shopIdx = 1;
                const matched = (mgrConfig.staffList || []).find(s => s.name.includes(EMP_SESSION.user) || (EMP_SESSION.fn && s.name.includes(EMP_SESSION.fn)));
                if(matched) { staffName = matched.name; shopIdx = matched.shopIdx; }

                const today = new Date();
                const dp = parseInt(mgrConfig.dp) || (today.getDate() > 1 ? today.getDate()-1 : 1);
                const eom = parseInt(mgrConfig.eom) || new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
                
                let mockConfigList = (mgrConfig.compData || []).map(c => ({ short: c.group, type: c.group.toLowerCase().includes('doanh thu') ? 'doanhthu' : 'soluong' }));
                container.innerHTML = LOCAL_BI_ENGINE.getNLNVReport(latestData, mockConfigList, mgrConfig, staffName, shopIdx, dp, eom, latestDate);
                setupTableZoom('emp-nlnv-container');
            } catch(e) { container.innerHTML = "Lỗi tải NLNV."; }
        };

        // --- LIGHTBOX & PREVIEW ---
        app.addEventListener('click', e => {
            if(e.target.classList.contains('rp-img')) { $('bc-lb-img').src = e.target.src; $('bc-lightbox').style.display = 'flex'; }
        });
        ['file-toroi','file-dangbai','file-live'].forEach(id => {
            $(id).onchange = e => {
                let prev = $('prev-' + id.split('-')[1]); prev.innerHTML = '';
                Array.from(e.target.files).forEach(f => prev.innerHTML += `<img src="${URL.createObjectURL(f)}" class="bc-preview-item" style="width:50px;height:50px;object-fit:cover;margin:2px">`);
            };
        });
    };

    return { name: "Báo Cáo", icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/></svg>`, bgColor: "#0284c7", action: runTool };
})();
