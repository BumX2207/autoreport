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
    const API_URL_HISTORY = "https://script.google.com/macros/s/AKfycbzL5rzzxfhSdX0WmFR3sB-BBimZgRsHT8v2RyzfZ_7RWG-bYuRTEwqmbwiImyZY5KgC/exec";

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
    let EDITING_EMP_INDEX = -1; // Cờ theo dõi trạng thái đang sửa nhân viên

    const parseDateFromSheet = (rawStr) => {
        if (!rawStr) return { date: "N/A", time: "N/A", month: "N/A" };
        let str = String(rawStr).trim();
        
        // Trường hợp 1: Chuỗi đã được format sẵn dạng dd/mm/yyyy hh:mm
        let match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/);
        if (match) {
            let dd = String(match[1]).padStart(2, '0');
            let mm = String(match[2]).padStart(2, '0');
            return { date: `${dd}/${mm}/${match[3]}`, month: `${mm}/${match[3]}`, time: `${String(match[4]).padStart(2, '0')}:${String(match[5]).padStart(2, '0')}` };
        }
        
        // Trường hợp 2: Định dạng ISO chuẩn từ Google Sheets
        let d = new Date(str);
        if (!isNaN(d.getTime())) {
            try {
                // ÉP CỨNG MÚI GIỜ VIỆT NAM (Asia/Ho_Chi_Minh) BẤT CHẤP CÀI ĐẶT MÁY TÍNH
                let formatter = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
                
                let parts = formatter.formatToParts(d);
                let p = {};
                parts.forEach(part => p[part.type] = part.value);
                
                // Fix lỗi hiển thị 24:00 thành 00:00 trên một số trình duyệt
                let hh = p.hour === '24' ? '00' : p.hour;
                
                return { 
                    date: `${p.day}/${p.month}/${p.year}`, 
                    month: `${p.month}/${p.year}`, 
                    time: `${hh}:${p.minute}` 
                };
            } catch (e) {
                // Fallback dự phòng nếu trình duyệt quá cũ
                let dd = String(d.getDate()).padStart(2, '0');
                let mm = String(d.getMonth() + 1).padStart(2, '0');
                return { date: `${dd}/${mm}/${d.getFullYear()}`, month: `${mm}/${d.getFullYear()}`, time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
            }
        }
        return { date: "N/A", time: "N/A", month: "N/A" };
    };

    const getEmpDisplayName = (u) => {
        const emp = MANAGER_EMPLOYEES.find(x => x.u === u);
        return (emp && emp.fn) ? `${emp.fn} - ${u}` : u;
    };

    // ===============================================================
    // 2. CSS GIAO DIỆN TỔNG HỢP (Đã thêm CSS cho Lock Input và Zoom)
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

        /* Khóa input mờ đi */
        .bc-input.locked { opacity: 0.5; background: rgba(255,255,255,0.05); border-color: transparent; }
        .btn-unlock { position: absolute; right: 10px; top: 10px; background: rgba(255,255,255,0.1); border: none; color: #38bdf8; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: 0.2s; font-weight: bold; z-index: 2; }
        .btn-unlock:hover { background: rgba(56,189,248,0.2); color: #fff; }
        .input-wrapper { position: relative; margin-bottom: 15px; }
        .input-wrapper .bc-input { margin-bottom: 0; padding-right: 60px; } /* chừa chỗ cho nút sửa */

        .bc-btn { width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; border:none; color:#fff; transition:0.2s; }
        .btn-primary { background: linear-gradient(135deg, #0284c7, #0369a1); }
        .btn-primary:hover { background: linear-gradient(135deg, #0369a1, #075985); }
        .btn-success { background: linear-gradient(135deg, #10b981, #047857); }
        .btn-danger { background: #ef4444; }
        .btn-warning { background: linear-gradient(135deg, #f59e0b, #d97706); } /* Thêm màu nút Sửa */

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

        /* CSS BẢNG NĂNG LỰC NHÂN VIÊN TRONG TAB CÁ NHÂN */
        #emp-nlnv-scroll-wrapper { width: 100%; overflow: auto; background: #fff; border-radius: 8px; }
        .nlnv-zoom-area { transform-origin: 0 0; width: max-content;}
        
        .nlnv-container { width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #fff; }
        .nlnv-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; border: 2px solid #000; color: #000;}
        .nlnv-table th, .nlnv-table td { border: 1px solid #000; padding: 6px 4px; vertical-align: middle; }
        .nlnv-title-cell { background-color: #FFEB3B; font-weight: bold; font-size: 16px; color: #000; text-transform: uppercase; line-height: 1.4; }
        .nlnv-staff-cell { padding: 0 !important; vertical-align: middle; background: #fff;}
        .nlnv-staff-select { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #0070C0; border: none; outline: none; background: transparent; text-align: center; width: 100%; height: 100%; min-height: 45px; display: block; cursor: pointer; appearance: none; -webkit-appearance: none; pointer-events: none;}
        .nlnv-header-cyan { background-color: #00B0F0; color: #fff; font-weight: bold; }
        .nlnv-label { color: #0070C0; font-weight: bold; }
        .nlnv-val-red { color: #FF0000; font-weight: bold; }
        .nlnv-val-green { color: #00B050; font-weight: bold; }
        .nlnv-row-bg { background-color: #f9f9f9; }
        .nlnv-item-name { color: #0070C0; font-weight: bold; text-align: left; padding-left: 8px !important; }
        .nlnv-footer-blue { background-color: #00B0F0; color: white; font-weight: bold; font-size: 14px; }
        .nlnv-footer-green { background-color: #00B050; color: white; font-weight: bold; font-size: 14px; }
        .nlnv-footer-yellow { background-color: #FFEB3B; color: red; font-weight: bold; font-size: 14px; }

        .nlnv-daily-wrapper { width: 100%; font-family: Arial, sans-serif;}
        .nlnv-daily-table { border-collapse: collapse; width: 100%; text-align: center; font-size: 13px; border: 1px solid #000; color: #000;}
        .nlnv-daily-table th, .nlnv-daily-table td { border: 1px solid #000; padding: 6px 4px; white-space: nowrap; vertical-align: middle; }
        .nlnv-daily-item { color: #008080; font-weight: bold; text-align: left; padding-left: 8px !important; }

        /* Khóa cứng Dropdown nhân viên trong bảng NLNV */
        #emp-nlnv-container * { color: #000; }

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

    // ===============================================================
    // TÍNH NĂNG ZOOM BẢNG ĐỘC LẬP
    // ===============================================================
    const setupTableZoom = (containerId) => {
        const wrapper = document.getElementById(containerId);
        if (!wrapper) return;
        
        const tableContent = wrapper.innerHTML;
        wrapper.innerHTML = `<div class="nlnv-zoom-area" id="nlnv-zoom-area">${tableContent}</div>`;
        const zoomArea = document.getElementById('nlnv-zoom-area');
        
        let scale = 1, lastScale = 1, startDist = 0;

        // Cho mobile zoom bằng 2 ngón
        wrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                startDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            }
        }, {passive: true});

        wrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault(); // Chặn cuộn trang khi zoom
                const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
                const delta = dist / startDist;
                scale = Math.min(Math.max(lastScale * delta, 0.4), 3); // Giới hạn zoom
                zoomArea.style.transform = `scale(${scale})`;
                
                // Bù khoảng trống để người dùng có thể lướt xem phần bảng bị phóng to
                zoomArea.style.marginBottom = `${Math.max(0, (scale - 1) * zoomArea.offsetHeight)}px`;
                zoomArea.style.marginRight = `${Math.max(0, (scale - 1) * zoomArea.offsetWidth)}px`;
            }
        }, {passive: false});

        wrapper.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) lastScale = scale;
        }, {passive: true});

        // Cho máy tính zoom bằng phím Ctrl + Cuộn chuột
        wrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY * -0.01;
                scale = Math.min(Math.max(lastScale + delta, 0.4), 3);
                zoomArea.style.transform = `scale(${scale})`;
                zoomArea.style.marginBottom = `${Math.max(0, (scale - 1) * zoomArea.offsetHeight)}px`;
                zoomArea.style.marginRight = `${Math.max(0, (scale - 1) * zoomArea.offsetWidth)}px`;
                lastScale = scale;
            }
        }, {passive: false});
    };


    // ===============================================================
    // LOCAL BI ENGINE (TỰ ĐỘNG VẼ BẢNG NLNV ĐỘC LẬP TỪ CLOUD)
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
                    if (i === keys.length - 1) {
                        current[key] = flatObj[flatKey];
                    } else {
                        if (!current[key]) current[key] = {};
                        current = current[key];
                    }
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

            const today = new Date();
            const dateStr = `${today.getDate() < 10 ? '0'+today.getDate() : today.getDate()}/${(today.getMonth() + 1) < 10 ? '0'+(today.getMonth() + 1) : (today.getMonth() + 1)}/${today.getFullYear()}`;
            
            // Lấy ngày truyền vào, nếu không có thì lấy ngày hôm nay
            const displayDate = latestDate ? latestDate : dateStr;

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

            // ====================================================================
            // TÍNH TOÁN ĐIỂM VÀ RANKING CHO TOÀN BỘ NHÂN VIÊN TRONG SHOP
            // ====================================================================
            let rankingData =[];
            shopStaffGroup.forEach(s => {
                // 1. Điểm doanh thu
                let s_actualRev = revData[s.name] || 0;
                let s_revInMillions = s_actualRev > 1000000 ? Math.round(s_actualRev / 1000000) : Math.round(s_actualRev);
                let s_diemDoanhThu = Math.floor(s_revInMillions / 20);

                // 2. Điểm phục vụ
                let s_crm = crmData[s.name] || { ratePct: 0, score: '-' };
                let s_roundedRate = Math.round(parseFloat(s_crm.ratePct) || 0);
                let s_diemPhucVu = s_roundedRate < 10 ? -10 : (s_roundedRate - 10) * 2;

                // 3. Điểm thi đua NH
                let s_diemDat = 0, s_diemKhongDat = 0;

                activeGroups.forEach(cat => {
                    const configItem = configList.find(c => c.short === cat) || { type: 'soluong' };
                    const isRevenue = configItem.type.toLowerCase().includes('doanhthu') || configItem.type.toLowerCase().includes('tiền');
                    const finalMult = isRevenue ? 1000 : 1;

                    let shopTargetRaw = 0;
                    if (dataCache.link4_smart && dataCache.link4_smart[cat] && dataCache.link4_smart[cat][shopKey]) {
                        shopTargetRaw = dataCache.link4_smart[cat][shopKey].t || 0;
                        if (isRevenue) shopTargetRaw = shopTargetRaw / 1000;
                    } else {
                        const compRow = userConfig.compData.find(c => c.group === cat);
                        if (compRow) shopTargetRaw = compRow[`t${shopIdx}`] || 0;
                    }

                    let personalTarget = 0;
                    if(s.rate && parseFloat(s.rate) > 0) {
                        personalTarget = Math.round(shopTargetRaw * parseFloat(s.rate) / 100) * finalMult;
                    } else if (staffNoRate.length > 0) {
                        let usedT = 0; staffWithRate.forEach(sr => usedT += Math.round(shopTargetRaw * parseFloat(sr.rate) / 100));
                        personalTarget = Math.round(Math.max(0, shopTargetRaw - usedT) / staffNoRate.length) * finalMult;
                    }

                    let s_actual = currentShopStaffData[s.name]?.[cat] || staffRealMap[s.name]?.[cat] || 0;
                    let forecastPct = personalTarget > 0 ? ((s_actual / daysPassed) * daysInMonth / personalTarget * 100) : (s_actual > 0 ? 100 : 0);
                    let roundedForecast = Math.round(forecastPct);

                    let baseScore = 0;
                    if (roundedForecast >= 130) baseScore = 3;
                    else if (roundedForecast >= 120) baseScore = 2;
                    else if (roundedForecast >= 110) baseScore = 1;
                    else if (roundedForecast >= 100) baseScore = 0;
                    else if (roundedForecast >= 90) baseScore = -1;
                    else if (roundedForecast >= 80) baseScore = -2;
                    else baseScore = -3;

                    const compRow = userConfig.compData.find(c => c.group === cat);
                    const mult = compRow ? (parseInt(compRow.mult) || 1) : 1;
                    let finalScore = baseScore * mult;

                    if (roundedForecast >= 100) s_diemDat += finalScore;
                    else s_diemKhongDat += finalScore;
                });

                let s_tongDiem = 100 + s_diemPhucVu + s_diemDoanhThu + s_diemDat + s_diemKhongDat;

                rankingData.push({
                    name: s.name,
                    diemDoanhThu: s_diemDoanhThu,
                    tongDiem: s_tongDiem,
                    ratePct: s_roundedRate,
                    scoreOriginal: s_crm.score
                });
            });

            // Xếp hạng Rank thi đua (Theo Tổng điểm)
            rankingData.sort((a, b) => b.tongDiem - a.tongDiem);
            rankingData.forEach((item, idx) => item.rankThiDua = idx + 1);

            // Xếp hạng Rank phục vụ (Theo tỉ lệ đánh giá %)
            rankingData.sort((a, b) => b.ratePct - a.ratePct);
            rankingData.forEach((item, idx) => item.rankPhucVu = idx + 1);

            // Trích xuất Data của Nhân viên đang chọn để hiển thị
            const selectedStaffStats = rankingData.find(item => item.name === selectedStaffName) || {
                diemDoanhThu: 0, tongDiem: 0, rankThiDua: '-', rankPhucVu: '-', scoreOriginal: serviceInfo.score
            };
            // ====================================================================

            let html = `
            <div class="nlnv-container">
                <table class="nlnv-table">
                    <tr>
                        <td colspan="2" class="nlnv-title-cell">BẢNG NĂNG LỰC NHÂN VIÊN<br><span style="font-size:14px; color:#c00000;">Dữ liệu ngày: ${displayDate}</span></td>
                        <td colspan="3" class="nlnv-staff-cell"><div class="nlnv-staff-select" style="display: flex; align-items: center; justify-content: center; padding: 5px; white-space: normal; word-break: break-word; min-height: 45px; line-height: 1.3;">${selectedStaffName}</div></td>
                    </tr>
                    <tr>
                        <td class="nlnv-label">Target Doanh thu</td><td class="nlnv-val-red">${LOCAL_BI_ENGINE.formatNumber(personalRevTarget)}</td>
                        <td colspan="2" class="nlnv-label">Thực hiện</td><td class="nlnv-val-red">${LOCAL_BI_ENGINE.formatNumber(actualRev)}</td>
                    </tr>
                    <tr>
                        <td class="nlnv-label" style="color:#008080;">Điểm Phục vụ</td><td class="nlnv-label" style="color:#008080;">Điểm doanh thu</td><td class="nlnv-label" style="color:#008080;">Điểm thi đua</td><td class="nlnv-label" style="color:#008080;">Rank phục vụ</td><td class="nlnv-label" style="color:#008080;">Rank thi đua</td>
                    </tr>
                    <tr>
                        <td class="nlnv-val-red">${selectedStaffStats.scoreOriginal}</td><td class="nlnv-val-red">${selectedStaffStats.diemDoanhThu}</td><td class="nlnv-val-red">${selectedStaffStats.tongDiem}</td><td class="nlnv-val-red">${selectedStaffStats.rankPhucVu}</td><td class="nlnv-val-red">${selectedStaffStats.rankThiDua}</td>
                    </tr>
                    <tr class="nlnv-header-cyan"><td>Nhóm hàng</td><td>Target</td><td>Thực hiện</td><td>% Hoàn thành</td><td>Dự kiến</td></tr>
            `;

            let passCount = 0; let failCount = 0;

            activeGroups.forEach((cat, idx) => {
                const configItem = configList.find(c => c.short === cat) || { type: 'soluong' };
                const isRevenue = configItem.type.toLowerCase().includes('doanhthu') || configItem.type.toLowerCase().includes('tiền');
                const finalMult = isRevenue ? 1000 : 1;

                let shopTargetRaw = 0;
                if (dataCache.link4_smart && dataCache.link4_smart[cat] && dataCache.link4_smart[cat][shopKey]) {
                    shopTargetRaw = dataCache.link4_smart[cat][shopKey].t || 0;
                    if (isRevenue) shopTargetRaw = shopTargetRaw / 1000;
                } else {
                    const compRow = userConfig.compData.find(c => c.group === cat);
                    if (compRow) shopTargetRaw = compRow[`t${shopIdx}`] || 0;
                }

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

                let actual = 0;
                if (currentShopStaffData[selectedStaffName] && currentShopStaffData[selectedStaffName][cat] !== undefined) { actual = currentShopStaffData[selectedStaffName][cat]; } 
                else if (staffRealMap[selectedStaffName] && staffRealMap[selectedStaffName][cat] !== undefined) { actual = staffRealMap[selectedStaffName][cat]; }

                let pctComplete = personalTarget > 0 ? (actual / personalTarget * 100) : (actual > 0 ? 100 : 0);
                const forecastValue = (actual / daysPassed) * daysInMonth;
                let forecastPct = personalTarget > 0 ? (forecastValue / personalTarget * 100) : (actual > 0 ? 100 : 0);

                pctComplete = Math.round(pctComplete); forecastPct = Math.round(forecastPct);
                if (forecastPct >= 100) passCount++; else failCount++;

                const bgRow = idx % 2 !== 0 ? 'nlnv-row-bg' : '';
                const fcClass = forecastPct >= 100 ? 'nlnv-val-green' : 'nlnv-val-red';
                const fcBg = forecastPct >= 100 ? 'background-color:#d9ead3;' : 'background-color:#fce4d6;';
                const fillPct = Math.min(pctComplete, 100);
                const progressStyle = `background: linear-gradient(to right, #c6efce ${fillPct}%, transparent ${fillPct}%); font-weight:bold;`;

                html += `<tr class="${bgRow}"><td class="nlnv-item-name">${cat}</td><td class="bold">${LOCAL_BI_ENGINE.formatNumber(personalTarget)}</td><td class="bold">${LOCAL_BI_ENGINE.formatNumber(actual)}</td><td style="${progressStyle}">${pctComplete}%</td><td class="${fcClass}" style="${fcBg}">${forecastPct}%</td></tr>`;
            });

            html += `<tr><td colspan="2" class="nlnv-footer-blue">Số lượng môn thi đua</td><td class="nlnv-footer-blue">${activeGroups.length}</td><td class="nlnv-footer-green">Đạt: ${passCount}</td><td class="nlnv-footer-yellow">Không đạt: ${failCount}</td></tr></table></div>`;
            return html;
        },

        getNLNVDailyReport: (historyCache, configList, userConfig, selectedStaffName, shopIdx, daysPassed, daysInMonth) => {
            const staffList = userConfig.staffList ||[];
            const shopKey = `shop${shopIdx}`;
            const today = new Date();
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const currentYear = String(today.getFullYear());

            let validDates = Object.keys(historyCache).filter(d => {
                const parts = d.split('/');
                if (parts.length === 3) {
                    const[dd, mm, yyyy] = parts;
                    return mm === currentMonth && yyyy === currentYear && parseInt(dd) > 1;
                }
                return false;
            }).sort((a, b) => parseInt(a.split('/')[0]) - parseInt(b.split('/')[0]));

            let shopRevTarget = userConfig[`target${shopIdx}`] || 0;
            let personalRevTarget = 0;
            const shopStaffGroup = staffList.filter(s => s.shopIdx == shopIdx);
            const staffWithRate = shopStaffGroup.filter(s => s.rate && parseFloat(s.rate) > 0);
            const staffNoRate = shopStaffGroup.filter(s => !s.rate || parseFloat(s.rate) <= 0);

            let usedRevTarget = 0;
            staffWithRate.forEach(s => {
                const t = Math.round(shopRevTarget * parseFloat(s.rate) / 100);
                if(s.name === selectedStaffName) personalRevTarget = t;
                usedRevTarget += t;
            });
            if (staffNoRate.length > 0) {
                const remain = Math.max(0, shopRevTarget - usedRevTarget);
                const perStaff = Math.round(remain / staffNoRate.length);
                staffNoRate.forEach(s => { if(s.name === selectedStaffName) personalRevTarget = perStaff; });
            }

            let activeGroups = userConfig.compData ? userConfig.compData.map(c => c.group) : [];
            const rowData =[];

            rowData.push({ name: 'Doanh thu', flatKey: `link6|||${shopKey}|||revenue|||${selectedStaffName}`, target: personalRevTarget });

            activeGroups.forEach(cat => {
                const configItem = configList.find(c => c.short === cat) || { type: 'soluong' };
                const isRevenue = configItem.type.toLowerCase().includes('doanhthu') || configItem.type.toLowerCase().includes('tiền');
                const finalMult = isRevenue ? 1000 : 1;

                let shopTargetRaw = 0;
                if (validDates.length > 0) {
                    const latestDate = validDates[validDates.length - 1];
                    const historyKey = `link4_smart|||${cat}|||${shopKey}|||t`;
                    if (historyCache[latestDate] && historyCache[latestDate][historyKey] !== undefined) {
                        shopTargetRaw = parseFloat(historyCache[latestDate][historyKey]) || 0;
                        if (isRevenue) shopTargetRaw = shopTargetRaw / 1000;
                    } else {
                        const compRow = userConfig.compData.find(c => c.group === cat);
                        if (compRow) shopTargetRaw = compRow[`t${shopIdx}`] || 0;
                    }
                }

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

                rowData.push({ name: cat, flatKey: `link6|||${shopKey}|||competition|||${selectedStaffName}|||${cat}`, target: personalTarget });
            });

            let html = `<div class="nlnv-daily-wrapper"><table class="nlnv-daily-table"><thead><tr>`;
            html += `<th style="background-color: #FFEB3B; padding: 0; min-width:180px;"><div class="nlnv-staff-select" style="display: flex; align-items: center; justify-content: center; padding: 5px; white-space: normal; word-break: break-word; min-height: 45px; line-height: 1.3;">${selectedStaffName}</div></th>`;
            html += `<th style="background-color: #00B0F0; color: white; font-size: 14px;">Target</th><th style="background-color: #00B0F0; color: white; font-size: 14px;">Dự kiến</th><th style="background-color: #00B0F0; color: white; font-size: 14px; min-width: 100px;">Cảnh báo</th>`;
            validDates.forEach(d => { html += `<th style="background-color: #00B0F0; color: white; font-size: 14px;">Ngày<br>${parseInt(d.split('/')[0]) - 1}</th>`; });
            if (validDates.length === 0) html += `<th style="background-color: #00B0F0; color: white;">Chưa có dữ liệu</th>`;
            html += `</tr></thead><tbody>`;

            rowData.forEach((row, idx) => {
                const bgClass = idx % 2 !== 0 ? 'background-color: #f9f9f9;' : '';
                const targetDisplay = row.target === 0 ? '-' : LOCAL_BI_ENGINE.formatNumber(row.target);

                let previousValue = 0; let dailyValues =[]; let cumulativeCurrent = 0;
                if (validDates.length > 0) {
                    validDates.forEach(d => {
                        const dayObj = historyCache[d] || {};
                        let currentValue = parseFloat(dayObj[row.flatKey]) || 0;
                        let delta = currentValue - previousValue;
                        if (delta < 0) delta = 0;
                        dailyValues.push(delta); previousValue = currentValue; cumulativeCurrent = currentValue;
                    });
                }

                let forecastPct = row.target > 0 ? ((cumulativeCurrent / daysPassed) * daysInMonth / row.target) * 100 : (cumulativeCurrent > 0 ? 100 : 0);
                let forecastDisplay = validDates.length === 0 ? '-' : Math.round(forecastPct) + '%';
                let forecastColor = forecastPct >= 100 ? '#00b050' : '#d63031';

                let consecutiveZeroDays = 0;
                for (let i = dailyValues.length - 1; i >= 0; i--) { if (dailyValues[i] === 0) consecutiveZeroDays++; else break; }
                let warningText = (consecutiveZeroDays >= 2 && validDates.length >= 2) ? `Liên tiếp ${consecutiveZeroDays} ngày<br>chưa bán!` : '';

                html += `<tr style="${bgClass}"><td class="nlnv-daily-item">${row.name}</td><td class="nlnv-daily-target" style="color:#007bff">${targetDisplay}</td><td style="color:${forecastColor}; font-weight:bold;">${forecastDisplay}</td><td style="color:#d63031; font-weight:bold; font-size:11px; line-height: 1.3;">${warningText}</td>`;
                if (validDates.length === 0) html += `<td>-</td>`;
                else { dailyValues.forEach(delta => { html += `<td class="nlnv-daily-val" style="${delta === 0 ? 'color: #999;' : 'color: #000000; font-weight:bold;'}">${delta === 0 ? '-' : LOCAL_BI_ENGINE.formatNumber(delta)}</td>`; }); }
                html += `</tr>`;
            });
            html += `</tbody></table></div>`;
            return html;
        }
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
                            <!-- THÊM TÍNH NĂNG KHÓA ID -->
                            <label class="bc-label">ID Thư mục Google Drive:</label>
                            <div class="input-wrapper">
                                <input type="text" id="inp-folder-id" class="bc-input" placeholder="VD: 1A2b3C4d5E...">
                                <button class="btn-unlock" id="btn-edit-folder">✏️ Sửa</button>
                            </div>
                            
                            <label class="bc-label">ID Google Sheet:</label>
                            <div class="input-wrapper">
                                <input type="text" id="inp-sheet-id" class="bc-input" placeholder="VD: 1xYz_789abc...">
                                <button class="btn-unlock" id="btn-edit-sheet">✏️ Sửa</button>
                            </div>
                        </div>
                        <div class="bc-card">
                            <h3 class="bc-sec-title">2. Khai báo Nhân viên</h3>
                            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                                <input type="text" id="inp-nv-shop" class="bc-input" style="margin:0; flex:1; min-width:80px;" placeholder="Mã Shop">
                                <input type="text" id="inp-nv-user" class="bc-input" style="margin:0; flex:1; min-width:80px;" placeholder="User">
                                <input type="text" id="inp-nv-fn" class="bc-input" style="margin:0; flex:2; min-width:140px;" placeholder="Họ và Tên">
                                <input type="text" id="inp-nv-dob" class="bc-input" style="margin:0; flex:1.5; min-width:120px;" placeholder="Ngày sinh (dd/mm/yyyy)">
                                <input type="text" id="inp-nv-pass" class="bc-input" style="margin:0; flex:1.5; min-width:100px;" placeholder="Mật khẩu">
                                <select id="inp-nv-role" class="bc-input" style="margin:0; flex:0.8; min-width:70px; padding:12px;"><option value="NV">NV</option><option value="PG">PG</option></select>
                                <input type="text" id="inp-nv-grp" class="bc-input" style="margin:0; flex:0; min-width:60px;" placeholder="Nhóm (Tự chọn)">
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
                        <!-- Thêm wrapper bên ngoài để thực hiện việc Zoom độc lập -->
                        <div id="emp-nlnv-scroll-wrapper">
                            <div id="emp-nlnv-container" style="padding:10px;"></div>
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

        // Hàm Khóa/Mở Khóa ô Cấu hình ID
        const lockConfigInputs = (isLocked) => {
            const fId = $('inp-folder-id');
            const sId = $('inp-sheet-id');
            if (isLocked) {
                fId.setAttribute('readonly', 'true'); fId.classList.add('locked');
                sId.setAttribute('readonly', 'true'); sId.classList.add('locked');
            } else {
                fId.removeAttribute('readonly'); fId.classList.remove('locked');
                sId.removeAttribute('readonly'); sId.classList.remove('locked');
            }
        };

        $('btn-edit-folder').onclick = () => lockConfigInputs(false);
        $('btn-edit-sheet').onclick = () => lockConfigInputs(false);

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
                            executeDownload(imgUrl, `${prefix}_${idx+1}.jpg`);
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
                        
                        // ĐÓNG BĂNG ID NẾU CÓ DỮ LIỆU
                        if (data.folderId || data.sheetId) {
                            lockConfigInputs(true);
                        }

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
                        <div style="flex-shrink:0; display:flex; gap:5px;">
                            <button class="bc-btn btn-warning" style="width:auto; padding:5px 10px;" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('editNV', {detail:${idx}}))">Sửa</button>
                            <button class="bc-btn btn-danger" style="width:auto; padding:5px 10px;" onclick="document.getElementById('bc-app-wrapper').dispatchEvent(new CustomEvent('delNV', {detail:${idx}}))">Xóa</button>
                        </div>
                    </div>
                `).join('');
            };

            app.addEventListener('delNV', (e) => { 
                MANAGER_EMPLOYEES.splice(e.detail, 1); 
                renderNV(); 
                if (EDITING_EMP_INDEX === e.detail) {
                    // Nếu đang sửa mà bấm xóa thì reset luôn khung nhập
                    EDITING_EMP_INDEX = -1;
                    resetEmpInputs();
                }
            });

            // TÍNH NĂNG SỬA NHÂN VIÊN
            app.addEventListener('editNV', (e) => {
                EDITING_EMP_INDEX = e.detail;
                const nv = MANAGER_EMPLOYEES[e.detail];
                $('inp-nv-shop').value = nv.s;
                $('inp-nv-user').value = nv.u;
                $('inp-nv-fn').value = nv.fn || '';
                $('inp-nv-dob').value = nv.dob || '';
                $('inp-nv-pass').value = nv.p;
                $('inp-nv-role').value = nv.role || 'NV';
                $('inp-nv-grp').value = nv.grp || '';

                const btnAdd = $('btn-add-nv');
                btnAdd.innerText = "Cập Nhật Sửa";
                btnAdd.classList.remove('btn-success');
                btnAdd.classList.add('btn-primary'); // Đổi màu thành xanh dương cho biết đang ở chế độ sửa
                
                // Tự động cuộn lên form nhập liệu để người dùng thấy
                $('tab-config').querySelector('.bc-screen-body').scrollTop = 0;
            });
            
            const resetEmpInputs = () => {
                $('inp-nv-shop').value = ''; $('inp-nv-user').value = ''; $('inp-nv-fn').value = ''; $('inp-nv-dob').value = ''; $('inp-nv-pass').value = ''; $('inp-nv-grp').value = '';
                const btnAdd = $('btn-add-nv');
                btnAdd.innerText = "+ Thêm Nhân Viên";
                btnAdd.classList.remove('btn-primary');
                btnAdd.classList.add('btn-success');
            };

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

                // Xử lý Cập nhật hoặc Thêm mới
                if (EDITING_EMP_INDEX > -1) {
                    const dup = MANAGER_EMPLOYEES.findIndex(x => x.s === s && x.u === u);
                    if(dup !== -1 && dup !== EDITING_EMP_INDEX) return alert("User này đã tồn tại trong Shop!");
                    
                    MANAGER_EMPLOYEES[EDITING_EMP_INDEX] = {s, u, fn, dob, p, role, grp}; 
                    EDITING_EMP_INDEX = -1; // Tắt cờ sửa
                    resetEmpInputs();
                } else {
                    if(MANAGER_EMPLOYEES.some(x => x.s === s && x.u === u)) return alert("User này đã tồn tại trong Shop!");
                    MANAGER_EMPLOYEES.push({s, u, fn, dob, p, role, grp}); 
                    resetEmpInputs();
                }
                renderNV(); 
            };

            $('btn-save-config').onclick = async () => {
                let fId = $('inp-folder-id').value.trim(), sId = $('inp-sheet-id').value.trim();
                if(!fId || !sId) return alert("Nhập đủ ID Folder và ID Sheet!");
                $('bc-loading').style.display = 'flex'; $('bc-load-text').innerText = "Đang lưu cấu hình...";
                try {
                    let res = await universalFetch({ method:"POST", url: API_URL_MAIN, data: JSON.stringify({ action: "save_config_manager", user: CURRENT_USER, folderId: fId, sheetId: sId, employees: JSON.stringify(MANAGER_EMPLOYEES) }) });
                    if(JSON.parse(res).status === 'success') { 
                        alert("✅ Đã lưu cấu hình!"); 
                        MANAGER_SHEET_ID = sId; 
                        lockConfigInputs(true); // Đóng băng ngay sau khi lưu
                        await loadStatistics(); 
                    }
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
            // LUỒNG NHÂN VIÊN
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
            
            $('tab-btn-emp-history').onclick = () => {['tab-btn-emp-form', 'tab-btn-emp-history', 'tab-btn-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });['tab-emp-form', 'tab-emp-history', 'tab-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                $('tab-btn-emp-history').classList.add('active'); $('tab-emp-history').classList.add('active'); 
                loadEmployeeHistory();
            };

            // TAB CÁ NHÂN CLICK
            $('tab-btn-emp-personal').onclick = () => {['tab-btn-emp-form', 'tab-btn-emp-history', 'tab-btn-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });['tab-emp-form', 'tab-emp-history', 'tab-emp-personal'].forEach(id => { if($(id)) $(id).classList.remove('active') });
                $('tab-btn-emp-personal').classList.add('active'); $('tab-emp-personal').classList.add('active'); 
                renderNLNV('overview'); 
            };

            $('emp-nlnv-view-select').onchange = (e) => {
                renderNLNV(e.target.value);
            };

            const renderNLNV = async (mode) => {
                const container = $('emp-nlnv-container');
                container.innerHTML = `<div style="text-align:center; padding:20px; color:#000;"><div class="spinner" style="margin:0 auto; border-top-color:#0070C0;"></div><br>Đang tải dữ liệu...</div>`;
                
                if (!EMP_SESSION.mgrUser) {
                    container.innerHTML = `<div style="color:red; text-align:center;">Lỗi: Không xác định được Quản lý của bạn. Vui lòng đăng nhập lại.</div>`;
                    return;
                }

                try {
                    // 1. Fetch Config Quản lý
                    let configRes = await universalFetch({
                        method: "GET",
                        url: `${CONSTANTS.GSHEET.CONFIG_API}?user=${encodeURIComponent(EMP_SESSION.mgrUser)}`
                    });
                    let configJson = JSON.parse(configRes);
                    if (configJson.status !== 'success' || !configJson.data) throw new Error("Không lấy được cấu hình Quản lý");
                    let mgrConfig = JSON.parse(configJson.data);
                    
                    let historySheetId = mgrConfig.historySheetId;
                    if (!historySheetId) throw new Error("Quản lý chưa cài đặt ID file Lịch sử.");

                    // 2. Fetch Lịch sử
                    let historyRes = await universalFetch({
                        method: "GET",
                        url: `${API_URL_HISTORY}?sheetId=${historySheetId}`
                    });
                    let historyJson = JSON.parse(historyRes);
                    if (historyJson.status !== 'success' || !historyJson.data) throw new Error("Không lấy được dữ liệu Lịch sử.");
                    let historyCache = historyJson.data;

                    // 3. Khôi phục configList & dataCache
                    let mockConfigList = (mgrConfig.compData ||[]).map(c => ({
                        short: c.group,
                        type: c.group.toLowerCase().includes('doanh thu') ? 'doanhthu' : 'soluong',
                        channel: 'T'
                    }));

                    let parseDateStr = (dStr) => { let parts = dStr.split('/'); return new Date(parts[2], parts[1] - 1, parts[0]); };
                    let validDates = Object.keys(historyCache);
                    if (validDates.length === 0) throw new Error("Chưa có dữ liệu lịch sử nào.");
                    validDates.sort((a, b) => parseDateStr(a) - parseDateStr(b));
                    
                    let latestDate = validDates[validDates.length - 1];
                    let latestFlatData = historyCache[latestDate];
                    let latestDataCache = LOCAL_BI_ENGINE.unflattenObject(latestFlatData);

                    // 4. Tìm nhân viên và ShopIdx
                    let staffNameInBI = EMP_SESSION.user; 
                    const staffListBI = mgrConfig.staffList ||[];
                    const matchedStaff = staffListBI.find(s => (EMP_SESSION.fn && s.name.includes(EMP_SESSION.fn)) || s.name.includes(EMP_SESSION.user));
                    let shopIdx = 1;
                    if (matchedStaff) {
                        staffNameInBI = matchedStaff.name;
                        shopIdx = matchedStaff.shopIdx;
                    }

                    // 5. Xử lý thời gian (dp)
                    const today = new Date();
                    const currentDay = today.getDate();
                    const customDP = parseInt(mgrConfig.dp);
                    const daysPassed = (customDP >= 1 && customDP <= 31) ? customDP : (currentDay > 1 ? currentDay - 1 : 1);
                    const customEOM = parseInt(mgrConfig.eom);
                    const daysInMonth = (customEOM >= 1 && customEOM <= 31) ? customEOM : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

                    if (mode === 'overview') {
                        container.innerHTML = LOCAL_BI_ENGINE.getNLNVReport(latestDataCache, mockConfigList, mgrConfig, staffNameInBI, shopIdx, daysPassed, daysInMonth, latestDate);
                    } else if (mode === 'daily') {
                        container.innerHTML = LOCAL_BI_ENGINE.getNLNVDailyReport(historyCache, mockConfigList, mgrConfig, staffNameInBI, shopIdx, daysPassed, daysInMonth);
                    }

                    // KHỞI TẠO ZOOM ĐỘC LẬP CHO BẢNG MỚI VẼ
                    setupTableZoom('emp-nlnv-container');

                } catch (e) {
                    console.error(e);
                    container.innerHTML = `<div style="color:red; text-align:center; padding: 20px;">Lỗi: ${e.message}</div>`;
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
                        EMP_SESSION = { user: u, shop: s, folderId: data.folderId, sheetId: data.sheetId, mgrUser: data.mgrUser || "", fn: data.fn || "", dob: data.dob || "", role: data.role || "NV", grp: data.grp || "" };
                        localStorage.setItem('bc_emp_session', JSON.stringify(EMP_SESSION));
                        $('lbl-emp-name').innerText = `👤 ${EMP_SESSION.fn ? EMP_SESSION.fn + ' - ' : ''}${u}`; 
                        
                        updateEmpTabs(); 
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
