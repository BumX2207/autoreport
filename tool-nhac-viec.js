/* 
   MODULE: NHẮC VIỆC (MULTI TASKS VERSION)
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE, GM_xmlhttpRequest } = context;

    // CSS MỚI CHO GIAO DIỆN DANH SÁCH
    const MY_CSS = `
        #tgdd-reminder-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483650; justify-content:center; align-items:center; }
        .rm-content { background:white; width:95%; max-width:450px; border-radius:15px; padding:20px; box-shadow:0 10px 40px rgba(0,0,0,0.3); animation: popIn 0.3s; font-family: sans-serif; display:flex; flex-direction:column; max-height:90vh; }
        .rm-header { font-size:18px; font-weight:bold; margin-bottom:10px; text-align:center; color:#ff9800; border-bottom:2px solid #eee; padding-bottom:10px; flex-shrink:0; }
        
        /* List Area */
        .rm-list-container { flex:1; overflow-y:auto; margin-bottom:15px; border:1px solid #eee; border-radius:8px; background:#f9f9f9; padding:5px; min-height:100px; }
        .rm-item { background:white; border-radius:8px; padding:10px; margin-bottom:5px; border:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05); }
        .rm-item-info { flex:1; }
        .rm-time { font-weight:bold; color:#d35400; font-size:14px; }
        .rm-text { font-size:12px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }
        .rm-item-del { color:red; cursor:pointer; padding:5px 10px; font-weight:bold; font-size:16px; }

        /* Form Area */
        .rm-form { border-top:2px solid #eee; padding-top:15px; flex-shrink:0; }
        .rm-label { font-size:11px; font-weight:bold; color:#555; display:block; margin-bottom:3px; }
        .rm-input { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; margin-bottom:8px; box-sizing: border-box; font-size:13px; }
        .rm-group-box { max-height:80px; overflow-y:auto; border:1px solid #eee; border-radius:6px; padding:5px; background:#fff; margin-bottom:8px; }
        
        .rm-btn { width:100%; padding:10px; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; margin-top:5px; }
        .rm-btn-add { background:#4caf50; }
        .rm-btn-save { background:#2196f3; margin-top:10px; }
        .rm-btn-close { position:absolute; top:10px; right:15px; background:none; border:none; font-size:24px; color:#aaa; cursor:pointer; }
    `;

    const runTool = () => {
        const modalId = 'tgdd-reminder-modal';
        let modal = document.getElementById(modalId);

        // -- DATA STORE --
        let currentTasks = []; // Chứa danh sách các task
        const userCfg = UTILS.getPersistentConfig();
        
        // Load dữ liệu cũ (nếu là object thì chuyển thành array)
        if (userCfg.reminderTask) {
            if (Array.isArray(userCfg.reminderTask)) {
                currentTasks = userCfg.reminderTask;
            } else {
                currentTasks = [userCfg.reminderTask];
            }
        }

        // -- HELPER: RENDER LIST --
        const renderList = () => {
            const container = document.getElementById('rm-task-list');
            if(!container) return;
            container.innerHTML = '';
            
            if (currentTasks.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-size:12px;">Chưa có lịch nhắc nào.<br>Hãy thêm mới bên dưới.</div>';
                return;
            }

            // Sắp xếp theo giờ
            currentTasks.sort((a,b) => a.time.localeCompare(b.time));

            currentTasks.forEach((task, index) => {
                const div = document.createElement('div');
                div.className = 'rm-item';
                
                // Lấy tên các nhóm (để hiển thị tooltip nếu cần)
                const groupCount = task.groups ? task.groups.length : 0;

                div.innerHTML = `
                    <div class="rm-item-info">
                        <div class="rm-time">⏰ ${task.time} <span style="font-size:10px; color:#999; font-weight:normal">(${groupCount} nhóm)</span></div>
                        <div class="rm-text">${task.msg}</div>
                    </div>
                    <div class="rm-item-del" data-idx="${index}">×</div>
                `;
                container.appendChild(div);
            });

            // Gán sự kiện xóa
            document.querySelectorAll('.rm-item-del').forEach(btn => {
                btn.onclick = (e) => {
                    if(confirm('Bạn muốn xóa lịch nhắc này?')) {
                        const idx = parseInt(e.target.dataset.idx);
                        currentTasks.splice(idx, 1);
                        renderList(); // Render lại
                    }
                };
            });
        };

        // -- INIT UI --
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            
            // Lấy danh sách nhóm từ Config
            const groups = userCfg.lineGroups || [];
            let groupHtml = groups.length === 0 ? '<div style="color:red; font-size:11px;">Chưa có nhóm Line!</div>' : '';
            groups.forEach(g => {
                groupHtml += `<label style="display:flex; align-items:center; font-size:12px; margin-bottom:4px; cursor:pointer;">
                    <input type="checkbox" class="chk-rm-new-group" value="${g.id}" style="margin-right:5px;"> ${g.name}
                </label>`;
            });

            modal.innerHTML = `
                <div class="rm-content">
                    <button class="rm-btn-close" id="btn-rm-close">×</button>
                    <div class="rm-header">🔔 QUẢN LÝ NHẮC VIỆC</div>
                    
                    <!-- DANH SÁCH -->
                    <div id="rm-task-list" class="rm-list-container"></div>

                    <!-- FORM THÊM MỚI -->
                    <div class="rm-form">
                        <div style="font-size:13px; font-weight:bold; color:#2196f3; margin-bottom:10px;">➕ Thêm lịch nhắc mới</div>
                        
                        <div style="display:flex; gap:10px;">
                            <div style="flex:1">
                                <label class="rm-label">Giờ gửi:</label>
                                <input type="time" id="rm-new-time" class="rm-input">
                            </div>
                            <div style="flex:2">
                                <label class="rm-label">Nhóm nhận tin:</label>
                                <div class="rm-group-box">${groupHtml}</div>
                            </div>
                        </div>

                        <label class="rm-label">Nội dung:</label>
                        <input type="text" id="rm-new-msg" class="rm-input" placeholder="Nhập nội dung nhắc nhở...">

                        <button id="btn-rm-add" class="rm-btn rm-btn-add">Thêm vào danh sách</button>
                    </div>

                    <!-- SAVE ALL BUTTON -->
                    <button id="btn-rm-save-cloud" class="rm-btn rm-btn-save">☁️ LƯU TẤT CẢ LÊN SERVER</button>
                </div>
            `;
            document.body.appendChild(modal);

            // 1. Đóng Modal
            document.getElementById('btn-rm-close').onclick = () => { modal.style.display = 'none'; };

            // 2. Thêm Task mới vào List (Chưa lưu Server)
            document.getElementById('btn-rm-add').onclick = () => {
                const time = document.getElementById('rm-new-time').value;
                const msg = document.getElementById('rm-new-msg').value.trim();
                const selectedGroups = Array.from(document.querySelectorAll('.chk-rm-new-group:checked')).map(c => c.value);

                if(!time) return alert("Chưa chọn giờ!");
                if(!msg) return alert("Chưa nhập nội dung!");
                if(selectedGroups.length === 0) return alert("Chưa chọn nhóm!");

                // Thêm vào mảng tạm
                currentTasks.push({
                    isActive: true,
                    time: time,
                    msg: msg,
                    groups: selectedGroups,
                    lastRun: ''
                });

                // Reset form
                document.getElementById('rm-new-msg').value = '';
                renderList();
            };

            // 3. Lưu lên Server (Cột D)
            document.getElementById('btn-rm-save-cloud').onclick = () => {
                const currentUser = AUTH_STATE.userName;
                if (!currentUser || currentUser === "---") return alert("Chưa có User!");

                const btn = document.getElementById('btn-rm-save-cloud');
                const oldText = btn.innerText;
                btn.innerText = "Đang lưu..."; btn.disabled = true;

                GM_xmlhttpRequest({
                    method: "POST",
                    url: CONSTANTS.GSHEET.CONFIG_API,
                    data: JSON.stringify({
                        user: currentUser,
                        type: 'reminder', // Ghi vào cột D
                        config: currentTasks // Gửi cả mảng lên
                    }),
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    onload: (res) => {
                        btn.innerText = oldText; btn.disabled = false;
                        try {
                            const response = JSON.parse(res.responseText);
                            if (response.status === 'success') {
                                UI.showToast("✅ Đã lưu thành công!");
                                
                                // Cập nhật LocalStorage
                                userCfg.reminderTask = currentTasks;
                                UTILS.savePersistentConfig(userCfg);
                                
                                modal.style.display = 'none';
                            } else { alert("Lỗi: " + response.message); }
                        } catch (e) { alert("Lỗi phản hồi Server"); }
                    },
                    onerror: () => { btn.innerText = oldText; btn.disabled = false; alert("Lỗi mạng!"); }
                });
            };
        }

        renderList();
        modal.style.display = 'flex';
    };

    return {
        name: "Nhắc việc",
        icon: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="white"/></svg>`,
        bgColor: "#ff9800",
        css: MY_CSS,
        action: runTool
    };
})
