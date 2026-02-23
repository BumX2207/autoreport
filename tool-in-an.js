/* 
   MODULE: IN ẤN (PRINT TOOL) - V4.2 (FIX MOBILE PRINTING)
   - Khắc phục lỗi cắt viền 2 bên trên điện thoại.
   - Chặn tuyệt đối lỗi nhảy sang trang 2.
*/
((context) => {
    const { UI, AUTH_STATE } = context;

    const TEMPLATE_URLS = [
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-1.html',
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-2.html',
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-4.html',
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-6.html',
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-8.html'
    ];

    // ===============================================================
    // CSS STYLE
    // ===============================================================
    const MY_CSS = `
        #tgdd-print-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2147483800; font-family: sans-serif; flex-direction:column; }
        .pr-content { background:#e9ecef; width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; position: relative; }

        .pr-header { background:white; padding:10px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; flex-shrink:0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); z-index: 10; }
        .pr-top-bar { display:flex; align-items:center; justify-content:space-between; }
        .pr-title { font-size:16px; font-weight:bold; color:#2c3e50; display:flex; align-items:center; gap:5px; }
        
        .pr-actions { display:flex; gap:8px; align-items:center; }
        .pr-btn { border:none; border-radius:4px; padding:6px 16px; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:5px; transition:0.2s; }
        .pr-btn-print { background:#27ae60; color:white; }
        .pr-btn-close { background:#fab1a0; color:#d63031; width:30px; height:30px; padding:0; justify-content:center; font-size:20px; }
        .pr-btn:hover { filter:brightness(1.1); }
        .pr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pr-list-scroll { display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: thin; }
        .pr-list-scroll::-webkit-scrollbar { height: 4px; }
        .pr-list-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        
        .pr-tpl-item { min-width:100px; width:100px; cursor:pointer; border:2px solid transparent; border-radius:6px; overflow:hidden; background:white; position:relative; }
        .pr-tpl-item.active { border-color:#007bff; box-shadow:0 0 0 2px rgba(0,123,255,0.2); }
        .pr-tpl-img { width:100%; height:60px; object-fit:contain; display:block; background:#f8f9fa; padding:2px; box-sizing:border-box; }
        .pr-tpl-name { font-size:10px; padding:4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#333; font-weight:bold; }
        
        .pr-loading { text-align: center; padding: 20px; color: white; font-size: 16px; margin: auto; }

        .pr-body { flex:1; overflow:auto; display:flex; justify-content:center; padding:20px; background:#555; }
        
        /* KHUNG A4 TRÊN MÀN HÌNH CHỜ (Hiển thị preview) */
        .pr-a4-page { 
            width: 794px; 
            height: 1123px; 
            background: white; 
            box-shadow: 0 0 20px rgba(0,0,0,0.5); 
            margin-bottom: 50px; 
            position: relative; 
            box-sizing: border-box; 
            padding: 10px; 
            overflow: hidden;
        }

        .pr-input-div { 
            position:absolute; 
            background:transparent; 
            border:1px dashed transparent; 
            outline:none; 
            line-height:1.2; 
            white-space: pre-wrap; 
            display:flex; 
            align-items:center; 
            cursor:text;
            transition:0.1s;
        }
        .pr-input-div:hover { border-color:rgba(0,0,0,0.2); background:rgba(255,255,255,0.2); }
        .pr-input-div:focus { border-color:#007bff; background:rgba(255,255,255,0.8); z-index:10; }

        /* KHUNG ẢNH CHỤP ẨN TRÊN MÀN HÌNH */
        #pr-print-image-wrap { display: none; }

        .pr-qty-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:none; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(2px); }
        .pr-qty-box { background:white; padding:20px 25px; border-radius:10px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.3); animation: pop 0.2s ease-out; }
        @keyframes pop { from{ transform:scale(0.8); opacity:0; } to{ transform:scale(1); opacity:1; } }
        .pr-qty-title { font-size:16px; font-weight:bold; margin-bottom:15px; color:#2c3e50; }
        .pr-qty-btns { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
        .pr-qty-btn { padding:10px 20px; background:#e0e0e0; color:#333; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; transition:0.2s; }
        .pr-qty-btn:hover { background:#d0d0d0; }
        .pr-qty-btn.pr-qty-active { background:#3498db; color:white; }

        /* =========================================================
           MEDIA PRINT (ĐÃ TỐI ƯU CẢ MOBILE & PC)
           ========================================================= */
        @media print {
            @page { 
                size: A4 portrait; 
                margin: 0 !important; 
            }
            
            /* overflow: hidden ở thẻ html và body triệt tiêu hoàn toàn trang số 2 */
            html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                width: 100% !important; 
                height: 100% !important; 
                background: white !important; 
                overflow: hidden !important; 
            }
            
            body * { visibility: hidden !important; }
            #tgdd-print-modal, #tgdd-print-modal * { visibility: visible !important; }
            
            #tgdd-print-modal { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                height: 100% !important; 
                z-index: 2147483800; 
                display: block !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important; 
            }
            
            .pr-header, .pr-qty-overlay, .pr-body { display: none !important; }

            /* Thiết lập khung bao quanh bức ảnh bám dính vào giấy */
            #pr-print-image-wrap { 
                display: flex !important; 
                justify-content: center !important;
                align-items: center !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important; 
                height: 100% !important; 
                margin: 0 !important; 
                padding: 0 !important;
                background: white;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
            }
            
            /* Dùng object-fit: contain để ảnh TỰ THU NHỎ HIỂN THỊ ĐỦ 100% NỘI DUNG */
            #pr-print-image { 
                max-width: 100% !important; 
                max-height: 100% !important; 
                width: auto !important;
                height: auto !important;
                object-fit: contain !important; 
                display: block !important;
                margin: 0 auto !important;
            }
        }
        
        @media (max-width: 600px) {
            .pr-a4-page { transform-origin: top left; transform: scale(0.45); margin-bottom: -500px; margin-right: -400px; }
            .pr-title span { display:none; } 
        }
    `;

    // ===============================================================
    // LOGIC CHÍNH
    // ===============================================================
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';

        let state = {
            groupedTemplates: {},
            activeBaseUrl: null,
            activeQty: null
        };

        const $ = (id) => document.getElementById(id);

        let modal = $('tgdd-print-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tgdd-print-modal';
            modal.innerHTML = `
                <div class="pr-content">
                    <div class="pr-header">
                        <div class="pr-top-bar">
                            <div class="pr-title">🖨️ <span>IN ẤN TỰ ĐỘNG</span></div>
                            <div class="pr-actions">
                                <button class="pr-btn pr-btn-print" id="btn-pr-exec" disabled>🖨️ IN NGAY</button>
                                <button class="pr-btn pr-btn-close" id="btn-pr-close">×</button>
                            </div>
                        </div>
                        <div class="pr-list-scroll" id="pr-list"></div>
                    </div>
                    
                    <div class="pr-body" id="pr-body-wrap">
                        <div class="pr-loading" id="pr-loading">Đang tải cấu trúc từ Github...</div>
                        <div id="pr-a4" class="pr-a4-page" style="display:none;"></div>
                    </div>

                    <!-- KHUNG CHỨA ẢNH CHỤP DÀNH RIÊNG CHO LÚC IN -->
                    <div id="pr-print-image-wrap">
                        <img id="pr-print-image" src="" />
                    </div>

                    <div class="pr-qty-overlay" id="pr-qty-overlay">
                        <div class="pr-qty-box">
                            <div class="pr-qty-title" id="pr-qty-title">Chọn Layout In</div>
                            <div class="pr-qty-btns" id="pr-qty-btns"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            $('btn-pr-close').onclick = () => { 
                modal.style.display = 'none'; 
                if(bottomNav) bottomNav.style.display = 'flex';
            };
            
            $('pr-qty-overlay').onclick = (e) => {
                if(e.target.id === 'pr-qty-overlay') $('pr-qty-overlay').style.display = 'none';
            };
        }

        modal.style.display = 'flex';
        
        if(Object.keys(state.groupedTemplates).length === 0) {
            try {
                const fetchPromises = TEMPLATE_URLS.map(url => 
                    fetch(`${url}?t=${Date.now()}`).then(res => res.text()).then(htmlText => {
                        const match = url.match(/(.*?)-(\d+)\.html(\?.*)?$/);
                        if (!match) return;
                        const baseUrl = match[1];
                        const qty = parseInt(match[2]);

                        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                        const setupEl = doc.getElementById('template-setup'); 
                        
                        if (setupEl) {
                            if (!state.groupedTemplates[baseUrl]) {
                                state.groupedTemplates[baseUrl] = {
                                    baseUrl: baseUrl,
                                    name: setupEl.getAttribute('data-name') || 'Mẫu chưa đặt tên',
                                    bg: setupEl.getAttribute('data-bg') || '',
                                    variants: {} 
                                };
                            }
                            state.groupedTemplates[baseUrl].variants[qty] = setupEl.innerHTML;
                            if (qty === 1) {
                                state.groupedTemplates[baseUrl].name = setupEl.getAttribute('data-name') || state.groupedTemplates[baseUrl].name;
                                state.groupedTemplates[baseUrl].bg = setupEl.getAttribute('data-bg') || state.groupedTemplates[baseUrl].bg;
                            }
                        }
                    })
                );
                await Promise.all(fetchPromises);
            } catch(e) {
                $('pr-loading').innerText = "Lỗi khi tải mẫu HTML!";
                return;
            }
        }

        const groups = Object.values(state.groupedTemplates);
        if(groups.length === 0) {
            $('pr-loading').innerText = "Không tìm thấy cấu hình <div id='template-setup'> hợp lệ!";
            return;
        }

        state.activeBaseUrl = groups[0].baseUrl;
        const availableQtys = Object.keys(groups[0].variants).map(Number).sort((a,b) => a-b);
        state.activeQty = availableQtys.includes(1) ? 1 : availableQtys[0];
        
        $('pr-loading').style.display = 'none';
        $('pr-a4').style.display = 'block';
        $('btn-pr-exec').disabled = false;

        const renderMenuList = () => {
            const listEl = $('pr-list');
            listEl.innerHTML = ''; 
            
            groups.forEach(group => {
                const item = document.createElement('div');
                item.className = 'pr-tpl-item';
                if(group.baseUrl === state.activeBaseUrl) item.classList.add('active');
                
                item.innerHTML = `<img src="${group.bg}" class="pr-tpl-img"><div class="pr-tpl-name">${group.name}</div>`;
                
                item.onclick = () => {
                    const variantsKeys = Object.keys(group.variants).map(Number).sort((a,b) => a-b);
                    if(variantsKeys.length === 1) {
                        state.activeBaseUrl = group.baseUrl;
                        state.activeQty = variantsKeys[0];
                        renderMenuList(); 
                        renderA4();
                    } else {
                        showQtyPopup(group, variantsKeys);
                    }
                };
                listEl.appendChild(item);
            });
        };

        const showQtyPopup = (group, variantsKeys) => {
            $('pr-qty-title').innerText = `Chọn Layout In: ${group.name}`;
            const btnContainer = $('pr-qty-btns');
            btnContainer.innerHTML = '';
            
            variantsKeys.forEach(q => {
                const btn = document.createElement('button');
                btn.className = 'pr-qty-btn';
                if(group.baseUrl === state.activeBaseUrl && state.activeQty === q) {
                    btn.classList.add('pr-qty-active');
                }
                btn.innerText = `Bản ${q} tem`;
                
                btn.onclick = () => {
                    state.activeBaseUrl = group.baseUrl;
                    state.activeQty = q;
                    $('pr-qty-overlay').style.display = 'none';
                    renderMenuList(); 
                    renderA4();
                };
                btnContainer.appendChild(btn);
            });
            $('pr-qty-overlay').style.display = 'flex';
        };

        const renderA4 = () => {
            const a4 = $('pr-a4');
            const htmlContent = state.groupedTemplates[state.activeBaseUrl].variants[state.activeQty];
            a4.innerHTML = htmlContent;

            const inputs = a4.querySelectorAll('.pr-input-div');
            inputs.forEach(div => {
                div.contentEditable = true; 
                div.spellcheck = false;
            });
        };

        // =======================================================
        // THUẬT TOÁN CHỤP ẢNH MÀN HÌNH TRƯỚC KHI IN
        // =======================================================
        $('btn-pr-exec').onclick = async () => { 
            const btn = $('btn-pr-exec');
            const originalText = btn.innerText;
            btn.innerText = '⏳ ĐANG TẠO BẢN IN...';
            btn.disabled = true;

            try {
                if (typeof html2canvas === 'undefined') {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                if(document.activeElement) document.activeElement.blur();

                const a4 = $('pr-a4');
                const oldShadow = a4.style.boxShadow;
                a4.style.boxShadow = 'none';

                const canvas = await html2canvas(a4, {
                    scale: 2, 
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                a4.style.boxShadow = oldShadow;

                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                $('pr-print-image').src = dataUrl;

                window.print();

            } catch (err) {
                console.error(err);
                alert("Lỗi khi tạo ảnh in: Đảm bảo ảnh nền của bạn được host ở nơi hỗ trợ CORS (như Github)!");
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };

        renderMenuList();
        renderA4(); 
    };

    return {
        name: "In ấn",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-2h8zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" fill="white"/></svg>`,
        bgColor: "#e17055",
        css: MY_CSS,
        action: runTool
    };
})
