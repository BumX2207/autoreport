((context) => {
    // ===============================================================
    // CSS GIAO DIỆN (Toàn màn hình, chia 2 cột)
    // ===============================================================
    const MY_CSS = `
        #vq-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#f0f2f5; z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow:hidden; box-sizing: border-box; }
        #vq-app * { box-sizing: border-box; }
        
        /* Header */
        .vq-header { background:#fff; padding:15px 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; z-index:20; height:60px; flex-shrink: 0; }
        .vq-logo { font-size:20px; font-weight:900 !important; color:#e84393; text-transform:uppercase; display:flex; align-items:center; gap:10px;}
        .vq-btn-close { background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; font-size:16px;}
        .vq-btn-close:hover { background:#d63031; color:white; transform:scale(1.1);}

        /* Body Layout */
        .vq-body { flex: 1; display: flex; padding: 20px; gap: 20px; overflow-y: auto; }
        .vq-panel { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; }
        
        /* CỘT TRÁI: VÒNG QUAY */
        .vq-left { flex: 6; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; gap: 20px; }
        .vq-wheel-wrapper { position: relative; width: 100%; max-width: 500px; aspect-ratio: 1; }
        canvas#vq-canvas { width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 8px solid #fff; }
        .vq-pointer { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 40px solid #d63031; z-index: 10; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.2)); }
        
        .vq-controls { width: 100%; max-width: 500px; display: flex; gap: 10px; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px; border: 1px solid #eee; }
        .vq-time-input { width: 100px; flex: 1; padding: 12px; border: 2px solid #dfe6e9; border-radius: 8px; font-size: 15px; font-weight:bold; text-align:center; outline:none; }
        .vq-time-input:focus { border-color:#e84393; }
        .vq-btn-spin { flex: 2; background: #e84393; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 18px; font-weight: 900; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(232, 67, 147, 0.3); }
        .vq-btn-spin:hover:not(:disabled) { background: #d81b60; transform: translateY(-2px); }
        .vq-btn-spin:active:not(:disabled) { transform: translateY(0); }
        .vq-btn-spin:disabled { background: #b2bec3; cursor: not-allowed; box-shadow:none; transform: none; }

        /* CỘT PHẢI: QUẢN LÝ DANH SÁCH */
        .vq-right { flex: 4; gap: 15px; }
        
        .vq-section-title { font-size: 14px; font-weight: 800; color: #2d3436; text-transform: uppercase; margin-bottom: 8px; display:flex; justify-content:space-between; align-items:center; }
        .vq-count-badge { background:#0984e3; color:white; padding:2px 8px; border-radius:12px; font-size:12px;}
        
        /* Input Box (Chat style) */
        .vq-input-group { display: flex; gap: 8px; margin-bottom: 15px; }
        .vq-input-text { flex: 1; padding: 12px 15px; border: 2px solid #dfe6e9; border-radius: 20px; font-size: 15px; outline: none; transition:0.2s; }
        .vq-input-text:focus { border-color: #0984e3; }
        .vq-btn-add { background: #0984e3; color: white; border: none; border-radius: 20px; padding: 0 20px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .vq-btn-add:hover { background: #0097e6; }

        /* Lists */
        .vq-list-container { flex: 1; min-height: 150px; overflow-y: auto; background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; padding: 10px; display:flex; flex-direction:column; gap:6px; }
        .vq-list-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #f0f0f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); font-size:14px; font-weight:600; color:#2d3436; animation: slideIn 0.2s ease;}
        .vq-list-item.history-item { background: #fff5f8; border-color: #ffcccc; color: #d63031; font-weight: 800; }
        
        .vq-btn-del { background: #ff7675; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .vq-btn-del:hover { background: #d63031; }

        /* Tùy chọn tự động xóa */
        .vq-checkbox-group { display: flex; align-items: center; gap: 8px; margin-top: 5px; font-size: 13px; font-weight: 600; color: #636e72; cursor: pointer; }
        .vq-checkbox-group input { cursor: pointer; width: 16px; height: 16px; }

        @keyframes slideIn { from{opacity:0; transform:translateX(10px);} to{opacity:1; transform:translateX(0);} }

        /* Responsive */
        @media (max-width: 768px) {
            .vq-body { flex-direction: column; }
            .vq-left, .vq-right { flex: none; width: 100%; }
            .vq-list-container { min-height: 200px; }
        }
    `;

    // Bảng màu cho vòng quay
    const COLORS = ["#00b894", "#0984e3", "#d63031", "#fdcb6e", "#e84393", "#6c5ce7", "#00cec9", "#e17055", "#f1c40f", "#27ae60", "#2980b9", "#8e44ad"];

    // ===============================================================
    // LOGIC TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('vq-app');
        
        if (!app) {
            app = document.createElement('div');
            app.id = 'vq-app';

            app.innerHTML = `
                <div class="vq-header">
                    <div class="vq-logo">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z"/></svg>
                        Quay Ngẫu Nhiên
                    </div>
                    <button class="vq-btn-close" id="vq-btn-close" title="Đóng">✖</button>
                </div>
                
                <div class="vq-body">
                    <!-- CỘT TRÁI: CANVAS -->
                    <div class="vq-panel vq-left">
                        <div class="vq-wheel-wrapper">
                            <div class="vq-pointer"></div>
                            <canvas id="vq-canvas" width="600" height="600"></canvas>
                        </div>
                        <div class="vq-controls">
                            <input type="number" id="vq-time" class="vq-time-input" value="5" min="1" placeholder="Số giây (VD: 10)">
                            <span style="font-size:13px; font-weight:bold; color:#636e72;">Giây</span>
                            <button id="vq-btn-spin" class="vq-btn-spin">QUAY NGAY</button>
                        </div>
                    </div>

                    <!-- CỘT PHẢI: DATA -->
                    <div class="vq-panel vq-right">
                        <!-- Input thêm dữ liệu -->
                        <div class="vq-input-group">
                            <input type="text" id="vq-input-text" class="vq-input-text" placeholder="Nhập nội dung...">
                            <button id="vq-btn-add" class="vq-btn-add">Thêm</button>
                        </div>
                        
                        <!-- List Đang chờ quay -->
                        <div class="vq-section-title">
                            Danh sách tham gia <span class="vq-count-badge" id="vq-active-count">0</span>
                        </div>
                        <div class="vq-list-container" id="vq-list-active" style="margin-bottom: 10px;">
                            <!-- Items go here -->
                        </div>
                        <label class="vq-checkbox-group">
                            <input type="checkbox" id="vq-chk-autoremove" checked>
                            Tự động xóa người trúng khỏi vòng quay tiếp theo
                        </label>

                        <hr style="border:0; border-top:1px dashed #ddd; margin: 15px 0;">

                        <!-- List Lịch sử trúng -->
                        <div class="vq-section-title" style="color:#d63031;">
                            Lịch sử <span class="vq-count-badge" style="background:#d63031;" id="vq-history-count">0</span>
                        </div>
                        <div class="vq-list-container" id="vq-list-history">
                            <!-- Items go here -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // ==========================================
            // BIẾN TRẠNG THÁI & DOM
            // ==========================================
            const $ = (id) => app.querySelector('#' + id);
            
            let items = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Hoàng Văn D", "Phạm Thị E"]; // Dữ liệu mẫu
            let history = [];
            let isSpinning = false;
            let currentRotation = 0; // Góc quay hiện tại (Radian)
            
            const canvas = $('vq-canvas');
            const ctx = canvas.getContext('2d');
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = cx;

            // Đóng tool
            $('vq-btn-close').onclick = () => { app.style.display = 'none'; };

            // ==========================================
            // CÁC HÀM RENDER UI BÊN PHẢI
            // ==========================================
            const renderLists = () => {
                // Render List Active
                $('vq-list-active').innerHTML = items.map((item, index) => `
                    <div class="vq-list-item">
                        <span>${index + 1}. ${item}</span>
                        <button class="vq-btn-del" onclick="window._vqRemoveItem(${index})" title="Xóa">✖</button>
                    </div>
                `).join('');
                $('vq-active-count').innerText = items.length;

                // Render List History
                $('vq-list-history').innerHTML = history.map((item, index) => `
                    <div class="vq-list-item history-item">
                        <span>🏆 Lần ${index + 1}: ${item}</span>
                        <button class="vq-btn-del" onclick="window._vqRemoveHistory(${index})" title="Xóa">✖</button>
                    </div>
                `).reverse().join(''); // Đảo ngược để trúng gần nhất lên đầu
                $('vq-history-count').innerText = history.length;
            };

            // Hàm hỗ trợ xóa
            window._vqRemoveItem = (index) => {
                if(isSpinning) return;
                items.splice(index, 1);
                renderLists();
                drawWheel();
            };
            window._vqRemoveHistory = (index) => {
                history.splice(index, 1);
                renderLists();
            };

            // Thêm người mới
            const addItem = () => {
                if(isSpinning) return;
                const val = $('vq-input-text').value.trim();
                if(val) {
                    items.push(val);
                    $('vq-input-text').value = '';
                    renderLists();
                    drawWheel();
                }
            };
            $('vq-btn-add').onclick = addItem;
            $('vq-input-text').addEventListener('keypress', (e) => {
                if(e.key === 'Enter') addItem();
            });

            // ==========================================
            // CANVAS: HÀM VẼ VÒNG QUAY
            // ==========================================
            const drawWheel = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if(items.length === 0) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = "#dfe6e9";
                    ctx.fill();
                    ctx.fillStyle = "#2d3436";
                    ctx.font = "bold 30px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText("KHÔNG CÓ NỘI DUNG", cx, cy + 10);
                    return;
                }

                const arcAngle = (Math.PI * 2) / items.length;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(currentRotation); // Xoay cả canvas theo góc hiện tại
                
                for (let i = 0; i < items.length; i++) {
                    const angleStart = i * arcAngle;
                    const angleEnd = angleStart + arcAngle;

                    // Vẽ miếng cắt (Slice)
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, radius, angleStart, angleEnd);
                    ctx.fillStyle = COLORS[i % COLORS.length];
                    ctx.fill();
                    ctx.stroke();

                    // Vẽ chữ
                    ctx.save();
                    ctx.rotate(angleStart + arcAngle / 2); // Xoay tới giữa miếng cắt
                    ctx.textAlign = "right"; 
                    ctx.fillStyle = "#fff";
                    ctx.font = "bold 24px 'Segoe UI', Arial";
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 4;
                    
                    const text = items[i].length > 18 ? items[i].substring(0, 18) + '...' : items[i];
                    ctx.fillText(text, radius - 30, 8); 
                    ctx.restore();
                }
                ctx.restore();
            };

            // ==========================================
            // THUẬT TOÁN QUAY NGẪU NHIÊN (VẬT LÝ THỰC TẾ)
            // ==========================================
            const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

            $('vq-btn-spin').onclick = () => {
                if (isSpinning || items.length === 0) return;

                const seconds = parseFloat($('vq-time').value) || 5;
                const duration = seconds * 1000; 

                // Trạng thái nút
                isSpinning = true;
                $('vq-btn-spin').disabled = true;
                $('vq-btn-spin').innerText = "ĐANG QUAY...";

                // Quay 1 góc hoàn toàn ngẫu nhiên
                // Số vòng cơ bản (tối thiểu 3 vòng) + Góc dư ngẫu nhiên
                const baseSpins = Math.max(3, Math.floor(seconds * 1.5)); 
                const extraRandomAngle = Math.random() * Math.PI * 2; 

                const startRotation = currentRotation;
                const finalRotation = startRotation + (baseSpins * Math.PI * 2) + extraRandomAngle;

                let startTime = null;

                const animateSpin = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const elapsed = timestamp - startTime;
                    let progress = elapsed / duration;

                    if (progress >= 1) progress = 1;

                    // Áp dụng gia tốc (chậm dần)
                    const easeProgress = easeOutQuart(progress);
                    currentRotation = startRotation + (finalRotation - startRotation) * easeProgress;

                    drawWheel();

                    if (progress < 1) {
                        requestAnimationFrame(animateSpin);
                    } else {
                        // KẾT THÚC QUAY - BẮT ĐẦU ĐO GÓC ĐỂ XÁC ĐỊNH NGƯỜI TRÚNG
                        // Kim chỉ nam ở Top tức là tương đương góc 270 độ (1.5 * PI)
                        const pointerAngle = Math.PI * 1.5; 
                        
                        // Đưa góc quay hiện tại về chuẩn [0, 2PI]
                        let normalizedRot = currentRotation % (Math.PI * 2);
                        if (normalizedRot < 0) normalizedRot += Math.PI * 2;
                        
                        // Tính xem điểm 0 độ của hình tròn đang lệch với kim bao nhiêu
                        let pointerWheelAngle = pointerAngle - normalizedRot;
                        if (pointerWheelAngle < 0) pointerWheelAngle += Math.PI * 2;
                        
                        // Từ đó suy ra index của ô đang nằm dưới kim
                        const arcAngle = (Math.PI * 2) / items.length;
                        const winnerIndex = Math.floor(pointerWheelAngle / arcAngle);
                        
                        const winnerName = items[winnerIndex];

                        // Dùng setTimeout 50ms để Canvas kịp render frame cuối cùng trước khi Alert chặn màn hình
                        setTimeout(() => {
                            isSpinning = false;
                            $('vq-btn-spin').disabled = false;
                            $('vq-btn-spin').innerText = "QUAY NGAY";
                            
                            alert(`🎉 CHÚC MỪNG: ${winnerName} 🎉`);
                            
                            // Đẩy vào lịch sử
                            history.push(winnerName);

                            // Tự động xóa nếu được tick
                            if ($('vq-chk-autoremove').checked) {
                                items.splice(winnerIndex, 1);
                            }
                            
                            renderLists();
                            drawWheel();
                        }, 50);
                    }
                };

                requestAnimationFrame(animateSpin);
            };

            // Khởi tạo lần đầu
            renderLists();
            drawWheel();
        }
        
        // Hiển thị
        app.style.display = 'flex';
    };

    return {
        name: "Quay Random",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z"/></svg>`,
        bgColor: "#e84393",
        action: runTool
    };
})
