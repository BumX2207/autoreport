((context) => {
    // ===============================================================
    // 1. CẤU HÌNH DATA SHEET
    // ===============================================================
    const SHEET_ID = '1iuApMwdKYx9ofo0oJR84AlzXka0PmTQPudXzx0Uub0o';
    const SHEET_GID = '356882912';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

    // Hàm phân tích CSV chuẩn xác (xử lý được dấu phẩy nằm trong ngoặc kép)
    const parseCSV = (text) => {
        const rows = []; let row =[], curr = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuotes) {
                if (char === '"') { if (text[i + 1] === '"') { curr += '"'; i++; } else { inQuotes = false; } } 
                else { curr += char; }
            } else {
                if (char === '"') { inQuotes = true; } 
                else if (char === ',') { row.push(curr); curr = ''; } 
                else if (char === '\n' || char === '\r') {
                    if (char === '\r' && text[i + 1] === '\n') i++;
                    row.push(curr); rows.push(row); row =[]; curr = '';
                } else { curr += char; }
            }
        }
        if (curr !== '' || row.length > 0) { row.push(curr); rows.push(row); }
        return rows;
    };

    // Tạo mảng màu ngẫu nhiên cho các icon không có ảnh
    const COLORS =['#e17055', '#00b894', '#0984e3', '#6c5ce7', '#d63031', '#e84393', '#fdcb6e', '#00cec9'];

    // ===============================================================
    // 2. CSS GIAO DIỆN (DARK THEME + PHÂN LÔ)
    // ===============================================================
    const MY_CSS = `
        #dl-store-app { 
            display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; 
            background-color: #0f172a; 
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%);
            z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; 
            overflow-y: auto; overflow-x: hidden; 
            box-sizing: border-box;
            
            /* Tàng hình scrollbar nhưng vẫn cuộn được */
            scrollbar-width: none; -ms-overflow-style: none;
        }
        #dl-store-app::-webkit-scrollbar { display: none; }
        #dl-store-app * { box-sizing: border-box; }
        
        /* Header */
        .dl-header { 
            padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; 
            position: sticky; top: 0; z-index: 20;
            background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dl-title { font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: 1px; text-transform: uppercase;}
        
        .dl-btn-close { 
            width: 36px; height: 36px; border-radius: 50%; border: none; 
            background: rgba(255,255,255,0.1); color: #f8fafc; font-size: 16px; 
            display: flex; justify-content: center; align-items: center; cursor: pointer; 
            transition: all 0.3s;
        }
        .dl-btn-close:hover { background: #ef4444; transform: rotate(90deg); }

        .dl-body { padding: 20px 30px 50px; max-width: 1200px; margin: 0 auto; width: 100%; min-height: 100vh;}
        
        /* Loading & Lỗi */
        .dl-loading { text-align: center; color: #94a3b8; font-size: 16px; margin-top: 50px; display: flex; flex-direction: column; align-items: center; gap: 15px;}
        .dl-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: dl-spin 1s linear infinite; }
        @keyframes dl-spin { to { transform: rotate(360deg); } }

        /* Phân lô (Đường kẻ ngang) */
        .dl-category-header {
            display: flex; align-items: center; color: #94a3b8; font-size: 13px; font-weight: 800;
            text-transform: uppercase; letter-spacing: 2px; margin: 40px 0 20px 0;
        }
        .dl-category-header::after {
            content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); margin-left: 20px;
        }
        .dl-category-header:first-child { margin-top: 10px; }

        /* Grid hiển thị App */
        .dl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

        /* Thẻ App (Card) */
        .dl-card { 
            background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); 
            border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center;
            cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .dl-card:hover { 
            transform: translateY(-6px) scale(1.02); background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 15px 35px rgba(0,0,0,0.3), inset 0 0 15px rgba(255,255,255,0.05);
        }
        
        .dl-icon-box { 
            width: 75px; height: 75px; border-radius: 18px; display: flex; justify-content: center; align-items: center; 
            margin-bottom: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); overflow: hidden;
            font-size: 32px; font-weight: 900; color: white; background: #34495e;
        }
        .dl-icon-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .dl-app-name { color: #f1f5f9; font-size: 15px; font-weight: 700; margin-bottom: 5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .dl-app-desc { color: #64748b; font-size: 12px; font-weight: 600; }

        /* =========================================================
           POPUP TẢI VỀ (MODAL)
           ========================================================= */
        .dl-overlay { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
            z-index: 50; display: none; justify-content: center; align-items: center;
            opacity: 0; transition: opacity 0.3s; padding: 20px;
        }
        .dl-overlay.show { display: flex; opacity: 1; }

        .dl-modal { 
            background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; width: 100%; max-width: 400px; max-height: 90vh; display: flex; flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05);
            transform: scale(0.9); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .dl-overlay.show .dl-modal { transform: scale(1); }

        .dl-modal-header { 
            padding: 30px 20px 20px; position: relative; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); flex-shrink: 0;
        }
        .dl-modal-close { 
            position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(255,255,255,0.1); border: none; border-radius: 50%; color: #94a3b8; font-size: 14px; cursor: pointer; transition: 0.2s;
        }
        .dl-modal-close:hover { background: #ef4444; color: white; }
        
        .dl-modal-icon { 
            width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 15px; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden; font-size: 35px; font-weight: 900; color: white;
        }
        .dl-modal-icon img { width: 100%; height: 100%; object-fit: cover; }
        
        .dl-modal-title { font-size: 20px; font-weight: 800; color: #f8fafc; margin-bottom: 5px; line-height: 1.3;}
        .dl-modal-subtitle { font-size: 13px; color: #cbd5e1; }

        .dl-version-list { padding: 20px; overflow-y: auto; flex-grow: 1; scrollbar-width: none; }
        .dl-version-list::-webkit-scrollbar { display: none; }
        
        .dl-version-item { 
            display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 12px; transition: 0.3s;
        }
        .dl-version-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
        
        .dl-ver-info { display: flex; flex-direction: column; gap: 4px; flex: 1; padding-right: 15px; }
        .dl-ver-name { font-size: 15px; font-weight: 700; color: #f1f5f9; }
        .dl-ver-meta { font-size: 11px; color: #64748b; font-weight: 500; }
        
        .dl-btn-download { 
            background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex-shrink: 0;
        }
        .dl-btn-download:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6); }
        .dl-btn-download:active { transform: translateY(1px); }
        .dl-btn-download svg { width: 16px; height: 16px; fill: white; }

        @media (max-width: 600px) {
            .dl-header { padding: 15px 20px; }
            .dl-body { padding: 15px 20px; }
            .dl-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .dl-card { padding: 15px; border-radius: 14px; }
            .dl-icon-box { width: 60px; height: 60px; border-radius: 14px; font-size: 24px;}
            .dl-app-name { font-size: 13px; }
            .dl-app-desc { font-size: 11px; }
            .dl-category-header { font-size: 11px; margin: 25px 0 15px 0; }
            .dl-version-item { flex-direction: column; align-items: flex-start; gap: 10px; }
            .dl-btn-download { width: 100%; justify-content: center; }
        }
    `;

    // ===============================================================
    // 3. LOGIC TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('dl-store-app');
        
        if (!app) {
            // 1. Tạo thẻ DOM chính
            app = document.createElement('div');
            app.id = 'dl-store-app';
            app.innerHTML = `
                <div class="dl-header">
                    <div class="dl-title">KHO PHẦN MỀM</div>
                    <button class="dl-btn-close" id="dl-btn-close" title="Đóng">✕</button>
                </div>
                
                <div class="dl-body" id="dl-body-content">
                    <div class="dl-loading">
                        <div class="dl-spinner"></div>
                        Đang đồng bộ dữ liệu từ Google...
                    </div>
                </div>

                <!-- Overlay Popup chứa thông tin bản tải -->
                <div class="dl-overlay" id="dl-overlay">
                    <div class="dl-modal" id="dl-modal"></div>
                </div>
            `;
            document.body.appendChild(app);
            
            // Nhúng CSS
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            const $ = (id) => app.querySelector('#' + id);
            
            // Hàm lấy màu nền ngẫu nhiên theo tên
            const getColorFromName = (name) => {
                let hash = 0;
                for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                return COLORS[Math.abs(hash) % COLORS.length];
            };

            // Hàm xử lý Click
            const bindEvents = (groupedData) => {
                $('dl-btn-close').onclick = () => { app.style.display = 'none'; };

                const overlay = $('dl-overlay');
                const modal = $('dl-modal');

                app.querySelectorAll('.dl-card').forEach(card => {
                    card.onclick = () => {
                        const appName = card.getAttribute('data-name');
                        const appCat = card.getAttribute('data-cat');
                        
                        // Tìm data app trong mảng đã gộp
                        const appData = groupedData[appCat].find(a => a.name === appName);
                        if (!appData) return;

                        // Sinh HTML cho icon của Modal
                        let modalIconHtml = appData.img 
                            ? `<img src="${appData.img}">` 
                            : appData.name.charAt(0).toUpperCase();

                        // Sinh HTML danh sách phiên bản
                        let versionsHTML = '';
                        appData.versions.forEach(ver => {
                            versionsHTML += `
                                <div class="dl-version-item">
                                    <div class="dl-ver-info">
                                        <div class="dl-ver-name">${ver.name}</div>
                                        <div class="dl-ver-meta">Link tải từ ${ver.link.includes('Google') ? 'Google Drive' : (ver.link.includes('onedrive') ? 'OneDrive' : 'Máy chủ')}</div>
                                    </div>
                                    <button class="dl-btn-download" data-link="${ver.link}">
                                        <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                        Tải Về
                                    </button>
                                </div>
                            `;
                        });

                        // Nếu không có link nào
                        if (appData.versions.length === 0) {
                            versionsHTML = `<div style="text-align:center; color:#94a3b8; padding: 20px;">Đang cập nhật link tải...</div>`;
                        }

                        // Đổ HTML vào Modal
                        modal.innerHTML = `
                            <div class="dl-modal-header">
                                <button class="dl-modal-close" id="dl-modal-close">✕</button>
                                <div class="dl-modal-icon" style="background-color: ${appData.bgColor};">
                                    ${modalIconHtml}
                                </div>
                                <div class="dl-modal-title">${appData.name}</div>
                                <div class="dl-modal-subtitle">${appData.versions.length} phiên bản khả dụng</div>
                            </div>
                            <div class="dl-version-list">
                                ${versionsHTML}
                            </div>
                        `;

                        // Hiện Overlay
                        overlay.classList.add('show');

                        // Nút đóng
                        modal.querySelector('#dl-modal-close').onclick = () => { overlay.classList.remove('show'); };

                        // Nút tải về (Mở tab mới theo Link)
                        modal.querySelectorAll('.dl-btn-download').forEach(btn => {
                            btn.onclick = () => {
                                const dlLink = btn.getAttribute('data-link');
                                if(dlLink) window.open(dlLink, '_blank');
                            };
                        });
                    };
                });

                // Bấm ra ngoài rìa mờ cũng đóng popup
                overlay.onclick = (e) => {
                    if(e.target === overlay) overlay.classList.remove('show');
                };
            };

            // Hàm fetch và xử lý Data từ Google Sheet
            const fetchAndRenderData = async () => {
                try {
                    // Dùng fetch thông thường vì URL Export CSV của GSheet hỗ trợ CORS mở
                    const res = await fetch(CSV_URL);
                    if (!res.ok) throw new Error("Mạng lỗi!");
                    const text = await res.text();
                    
                    const rows = parseCSV(text);
                    const groupedData = {};

                    // Bỏ dòng tiêu đề (i=1)
                    for (let i = 1; i < rows.length; i++) {
                        const cols = rows[i];
                        if (cols.length < 3 || !cols[0].trim()) continue; // Bỏ qua dòng trống

                        const name = cols[0].trim();
                        const img = cols[1] ? cols[1].trim() : '';
                        const category = cols[2] ? cols[2].trim() : 'Khác';
                        
                        // Tách tên phiên bản (Cột D - Index 3)
                        const verNames = cols[3] ? cols[3].split(',').map(s => s.trim()) :[];
                        
                        // Lấy các cột Link 1 -> 5 (Từ Index 4 đến 8)
                        const links = [
                            cols[4] ? cols[4].trim() : null,
                            cols[5] ? cols[5].trim() : null,
                            cols[6] ? cols[6].trim() : null,
                            cols[7] ? cols[7].trim() : null,
                            cols[8] ? cols[8].trim() : null
                        ];

                        const versions = [];
                        for(let v = 0; v < verNames.length; v++) {
                            if (verNames[v] && links[v]) {
                                versions.push({ name: verNames[v], link: links[v] });
                            }
                        }

                        const appObj = {
                            name: name,
                            img: img,
                            bgColor: img ? 'transparent' : getColorFromName(name), // Có ảnh thì nền trong suốt
                            versions: versions
                        };

                        if (!groupedData[category]) groupedData[category] = [];
                        groupedData[category].push(appObj);
                    }

                    // Bắt đầu vẽ HTML
                    let finalHTML = '';
                    const categories = Object.keys(groupedData);

                    if (categories.length === 0) {
                        finalHTML = `<div class="dl-loading">Không có dữ liệu trong kho!</div>`;
                    } else {
                        categories.forEach(cat => {
                            // Tạo thanh phân lô
                            finalHTML += `<div class="dl-category-header">${cat}</div>`;
                            finalHTML += `<div class="dl-grid">`;
                            
                            groupedData[cat].forEach(app => {
                                let iconHtml = app.img 
                                    ? `<img src="${app.img}" loading="lazy">` 
                                    : app.name.charAt(0).toUpperCase();

                                finalHTML += `
                                    <div class="dl-card" data-name="${app.name}" data-cat="${cat}">
                                        <div class="dl-icon-box" style="background-color: ${app.bgColor};">
                                            ${iconHtml}
                                        </div>
                                        <div class="dl-app-name" title="${app.name}">${app.name}</div>
                                        <div class="dl-app-desc">Bấm để tải về</div>
                                    </div>
                                `;
                            });
                            
                            finalHTML += `</div>`;
                        });
                    }

                    $('dl-body-content').innerHTML = finalHTML;
                    bindEvents(groupedData); // Gán lại sự kiện Click

                } catch (error) {
                    console.error("Lỗi tải Kho Phần Mềm:", error);
                    $('dl-body-content').innerHTML = `<div class="dl-loading" style="color:#ef4444">❌ Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại!</div>`;
                    // Fix nút đóng khi lỗi
                    $('dl-btn-close').onclick = () => { app.style.display = 'none'; };
                }
            };

            // Gọi hàm lấy dữ liệu
            fetchAndRenderData();
        }
        
        // Mở giao diện
        app.style.display = 'block';
    };

    return {
        name: "Kho Phần Mềm",
        icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M19 2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16H5V4h14v14z"/><path fill="white" d="M7 12h2v5H7zm4-5h2v10h-2zm4 3h2v7h-2z"/></svg>`,
        bgColor: "#1e293b", // Xanh dương
        action: runTool
    };
})
