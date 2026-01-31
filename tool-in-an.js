/* 
   MODULE: IN ẤN (PRINT TOOL) - V1
   - Hỗ trợ in Tem Tết, Tem Giảm giá, Tem Tài khoản...
   - Giao diện chọn mẫu -> Chỉnh sửa -> In.
   - Cơ chế Config linh hoạt.
*/
((context) => {
    const { UI, UTILS } = context;

    // ===============================================================
    // CẤU HÌNH TEMPLATE (QUAN TRỌNG: THAY LINK ẢNH THẬT VÀO ĐÂY)
    // ===============================================================
    const TEMPLATES = [
        {
            id: 'tet-1',
            name: '🧧 Tem Tết 2025',
            // Thay link ảnh tem tết của bạn vào đây
            bg: 'https://admintnb.com/wp-content/uploads/2025/11/sticker3.png', 
            width: 800, // Chiều rộng ảnh gốc (px)
            height: 600, // Chiều cao ảnh gốc (px)
            inputs: [
                { label: 'Tiêu đề', x: 250, y: 150, w: 300, size: 40, color: '#d63031', bold: true, val: 'CHÚC MỪNG NĂM MỚI' },
                { label: 'Lời chúc 1', x: 100, y: 300, w: 600, size: 20, color: '#333', val: 'An khang thịnh vượng - Vạn sự như ý' },
                { label: 'Tên Shop', x: 200, y: 450, w: 400, size: 25, color: '#0984e3', bold: true, val: 'Thế Giới Di Động' }
            ]
        },
        {
            id: 'gg-1',
            name: '🔥 Tem Giảm Giá',
            // Thay link ảnh tem giảm giá vào đây
            bg: 'https://admintnb.com/wp-content/uploads/2025/11/sticker3.png', 
            width: 600, 
            height: 800,
            inputs: [
                { label: 'Tên sản phẩm', x: 50, y: 100, w: 500, size: 30, color: '#000', bold: true, val: 'Samsung Galaxy S24 Ultra' },
                { label: 'Giá cũ', x: 50, y: 200, w: 500, size: 25, color: '#666', decoration: 'line-through', val: '30.000.000đ' },
                { label: 'Giá mới', x: 50, y: 300, w: 500, size: 60, color: '#d63031', bold: true, val: '25.990.000đ' },
                { label: 'Ghi chú', x: 50, y: 600, w: 500, size: 18, color: '#333', val: '*Áp dụng đến hết 30/02' }
            ]
        },
        {
            id: 'tk-dq',
            name: '💳 Tem Tài Khoản QR',
            // Thay link ảnh tem tài khoản vào đây
            bg: 'https://admintnb.com/wp-content/uploads/2026/01/Tet-1.png', 
            width: 700, 
            height: 500,
            inputs: [
                { label: 'Ngân hàng', x: 50, y: 50, w: 600, size: 24, color: '#2ecc71', bold: true, val: 'VIETCOMBANK' },
                { label: 'Số tài khoản', x: 50, y: 100, w: 600, size: 40, color: '#000', bold: true, val: '9999.8888.6666' },
                { label: 'Chủ tài khoản', x: 50, y: 160, w: 600, size: 24, color: '#333', val: 'NGUYEN VAN A' },
                // Ví dụ chỗ để dán đè ảnh QR thật lên sau khi in hoặc chèn ảnh (tạm thời để text)
                { label: 'Ghi chú QR', x: 450, y: 250, w: 200, size: 14, color: '#666', val: '(Dán mã QR vào đây)' }
            ]
        }
    ];
    // ===============================================================

    const MY_CSS = `
        /* MODAL Z-INDEX: Thấp hơn Toast một chút */
        #tgdd-print-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:2147483650; justify-content:center; align-items:center; font-family: sans-serif; }
        
        .pr-content { background:#f5f6fa; width:95%; height:95%; border-radius:10px; display:flex; flex-direction:column; overflow:hidden; position:relative; }
        
        /* HEADER */
        .pr-header { height:50px; background:white; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid #ddd; flex-shrink:0; }
        .pr-title { font-size:18px; font-weight:bold; color:#2c3e50; display:flex; align-items:center; gap:10px; }
        .pr-btn-close { font-size:24px; cursor:pointer; color:#999; transition:0.2s; } .pr-btn-close:hover { color:red; }

        /* BODY LAYOUT */
        .pr-body { flex:1; display:flex; overflow:hidden; }
        
        /* SIDEBAR (GALLERY) */
        .pr-sidebar { width:250px; background:white; border-right:1px solid #ddd; overflow-y:auto; padding:15px; display:flex; flex-direction:column; gap:15px; flex-shrink:0; }
        .pr-sidebar-title { font-size:12px; font-weight:bold; color:#999; text-transform:uppercase; margin-bottom:5px; }
        
        .pr-thumb-item { cursor:pointer; border:2px solid transparent; border-radius:8px; overflow:hidden; transition:0.2s; background:#eee; }
        .pr-thumb-item:hover { transform:translateY(-2px); box-shadow:0 5px 15px rgba(0,0,0,0.1); }
        .pr-thumb-item.active { border-color:#007bff; box-shadow:0 0 0 2px rgba(0,123,255,0.2); }
        .pr-thumb-img { width:100%; height:120px; object-fit:cover; display:block; }
        .pr-thumb-name { padding:8px; font-size:13px; font-weight:bold; color:#333; text-align:center; background:white; }

        /* MAIN PREVIEW AREA */
        .pr-preview-area { flex:1; display:flex; justify-content:center; align-items:center; overflow:auto; background:#e9ecef; position:relative; padding:20px; }
        
        /* CANVAS (Cái khung để in) */
        #pr-canvas { position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.3); background:white; transition: transform 0.2s; transform-origin: center center; }
        .pr-bg-img { width:100%; height:100%; display:block; }
        
        /* INPUTS ON CANVAS */
        .pr-input-overlay { position:absolute; background:transparent; border:1px dashed rgba(0,0,0,0.1); padding:0; margin:0; outline:none; font-family: sans-serif; line-height:1.2; resize:none; overflow:hidden; white-space: pre-wrap; display:flex; align-items:center; }
        .pr-input-overlay:hover { border-color:#007bff; cursor:text; background:rgba(255,255,255,0.3); }
        .pr-input-overlay:focus { border-color:#007bff; background:rgba(255,255,255,0.8); }

        /* CONTROLS PANEL (Right side) */
        .pr-controls { width:280px; background:white; border-left:1px solid #ddd; overflow-y:auto; padding:15px; display:none; flex-direction:column; flex-shrink:0; }
        .pr-controls.active { display:flex; }
        
        .pr-field-group { margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px; }
        .pr-lbl { font-size:11px; font-weight:bold; color:#666; margin-bottom:5px; display:block; }
        .pr-inp-text { width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px; margin-bottom:5px; box-sizing:border-box; }
        .pr-row { display:flex; gap:5px; }
        .pr-inp-num { width:100%; padding:5px; border:1px solid #ddd; border-radius:4px; font-size:12px; }

        .pr-btn-print { width:100%; padding:12px; background:#28a745; color:white; border:none; border-radius:6px; font-weight:bold; font-size:16px; cursor:pointer; margin-top:auto; display:flex; align-items:center; justify-content:center; gap:8px; }
        .pr-btn-print:hover { background:#218838; }

        /* PRINT MEDIA QUERY (Phép thuật nằm ở đây) */
        @media print {
            body * { visibility: hidden; }
            #pr-canvas, #pr-canvas * { visibility: visible; }
            #pr-canvas { 
                position: fixed; 
                left: 0; 
                top: 0; 
                margin: 0; 
                box-shadow: none; 
                transform: none !important; 
                /* Đảm bảo in background */
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
            }
            /* Ẩn viền nét đứt khi in */
            .pr-input-overlay { border: none !important; background: transparent !important; }
            
            /* Tắt các thành phần khác của tool */
            #tgdd-print-modal { background:white; position:absolute; }
            .pr-sidebar, .pr-header, .pr-controls { display:none !important; }
            .pr-preview-area { background:white; overflow:visible; }
        }
    `;

    const runTool = () => {
        const modalId = 'tgdd-print-modal';
        let modal = document.getElementById(modalId);
        let currentTemplate = null;

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="pr-content">
                    <div class="pr-header">
                        <div class="pr-title">🖨️ IN ẤN TỰ ĐỘNG (BETA)</div>
                        <div class="pr-btn-close" id="btn-pr-close">×</div>
                    </div>
                    <div class="pr-body">
                        <!-- Sidebar chọn mẫu -->
                        <div class="pr-sidebar" id="pr-list">
                            <div class="pr-sidebar-title">Danh sách mẫu</div>
                            <!-- Render Templates Here -->
                        </div>

                        <!-- Khu vực hiển thị ảnh -->
                        <div class="pr-preview-area" id="pr-preview-container">
                            <div style="color:#999; font-style:italic;">👈 Chọn một mẫu bên trái để bắt đầu</div>
                        </div>

                        <!-- Sidebar chỉnh sửa -->
                        <div class="pr-controls" id="pr-editor-panel">
                            <div class="pr-sidebar-title">Chỉnh sửa nội dung</div>
                            <div id="pr-fields-container"></div>
                            <button class="pr-btn-print" id="btn-pr-exec">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-2h8zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/><circle cx="18" cy="11.5" r="1" fill="white"/></svg>
                                IN NGAY
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // --- RENDER DANH SÁCH MẪU ---
            const listEl = document.getElementById('pr-list');
            TEMPLATES.forEach(tpl => {
                const item = document.createElement('div');
                item.className = 'pr-thumb-item';
                item.innerHTML = `
                    <img src="${tpl.bg}" class="pr-thumb-img">
                    <div class="pr-thumb-name">${tpl.name}</div>
                `;
                item.onclick = () => loadTemplate(tpl, item);
                listEl.appendChild(item);
            });

            // --- FUNCTION LOAD MẪU ---
            const loadTemplate = (tpl, domItem) => {
                currentTemplate = tpl;
                // Highlight active item
                document.querySelectorAll('.pr-thumb-item').forEach(i => i.classList.remove('active'));
                if(domItem) domItem.classList.add('active');

                // Render Canvas
                const container = document.getElementById('pr-preview-container');
                container.innerHTML = `
                    <div id="pr-canvas" style="width:${tpl.width}px; height:${tpl.height}px;">
                        <img src="${tpl.bg}" class="pr-bg-img">
                        <div id="pr-canvas-inputs"></div>
                    </div>
                `;

                // Render Controls & Inputs Overlay
                const fieldsContainer = document.getElementById('pr-fields-container');
                const canvasInputs = document.getElementById('pr-canvas-inputs');
                
                fieldsContainer.innerHTML = '';
                canvasInputs.innerHTML = '';

                tpl.inputs.forEach((inp, idx) => {
                    // 1. Tạo ô nhập trên Canvas (div contenteditable hoặc textarea)
                    const overlay = document.createElement('div');
                    overlay.className = 'pr-input-overlay';
                    overlay.style.left = inp.x + 'px';
                    overlay.style.top = inp.y + 'px';
                    overlay.style.width = inp.w + 'px';
                    overlay.style.fontSize = (inp.size || 14) + 'px';
                    overlay.style.color = inp.color || '#000';
                    overlay.style.fontWeight = inp.bold ? 'bold' : 'normal';
                    overlay.style.textDecoration = inp.decoration || 'none';
                    if(inp.align) overlay.style.justifyContent = inp.align; // center, flex-start...
                    
                    overlay.innerText = inp.val;
                    overlay.id = `pr-overlay-${idx}`;
                    
                    // Sync ngược lại bảng điều khiển khi gõ trực tiếp trên hình
                    overlay.addEventListener('input', (e) => {
                        document.getElementById(`pr-ctrl-${idx}`).value = e.target.innerText;
                    });

                    canvasInputs.appendChild(overlay);

                    // 2. Tạo ô điều khiển bên phải
                    const group = document.createElement('div');
                    group.className = 'pr-field-group';
                    group.innerHTML = `
                        <label class="pr-lbl">${inp.label}</label>
                        <input type="text" class="pr-inp-text" id="pr-ctrl-${idx}" value="${inp.val}">
                        <div class="pr-row">
                            <div style="flex:1"><label class="pr-lbl">Cỡ chữ</label><input type="number" class="pr-inp-num" value="${inp.size}" onchange="document.getElementById('pr-overlay-${idx}').style.fontSize = this.value + 'px'"></div>
                            <div style="flex:1"><label class="pr-lbl">Màu</label><input type="color" class="pr-inp-num" value="${inp.color}" onchange="document.getElementById('pr-overlay-${idx}').style.color = this.value" style="height:28px; padding:0;"></div>
                            <div style="flex:1"><label class="pr-lbl">Y</label><input type="number" class="pr-inp-num" value="${inp.y}" onchange="document.getElementById('pr-overlay-${idx}').style.top = this.value + 'px'"></div>
                        </div>
                    `;
                    fieldsContainer.appendChild(group);

                    // Sync từ bảng điều khiển sang hình
                    const ctrlInput = group.querySelector(`#pr-ctrl-${idx}`);
                    ctrlInput.addEventListener('input', (e) => {
                        document.getElementById(`pr-overlay-${idx}`).innerText = e.target.value;
                    });
                });

                document.getElementById('pr-editor-panel').classList.add('active');
                
                // Auto Zoom cho vừa màn hình nếu ảnh quá to
                setTimeout(() => {
                    const previewW = container.clientWidth - 40;
                    const previewH = container.clientHeight - 40;
                    const scale = Math.min(previewW / tpl.width, previewH / tpl.height, 1);
                    if(scale < 1) {
                        const canvas = document.getElementById('pr-canvas');
                        canvas.style.transform = `scale(${scale})`;
                    }
                }, 100);
            };

            // --- EVENTS ---
            document.getElementById('btn-pr-close').onclick = () => { modal.style.display = 'none'; };
            document.getElementById('btn-pr-exec').onclick = () => {
                window.print();
            };
        }

        modal.style.display = 'flex';
    };

    return {
        name: "In ấn",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-2h8zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" fill="white"/></svg>`,
        bgColor: "#2c3e50", // Màu xanh đậm in ấn
        css: MY_CSS,
        action: runTool
    };
})
