((context) => {
    // ===============================================================
    // 1. DỮ LIỆU DEMO CÁC ỨNG DỤNG (Bạn có thể thêm bớt sau này)
    // ===============================================================
    const APPS_DATA =[
        {
            id: 'app_bchngay',
            name: 'Báo Cáo Hằng Ngày',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
            bgColor: '#636e72', // Màu xám
            versions:[
                { ver: 'v2.1.0', size: '15.2 MB', date: '10/03/2026', link: '#dl1' },
                { ver: 'v2.0.5', size: '14.8 MB', date: '01/02/2026', link: '#dl2' }
            ]
        },
        {
            id: 'app_hcns',
            name: 'Headcount Nhân Sự',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
            bgColor: '#00b894', // Màu xanh lá
            versions:[
                { ver: 'v1.0.0', size: '8.5 MB', date: '15/01/2026', link: '#dl3' }
            ]
        },
        {
            id: 'app_tgtst',
            name: 'Target Siêu Thị',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`,
            bgColor: '#0984e3', // Màu xanh biển
            versions:[
                { ver: 'v3.5.2', size: '22.1 MB', date: '05/03/2026', link: '#dl4' },
                { ver: 'v3.5.0', size: '21.9 MB', date: '20/02/2026', link: '#dl5' },
                { ver: 'v3.4.1', size: '20.0 MB', date: '10/01/2026', link: '#dl6' }
            ]
        },
        {
            id: 'app_tgtthidua',
            name: 'Target Thi Đua',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5v18l7-3 7 3V3z"/></svg>`,
            bgColor: '#e17055', // Màu cam
            versions:[
                { ver: 'v1.2.0', size: '12.0 MB', date: '28/02/2026', link: '#dl7' }
            ]
        },
        {
            id: 'app_thuongthidua',
            name: 'Thưởng Thi Đua',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>`,
            bgColor: '#00cec9', // Màu mint
            versions:[
                { ver: 'v1.5.0', size: '10.5 MB', date: '01/03/2026', link: '#dl8' }
            ]
        },
        {
            id: 'app_phuondoc',
            name: 'Phướn Dọc',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`,
            bgColor: '#192a56', // Xanh đen
            versions:[
                { ver: 'v1.0.1', size: '5.2 MB', date: '10/02/2026', link: '#dl9' }
            ]
        },
        {
            id: 'app_vpp',
            name: 'Văn Phòng Phẩm',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
            bgColor: '#a29bfe', // Tím
            versions:[
                { ver: 'v2.2.0', size: '18.4 MB', date: '08/03/2026', link: '#dl10' }
            ]
        },
        {
            id: 'app_popup',
            name: 'Popup Notification',
            desc: 'Nhấn Vào Để Xem Chi Tiết',
            icon: `<svg viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`,
            bgColor: '#d63031', // Đỏ
            versions:[
                { ver: 'v4.0.0', size: '9.8 MB', date: '11/03/2026', link: '#dl11' },
                { ver: 'v3.9.5', size: '9.2 MB', date: '15/02/2026', link: '#dl12' }
            ]
        }
    ];

    // ===============================================================
    // 2. CSS GIAO DIỆN (DARK THEME + NEON + KHÔNG SCROLLBAR)
    // ===============================================================
    const MY_CSS = `
        /* Khóa nền, tàng hình scrollbar nhưng vẫn cho phép cuộn */
        #dl-store-app { 
            display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; 
            background-color: #0f172a; /* Nền xanh đen Dark Mode */
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%);
            z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; 
            overflow-y: auto; overflow-x: hidden; 
            box-sizing: border-box;
            
            /* Tàng hình scrollbar (Firefox, IE, Chrome, Safari) */
            scrollbar-width: none; 
            -ms-overflow-style: none;
        }
        #dl-store-app::-webkit-scrollbar { display: none; }
        #dl-store-app * { box-sizing: border-box; }
        
        /* Header */
        .dl-header { 
            padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; 
            position: sticky; top: 0; z-index: 20;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(15px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dl-title { font-size: 20px; font-weight: 800; color: #f8fafc; letter-spacing: 1px; text-transform: uppercase;}
        .dl-subtitle { font-size: 12px; color: #94a3b8; font-weight: 500; letter-spacing: 2px;}
        .dl-btn-close { 
            width: 36px; height: 36px; border-radius: 50%; border: none; 
            background: rgba(255,255,255,0.1); color: #f8fafc; font-size: 16px; 
            display: flex; justify-content: center; align-items: center; cursor: pointer; 
            transition: all 0.3s;
        }
        .dl-btn-close:hover { background: #ef4444; transform: rotate(90deg); }

        /* Grid hiển thị App */
        .dl-body { padding: 30px; max-width: 1200px; margin: 0 auto; width: 100%; min-height: 100vh;}
        .dl-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 25px; 
        }

        /* Thẻ App (Card) */
        .dl-card { 
            background: rgba(255, 255, 255, 0.03); 
            border: 1px solid rgba(255, 255, 255, 0.05); 
            border-radius: 20px; padding: 25px 20px; 
            display: flex; flex-direction: column; align-items: center; text-align: center;
            cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .dl-card:hover { 
            transform: translateY(-8px) scale(1.02); 
            background: rgba(255, 255, 255, 0.08); 
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05);
        }
        .dl-icon-box { 
            width: 70px; height: 70px; border-radius: 18px; 
            display: flex; justify-content: center; align-items: center; 
            margin-bottom: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .dl-icon-box svg { width: 34px; height: 34px; fill: #ffffff; }
        .dl-app-name { color: #f1f5f9; font-size: 16px; font-weight: 700; margin-bottom: 5px; }
        .dl-app-desc { color: #64748b; font-size: 12px; font-weight: 600; }

        /* =========================================================
           POPUP TẢI VỀ (MODAL)
           ========================================================= */
        .dl-overlay { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); 
            z-index: 50; display: none; justify-content: center; align-items: center;
            opacity: 0; transition: opacity 0.3s;
        }
        .dl-overlay.show { display: flex; opacity: 1; }

        .dl-modal { 
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; width: 90%; max-width: 450px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05);
            transform: scale(0.9); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
        }
        .dl-overlay.show .dl-modal { transform: scale(1); }

        /* Modal Header (Ảnh bìa mờ) */
        .dl-modal-header { 
            padding: 30px 20px 20px; position: relative; text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.02);
        }
        .dl-modal-close { 
            position: absolute; top: 15px; right: 15px; width: 30px; height: 30px;
            background: rgba(255,255,255,0.1); border: none; border-radius: 50%;
            color: #94a3b8; font-size: 14px; cursor: pointer; transition: 0.2s;
        }
        .dl-modal-close:hover { background: #ef4444; color: white; }
        .dl-modal-icon { 
            width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 15px; 
            display: flex; justify-content: center; align-items: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .dl-modal-icon svg { width: 40px; height: 40px; }
        .dl-modal-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin-bottom: 5px; }
        .dl-modal-subtitle { font-size: 13px; color: #cbd5e1; }

        /* Danh sách phiên bản */
        .dl-version-list { padding: 20px; max-height: 300px; overflow-y: auto; scrollbar-width: none; }
        .dl-version-list::-webkit-scrollbar { display: none; }
        
        .dl-version-item { 
            display: flex; justify-content: space-between; align-items: center; 
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px; padding: 15px; margin-bottom: 12px;
            transition: 0.3s;
        }
        .dl-version-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
        
        .dl-ver-info { display: flex; flex-direction: column; gap: 4px; }
        .dl-ver-name { font-size: 16px; font-weight: 700; color: #f1f5f9; }
        .dl-ver-meta { font-size: 12px; color: #64748b; font-weight: 500; }
        
        .dl-btn-download { 
            background: linear-gradient(135deg, #3b82f6, #2563eb); 
            color: white; border: none; border-radius: 8px; 
            padding: 8px 16px; font-size: 14px; font-weight: 700; 
            cursor: pointer; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
            display: flex; align-items: center; gap: 6px; transition: 0.2s;
        }
        .dl-btn-download:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6); }
        .dl-btn-download:active { transform: translateY(1px); }
        .dl-btn-download svg { width: 16px; height: 16px; fill: white; }

        /* Toast Thông báo nhỏ (Demo) */
        #dl-toast {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(50px);
            background: #10b981; color: white; padding: 12px 24px; border-radius: 30px;
            font-size: 14px; font-weight: bold; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
            opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 100;
        }
        #dl-toast.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }

        @media (max-width: 600px) {
            .dl-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .dl-card { padding: 15px; border-radius: 16px; }
            .dl-icon-box { width: 50px; height: 50px; border-radius: 14px; }
            .dl-icon-box svg { width: 24px; height: 24px; }
            .dl-app-name { font-size: 14px; }
            .dl-app-desc { font-size: 10px; }
            .dl-header { padding: 15px 20px; }
            .dl-body { padding: 20px 15px; }
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

            // 2. Sinh mã HTML cho lưới ứng dụng
            let gridHTML = '';
            APPS_DATA.forEach(item => {
                gridHTML += `
                    <div class="dl-card" data-id="${item.id}">
                        <div class="dl-icon-box" style="background-color: ${item.bgColor};">
                            ${item.icon}
                        </div>
                        <div class="dl-app-name">${item.name}</div>
                        <div class="dl-app-desc">${item.desc}</div>
                    </div>
                `;
            });

            // 3. Lắp ráp toàn bộ HTML
            app.innerHTML = `
                <div class="dl-header">
                    <div>
                        <div class="dl-subtitle">NGHIỆP VỤ VẬN HÀNH</div>
                        <div class="dl-title">KHO ỨNG DỤNG</div>
                    </div>
                    <button class="dl-btn-close" id="dl-btn-close">✕</button>
                </div>
                
                <div class="dl-body">
                    <div class="dl-grid">
                        ${gridHTML}
                    </div>
                </div>

                <!-- Overlay Popup chứa thông tin bản tải -->
                <div class="dl-overlay" id="dl-overlay">
                    <div class="dl-modal" id="dl-modal">
                        <!-- Nội dung popup sẽ được JS bơm vào đây khi click -->
                    </div>
                </div>

                <!-- Cục Toast thông báo -->
                <div id="dl-toast">Đang bắt đầu tải về...</div>
            `;
            document.body.appendChild(app);
            
            // Nhúng CSS
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // ==========================================
            // 4. XỬ LÝ SỰ KIỆN (EVENTS)
            // ==========================================
            const $ = (id) => app.querySelector('#' + id);
            
            // Đóng App Store
            $('dl-btn-close').onclick = () => { app.style.display = 'none'; };

            // Logic mở Popup
            const overlay = $('dl-overlay');
            const modal = $('dl-modal');

            app.querySelectorAll('.dl-card').forEach(card => {
                card.onclick = () => {
                    const appId = card.getAttribute('data-id');
                    const appData = APPS_DATA.find(a => a.id === appId);
                    if (!appData) return;

                    // Sinh HTML danh sách phiên bản
                    let versionsHTML = '';
                    appData.versions.forEach(ver => {
                        versionsHTML += `
                            <div class="dl-version-item">
                                <div class="dl-ver-info">
                                    <div class="dl-ver-name">${ver.ver}</div>
                                    <div class="dl-ver-meta">${ver.size} • ${ver.date}</div>
                                </div>
                                <button class="dl-btn-download" data-app="${appData.name}" data-ver="${ver.ver}">
                                    <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                    Tải Về
                                </button>
                            </div>
                        `;
                    });

                    // Đổ HTML vào Modal
                    modal.innerHTML = `
                        <div class="dl-modal-header">
                            <button class="dl-modal-close" id="dl-modal-close">✕</button>
                            <div class="dl-modal-icon" style="background-color: ${appData.bgColor};">
                                ${appData.icon}
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

                    // Gán sự kiện đóng Popup
                    modal.querySelector('#dl-modal-close').onclick = () => {
                        overlay.classList.remove('show');
                    };

                    // Gán sự kiện cho các nút "Tải Về" (Demo)
                    modal.querySelectorAll('.dl-btn-download').forEach(btn => {
                        btn.onclick = () => {
                            const name = btn.getAttribute('data-app');
                            const ver = btn.getAttribute('data-ver');
                            showToast(`⬇ Đang tải ${name} (${ver})...`);
                            // Đóng popup sau khi bấm tải
                            setTimeout(() => overlay.classList.remove('show'), 500);
                        };
                    });
                };
            });

            // Bấm ra ngoài rìa mờ cũng đóng popup
            overlay.onclick = (e) => {
                if(e.target === overlay) overlay.classList.remove('show');
            };

            // Hàm hiện Toast
            let toastTimeout;
            const showToast = (msg) => {
                const toast = $('dl-toast');
                toast.innerText = msg;
                toast.classList.add('show');
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            };
        }
        
        // Mở giao diện
        app.style.display = 'block';
    };

    return {
        name: "Kho Ứng Dụng",
        icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`,
        bgColor: "#1e293b", // Xanh đen đậm chuẩn ngầu
        action: runTool
    };
})
