((context) => {
    // ===============================================================
    // 1. DATA MỆNH GIÁ TIỀN & STATE GLOBAL
    // ===============================================================
    const DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];
    let userHistory = [];

    const getUserContext = () => {
        const userObj = window.GLOBAL_AUTH ? window.GLOBAL_AUTH.currentUserData : null;
        if (!userObj) return { isLogged: false, isVip: false, username: null };
        return {
            isLogged: true,
            isVip: userObj.vip && userObj.vip.toString().toUpperCase() === "VIP",
            username: userObj.user
        };
    };

    // ===============================================================
    // 2. CSS GIAO DIỆN (ĐÃ ÉP GỌN LẠI VỪA KHÍT MÀN HÌNH ĐIỆN THOẠI)
    // ===============================================================
    const MY_CSS = `
        @keyframes slideInUp { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(10px); } }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }

        #kq-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); z-index:2147483647; font-family: 'Segoe UI', system-ui, sans-serif; flex-direction:column; overflow: hidden; box-sizing: border-box; }
        #kq-app * { box-sizing: border-box; }
        
        /* Header Nhỏ Gọn */
        .kq-header { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 8px 15px; border-bottom: 1px solid rgba(255,255,255,0.5); display: flex; justify-content: space-between; align-items: center; z-index: 20; height: 45px; flex-shrink: 0;}
        .kq-logo { font-size: 16px; font-weight: 900 !important; display: flex; align-items: center; gap: 6px; }
        .kq-logo-text { background: linear-gradient(135deg, #00b894, #0984e3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .kq-logo svg { color: #00b894; width: 20px; height: 20px;}
        .kq-btn-close { background: #fff; color: #ff4757; border: 1px solid rgba(255,71,87,0.2); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; }
        
        /* Body Ép Sát */
        .kq-body { padding: 8px 12px; display: flex; flex-direction: column; gap: 8px; max-width: 500px; margin: 0 auto; width: 100%; height: 100%; overflow-y: auto; animation: slideInUp 0.3s ease-out; }
        
        /* Nút Công Cụ */
        .kq-tools-row { display: flex; gap: 8px; width: 100%; flex-shrink: 0;}
        .kq-btn { flex: 1; padding: 8px; border-radius: 10px; font-size: 13px; font-weight: 800 !important; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 5px; border: none; height: 36px;}
        .kq-btn-reset { background: #fff; color: #ff4757; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid rgba(255,71,87,0.1); }
        .kq-btn-history { background: linear-gradient(135deg, #FFD700, #FDB931); color: #5d4037; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3); }
        .kq-btn-history::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: shimmer 2.5s infinite; }
        .kq-btn-history.locked { background: #f1f3f5; color: #adb5bd; box-shadow: none; border: 1px solid #e9ecef; }
        .kq-btn-history.locked::after { display: none; }

        #kq-sync-status { font-size: 11px; text-align: center; color: #94a3b8; font-weight: 600; min-height: 14px; margin-top:-2px;}

        /* Bảng Đếm Tiền Siêu Gọn */
        .kq-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); padding: 4px; flex-shrink: 0;}
        .kq-table-row { display: flex; align-items: center; padding: 4px 6px; gap: 6px; border-bottom: 1px solid rgba(0,0,0,0.02); border-radius: 8px; }
        .kq-table-row:last-child { border-bottom: none; }
        .kq-table-header { background: transparent; border-bottom: 2px solid #f1f3f5; font-size: 12px; color: #a4b0be; padding-bottom: 6px; margin-bottom: 2px;}
        
        .kq-col-label { flex: 0 0 65px; font-weight: 800 !important; color: #2d3436; font-size: 13px; }
        .kq-col-input { flex: 0 0 80px; display: flex; justify-content: center; }
        .kq-col-total { flex: 1; text-align: right; font-weight: 900 !important; color: #0984e3; font-size: 14px; }

        .kq-input { width: 100%; padding: 4px; background: #f4f6f8; border: 1px solid transparent; border-radius: 6px; font-size: 14px; text-align: center; color: #2d3436; font-weight: 800 !important; outline: none; height: 28px; }
        .kq-input:focus { background: #fff; border-color: #00b894; box-shadow: 0 0 0 2px rgba(0, 184, 148, 0.2); }

        /* Vùng Kết Quả Thu Nhỏ */
        .kq-summary-box { background: linear-gradient(145deg, #1e293b, #0f172a); border-radius: 12px; padding: 10px 12px; color: white; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
        .kq-sum-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .kq-sum-label { color: #94a3b8; font-weight: 600 !important; }
        .kq-sum-val { font-size: 16px; font-weight: 900 !important; color: #00d2ff; }
        
        .kq-danggiu-wrapper { position: relative; width: 50%; }
        .kq-danggiu-input { width: 100%; padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; font-size: 15px; text-align: right; color: #ff7675; font-weight: 900 !important; outline: none; height: 28px; }
        .kq-danggiu-input:focus { background: rgba(255,255,255,0.2); border-color: #ff7675; }

        .kq-diff-val { font-size: 18px; font-weight: 900 !important; }
        .diff-pos { color: #00e676; } .diff-neg { color: #ff4757; } .diff-zero { color: #ffeaa7; } 

        /* Panel Lịch Sử */
        #kq-history-panel { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 30; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s forwards;}
        .kq-history-content { background: #f8fafc; width: 100%; max-width: 500px; height: 85%; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; animation: slideInUp 0.3s ease-out forwards;}
        .kq-history-header { padding: 15px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; border-radius: 20px 20px 0 0;}
        .kq-history-title { font-weight: 900; font-size: 15px; color: #FFD700; }
        .kq-history-list { padding: 12px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .kq-history-item { background: #fff; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; border-left: 3px solid #00b894;}
        .kq-hist-info { display: flex; flex-direction: column; gap: 2px; }
        .kq-hist-time { font-size: 11px; color: #94a3b8; font-weight: 700; }
        .kq-hist-total { font-size: 15px; color: #1e293b; font-weight: 900; }
        .kq-hist-diff { font-size: 12px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content;}
        .diff-tag-pos { background: rgba(0,230,118,0.1); color: #00c853; }
        .diff-tag-neg { background: rgba(255,71,87,0.1); color: #ff4757; }
        .diff-tag-zero { background: rgba(241,196,15,0.1); color: #f39c12; }
        .kq-btn-del-hist { background: transparent; color: #cbd5e1; border: none; width: 28px; height: 28px; font-size: 14px;}
    `;

    // ===============================================================
    // 3. LOGIC XỬ LÝ API VÀ TIỆN ÍCH
    // ===============================================================
    const formatTime = (timestamp) => {
        const d = new Date(timestamp);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    const NEW_HISTORY_API_URL = 'https://script.google.com/macros/s/AKfycbwRHohTVMv-Z_ldTWFpJUIIQIXTxZ6z94UBboXQzJ0FZjTm64JKtkF9ppvXaLwQgkLP/exec';

    const syncCloudHistory = (user, historyData, statusEl) => {
        if(statusEl) statusEl.innerText = "⏳ Đang đồng bộ Cloud...";
        const payload = { action: 'sync_money_history', user: user, history: JSON.stringify(historyData) };
        if (context.GM_xmlhttpRequest) {
            context.GM_xmlhttpRequest({
                method: "POST", url: NEW_HISTORY_API_URL, data: JSON.stringify(payload),
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                onload: () => { if(statusEl) statusEl.innerText = "✅ Đã lưu Cloud"; setTimeout(()=> {if(statusEl) statusEl.innerText="";}, 2000); }
            });
        } else {
            fetch(NEW_HISTORY_API_URL, { method: "POST", body: JSON.stringify(payload) })
            .then(() => { if(statusEl) statusEl.innerText = "✅ Đã lưu Cloud"; setTimeout(()=> {if(statusEl) statusEl.innerText="";}, 2000); })
            .catch(() => { if(statusEl) statusEl.innerText = "❌ Lỗi mạng, đã lưu máy"; });
        }
    };

    const fetchCloudHistory = (user, callback) => {
        const payload = { action: 'get_money_history', user: user };
        const processRes = (text) => {
            try {
                const json = JSON.parse(text);
                if (json.status === 'success' && json.data) {
                    userHistory = JSON.parse(json.data);
                    localStorage.setItem('kq_vip_history_' + user, json.data);
                }
            } catch(e){}
            if(callback) callback();
        };
        if (context.GM_xmlhttpRequest) {
            context.GM_xmlhttpRequest({
                method: "POST", url: NEW_HISTORY_API_URL, data: JSON.stringify(payload),
                onload: (res) => processRes(res.responseText)
            });
        } else {
            fetch(NEW_HISTORY_API_URL, { method: "POST", body: JSON.stringify(payload) })
            .then(r => r.text()).then(processRes).catch(() => {if(callback) callback();});
        }
    };

    const runTool = () => {
        let app = document.getElementById('kq-app');
        const userInfo = getUserContext();
        
        if (userInfo.isVip) {
            try {
                const cached = localStorage.getItem('kq_vip_history_' + userInfo.username);
                if (cached) userHistory = JSON.parse(cached);
            } catch(e){}
            fetchCloudHistory(userInfo.username);
        }

        if (!app) {
            app = document.createElement('div');
            app.id = 'kq-app';
            
            let rowsHTML = '';
            DENOMINATIONS.forEach(val => {
                let label = val >= 1000 ? (val / 1000) + 'k' : val;
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

            // FIX BUG LỖI ONCLICK TẠI ĐÂY (Đã thêm id="kq-btn-history" cho thẻ user thường)
            const historyBtnHTML = userInfo.isVip ? 
                `<button class="kq-btn kq-btn-history" id="kq-btn-history"><span>✦</span> Lịch sử đếm</button>` : 
                `<button class="kq-btn kq-btn-history locked" id="kq-btn-history" title="Chỉ dành cho VIP">🔒 Lịch sử (VIP)</button>`;

            app.innerHTML = `
                <div class="kq-header">
                    <div class="kq-logo">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                        <span class="kq-logo-text">Kiểm Quỹ</span>
                    </div>
                    <button class="kq-btn-close" id="kq-btn-close">✖</button>
                </div>
                
                <div class="kq-body">
                    <div class="kq-tools-row">
                        <button class="kq-btn kq-btn-reset" id="kq-btn-reset">Làm mới</button>
                        ${historyBtnHTML}
                    </div>
                    <div id="kq-sync-status"></div>

                    <div class="kq-card">
                        <div class="kq-table-row kq-table-header">
                            <div class="kq-col-label">Mệnh giá</div>
                            <div class="kq-col-input" style="text-align:center;">SL</div>
                            <div class="kq-col-total">Thành tiền</div>
                        </div>
                        ${rowsHTML}
                    </div>

                    <div class="kq-summary-box">
                        <div class="kq-sum-row"><span class="kq-sum-label">Tổng đếm:</span><span class="kq-sum-val" id="kq-grand-total">0</span></div>
                        <div class="kq-sum-row"><span class="kq-sum-label">Hệ thống:</span><div class="kq-danggiu-wrapper"><input type="text" id="kq-danggiu" class="kq-danggiu-input kq-calc-trigger" value="" placeholder="Nhập..." inputmode="numeric"></div></div>
                        <div style="border-top:1px dashed rgba(255,255,255,0.2); margin: 2px 0;"></div>
                        <div class="kq-sum-row"><span class="kq-sum-label">Chênh lệch:</span><span class="kq-diff-val diff-zero" id="kq-chenhlech">0</span></div>
                    </div>

                    <!-- Panel Lịch Sử -->
                    <div id="kq-history-panel">
                        <div class="kq-history-content">
                            <div class="kq-history-header">
                                <div class="kq-history-title">✦ LỊCH SỬ ĐẾM TIỀN</div>
                                <button class="kq-btn-close" id="kq-btn-close-hist" style="width:24px;height:24px;">▼</button>
                            </div>
                            <div class="kq-history-list" id="kq-history-list"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);

            const $ = (id) => app.querySelector('#' + id);
            
            $('kq-btn-close').onclick = () => { app.style.display = 'none'; };

            const renderHistory = () => {
                const listEl = $('kq-history-list');
                if (userHistory.length === 0) {
                    listEl.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px; font-size:13px;">Chưa có dữ liệu lịch sử</div>';
                    return;
                }
                
                let html = '';
                [...userHistory].reverse().forEach(record => {
                    let diffText = record.diff > 0 ? '+' + record.diff.toLocaleString('vi-VN') : record.diff.toLocaleString('vi-VN');
                    let tagClass = record.diff > 0 ? 'diff-tag-pos' : (record.diff < 0 ? 'diff-tag-neg' : 'diff-tag-zero');
                    if(record.diff === 0) diffText = "Khớp";
                    
                    html += `
                        <div class="kq-history-item" data-id="${record.id}">
                            <div class="kq-hist-info">
                                <span class="kq-hist-time">⏱ ${formatTime(record.timestamp)}</span>
                                <span class="kq-hist-total">Σ ${record.total.toLocaleString('vi-VN')}</span>
                                <span class="kq-hist-diff ${tagClass}">Lệch: ${diffText}</span>
                            </div>
                            <button class="kq-btn-del-hist" title="Xóa">✖</button>
                        </div>
                    `;
                });
                listEl.innerHTML = html;

                listEl.querySelectorAll('.kq-history-item').forEach(item => {
                    item.onclick = (e) => {
                        if(e.target.classList.contains('kq-btn-del-hist')) return;
                        const rId = parseInt(item.getAttribute('data-id'));
                        const record = userHistory.find(r => r.id === rId);
                        if(record) {
                            DENOMINATIONS.forEach(val => {
                                const q = record.details[val];
                                $(`kq-qty-${val}`).value = q ? q.toLocaleString('vi-VN') : '';
                            });
                            $('kq-danggiu').value = record.system ? record.system.toLocaleString('vi-VN') : '';
                            calculateAll();
                            $('kq-history-panel').style.display = 'none';
                        }
                    };
                });

                listEl.querySelectorAll('.kq-btn-del-hist').forEach(btn => {
                    btn.onclick = (e) => {
                        const item = e.target.closest('.kq-history-item');
                        const rId = parseInt(item.getAttribute('data-id'));
                        userHistory = userHistory.filter(r => r.id !== rId);
                        localStorage.setItem('kq_vip_history_' + userInfo.username, JSON.stringify(userHistory));
                        item.style.display = 'none';
                        syncCloudHistory(userInfo.username, userHistory, $('kq-sync-status'));
                    };
                });
            };

            if (userInfo.isVip) {
                $('kq-btn-history').onclick = () => {
                    renderHistory();
                    $('kq-history-panel').style.display = 'flex';
                };
                $('kq-btn-close-hist').onclick = () => {
                    $('kq-history-panel').style.display = 'none';
                };
            } else {
                $('kq-btn-history').onclick = () => alert("Tính năng lưu lịch sử chỉ dành cho thành viên VIP.");
            }

            const calculateAll = () => {
                let grandTotal = 0;
                DENOMINATIONS.forEach(val => {
                    const qtyEl = $(`kq-qty-${val}`);
                    const qty = parseInt(qtyEl.value.replace(/\D/g, '')) || 0;
                    const sub = qty * val;
                    grandTotal += sub;
                    $(`kq-total-${val}`).innerText = sub > 0 ? sub.toLocaleString('vi-VN') : '0';
                });
                $('kq-grand-total').innerText = grandTotal.toLocaleString('vi-VN');
                const dangGiu = parseInt($('kq-danggiu').value.replace(/\D/g, '')) || 0;
                const diff = grandTotal - dangGiu;
                const diffEl = $('kq-chenhlech');
                
                if (dangGiu === 0 && grandTotal === 0) { diffEl.innerText = "0"; diffEl.className = "kq-diff-val diff-zero"; }
                else if (diff > 0) { diffEl.innerText = "+" + diff.toLocaleString('vi-VN'); diffEl.className = "kq-diff-val diff-pos"; }
                else if (diff < 0) { diffEl.innerText = diff.toLocaleString('vi-VN'); diffEl.className = "kq-diff-val diff-neg"; }
                else { diffEl.innerText = "0 (Khớp)"; diffEl.className = "kq-diff-val diff-zero"; }
                
                return { grandTotal, dangGiu, diff };
            };

            $('kq-btn-reset').onclick = () => {
                const currentData = calculateAll();
                if (userInfo.isVip && currentData.grandTotal > 0) {
                    const record = {
                        id: Date.now(),
                        timestamp: Date.now(),
                        total: currentData.grandTotal,
                        system: currentData.dangGiu,
                        diff: currentData.diff,
                        details: {}
                    };
                    DENOMINATIONS.forEach(val => {
                        const qty = parseInt($(`kq-qty-${val}`).value.replace(/\D/g, '')) || 0;
                        if(qty > 0) record.details[val] = qty;
                    });
                    
                    userHistory.unshift(record);
                    if(userHistory.length > 20) userHistory.pop(); 
                    
                    localStorage.setItem('kq_vip_history_' + userInfo.username, JSON.stringify(userHistory));
                    syncCloudHistory(userInfo.username, userHistory, $('kq-sync-status'));
                }
                app.querySelectorAll('.kq-calc-trigger').forEach(input => input.value = '');
                calculateAll();
            };

            app.querySelectorAll('.kq-calc-trigger').forEach(input => {
                input.addEventListener('input', (e) => {
                    let val = e.target.value.replace(/\D/g, ''); 
                    e.target.value = val ? Number(val).toLocaleString('vi-VN') : ''; 
                    calculateAll();
                });
                input.addEventListener('focus', function() { this.select(); });
            });
            calculateAll();
        }
        app.style.display = 'flex';
    };

    return {
        name: "Kiểm Quỹ",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.11-1.36-3.11-2.92v-1.59c0-1.79 1.4-2.69 3.27-3.09v-3.02c-.54.12-1.01.36-1.34.73-.34.35-.51.77-.51 1.25H6.55c0-1.08.41-2 1.15-2.65.71-.62 1.68-1.02 2.89-1.16V3.82h2.67v1.89c1.6.31 2.96 1.3 2.96 2.82v1.51c0 1.76-1.42 2.58-3.23 3.01v3.18c.61-.13 1.14-.4 1.5-.81.38-.43.59-.97.59-1.57h2.51c0 1.11-.42 2.06-1.18 2.74-.75.68-1.79 1.11-3.01 1.29z"/></svg>`,
        bgColor: "#0984e3",
        action: runTool
    };
})
