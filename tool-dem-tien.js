((context) => {
    // ===============================================================
    // 1. DATA MỆNH GIÁ TIỀN
    // ===============================================================
    const DENOMINATIONS =[500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];

    // ===============================================================
    // 2. CSS GIAO DIỆN (ĐÃ TỐI ƯU COMPACT & ANDROID EDGE)
    // ===============================================================
    const MY_CSS = `
        #kq-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#f4f6f8; z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow-y:auto; box-sizing: border-box; }
        #kq-app * { box-sizing: border-box; }
        
        /* Header */
        .kq-header { background:#fff; padding:12px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:20; height:55px; flex-shrink: 0; }
        .kq-logo { font-size:18px; font-weight:800 !important; color:#00b894; text-transform:uppercase; display:flex; align-items:center; gap:8px;}
        .kq-btn-close { background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; }
        .kq-btn-close:hover { background:#d63031; color:white; transform:scale(1.1);}

        /* Body - Giảm gap để gọn hơn */
        .kq-body { padding: 15px 20px; display: flex; flex-direction: column; gap: 12px; max-width: 550px; margin: 0 auto; width: 100%; }
        .kq-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 12px 15px; border: 1px solid #eee; }
        
        /* Nút công cụ (Đưa lên trên) */
        .kq-btn-reset { width: 100%; background: #dfe6e9; color: #2d3436; border: none; padding: 10px; border-radius: 8px; font-size: 15px; font-weight: 800 !important; cursor: pointer; transition: 0.2s; display:flex; justify-content:center; align-items:center; gap:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);}
        .kq-btn-reset:hover { background: #b2bec3; }
        .kq-btn-reset:active { transform: scale(0.98); }

        /* Bảng đếm tiền */
        .kq-table-row { display: flex; align-items: center; border-bottom: 1px dashed #eee; padding: 8px 10px; gap: 10px; }
        .kq-table-row:last-child { border-bottom: none; }
        .kq-table-header { font-weight: 800 !important; color: #555; background: #f8f9fa; border-radius: 6px; border: none; }
        
        /* CỘT 1: Mệnh giá */
        .kq-col-label { flex: 0 0 85px; font-weight: 800 !important; color: #2d3436; font-size: 15px; }
        
        /* CỘT 2: Ô nhập - Fixed kích thước nhỏ lại */
        .kq-col-input { flex: 0 0 85px; display: flex; justify-content: center;}
        
        /* CỘT 3: Thành tiền - Giao toàn bộ không gian còn lại (flex: 1) */
        .kq-col-total { flex: 1; text-align: right; font-weight: 800 !important; color: #0984e3; font-size: 15px; }

        .kq-input { width: 100%; padding: 6px 5px; border: 2px solid #dfe6e9; border-radius: 6px; font-size: 15px; text-align: center; color: #2d3436; font-weight: 800 !important; outline: none; transition: 0.2s; }
        .kq-input:focus { border-color: #00b894; background: #f0fff4; box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.1); }
        .kq-input::placeholder { color: #b2bec3; font-weight: normal; }

        /* Vùng kết quả (Thu nhỏ độ cao) */
        .kq-summary-box { background: #2d3436; border-radius: 12px; padding: 12px 15px; color: white; display:flex; flex-direction:column; gap:8px;}
        .kq-sum-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .kq-sum-label { color: #dfe6e9; font-weight: 700 !important; }
        .kq-sum-val { font-size: 18px; font-weight: 800 !important; color: #00b894; }
        
        .kq-danggiu-wrapper { position: relative; width: 55%; }
        .kq-danggiu-input { width: 100%; padding: 6px 10px; border: none; border-radius: 6px; font-size: 16px; text-align: right; color: #d63031; font-weight: 900 !important; outline: none; }
        .kq-danggiu-input:focus { box-shadow: 0 0 0 3px rgba(214, 48, 49, 0.4); }

        .kq-diff-val { font-size: 20px; font-weight: 900 !important; }
        .diff-pos { color: #00b894; } /* Dư tiền */
        .diff-neg { color: #ff7675; } /* Thiếu tiền */
        .diff-zero { color: #ffeaa7; } /* Vừa đủ */

        /* Responsive cho màn hình nhỏ */
        @media (max-width: 480px) {
            .kq-body { padding: 10px 15px; gap: 10px; }
            .kq-card { padding: 8px 10px; }
            .kq-table-row { padding: 6px 10px; gap: 8px; }
            .kq-col-label { flex: 0 0 80px; font-size: 14px; }
            .kq-col-input { flex: 0 0 100px; }
            .kq-input { font-size: 14px; padding: 4px; }
            .kq-col-total { font-size: 14px; }
            
            .kq-summary-box { padding: 10px 12px; gap: 6px; }
            .kq-sum-row { font-size: 13px; }
            .kq-sum-val { font-size: 16px; }
            .kq-danggiu-input { padding: 5px 8px; font-size: 15px; }
            .kq-diff-val { font-size: 18px; }
            .kq-btn-reset { padding: 8px; font-size: 14px; }
        }
    `;

    // ===============================================================
    // 3. LOGIC TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('kq-app');
        
        if (!app) {
            // 1. Tạo DOM HTML
            app = document.createElement('div');
            app.id = 'kq-app';
            
            // Sinh mã HTML tự động cho các mệnh giá
            let rowsHTML = '';
            DENOMINATIONS.forEach(val => {
                let label = val >= 1000 ? (val / 1000) + 'k' : val; // Đổi 500000 thành 500k
                rowsHTML += `
                    <div class="kq-table-row">
                        <div class="kq-col-label">${label.toLocaleString('vi-VN')}</div>
                        <div class="kq-col-input">
                            <input type="text" id="kq-qty-${val}" class="kq-input kq-calc-trigger" value="" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="kq-col-total" id="kq-total-${val}">0</div>
                    </div>
                `;
            });

            app.innerHTML = `
                <div class="kq-header">
                    <div class="kq-logo">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                        Kiểm Quỹ
                    </div>
                    <button class="kq-btn-close" id="kq-btn-close" title="Đóng">✖</button>
                </div>
                
                <div class="kq-body">
                    <!-- Nút Làm mới đưa lên đầu -->
                    <button class="kq-btn-reset" id="kq-btn-reset">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        Làm mới (Xóa trắng)
                    </button>

                    <div class="kq-card">
                        <div class="kq-table-row kq-table-header">
                            <div class="kq-col-label">Mệnh giá</div>
                            <div class="kq-col-input" style="text-align:center;">Số lượng</div>
                            <div class="kq-col-total">Thành tiền</div>
                        </div>
                        ${rowsHTML}
                    </div>

                    <!-- Bảng tổng kết được làm thấp gọn lại -->
                    <div class="kq-summary-box">
                        <div class="kq-sum-row">
                            <span class="kq-sum-label">Tổng đếm được:</span>
                            <span class="kq-sum-val" id="kq-grand-total">0</span>
                        </div>
                        <div class="kq-sum-row">
                            <span class="kq-sum-label">Số tiền hệ thống:</span>
                            <div class="kq-danggiu-wrapper">
                                <input type="text" id="kq-danggiu" class="kq-danggiu-input kq-calc-trigger" value="" placeholder="Nhập số báo cáo..." inputmode="numeric">
                            </div>
                        </div>
                        <div style="border-top:1px dashed #636e72; margin: 2px 0;"></div>
                        <div class="kq-sum-row">
                            <span class="kq-sum-label">Chênh lệch:</span>
                            <span class="kq-diff-val diff-zero" id="kq-chenhlech">0</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            // Nhúng CSS
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // 2. CÁC HÀM XỬ LÝ SỰ KIỆN
            const $ = (id) => app.querySelector('#' + id);
            
            // Đóng tool
            $('kq-btn-close').onclick = () => { app.style.display = 'none'; };

            // Nút Làm mới
            $('kq-btn-reset').onclick = () => {
                if(confirm("Bạn có chắc muốn xóa hết số liệu đếm để làm lại từ đầu?")) {
                    app.querySelectorAll('.kq-calc-trigger').forEach(input => input.value = '');
                    calculateAll();
                }
            };

            // Format input & Tính toán
            const calculateAll = () => {
                let grandTotal = 0;

                // Quét qua mảng mệnh giá để tính tổng đếm
                DENOMINATIONS.forEach(val => {
                    const inputEl = $(`kq-qty-${val}`);
                    const qty = parseInt(inputEl.value.replace(/\D/g, '')) || 0;
                    const subTotal = qty * val;
                    
                    grandTotal += subTotal;
                    $(`kq-total-${val}`).innerText = subTotal > 0 ? subTotal.toLocaleString('vi-VN') : '0';
                });

                // Cập nhật Tổng đếm
                $('kq-grand-total').innerText = grandTotal.toLocaleString('vi-VN');

                // Lấy số Đang giữ (Số hệ thống/Báo cáo)
                const dangGiuInput = $('kq-danggiu');
                const dangGiu = parseInt(dangGiuInput.value.replace(/\D/g, '')) || 0;
                
                // Tính chênh lệch
                const diff = grandTotal - dangGiu;
                const diffEl = $('kq-chenhlech');
                
                // Xử lý hiển thị chênh lệch
                if (dangGiu === 0 && grandTotal === 0) {
                    diffEl.innerText = "0";
                    diffEl.className = "kq-diff-val diff-zero";
                } else if (diff > 0) {
                    diffEl.innerText = "+" + diff.toLocaleString('vi-VN');
                    diffEl.className = "kq-diff-val diff-pos"; // Dư
                } else if (diff < 0) {
                    diffEl.innerText = diff.toLocaleString('vi-VN');
                    diffEl.className = "kq-diff-val diff-neg"; // Thiếu
                } else {
                    diffEl.innerText = "0 (Khớp)";
                    diffEl.className = "kq-diff-val diff-zero"; // Đủ
                }
            };

            // Gán sự kiện cho mọi ô input
            app.querySelectorAll('.kq-calc-trigger').forEach(input => {
                input.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/\D/g, ''); 
                    e.target.value = val ? Number(val).toLocaleString('vi-VN') : ''; 
                    calculateAll();
                });

                input.addEventListener('focus', function() {
                    this.select(); 
                });
            });

            calculateAll();
        }
        
        // Hiển thị giao diện
        app.style.display = 'flex';
    };

    return {
        name: "Kiểm Quỹ",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.11-1.36-3.11-2.92v-1.59c0-1.79 1.4-2.69 3.27-3.09v-3.02c-.54.12-1.01.36-1.34.73-.34.35-.51.77-.51 1.25H6.55c0-1.08.41-2 1.15-2.65.71-.62 1.68-1.02 2.89-1.16V3.82h2.67v1.89c1.6.31 2.96 1.3 2.96 2.82v1.51c0 1.76-1.42 2.58-3.23 3.01v3.18c.61-.13 1.14-.4 1.5-.81.38-.43.59-.97.59-1.57h2.51c0 1.11-.42 2.06-1.18 2.74-.75.68-1.79 1.11-3.01 1.29z"/></svg>`,
        bgColor: "#0984e3",
        action: runTool
    };
})
