/* 
   MODULE: IN ẤN (PRINT TOOL) - V2.4 (FIX AUTO-SCALE & ROTATE)
   - Tự động xoay tem 90 độ nếu lấp đầy giấy tốt hơn (khắc phục lỗi không tràn cạnh).
*/
((context) => {
    const { UI, AUTH_STATE } = context;

    const TEMPLATE_URLS = [
        'https://raw.githubusercontent.com/BumX2207/print/refs/heads/main/the-thanh-toan.html',
    ];

    const MY_CSS = `
        #tgdd-print-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2147483800; font-family: sans-serif; flex-direction:column; }
        .pr-content { background:#e9ecef; width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; }

        .pr-header { background:white; padding:10px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; flex-shrink:0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .pr-top-bar { display:flex; align-items:center; justify-content:space-between; }
        .pr-title { font-size:16px; font-weight:bold; color:#2c3e50; display:flex; align-items:center; gap:5px; }
        
        .pr-actions { display:flex; gap:8px; align-items:center; }
        .pr-btn { border:none; border-radius:4px; padding:6px 12px; font-weight:bold; cursor:pointer; font-size:13px; display:flex; align-items:center; gap:5px; transition:0.2s; }
        .pr-btn-qty { background:#3498db; color:white; min-width:80px; justify-content:center; }
        .pr-btn-print { background:#27ae60; color:white; }
        .pr-btn-close { background:#fab1a0; color:#d63031; width:30px; height:30px; padding:0; justify-content:center; font-size:20px; }
        .pr-btn:hover { filter:brightness(1.1); }
        .pr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pr-list-scroll { display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: thin; }
        .pr-list-scroll::-webkit-scrollbar { height: 4px; }
        .pr-list-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        
        .pr-tpl-item { min-width:100px; width:100px; cursor:pointer; border:2px solid transparent; border-radius:6px; overflow:hidden; background:white; position:relative; }
        .pr-tpl-item.active { border-color:#007bff; box-shadow:0 0 0 2px rgba(0,123,255,0.2); }
        .pr-tpl-img { width:100%; height:60px; object-fit:cover; display:block; }
        .pr-tpl-name { font-size:10px; padding:4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#333; }
        
        .pr-loading { text-align: center; padding: 20px; color: white; font-size: 16px; margin: auto; }

        .pr-body { flex:1; overflow:auto; display:flex; justify-content:center; padding:20px; background:#555; }
        .pr-a4-page { width: 794px; height: 1123px; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5); margin-bottom: 50px; position: relative; overflow: hidden; display: flex; }

        .pr-grid-1 { justify-content:center; align-items:center; padding:0 15px; } 
        .pr-grid-2 { display:grid !important; grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
        .pr-grid-4 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .pr-grid-6 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .pr-grid-8 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr; }

        .pr-cell { border:1px dashed #eee; display:flex; justify-content:center; align-items:center; overflow:hidden; position:relative; }
        .pr-cell:hover { border-color:blue; }

        .pr-canvas-wrapper { position:relative; transform-origin: center center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease; }
        .pr-bg-img { width:100%; height:100%; display:block; pointer-events:none; }
        
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

        @media print {
            @page { size: A4; margin: 0; }
            body * { visibility: hidden; }
            #tgdd-print-modal, #tgdd-print-modal * { visibility: visible; }
            #tgdd-print-modal { position:absolute; left:0; top:0; background:white; width:100%; height:100%; z-index:2147483800; display:block !important; }
            .pr-header { display:none !important; }
            .pr-body { padding:0; background:white; overflow:visible; display:block; }
            .pr-a4-page { width: 100%; height: 100%; box-shadow: none; margin:0; transform: none !important; }
            .pr-cell { border:none !important; } 
            .pr-input-div { border:none !important; background:transparent !important; }
            .pr-canvas-wrapper { box-shadow:none; }
        }
        @media (max-width: 600px) {
            .pr-a4-page { transform-origin: top left; transform: scale(0.45); margin-bottom: -500px; margin-right: -400px; }
            .pr-title span { display:none; } 
        }
    `;

    const runTool = async () => {
        const bottomNav = document.getElementById('tgdd-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'none';

        const QUANTITIES = [1, 2, 4, 6, 8];
        let state = {
            qtyIdx: 0,
            tpl: null,
            templates: [] 
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
                                <button class="pr-btn pr-btn-qty" id="btn-pr-qty" disabled>SL: 1</button>
                                <button class="pr-btn pr-btn-print" id="btn-pr-exec" disabled>🖨️ IN</button>
                                <button class="pr-btn pr-btn-close" id="btn-pr-close">×</button>
                            </div>
                        </div>
                        <div class="pr-list-scroll" id="pr-list"></div>
                    </div>
                    <div class="pr-body" id="pr-body-wrap">
                        <div class="pr-loading" id="pr-loading">Đang tải cấu trúc HTML từ Github...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            $('btn-pr-close').onclick = () => { 
                modal.style.display = 'none'; 
                if(bottomNav) bottomNav.style.display = 'flex';
            };
        }

        modal.style.display = 'flex';
        
        if(state.templates.length === 0) {
            try {
                const fetchPromises = TEMPLATE_URLS.map(url => 
                    fetch(`${url}?t=${Date.now()}`).then(res => res.text())
                );
                
                const filesContent = await Promise.all(fetchPromises);
                const parser = new DOMParser();

                filesContent.forEach(htmlText => {
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    const setupEl = doc.getElementById('template-setup'); 
                    
                    if (setupEl) {
                        state.templates.push({
                            id: setupEl.getAttribute('data-id'),
                            name: setupEl.getAttribute('data-name'),
                            bg: setupEl.getAttribute('data-bg'),
                            width: parseInt(setupEl.getAttribute('data-width') || 600),
                            height: parseInt(setupEl.getAttribute('data-height') || 800),
                            htmlContent: setupEl.innerHTML 
                        });
                    }
                });

            } catch(e) {
                $('pr-loading').innerText = "Lỗi khi tải mẫu HTML!";
                return;
            }
        }

        if(state.templates.length === 0) {
            $('pr-loading').innerText = "Không tìm thấy cấu hình <div id='template-setup'> hợp lệ!";
            return;
        }

        state.tpl = state.templates[0]; 
        
        const bodyWrap = $('pr-body-wrap');
        bodyWrap.innerHTML = `<div id="pr-a4" class="pr-a4-page pr-grid-1"></div>`;
        
        $('btn-pr-qty').disabled = false;
        $('btn-pr-exec').disabled = false;

        const listEl = $('pr-list');
        listEl.innerHTML = ''; 
        state.templates.forEach(tpl => {
            const item = document.createElement('div');
            item.className = 'pr-tpl-item';
            if(tpl.id === state.tpl.id) item.classList.add('active');
            item.innerHTML = `<img src="${tpl.bg}" class="pr-tpl-img"><div class="pr-tpl-name">${tpl.name}</div>`;
            item.onclick = () => {
                state.tpl = tpl;
                document.querySelectorAll('.pr-tpl-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                renderGrid();
            };
            listEl.appendChild(item);
        });

        $('btn-pr-exec').onclick = () => { window.print(); };
        $('btn-pr-qty').onclick = () => {
            state.qtyIdx = (state.qtyIdx + 1) % QUANTITIES.length;
            $('btn-pr-qty').innerText = `SL: ${QUANTITIES[state.qtyIdx]}`;
            renderGrid();
        };

        const renderGrid = () => {
            const a4 = $('pr-a4');
            const qty = QUANTITIES[state.qtyIdx];
            const tpl = state.tpl;

            a4.className = `pr-a4-page pr-grid-${qty}`;
            a4.innerHTML = '';

            let cellW, cellH;
            // Tính toán kích thước của từng ô (cell) trên giấy A4
            if (qty === 1) { cellW = 794 - 30; cellH = 1123 - 30; } 
            else if (qty === 2) { cellW = 794; cellH = 1123 / 2; }
            else if (qty === 4) { cellW = 794 / 2; cellH = 1123 / 2; }
            else if (qty === 6) { cellW = 794 / 2; cellH = 1123 / 3; }
            else { cellW = 794 / 2; cellH = 1123 / 4; } 

            for (let i = 0; i < qty; i++) {
                const cell = document.createElement('div');
                cell.className = 'pr-cell';
                
                const wrapper = document.createElement('div');
                wrapper.className = 'pr-canvas-wrapper';
                wrapper.style.width = tpl.width + 'px';
                wrapper.style.height = tpl.height + 'px';
                
                // =======================================================
                // THUẬT TOÁN FIX TRÀN CẠNH (TỰ ĐỘNG XOAY THÔNG MINH)
                // =======================================================
                
                // 1. Tính độ Zoom tối đa nếu giữ nguyên chiều ngang
                const scaleNormalX = (cellW - 10) / tpl.width; 
                const scaleNormalY = (cellH - 10) / tpl.height;
                const scaleNormal = Math.min(scaleNormalX, scaleNormalY); 
                
                // 2. Tính độ Zoom tối đa nếu xoay ngang tem 90 độ
                const scaleRotateX = (cellW - 10) / tpl.height;
                const scaleRotateY = (cellH - 10) / tpl.width;
                const scaleRotate = Math.min(scaleRotateX, scaleRotateY);

                // 3. Quyết định: Cách nào giúp tem in to hơn (tràn viền hơn)?
                if (scaleRotate > scaleNormal && qty > 1) {
                    wrapper.style.transform = `scale(${scaleRotate}) rotate(90deg)`;
                } else {
                    wrapper.style.transform = `scale(${scaleNormal})`;
                }
                // =======================================================
                
                wrapper.innerHTML = `<img src="${tpl.bg}" class="pr-bg-img">` + tpl.htmlContent;

                const inputs = wrapper.querySelectorAll('.pr-input-div');
                inputs.forEach(div => {
                    div.contentEditable = true; 
                    div.spellcheck = false;

                    div.oninput = (e) => {
                        const syncKey = div.getAttribute('data-sync');
                        if(syncKey) {
                            const newVal = e.target.innerText;
                            const allSameInputs = document.querySelectorAll(`.pr-input-div[data-sync="${syncKey}"]`);
                            allSameInputs.forEach(item => {
                                if (item !== e.target) item.innerText = newVal;
                            });
                        }
                    };
                });

                cell.appendChild(wrapper);
                a4.appendChild(cell);
            }
        };

        renderGrid(); 
    };

    return {
        name: "In ấn Pro HTML",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-2h8zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" fill="white"/></svg>`,
        bgColor: "#e17055",
        css: MY_CSS,
        action: runTool
    };
})
