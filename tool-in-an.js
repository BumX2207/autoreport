/* 
   MODULE: IN ẤN (PRINT TOOL) - V2 (GRID A4 EDITION)
   - Layout: Horizontal List + A4 Preview.
   - Logic: Grid System (1, 2, 4, 6, 8 items/page).
   - Edit: Direct on canvas + Auto Sync text.
*/
((context) => {
    // ===============================================================
    // CẤU HÌNH TEMPLATE
    // ===============================================================
    const TEMPLATES = [
        {
            id: 'tet-1',
            name: '🧧 Tem Tết 2025',
            bg: 'https://admintnb.com/wp-content/uploads/2025/11/sticker3.png', 
            width: 800, height: 600,
            inputs: [
                { label: 'Tiêu đề', x: 250, y: 150, w: 300, size: 40, color: '#d63031', bold: true, val: 'CHÚC MỪNG NĂM MỚI', align: 'center' },
                { label: 'Lời chúc', x: 100, y: 300, w: 600, size: 20, color: '#333', val: 'An khang thịnh vượng - Vạn sự như ý', align: 'center' },
                { label: 'Tên Shop', x: 200, y: 450, w: 400, size: 25, color: '#0984e3', bold: true, val: 'Thế Giới Di Động', align: 'center' }
            ]
        },
        {
            id: 'gg-1',
            name: '🔥 Tem Giảm Giá',
            bg: 'https://admintnb.com/wp-content/uploads/2025/11/sticker3.png', 
            width: 600, height: 800,
            inputs: [
                { label: 'Tên SP', x: 50, y: 100, w: 500, size: 30, color: '#000', bold: true, val: 'Samsung Galaxy S24 Ultra' },
                { label: 'Giá cũ', x: 50, y: 200, w: 500, size: 25, color: '#666', decoration: 'line-through', val: '30.000.000đ' },
                { label: 'Giá mới', x: 50, y: 300, w: 500, size: 60, color: '#d63031', bold: true, val: '25.990.000đ' },
                { label: 'Note', x: 50, y: 600, w: 500, size: 18, color: '#333', val: '*Áp dụng đến hết 30/02' }
            ]
        },
        {
            id: 'tk-qr',
            name: '💳 Tem QR',
            bg: 'https://admintnb.com/wp-content/uploads/2026/01/Tet-1.png', 
            width: 700, height: 500,
            inputs: [
                { label: 'Bank', x: 50, y: 50, w: 600, size: 24, color: '#2ecc71', bold: true, val: 'VIETCOMBANK' },
                { label: 'STK', x: 50, y: 100, w: 600, size: 40, color: '#000', bold: true, val: '9999.8888.6666' },
                { label: 'Tên', x: 50, y: 160, w: 600, size: 24, color: '#333', val: 'NGUYEN VAN A' }
            ]
        }
    ];

    // ===============================================================
    // CSS STYLE
    // ===============================================================
    const MY_CSS = `
        #tgdd-print-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; font-family: sans-serif; flex-direction:column; }
        .pr-content { background:#e9ecef; width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; }

        /* HEADER & TOOLBAR */
        .pr-header { background:white; padding:10px; border-bottom:1px solid #ddd; display:flex; flex-direction:column; gap:10px; flex-shrink:0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .pr-top-bar { display:flex; align-items:center; justify-content:space-between; }
        .pr-title { font-size:16px; font-weight:bold; color:#2c3e50; display:flex; align-items:center; gap:5px; }
        
        /* ACTION BUTTONS IN HEADER */
        .pr-actions { display:flex; gap:8px; align-items:center; }
        .pr-btn { border:none; border-radius:4px; padding:6px 12px; font-weight:bold; cursor:pointer; font-size:13px; display:flex; align-items:center; gap:5px; transition:0.2s; }
        .pr-btn-qty { background:#3498db; color:white; min-width:80px; justify-content:center; }
        .pr-btn-print { background:#27ae60; color:white; }
        .pr-btn-close { background:#fab1a0; color:#d63031; width:30px; height:30px; padding:0; justify-content:center; font-size:20px; }
        .pr-btn:hover { filter:brightness(1.1); }

        /* HORIZONTAL TEMPLATE LIST */
        .pr-list-scroll { display:flex; overflow-x:auto; gap:10px; padding-bottom:5px; scrollbar-width: thin; }
        .pr-list-scroll::-webkit-scrollbar { height: 4px; }
        .pr-list-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        
        .pr-tpl-item { min-width:100px; width:100px; cursor:pointer; border:2px solid transparent; border-radius:6px; overflow:hidden; background:white; position:relative; }
        .pr-tpl-item.active { border-color:#007bff; box-shadow:0 0 0 2px rgba(0,123,255,0.2); }
        .pr-tpl-img { width:100%; height:60px; object-fit:cover; display:block; }
        .pr-tpl-name { font-size:10px; padding:4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#333; }

        /* MAIN PREVIEW AREA (A4) */
        .pr-body { flex:1; overflow:auto; display:flex; justify-content:center; padding:20px; background:#555; }
        
        /* A4 PAGE SIMULATION */
        /* Kích thước A4 trên màn hình (Scale tương đối để dễ nhìn) */
        .pr-a4-page { 
            width: 794px; /* ~21cm @ 96dpi */
            height: 1123px; /* ~29.7cm @ 96dpi */
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            margin-bottom: 50px;
            position: relative;
            overflow: hidden;
            /* Default grid is flex center for Qty=1 */
            display: flex; 
        }

        /* GRID SYSTEM LAYOUTS */
        .pr-grid-1 { justify-content:center; align-items:center; padding:0 15px; } /* Qty 1: Center + Padding */
        
        .pr-grid-2 { display:grid !important; grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
        .pr-grid-4 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .pr-grid-6 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .pr-grid-8 { display:grid !important; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr; }

        /* GRID CELL & SCALING WRAPPER */
        .pr-cell { border:1px dashed #eee; display:flex; justify-content:center; align-items:center; overflow:hidden; position:relative; }
        .pr-cell:hover { border-color:blue; }

        /* CONTENT INSIDE CELL */
        .pr-canvas-wrapper { position:relative; transform-origin: center center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .pr-bg-img { width:100%; height:100%; display:block; pointer-events:none; }
        
        /* INPUTS ON CANVAS */
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

        /* PRINT MEDIA QUERY */
        @media print {
            @page { size: A4; margin: 0; }
            body * { visibility: hidden; }
            #tgdd-print-modal, #tgdd-print-modal * { visibility: visible; }
            
            #tgdd-print-modal { position:absolute; left:0; top:0; background:white; width:100%; height:100%; z-index:99999; display:block !important; }
            .pr-header { display:none !important; }
            .pr-body { padding:0; background:white; overflow:visible; display:block; }
            .pr-a4-page { 
                width: 100%; height: 100%; /* Fill A4 paper */
                box-shadow: none; margin:0; 
                transform: none !important;
            }
            .pr-cell { border:none !important; } /* Ẩn viền lưới */
            .pr-input-div { border:none !important; background:transparent !important; }
            .pr-canvas-wrapper { box-shadow:none; }
        }

        /* MOBILE RESPONSIVE FOR UI */
        @media (max-width: 600px) {
            .pr-a4-page { transform-origin: top left; transform: scale(0.45); margin-bottom: -500px; margin-right: -400px; } /* Thu nhỏ A4 trên màn hình đt */
            .pr-title span { display:none; } /* Ẩn chữ tiêu đề nếu chật */
        }
    `;

    // ===============================================================
    // LOGIC CHÍNH
    // ===============================================================
    const runTool = () => {
        // State
        const QUANTITIES = [1, 2, 4, 6, 8];
        let state = {
            qtyIdx: 0, // Bắt đầu ở mức 1 (index 0)
            tpl: TEMPLATES[0]
        };

        // DOM Helper
        const $ = (id) => document.getElementById(id);

        // UI Setup
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
                                <button class="pr-btn pr-btn-qty" id="btn-pr-qty">SL: 1</button>
                                <button class="pr-btn pr-btn-print" id="btn-pr-exec">🖨️ IN</button>
                                <button class="pr-btn pr-btn-close" id="btn-pr-close">×</button>
                            </div>
                        </div>
                        <div class="pr-list-scroll" id="pr-list"></div>
                    </div>
                    <div class="pr-body">
                        <div id="pr-a4" class="pr-a4-page pr-grid-1">
                            <!-- Grid Items Rendered Here -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 1. Render Template List
            const listEl = $('pr-list');
            TEMPLATES.forEach(tpl => {
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

            // 2. Button Events
            $('btn-pr-close').onclick = () => { modal.style.display = 'none'; };
            $('btn-pr-exec').onclick = () => { window.print(); };
            
            $('btn-pr-qty').onclick = () => {
                state.qtyIdx = (state.qtyIdx + 1) % QUANTITIES.length; // Cycle 0->1->2->3->4->0
                const qty = QUANTITIES[state.qtyIdx];
                $('btn-pr-qty').innerText = `SL: ${qty}`;
                renderGrid();
            };
        }

        // Render Grid System
        const renderGrid = () => {
            const a4 = $('pr-a4');
            const qty = QUANTITIES[state.qtyIdx];
            const tpl = state.tpl;

            // Reset classes
            a4.className = `pr-a4-page pr-grid-${qty}`;
            a4.innerHTML = '';

            // Tính toán kích thước ô lưới để Scale ảnh cho vừa
            // A4 px approx: 794 x 1123
            let cellW, cellH;
            if (qty === 1) { cellW = 794 - 30; cellH = 1123 - 30; } // Trừ padding 15px mỗi bên
            else if (qty === 2) { cellW = 794; cellH = 1123 / 2; }
            else if (qty === 4) { cellW = 794 / 2; cellH = 1123 / 2; }
            else if (qty === 6) { cellW = 794 / 2; cellH = 1123 / 3; }
            else { cellW = 794 / 2; cellH = 1123 / 4; } // Qty 8

            // Loop tạo các ô
            for (let i = 0; i < qty; i++) {
                const cell = document.createElement('div');
                cell.className = 'pr-cell';
                
                // Tạo wrapper chứa ảnh và input
                const wrapper = document.createElement('div');
                wrapper.className = 'pr-canvas-wrapper';
                wrapper.style.width = tpl.width + 'px';
                wrapper.style.height = tpl.height + 'px';
                
                // Tính tỉ lệ Scale
                const scaleX = (cellW - 4) / tpl.width; // -4px trừ hao border
                const scaleY = (cellH - 4) / tpl.height;
                const scale = Math.min(scaleX, scaleY, 1); // Không phóng to quá 100% nếu ảnh nhỏ
                
                wrapper.style.transform = `scale(${scale})`;

                // Render Background
                wrapper.innerHTML = `<img src="${tpl.bg}" class="pr-bg-img">`;

                // Render Inputs
                tpl.inputs.forEach((inp, fieldIdx) => {
                    const div = document.createElement('div');
                    div.className = 'pr-input-div';
                    div.contentEditable = true; // Cho phép sửa trực tiếp
                    div.spellcheck = false;
                    
                    // Style
                    div.style.left = inp.x + 'px';
                    div.style.top = inp.y + 'px';
                    div.style.width = inp.w + 'px';
                    div.style.fontSize = (inp.size || 14) + 'px';
                    div.style.color = inp.color || '#000';
                    div.style.fontWeight = inp.bold ? 'bold' : 'normal';
                    div.style.textDecoration = inp.decoration || 'none';
                    if(inp.align) div.style.justifyContent = inp.align;

                    // Giá trị mặc định
                    div.innerText = inp.val;

                    // SYNC LOGIC: Khi sửa ô này, tìm các ô tương ứng ở tem khác sửa theo
                    div.oninput = (e) => {
                        const newVal = e.target.innerText;
                        // Cập nhật tất cả các input có cùng fieldIdx trong DOM
                        const allInputs = document.querySelectorAll(`.inp-field-${fieldIdx}`);
                        allInputs.forEach(item => {
                            if (item !== e.target) item.innerText = newVal;
                        });
                    };
                    
                    // Đánh dấu class để biết nó thuộc trường nào (cho việc Sync)
                    div.classList.add(`inp-field-${fieldIdx}`);

                    wrapper.appendChild(div);
                });

                cell.appendChild(wrapper);
                a4.appendChild(cell);
            }
        };

        modal.style.display = 'flex';
        renderGrid(); // Init first render
    };

    return {
        name: "In ấn Pro",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-2h8zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" fill="white"/></svg>`,
        bgColor: "#e17055",
        css: MY_CSS,
        action: runTool
    };
})
