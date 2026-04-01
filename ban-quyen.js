    ((context) => {
    // NHỚ ĐIỀN LẠI LINK WEB APP (API) CỦA MÀY VÀO ĐÂY NHÉ
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqFMnXmmxJgg1ZrYWTw4EbG2jyDbpb9VUec6tqibOLXKM25m-KVsllHKAgFT7uqoEz/exec"; 

    // ===============================================================
    // CSS GIAO DIỆN (Đã thêm CSS cho Popup Mật khẩu)
    // ===============================================================
    const MY_CSS = `
        #bq-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; align-items:center; justify-content:center; box-sizing: border-box; }
        #bq-app * { box-sizing: border-box; }
        
        .bq-container { background:#fff; width: 100%; max-width: 400px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; animation: bqFadeIn 0.3s ease; position: relative; }
        @keyframes bqFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

        /* Header */
        .bq-header { background:#0984e3; padding:15px 20px; display:flex; justify-content:space-between; align-items:center; color: white; }
        .bq-logo { font-size:16px; font-weight:800; text-transform:uppercase; display:flex; align-items:center; gap:8px;}
        .bq-btn-close { background:rgba(255,255,255,0.2); color:white; border:none; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; }
        .bq-btn-close:hover { background:#d63031; transform:scale(1.1);}

        /* Tabs */
        .bq-tabs { display: flex; background: #f4f6f8; border-bottom: 1px solid #ddd; }
        .bq-tab-btn { flex: 1; padding: 12px 0; border: none; background: transparent; font-weight: 700; color: #636e72; cursor: pointer; transition: 0.2s; border-bottom: 3px solid transparent; }
        .bq-tab-btn.active { color: #0984e3; border-bottom: 3px solid #0984e3; background: #fff; }
        .bq-tab-btn:hover:not(.active) { background: #eef2f5; }

        /* Body */
        .bq-body { padding: 20px; }
        .bq-tab-content { display: none; flex-direction: column; gap: 12px; }
        .bq-tab-content.active { display: flex; }

        /* Form Controls */
        .bq-form-group { display: flex; flex-direction: column; gap: 4px; }
        .bq-label { font-size: 13px; font-weight: 700; color: #2d3436; }
        .bq-input, .bq-select { width: 100%; padding: 8px 12px; border: 1px solid #dfe6e9; border-radius: 6px; font-size: 14px; color: #2d3436; outline: none; transition: 0.2s; background: #fcfcfc;}
        .bq-input:focus, .bq-select:focus { border-color: #0984e3; background: #fff; box-shadow: 0 0 0 3px rgba(9, 132, 227, 0.1); }
        
        /* Submit Button */
        .bq-btn-submit { margin-top: 10px; width: 100%; background: #00b894; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; display:flex; justify-content:center; align-items:center; gap:8px; }
        .bq-btn-submit:hover { background: #00a884; }
        .bq-btn-submit:active { transform: scale(0.98); }
        .bq-btn-submit:disabled { background: #b2bec3; cursor: not-allowed; }

        /* Vùng hiển thị Popup Mật khẩu */
        .bq-pass-overlay { display: none; position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.85); backdrop-filter: blur(3px); z-index: 50; flex-direction: column; align-items:center; justify-content:center; }
        .bq-pass-box { background: #fff; padding: 20px; border-radius: 10px; width: 85%; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.15); border: 1px solid #dfe6e9; }
        .bq-pass-input { width: 100%; padding: 10px; margin: 15px 0; border: 2px solid #dfe6e9; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; outline: none; color: #2d3436; transition: 0.2s;}
        .bq-pass-input:focus { border-color: #d63031; }
        .bq-pass-btns { display: flex; gap: 10px; justify-content: center; }
        .bq-pass-btn { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;}
        .bq-pass-btn-cancel { background: #dfe6e9; color: #2d3436; }
        .bq-pass-btn-cancel:hover { background: #b2bec3; }
        .bq-pass-btn-ok { background: #00b894; color: white; }
        .bq-pass-btn-ok:hover { background: #00a884; }
    `;

    // Hàm lấy ngày hiện tại format dd/mm/yyyy
    const getToday = () => {
        const d = new Date();
        return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    };

    // ===============================================================
    // LOGIC TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('bq-app');
        
        if (!app) {
            // 1. Tạo DOM HTML
            app = document.createElement('div');
            app.id = 'bq-app';

            app.innerHTML = `
                <div class="bq-container">
                    <div class="bq-header">
                        <div class="bq-logo">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                            Quản lý Bản quyền
                        </div>
                        <button class="bq-btn-close" id="bq-btn-close" title="Đóng">✖</button>
                    </div>

                    <div class="bq-tabs">
                        <button class="bq-tab-btn active" data-target="tab-file">Bản quyền File</button>
                        <button class="bq-tab-btn" data-target="tab-tool">Bản quyền Tool</button>
                    </div>

                    <div class="bq-body">
                        <!-- TAB: BẢN QUYỀN FILE -->
                        <div class="bq-tab-content active" id="tab-file">
                            <div class="bq-form-group">
                                <label class="bq-label">Tên</label>
                                <input type="text" id="bq-file-name" class="bq-input" placeholder="Nhập tên...">
                            </div>
                            <div class="bq-form-group">
                                <label class="bq-label">Mã thiết bị</label>
                                <input type="text" id="bq-file-device" class="bq-input" placeholder="Nhập mã thiết bị...">
                            </div>
                            <div class="bq-form-group">
                                <label class="bq-label">Key</label>
                                <input type="text" id="bq-file-key" class="bq-input" placeholder="Nhập Key...">
                            </div>
                            <div class="bq-form-group">
                                <label class="bq-label">Loại key</label>
                                <select id="bq-file-type" class="bq-select">
                                    <option value="7DAYS">7DAYS</option>
                                    <option value="30DAYS">30DAYS</option>
                                    <option value="100DAYS">100DAYS</option>
                                    <option value="1year">1year</option>
                                    <option value="Lifetime">Lifetime</option>
                                </select>
                            </div>
                            <div class="bq-form-group">
                                <label class="bq-label">Ngày kích hoạt (dd/mm/yyyy)</label>
                                <input type="text" id="bq-file-date" class="bq-input" value="${getToday()}">
                            </div>
                            <button class="bq-btn-submit" id="btn-submit-file">Cập nhật File</button>
                        </div>

                        <!-- TAB: BẢN QUYỀN TOOL -->
                        <div class="bq-tab-content" id="tab-tool">
                            <div class="bq-form-group">
                                <label class="bq-label">User CRM</label>
                                <input type="text" id="bq-tool-crm" class="bq-input" placeholder="Nhập User CRM...">
                            </div>
                            <div class="bq-form-group">
                                <label class="bq-label">User BI</label>
                                <input type="text" id="bq-tool-bi" class="bq-input" placeholder="Nhập User BI...">
                            </div>
                            <button class="bq-btn-submit" id="btn-submit-tool">Cập nhật Tool</button>
                        </div>
                    </div>

                    <!-- LỚP PHỦ NHẬP MẬT KHẨU (NẰM GỌN TRONG BOX) -->
                    <div class="bq-pass-overlay" id="bq-pass-overlay">
                        <div class="bq-pass-box">
                            <div class="bq-label" style="color:#d63031; font-size:14px;">YÊU CẦU MẬT KHẨU</div>
                            <input type="password" id="bq-pass-input" class="bq-pass-input" placeholder="***">
                            <div class="bq-pass-btns">
                                <button class="bq-pass-btn bq-pass-btn-cancel" id="bq-btn-pass-cancel">Hủy bỏ</button>
                                <button class="bq-pass-btn bq-pass-btn-ok" id="bq-btn-pass-ok">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            // Nhúng CSS
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // ==========================================
            // CÁC HÀM XỬ LÝ SỰ KIỆN
            // ==========================================
            const $ = (id) => app.querySelector('#' + id);
            let pendingAction = null; // Lưu hành động đang chờ xác nhận mật khẩu
            
            // Đóng popup
            $('bq-btn-close').onclick = () => { app.style.display = 'none'; };
            app.onclick = (e) => { if(e.target === app) app.style.display = 'none'; };

            // Chuyển Tab
            app.querySelectorAll('.bq-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    app.querySelectorAll('.bq-tab-btn').forEach(b => b.classList.remove('active'));
                    app.querySelectorAll('.bq-tab-content').forEach(c => c.classList.remove('active'));
                    
                    btn.classList.add('active');
                    $(btn.dataset.target).classList.add('active');
                };
            });

            // Giao diện hỏi Mật khẩu
            const requirePassword = (callback) => {
                $('bq-pass-input').value = '';
                $('bq-pass-overlay').style.display = 'flex';
                $('bq-pass-input').focus();
                pendingAction = callback;
            };

            // Hủy nhập mật khẩu
            $('bq-btn-pass-cancel').onclick = () => {
                $('bq-pass-overlay').style.display = 'none';
                pendingAction = null;
            };

            // Xác nhận nhập mật khẩu
            $('bq-btn-pass-ok').onclick = () => {
                const pass = $('bq-pass-input').value;
                if (pass === "Doanhthu5ty") {
                    $('bq-pass-overlay').style.display = 'none'; // Ẩn overlay
                    if (pendingAction) pendingAction(); // Cho phép chạy hàm update
                } else {
                    alert("Sai mật khẩu! Vui lòng thử lại.");
                    $('bq-pass-input').value = '';
                    $('bq-pass-input').focus();
                }
            };

            // Hỗ trợ bấm phím Enter khi đang gõ mật khẩu
            $('bq-pass-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') $('bq-btn-pass-ok').click();
            });

            // Hàm gửi dữ liệu lên Google Sheet
            const sendData = async (type, payload, btnEl) => {
                if(WEB_APP_URL.includes("ĐIỀN_LINK")) {
                    alert("Vui lòng cập nhật WEB_APP_URL trong mã nguồn trước!");
                    return;
                }

                const originalText = btnEl.innerText;
                btnEl.innerText = "Đang cập nhật...";
                btnEl.disabled = true;

                try {
                    const response = await fetch(WEB_APP_URL, {
                        method: 'POST',
                        body: JSON.stringify({ type: type, data: payload })
                    });
                    
                    const result = await response.json();
                    if(result.status === "success") {
                        alert("Cập nhật dữ liệu thành công!");
                        // Reset form
                        if(type === 'file') {
                            $('bq-file-name').value = '';
                            $('bq-file-device').value = '';
                            $('bq-file-key').value = '';
                        } else {
                            $('bq-tool-crm').value = '';
                            $('bq-tool-bi').value = '';
                        }
                    } else {
                        alert("Lỗi: " + result.message);
                    }
                } catch (error) {
                    alert("Lỗi kết nối. Không thể gửi dữ liệu!");
                    console.error(error);
                } finally {
                    btnEl.innerText = originalText;
                    btnEl.disabled = false;
                }
            };

            // Xử lý nút: Cập nhật File
            $('btn-submit-file').onclick = () => {
                const payload = {
                    name: $('bq-file-name').value.trim(),
                    device: $('bq-file-device').value.trim(),
                    key: $('bq-file-key').value.trim(),
                    type: $('bq-file-type').value,
                    date: $('bq-file-date').value.trim()
                };
                if(!payload.name || !payload.device || !payload.key) {
                    alert("Vui lòng điền đủ Tên, Mã thiết bị và Key!");
                    return;
                }
                
                // Bật popup hỏi mật khẩu trước khi lưu
                requirePassword(() => {
                    sendData('file', payload, $('btn-submit-file'));
                });
            };

            // Xử lý nút: Cập nhật Tool
            $('btn-submit-tool').onclick = () => {
                const payload = {
                    crm: $('bq-tool-crm').value.trim(),
                    bi: $('bq-tool-bi').value.trim()
                };
                if(!payload.crm || !payload.bi) {
                    alert("Vui lòng điền đủ User CRM và User BI!");
                    return;
                }

                // Bật popup hỏi mật khẩu trước khi lưu
                requirePassword(() => {
                    sendData('tool', payload, $('btn-submit-tool'));
                });
            };
        }
        
        // Hiển thị giao diện
        app.style.display = 'flex';
    };

    return {
        name: "Bản quyền",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`,
        bgColor: "#0984e3",
        action: runTool
    };
})
