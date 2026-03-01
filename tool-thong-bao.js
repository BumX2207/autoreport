/* 
   MODULE: QUẢN LÝ THÔNG BÁO (NOTIFICATION MANAGER) - GLASS UI V2
   - Clean: Không can thiệp Bottom Nav.
   - Fix CSS: Badge Đã xem/Chưa xem có màu nổi bật trên nền Glass.
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE, GM_xmlhttpRequest } = context;

    const MY_CSS = `
        /* --- STANDARD THEME (Mặc định) --- */
        #tgdd-notif-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483660; justify-content:center; align-items:center; }
        .nt-content { background:white; width:95%; max-width:500px; border-radius:16px; padding:0; box-shadow:0 15px 50px rgba(0,0,0,0.3); animation: popIn 0.3s; display:flex; flex-direction:column; max-height:80vh; min-height: 500px; overflow:hidden; position:relative; }
        .nt-header { background: linear-gradient(135deg, #FF9800, #F57C00); padding: 15px; color: white; font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 10px; }
        .nt-body { padding: 15px; overflow-y: auto; flex: 1; background: #f4f6f8; }
        .nt-footer { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
        
        .nt-btn-close { position:absolute; top:10px; right:15px; background:none; border:none; font-size:28px; color:rgba(255,255,255,0.8); cursor:pointer; line-height:1; z-index: 10; }
        .nt-btn-close:hover { color: white; }

        .nt-input-area { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 15px; }
        .nt-textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 13px; resize: vertical; min-height: 80px; box-sizing: border-box; }
        .nt-textarea:focus { outline: none; border-color: #FF9800; }
        
        .nt-list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; font-size: 13px; font-weight: bold; color: #555; }
        
        .nt-search-box { margin-bottom: 10px; position: relative; }
        .nt-search-input { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px 8px 32px; font-family: inherit; font-size: 13px; box-sizing: border-box; transition: 0.2s; }
        .nt-search-input:focus { outline: none; border-color: #FF9800; box-shadow: 0 0 0 2px rgba(255,152,0,0.2); }
        .nt-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; pointer-events: none; }

        .nt-list-container { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #eee; }
        .nt-user-row { display: flex; align-items: center; padding: 10px 15px; border-bottom: 1px solid #f0f0f0; transition: 0.2s; cursor: pointer; }
        .nt-user-row:last-child { border-bottom: none; }
        .nt-user-row:hover { background: #fff8e1; }
        
        .nt-chk { width: 18px; height: 18px; margin-right: 12px; accent-color: #FF9800; cursor: pointer; }
        .nt-user-info { flex: 1; }
        .nt-user-name { font-size: 13px; font-weight: 600; color: #333; }
        .nt-user-status { font-size: 11px; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
        
        .nt-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .nt-badge-read { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .nt-badge-unread { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .nt-badge-empty { background: #f5f5f5; color: #999; border: 1px solid #eee; }

        .nt-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .nt-btn-send { background: linear-gradient(135deg, #FF9800, #EF6C00); color: white; box-shadow: 0 4px 10px rgba(255, 152, 0, 0.3); }
        .nt-btn-send:active { transform: scale(0.98); }
        .nt-btn-clear { background: #f5f5f5; color: #666; border: 1px solid #ddd; max-width: 50%; }
        .nt-btn-reload { background: none; border: none; color: #007bff; cursor: pointer; font-size: 12px; font-weight: normal; }

        .nt-loader { text-align: center; padding: 30px; color: #888; font-size: 13px; }
        .nt-spin { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #FF9800; border-radius: 50%; animation: nt-spin 1s linear infinite; vertical-align: middle; margin-right: 5px; }
        @keyframes nt-spin { to { transform: rotate(360deg); } }

        /* =========================================================
           --- GLASS UI THEME (ĐỒNG BỘ VỚI MAIN SCRIPT) ---
           ========================================================= */
        
        /* 1. Nền Overlay ngoài cùng (Gradient tối + Mờ) */
        body.glass-ui-mode #tgdd-notif-modal {
            background: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.25), transparent 50%),
                        radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.25), transparent 50%),
                        rgba(15, 23, 42, 0.8) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
        }

        /* 2. Vỏ Modal Glass (Khung viền mờ trong suốt) */
        body.glass-ui-mode .nt-content {
            position: relative !important;
            background: rgba(255, 255, 255, 0.2) !important;
            backdrop-filter: blur(25px) !important;
            -webkit-backdrop-filter: blur(25px) !important;
            border: 1px solid rgba(255, 255, 255, 0.6) !important;
            border-radius: 28px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.3) !important;
            padding: 32px 24px 24px 24px !important;
            z-index: 1;
            color: #333 !important; /* Chữ tối vì lõi màu trắng */
        }

        /* 3. Lõi Modal Trắng (Tạo hiệu ứng viền kính) */
        body.glass-ui-mode .nt-content::before {
            content: "" !important; position: absolute !important;
            top: 8px !important; left: 8px !important; right: 8px !important; bottom: 8px !important;
            background: #ffffff !important; border-radius: 20px !important;
            z-index: -1 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
        }
        body.glass-ui-mode .nt-content > * { position: relative; z-index: 2; }

        /* 4. Nút Đóng (X) - Tròn, nền xám nhạt, đổi màu khi hover */
        body.glass-ui-mode .nt-btn-close {
            position: absolute !important; top: 16px !important; right: 16px !important;
            background: #f1f3f5 !important; width: 32px !important; height: 32px !important;
            border-radius: 50% !important; display: flex !important; justify-content: center !important; align-items: center !important;
            font-size: 18px !important; color: #555 !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
            border: none !important; cursor: pointer !important; z-index: 10 !important;
            transition: all 0.2s ease !important;
        }
        body.glass-ui-mode .nt-btn-close:hover { background: #fee2e2 !important; color: #ef4444 !important; transform: scale(1.1); }

        /* 5. Header (Bỏ nền cam khối, dùng màu cam cho chữ và icon) */
        body.glass-ui-mode .nt-header {
            background: transparent !important;
            border-bottom: 2px solid rgba(0,0,0,0.05) !important;
            color: #ff9800 !important;
            text-shadow: none !important;
            padding: 5px 0 15px 0 !important; /* Gọn lại do có padding của khung vỏ */
        }
        body.glass-ui-mode .nt-header svg { fill: #ff9800 !important; filter: none !important; }
        
        body.glass-ui-mode .nt-body { background: transparent !important; padding: 15px 0 !important; }
        body.glass-ui-mode .nt-footer { background: transparent !important; border-top: 1px solid rgba(0,0,0,0.05) !important; padding: 15px 0 0 0 !important; }

        /* 6. Form, Khung danh sách và Input (Đưa về tone sáng, chữ tối) */
        body.glass-ui-mode .nt-input-area,
        body.glass-ui-mode .nt-list-container {
            background: #f8f9fa !important;
            border: 1px solid rgba(0,0,0,0.05) !important;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important;
        }
        
        body.glass-ui-mode .nt-textarea, 
        body.glass-ui-mode .nt-search-input {
            background: #fff !important;
            border: 1px solid #ddd !important;
            color: #333 !important;
        }
        body.glass-ui-mode .nt-textarea::placeholder, 
        body.glass-ui-mode .nt-search-input::placeholder { color: #aaa !important; }

        body.glass-ui-mode .nt-list-header { color: #555 !important; }
        body.glass-ui-mode .nt-btn-reload { color: #007bff !important; }
        body.glass-ui-mode .nt-search-icon { color: #999 !important; }

        /* 7. Danh sách User */
        body.glass-ui-mode .nt-user-row { border-bottom: 1px solid #eee !important; background: #fff !important; }
        body.glass-ui-mode .nt-user-row:hover { background: #f1f3f5 !important; }
        body.glass-ui-mode .nt-user-name { color: #333 !important; }
        body.glass-ui-mode .nt-user-status span:not([class^="nt-badge"]) { color: #777 !important; }
        
        /* 8. Fix Màu Badge (Dùng màu sắc nét nổi trên nền trắng) */
        body.glass-ui-mode .nt-badge-read { 
            background: #e8f5e9 !important; 
            color: #2e7d32 !important; 
            border: 1px solid #c8e6c9 !important; 
        }
        body.glass-ui-mode .nt-badge-unread { 
            background: #ffebee !important; 
            color: #c62828 !important; 
            border: 1px solid #ffcdd2 !important; 
        }
        body.glass-ui-mode .nt-badge-empty { background: #f5f5f5 !important; color: #999 !important; border: 1px solid #eee !important; }
        
        /* 9. Các Nút Bấm Chính (Bo góc sâu, gradient hiện đại) */
        body.glass-ui-mode .nt-btn {
            border-radius: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            font-weight: bold !important;
            border: none !important;
            transition: transform 0.2s, box-shadow 0.2s !important;
        }
        body.glass-ui-mode .nt-btn:active { transform: scale(0.96) !important; }

        body.glass-ui-mode .nt-btn-send {
            background: linear-gradient(135deg, #ff9800, #e65100) !important; 
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3) !important; 
            color: #fff !important;
            text-shadow: none !important;
        }
        
        body.glass-ui-mode .nt-btn-clear {
            background: #f1f3f5 !important;
            color: #555 !important; 
            border: 1px solid #ddd !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
        }
        body.glass-ui-mode .nt-btn-clear:hover { background: #e2e6ea !important; color: #333 !important;}
    `;

    const runTool = () => {
        const modalId = 'tgdd-notif-modal';
        let modal = document.getElementById(modalId);
        let userList = []; 

        if (modal) modal.remove();

        const loadUsers = () => {
            const container = document.getElementById('nt-list-body');
            if(container) container.innerHTML = '<div class="nt-loader"><div class="nt-spin"></div> Đang tải danh sách người dùng...</div>';

            const url = `https://docs.google.com/spreadsheets/d/${CONSTANTS.GSHEET.AUTH.ID}/export?format=csv&gid=${CONSTANTS.GSHEET.AUTH.GID}`;
            
            GM_xmlhttpRequest({
                method: "GET", url: url,
                onload: (res) => {
                    if(res.status === 200) {
                        userList = [];
                        const rows = res.responseText.split('\n');
                        for (let i = 1; i < rows.length; i++) {
                            const rowText = rows[i].trim();
                            if(rowText) {
                                const cols = UTILS.parseCSVLine(rowText);
                                if(cols.length >= 2) {
                                    const userName = cols[1].trim();
                                    const rawNotif = (cols.length > 6) ? cols[6].trim() : "";
                                    
                                    let notifData = null;
                                    try {
                                        if(rawNotif && rawNotif.startsWith('{')) {
                                            notifData = JSON.parse(rawNotif);
                                        } else if (rawNotif) {
                                            notifData = { msg: rawNotif, read: false };
                                        }
                                    } catch(e) {}

                                    if(userName) {
                                        userList.push({ name: userName, notif: notifData, rowIndex: i + 1 });
                                    }
                                }
                            }
                        }
                        renderUserList();
                        const searchInput = document.getElementById('nt-search-input');
                        if (searchInput) searchInput.value = "";
                    } else {
                        if(container) container.innerHTML = '<div class="nt-loader" style="color:#ff6b6b">❌ Lỗi tải dữ liệu!</div>';
                    }
                },
                onerror: () => {
                    if(container) container.innerHTML = '<div class="nt-loader" style="color:#ff6b6b">❌ Lỗi kết nối mạng!</div>';
                }
            });
        };

        const renderUserList = () => {
            const container = document.getElementById('nt-list-body');
            if(!container) return;
            container.innerHTML = '';

            if(userList.length === 0) {
                container.innerHTML = '<div class="nt-loader">Không tìm thấy người dùng nào.</div>';
                return;
            }

            userList.forEach((u, idx) => {
                const div = document.createElement('div');
                div.className = 'nt-user-row';
                
                let badgeHtml = '<span class="nt-badge nt-badge-empty">Trống</span>';
                let msgPreview = 'Chưa có thông báo';
                
                if (u.notif && u.notif.msg) {
                    if (u.notif.read) {
                        badgeHtml = '<span class="nt-badge nt-badge-read">✅ Đã xem</span>';
                        msgPreview = u.notif.msg;
                    } else {
                        badgeHtml = '<span class="nt-badge nt-badge-unread">🔴 Chưa xem</span>';
                        msgPreview = `<b style="color:#e53935">${u.notif.msg}</b>`;
                    }
                }

                div.innerHTML = `
                    <input type="checkbox" class="nt-chk" id="nt-chk-${idx}" value="${u.name}">
                    <div class="nt-user-info">
                        <div class="nt-user-name">${u.name}</div>
                        <div class="nt-user-status">${badgeHtml} <span style="color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:150px;">- ${msgPreview}</span></div>
                    </div>
                `;
                
                div.onclick = (e) => {
                    if(e.target.type !== 'checkbox') {
                        const chk = document.getElementById(`nt-chk-${idx}`);
                        chk.checked = !chk.checked;
                    }
                };

                container.appendChild(div);
            });
        };

        // --- UI STRUCTURE ---
        modal = document.createElement('div');
        modal.id = modalId;
        modal.innerHTML = `
            <div class="nt-content">
                <button class="nt-btn-close" id="btn-nt-close">×</button>
                <div class="nt-header">
                    <svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                    Quản Lý Thông Báo
                </div>
                
                <div class="nt-body">
                    <div class="nt-input-area">
                        <label style="font-weight:bold; color:inherit; display:block; margin-bottom:5px;">Nội dung tin nhắn:</label>
                        <textarea id="nt-msg-input" class="nt-textarea" placeholder="Nhập thông báo muốn gửi..."></textarea>
                    </div>

                    <div class="nt-list-header">
                        <span>Danh sách người dùng</span>
                        <div style="display:flex; gap:10px;">
                            <button class="nt-btn-reload" id="btn-nt-select-all">Chọn tất cả</button>
                            <button class="nt-btn-reload" id="btn-nt-reload">🔄 Tải lại</button>
                        </div>
                    </div>

                    <div class="nt-search-box">
                        <span class="nt-search-icon">🔍</span>
                        <input type="text" id="nt-search-input" class="nt-search-input" placeholder="Tìm tên người dùng...">
                    </div>

                    <div class="nt-list-container" id="nt-list-body">
                        <!-- User list render here -->
                    </div>
                </div>

                <div class="nt-footer">
                    <button class="nt-btn nt-btn-clear" id="btn-nt-reset">🗑 Xóa thông báo</button>
                    <button class="nt-btn nt-btn-send" id="btn-nt-send">🚀 CẬP NHẬT</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // --- EVENTS ---
        document.getElementById('btn-nt-close').onclick = () => { 
            modal.style.display = 'none'; 
        };
        document.getElementById('btn-nt-reload').onclick = loadUsers;
        
        // --- TÌM KIẾM TIẾNG VIỆT (Fix lỗi dấu) ---
        document.getElementById('nt-search-input').addEventListener('input', (e) => {
            const searchTerm = UTILS.toUltraSlug(e.target.value); // Dùng hàm khử dấu của main script
            const rows = document.querySelectorAll('.nt-user-row');
            
            rows.forEach(row => {
                const userNameRaw = row.querySelector('.nt-user-name').innerText;
                const userNameSlug = UTILS.toUltraSlug(userNameRaw);
                
                if (userNameSlug.includes(searchTerm)) {
                    row.style.display = 'flex';
                } else {
                    row.style.display = 'none';
                }
            });
        });
        
        let isAllSelected = false;
        document.getElementById('btn-nt-select-all').onclick = () => {
            isAllSelected = !isAllSelected;
            const visibleRows = Array.from(document.querySelectorAll('.nt-user-row')).filter(row => row.style.display !== 'none');
            
            visibleRows.forEach(row => {
                const chk = row.querySelector('.nt-chk');
                if(chk) chk.checked = isAllSelected;
            });
            document.getElementById('btn-nt-select-all').innerText = isAllSelected ? "Bỏ chọn" : "Chọn tất cả";
        };

        const updateColumnG = (targetUserNames, message, isClear) => {
            const btn = document.getElementById('btn-nt-send');
            const originalText = btn.innerText;
            btn.innerText = "⏳ Đang lưu..."; btn.disabled = true;

            const updateData = targetUserNames.map(name => {
                let jsonVal = "";
                if (!isClear) {
                    const payload = {
                        msg: message,
                        read: false,
                        time: Date.now(),
                        sender: AUTH_STATE.userName
                    };
                    jsonVal = JSON.stringify(payload);
                }
                return { user: name, val: jsonVal };
            });
            
            GM_xmlhttpRequest({
                method: "POST",
                url: CONSTANTS.GSHEET.CONFIG_API,
                data: JSON.stringify({ 
                    action: 'push_notif',
                    targets: updateData
                }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: (res) => {
                    btn.innerText = originalText; btn.disabled = false;
                    try {
                        UI.showToast("✅ Đã cập nhật thành công!");
                        loadUsers(); 
                    } catch (e) {
                        alert("Lỗi phản hồi: " + e);
                    }
                },
                onerror: () => {
                    btn.innerText = originalText; btn.disabled = false;
                    alert("Lỗi kết nối tới Server!");
                }
            });
        };

        document.getElementById('btn-nt-send').onclick = () => {
            const msg = document.getElementById('nt-msg-input').value.trim();
            if(!msg) return alert("Vui lòng nhập nội dung thông báo!");

            const selectedUsers = [];
            document.querySelectorAll('.nt-chk:checked').forEach(chk => {
                selectedUsers.push(chk.value);
            });

            if(selectedUsers.length === 0) return alert("Vui lòng chọn ít nhất 1 người nhận!");
            if(!confirm(`Bạn có chắc muốn gửi thông báo cho ${selectedUsers.length} người?`)) return;

            updateColumnG(selectedUsers, msg, false);
        };

        document.getElementById('btn-nt-reset').onclick = () => {
             const selectedUsers = [];
            document.querySelectorAll('.nt-chk:checked').forEach(chk => {
                selectedUsers.push(chk.value);
            });
            if(selectedUsers.length === 0) return alert("Chọn người cần xóa thông báo!");
            if(!confirm(`Xóa thông báo của ${selectedUsers.length} người này?`)) return;

            updateColumnG(selectedUsers, "", true);
        };

        // --- START ---
        modal.style.display = 'flex';
        loadUsers();
    };

    return {
        name: "Thông báo",
        icon: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="#8cafbf"/></svg>`,
        bgColor: "#FFF3E0", 
        css: MY_CSS,
        action: runTool
    };
})
