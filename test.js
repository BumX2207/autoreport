/* 
   MODULE: IN ẤN (PRINT TOOL) - V6.1 (ULTRA SHARP)
   - Tăng độ phân giải ảnh (Scale 4.0) -> Chữ nét căng.
   - Chuyển sang định dạng PNG (Lossless) để không bị nhòe nét.
   - Vẫn giữ cơ chế Iframe Injection để in full khổ giấy.
*/
((context) => {
    // Check thiết bị
    const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const TEMPLATE_URLS = [
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-1.html',
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan-2.html'
    ];

    // ===============================================================
    // CSS STYLE GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        #tgdd-print-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2147483800; font-family: sans-serif; flex-direction:column; }
        .pr-content { background:#e9ecef; width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; position: relative; }
        .pr-header { background:white; padding:10px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; flex-shrink:0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); z-index: 10; }
        .pr-top-bar { display:flex; align-items:center; justify-content:space-between; }
        .pr-title { font-size:16px; font-weight:bold; color:#2c3e50; display:flex; align-items:center; gap:5px; }
        .pr-actions { display:flex; gap:8px; align-items:center; }
        .pr-btn { border:none; border-radius:4px; padding:6px 16px; font-weight:bold; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:5px; transition:0.2s; white-space:nowrap; }
        .pr-btn-print { background:#27ae60; color:white; }
        .pr-btn-close { background:#fab1a0; color:#d63031; width:30px; height:30px; padding:0; justify-content:center; font-size:20px; }
        .pr-list-scroll { display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: thin; }
        .pr-tpl-item { min-width:100px; width:100px; cursor:pointer; border:2px solid transparent; border-radius:6px; overflow:hidden; background:white; position:relative; }
        .pr-tpl-item.active { border-color:#007bff; box-shadow:0 0 0 2px rgba(0,123,255,0.2); }
        .pr-tpl-img { width:100%; height:60px; object-fit:contain; display:block; background:#f8f9fa; padding:2px; }
        .pr-tpl-name { font-size:10px; padding:4px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:bold; }
        .pr-body { flex:1; overflow:auto; display:flex; justify-content:center; padding:20px; background:#555; }
        .pr-a4-page { width: 794px; height: 1123px; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); margin-bottom: 50px; position: relative; padding: 10px; overflow: hidden; box-sizing: border-box; }
        .pr-input-div { position:absolute; background:transparent; border:1px dashed transparent; outline:none; white-space: pre-wrap; display:flex; align-items:center; cursor:text; }
        .pr-input-div:focus { border-color:#007bff; background:rgba(255,255,255,0.8); z-index:10; }
        .pr-qty-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:none; align-items:center; justify-content:center; z-index:50; }
        .pr-qty-box { background:white; padding:20px 25px; border-radius:10px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.3); }
        .pr-qty-btns { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:15px; }
        .pr-qty-btn { padding:10px 20px; background:#e0e0e0; border:none; border-radius:6px; cursor:pointer; font-weight:bold; }
        .pr-qty-btn.pr-qty-active { background:#3498db; color:white; }
        
        @media (max-width: 600px) {
            .pr-a4-page { transform-origin: top left; transform: scale(0.45); margin-bottom: -500px; margin-right: -400px; }
            .pr-title span { display:none; }
        }
    `;

    // Hàm load thư viện chụp ảnh
    const loadHtml2Canvas = () => {
        return new Promise((resolve) => {
            if (window.html2canvas) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    };

    // ===============================================================
    // HÀM IN QUA IFRAME (CORE CỦA V6.1)
    // ===============================================================
    const printViaIframe = (dataUrl) => {
        let iframe = document.getElementById('pr-hidden-iframe');
        if (iframe) document.body.removeChild(iframe);
        
        iframe = document.createElement('iframe');
        iframe.id = 'pr-hidden-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        
        // CSS ép lề + Scale cho mobile
        const mobileStyle = isMobile() ? `
            width: 100%;
            height: auto;
            transform: scale(1.04); 
            transform-origin: top center;
            margin-top: 0;
        ` : `
            max-width: 100%;
            height: auto;
        `;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>IN AN TU DONG</title>
                <style>
                    @page { size: A4 portrait; margin: 0 !important; }
                    html, body {
                        margin: 0 !important; padding: 0 !important;
                        width: 100%; height: 100%; overflow: hidden;
                    }
                    #print-img {
                        display: block; margin: 0 auto;
                        /* Quan trọng: image-rendering giúp ảnh không bị nhòe khi thu nhỏ hiển thị */
                        image-rendering: -webkit-optimize-contrast; 
                        ${mobileStyle}
                    }
                </style>
            </head>
            <body>
                <img id="print-img" src="${dataUrl}" onload="window.print();" />
            </body>
            </html>
        `);
        doc.close();
    };

    // ===============================================================
    // LOGIC GIAO DIỆN
    // ===============================================================
    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';

        let state = { groupedTemplates: {}, activeBaseUrl: null, activeQty: null };
        const $ = (id) => document.getElementById(id);

        let modal = $('tgdd-print-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tgdd-print-modal';
            modal.innerHTML = `
                <div class="pr-content">
                    <div class="pr-header">
                        <div class="pr-top-bar">
                            <div class="pr-title">🖨️ IN ẤN</div>
                            <div class="pr-actions">
                                <button class="pr-btn pr-btn-print" id="btn-pr-exec" disabled>🖨️ IN NGAY</button>
                                <button class="pr-btn pr-btn-close" id="btn-pr-close">×</button>
                            </div>
                        </div>
                        <div class="pr-list-scroll" id="pr-list"></div>
                    </div>
                    <div class="pr-body">
                        <div class="pr-loading" id="pr-loading">Đang tải ...</div>
                        <div id="pr-a4" class="pr-a4-page" style="display:none;"></div>
                    </div>
                    <div class="pr-qty-overlay" id="pr-qty-overlay">
                        <div class="pr-qty-box">
                            <div class="pr-qty-title" id="pr-qty-title">Chọn Layout</div>
                            <div class="pr-qty-btns" id="pr-qty-btns"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            $('btn-pr-close').onclick = () => { modal.style.display = 'none'; if(bottomNav) bottomNav.style.display = 'flex'; };
            $('pr-qty-overlay').onclick = (e) => { if(e.target.id === 'pr-qty-overlay') $('pr-qty-overlay').style.display = 'none'; };
        }
        modal.style.display = 'flex';
        
        // TẢI TEMPLATE
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
                            if (!state.groupedTemplates[baseUrl]) state.groupedTemplates[baseUrl] = { baseUrl: baseUrl, name: setupEl.getAttribute('data-name') || 'Mẫu chưa đặt tên', bg: setupEl.getAttribute('data-bg') || '', variants: {} };
                            state.groupedTemplates[baseUrl].variants[qty] = setupEl.innerHTML;
                            if (qty === 1) {
                                state.groupedTemplates[baseUrl].name = setupEl.getAttribute('data-name') || state.groupedTemplates[baseUrl].name;
                                state.groupedTemplates[baseUrl].bg = setupEl.getAttribute('data-bg') || state.groupedTemplates[baseUrl].bg;
                            }
                        }
                    })
                );
                await Promise.all(fetchPromises);
            } catch(e) { $('pr-loading').innerText = "Lỗi tải mẫu!"; return; }
        }

        const groups = Object.values(state.groupedTemplates);
        if(groups.length === 0) return;

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
                    if(variantsKeys.length === 1) { state.activeBaseUrl = group.baseUrl; state.activeQty = variantsKeys[0]; renderMenuList(); renderA4(); } 
                    else { showQtyPopup(group, variantsKeys); }
                };
                listEl.appendChild(item);
            });
        };

        const showQtyPopup = (group, variantsKeys) => {
            $('pr-qty-title').innerText = `Chọn Layout: ${group.name}`;
            const btnContainer = $('pr-qty-btns');
            btnContainer.innerHTML = '';
            variantsKeys.forEach(q => {
                const btn = document.createElement('button');
                btn.className = 'pr-qty-btn';
                if(group.baseUrl === state.activeBaseUrl && state.activeQty === q) btn.classList.add('pr-qty-active');
                btn.innerText = `Số lượng: ${q}`;
                btn.onclick = () => { state.activeBaseUrl = group.baseUrl; state.activeQty = q; $('pr-qty-overlay').style.display = 'none'; renderMenuList(); renderA4(); };
                btnContainer.appendChild(btn);
            });
            $('pr-qty-overlay').style.display = 'flex';
        };

        const renderA4 = () => {
            const a4 = $('pr-a4');
            a4.innerHTML = state.groupedTemplates[state.activeBaseUrl].variants[state.activeQty];
            a4.querySelectorAll('.pr-input-div').forEach(div => { div.contentEditable = true; div.spellcheck = false; });
        };

        // =======================================================
        // XỬ LÝ SỰ KIỆN IN (V6.1 - HIGH RESOLUTION)
        // =======================================================
        $('btn-pr-exec').onclick = async () => { 
            const btn = $('btn-pr-exec');
            const originalText = btn.innerText;
            btn.innerText = '📸 ĐANG XỬ LÝ ẢNH...';
            btn.disabled = true;

            try {
                await loadHtml2Canvas();
                if(document.activeElement) document.activeElement.blur();

                const a4 = $('pr-a4');
                const oldShadow = a4.style.boxShadow;
                a4.style.boxShadow = 'none';

                // --- CẤU HÌNH ĐỘ NÉT ---
                // PC: Scale 4 (Rất nét). Mobile: Scale 3 (Nét & an toàn cho RAM điện thoại)
                const renderScale = isMobile() ? 3 : 4; 

                const canvas = await html2canvas(a4, { 
                    scale: renderScale, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    // Tắt logging để tăng tốc
                    logging: false 
                });
                a4.style.boxShadow = oldShadow;

                // CHUYỂN SANG PNG (Lossless) THAY VÌ JPEG
                const dataUrl = canvas.toDataURL('image/png');

                btn.innerText = '🖨️ ĐANG GỬI MÁY IN...';
                printViaIframe(dataUrl);

            } catch (err) {
                alert("Lỗi: " + err.message);
            } finally {
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        };

        renderMenuList();
        renderA4(); 
    };

    return {
        name: "Xem phim",
        icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>`,
        bgColor: "#e17055",
        css: MY_CSS,
        action: runTool
    };
})
