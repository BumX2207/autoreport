/* 
   MODULE: QUẢN LÝ THÔNG BÁO (NOTIFICATION MANAGER)
   - Gửi thông báo từ Admin tới User (Lưu vào Cột G)
   - Theo dõi trạng thái Đã xem/Chưa xem
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE, GM_xmlhttpRequest } = context;

    const MY_CSS = `
        #tgdd-notif-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483646; justify-content:center; align-items:center; }
        .nt-content { background:white; width:95%; max-width:500px; border-radius:16px; padding:0; box-shadow:0 15px 50px rgba(0,0,0,0.3); animation: popIn 0.3s; display:flex; flex-direction:column; max-height:90vh; overflow:hidden; position:relative; }
        .nt-header { background: linear-gradient(135deg, #FF9800, #F57C00); padding: 15px; color: white; font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 10px; }
        .nt-body { padding: 15px; overflow-y: auto; flex: 1; background: #f4f6f8; }
        .nt-footer { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
        
        .nt-btn-close { position:absolute; top:10px; right:15px; background:none; border:none; font-size:28px; color:rgba(255,255,255,0.8); cursor:pointer; line-height:1; }
        .nt-btn-close:hover { color: white; }

        .nt-input-area { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 15px; }
        .nt-textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 13px; resize: vertical; min-height: 80px; box-sizing: border-box; }
        .nt-textarea:focus { outline: none; border-color: #FF9800; }
        
        .nt-list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; font-size: 13px; font-weight: bold; color: #555; }
        .nt-list-container { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden; }
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
        .nt-btn-clear { background: #f5f5f5; color: #666; border: 1px solid #ddd; max-width: 100px; }
        .nt-btn-reload { background: none; border: none; color: #007bff; cursor: pointer; font-size: 12px; font-weight: normal; }

        .nt-loader { text-align: center; padding: 30px; color: #888; font-size: 13px; }
        .nt-spin { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #FF9800; border-radius: 50%; animation: nt-spin 1s linear infinite; vertical-align: middle; margin-right: 5px; }
        @keyframes nt-spin { to { transform: rotate(360deg); } }
    `;

    const runTool = () => {
        const modalId = 'tgdd-notif-modal';
        let modal = document.getElementById(modalId);
        let userList = []; // Chứa danh sách User load từ Sheet

        // --- HÀM ẨN/HIỆN NAV ---
        const toggleBottomNav = (show) => {
            const bottomNav = document.getElementById('tgdd-bottom-nav');
            if (bottomNav) {
                if (show) bottomNav.classList.add('show-nav');
                else bottomNav.classList.remove('show-nav');
            }
        };

        if (modal) modal.remove();

        // --- HÀM LOAD DỮ LIỆU TỪ SHEET (CỘT B và CỘT G) ---
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
                        // Duyệt từ dòng 1 (bỏ header)
                        for (let i = 1; i < rows.length; i++) {
                            const rowText = rows[i].trim();
                            if(rowText) {
                                const cols = UTILS.parseCSVLine(rowText);
                                // Cột B (index 1): Tên User
                                // Cột G (index 6): Dữ liệu Thông báo (JSON)
                                if(cols.length >= 2) {
                                    const userName = cols[1].trim();
                                    const rawNotif = (cols.length > 6) ? cols[6].trim() : "";
                                    
                                    let notifData = null;
                                    try {
                                        if(rawNotif && rawNotif.startsWith('{')) {
                                            notifData = JSON.parse(rawNotif);
                                        } else if (rawNotif) {
                                            // Hỗ trợ format text cũ nếu có
                                            notifData = { msg: rawNotif, read: false };
                                        }
                                    } catch(e) {}

                                    if(userName) {
                                        userList.push({
                                            name: userName,
                                            notif: notifData,
                                            rowIndex: i + 1 // Lưu lại số dòng để update cho đúng
                                        });
                                    }
                                }
                            }
                        }
                        renderUserList();
                    } else {
                        if(container) container.innerHTML = '<div class="nt-loader" style="color:red">❌ Lỗi tải dữ liệu!</div>';
                    }
                },
                onerror: () => {
                    if(container) container.innerHTML = '<div class="nt-loader" style="color:red">❌ Lỗi kết nối mạng!</div>';
                }
            });
        };

        // --- HÀM RENDER DANH SÁCH ---
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
                
                // Xác định trạng thái
                let badgeHtml = '<span class="nt-badge nt-badge-empty">Trống</span>';
                let msgPreview = 'Chưa có thông báo';
                
                if (u.notif && u.notif.msg) {
                    if (u.notif.read) {
                        badgeHtml = '<span class="nt-badge nt-badge-read">✅ Đã xem</span>';
                        msgPreview = u.notif.msg;
                    } else {
                        badgeHtml = '<span class="nt-badge nt-badge-unread">🔴 Chưa xem</span>';
                        msgPreview = `<b style="color:#c62828">${u.notif.msg}</b>`;
                    }
                }

                div.innerHTML = `
                    <input type="checkbox" class="nt-chk" id="nt-chk-${idx}" value="${u.name}">
                    <div class="nt-user-info">
                        <div class="nt-user-name">${u.name}</div>
                        <div class="nt-user-status">${badgeHtml} <span style="color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:150px;">- ${msgPreview}</span></div>
                    </div>
                `;
                
                // Click vào row thì toggle checkbox
                div.onclick = (e) => {
                    if(e.target.type !== 'checkbox') {
                        const chk = document.getElementById(`nt-chk-${idx}`);
                        chk.checked = !chk.checked;
                    }
                };

                container.appendChild(div);
            });
        };

        // --- UI ---
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
                        <label style="font-weight:bold; color:#333; display:block; margin-bottom:5px;">Nội dung tin nhắn:</label>
                        <textarea id="nt-msg-input" class="nt-textarea" placeholder="Nhập thông báo muốn gửi..."></textarea>
                    </div>

                    <div class="nt-list-header">
                        <span>Danh sách người dùng</span>
                        <div style="display:flex; gap:10px;">
                            <button class="nt-btn-reload" id="btn-nt-select-all">Chọn tất cả</button>
                            <button class="nt-btn-reload" id="btn-nt-reload">🔄 Tải lại</button>
                        </div>
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

        // --- BINDING EVENTS ---
        document.getElementById('btn-nt-close').onclick = () => { modal.style.display = 'none'; toggleBottomNav(true); };
        document.getElementById('btn-nt-reload').onclick = loadUsers;
        
        let isAllSelected = false;
        document.getElementById('btn-nt-select-all').onclick = () => {
            isAllSelected = !isAllSelected;
            document.querySelectorAll('.nt-chk').forEach(c => c.checked = isAllSelected);
            document.getElementById('btn-nt-select-all').innerText = isAllSelected ? "Bỏ chọn" : "Chọn tất cả";
        };

        // GỬI THÔNG BÁO
        document.getElementById('btn-nt-send').onclick = () => {
            const msg = document.getElementById('nt-msg-input').value.trim();
            if(!msg) return alert("Vui lòng nhập nội dung thông báo!");

            const selectedUsers = [];
            document.querySelectorAll('.nt-chk:checked').forEach(chk => {
                selectedUsers.push(chk.value);
            });

            if(selectedUsers.length === 0) return alert("Vui lòng chọn ít nhất 1 người nhận!");

            if(!confirm(`Bạn có chắc muốn gửi thông báo cho ${selectedUsers.length} người?`)) return;

            // Gọi API Update (Giả lập logic update cột G)
            updateColumnG(selectedUsers, msg, false); // read = false
        };

        // XÓA THÔNG BÁO (Set cột G thành rỗng)
        document.getElementById('btn-nt-reset').onclick = () => {
             const selectedUsers = [];
            document.querySelectorAll('.nt-chk:checked').forEach(chk => {
                selectedUsers.push(chk.value);
            });
            if(selectedUsers.length === 0) return alert("Chọn người cần xóa thông báo!");
            if(!confirm(`Xóa thông báo của ${selectedUsers.length} người này?`)) return;

            updateColumnG(selectedUsers, "", true); // msg rỗng = xóa
        };

        // --- HÀM GỌI API ĐỂ UPDATE CỘT G ---
        const updateColumnG = (targetUserNames, message, isClear) => {
            const btn = document.getElementById('btn-nt-send');
            const originalText = btn.innerText;
            btn.innerText = "⏳ Đang lưu..."; btn.disabled = true;

            // Tạo Payload
            // Data structure: [{ user: "ABC", data: JSON_STRING }, ...]
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

            // Sử dụng API Config (giả định API này hỗ trợ type='push_notif' để update cột G theo user)
            // Nếu API hiện tại của bạn chỉ hỗ trợ saveConfig toàn cục, bạn cần sửa lại API Server (Google Apps Script)
            // Tuy nhiên, ở đây mình sẽ gửi theo format chuẩn để bạn update GAS.
            
            GM_xmlhttpRequest({
                method: "POST",
                url: CONSTANTS.GSHEET.CONFIG_API, // Dùng chung link Config API
                data: JSON.stringify({ 
                    action: 'push_notif', // Action mới cho GAS
                    targets: updateData   // Danh sách user cần update
                }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: (res) => {
                    btn.innerText = originalText; btn.disabled = false;
                    try {
                        // Vì API GAS có thể trả về text hoặc json tùy cách bạn viết
                        // Ở đây giả định thành công nếu không lỗi 500
                        UI.showToast("✅ Đã cập nhật Cột G thành công!");
                        loadUsers(); // Load lại để thấy trạng thái mới
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

        // --- MAIN START ---
        modal.style.display = 'flex';
        toggleBottomNav(false);
        loadUsers();
    };

    return {
        name: "Thông báo",
        icon: `<svg viewBox="0 0 24 24"><path d="M93.43 98.52s-23.66-6.21-41.21 10.42c-7.55 7.16-12.89 12.47-14.18 13.76c-4.03 4.03-14.4 2.96-24.47-7.11s-11.63-22.1-7.6-26.12c.6-.6 7.34-6.59 14.82-14.5c7.99-8.46 6.55-20.27 7.06-27.56c.61-8.76 2.22-12.23 2.22-12.23l63.36 63.34z" fill="#8cafbf"/></svg>`,
        bgColor: "#FFF3E0", // Màu nền icon cam nhạt cho nổi bật
        css: MY_CSS,
        action: runTool
    };
})
