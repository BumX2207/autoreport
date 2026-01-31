/* 
   MODULE: AUTO TRIỂN KHAI (V2 - Updated)
*/
((context) => {
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE, GM_xmlhttpRequest } = context;

    const MY_CSS = `
        #tgdd-deploy-tool-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483646; justify-content:center; align-items:center; }
        .dp-content { background:white; width:95%; max-width:450px; border-radius:15px; padding:20px; box-shadow:0 10px 40px rgba(0,0,0,0.3); animation: popIn 0.3s; font-family: sans-serif; display:flex; flex-direction:column; max-height:90vh; position: relative; }
        .dp-header { font-size:18px; font-weight:bold; margin-bottom:10px; text-align:center; color:#28a745; border-bottom:2px solid #eee; padding-bottom:10px; flex-shrink:0; }
        .dp-btn-close { position:absolute; top:15px; right:15px; background:none; border:none; font-size:24px; color:#999; cursor:pointer; line-height:1; z-index:10; }
        .dp-list-container { flex:1; overflow-y:auto; margin-bottom:15px; border:1px solid #eee; border-radius:8px; background:#f9f9f9; padding:5px; min-height:120px; }
        .dp-item { background:white; border-radius:8px; padding:10px; margin-bottom:5px; border:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center; transition: background 0.2s; }
        .dp-item.editing { background:#e8f5e9; border-color:#28a745; }
        .dp-time { font-weight:bold; color:#2e7d32; font-size:14px; }
        .dp-text { font-size:11px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }
        .dp-badge { font-size:10px; padding:2px 6px; border-radius:4px; color:white; font-weight:bold; background:#28a745; margin-right:5px; }
        .dp-form { border-top:2px solid #eee; padding-top:10px; flex-shrink:0; background:#fff; }
        .dp-label { font-size:11px; font-weight:bold; color:#555; display:block; margin-bottom:3px; }
        .dp-input { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing: border-box; font-size:13px; }
        .dp-group-box { max-height:60px; overflow-y:auto; border:1px solid #eee; border-radius:6px; padding:5px; background:#fff; }
        .dp-toggle { display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; font-weight:bold; color:#28a745; margin-bottom:5px; }
        .dp-btn { width:100%; padding:10px; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; margin-top:5px; }
        .dp-btn-add { background:#28a745; }
        .dp-btn-save { background:#007bff; margin-top:10px; }
        .dp-icon-btn { cursor:pointer; padding:5px; font-size:16px; }
        .dp-loader { text-align:center; padding:20px; color:#666; font-size:12px; font-style:italic;}
    `;

    const runTool = () => {
        const modalId = 'tgdd-deploy-tool-modal';
        let modal = document.getElementById(modalId);
        let currentTasks = [];
        let editingId = null;
        const currentUser = AUTH_STATE.userName;

        // --- CÁC HÀM XỬ LÝ GIAO DIỆN ---
        const sortTasks = () => currentTasks.sort((a, b) => a.time.localeCompare(b.time));

        const renderList = (isLoading = false) => {
            const container = document.getElementById('dp-task-list');
            if(!container) return;
            container.innerHTML = '';
            
            if(isLoading) {
                container.innerHTML = '<div class="dp-loader">⏳ Đang tải dữ liệu từ Server...</div>';
                return;
            }

            if (currentTasks.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:30px; color:#999; font-size:12px;">Chưa có lịch triển khai nào.</div>';
                return;
            }
            sortTasks();

            currentTasks.forEach((task) => {
                const div = document.createElement('div');
                div.className = `dp-item ${task.id === editingId ? 'editing' : ''}`;
                const isDaily = (!task.mode || task.mode === 'daily');
                
                div.innerHTML = `
                    <div style="flex:1; cursor:pointer;" id="dp-item-info-${task.id}">
                        <div class="dp-time">
                            <span class="dp-badge" style="${task.status === 'done' && task.mode === 'once' ? 'background:#999' : ''}">
                                ${isDaily ? 'Hàng ngày' : task.date}
                            </span>
                            ⏰ ${task.time}
                        </div>
                        <div class="dp-text">📂 ID: ${task.folderId}</div>
                    </div>
                    <div>
                        <span class="dp-icon-btn" id="dp-edit-${task.id}">✎</span>
                        <span class="dp-icon-btn" id="dp-del-${task.id}" style="color:red; font-weight:bold;">×</span>
                    </div>
                `;
                container.appendChild(div);

                document.getElementById(`dp-del-${task.id}`).onclick = () => {
                    if(confirm('Xóa lịch này? (Cần bấm LƯU LÊN SERVER để áp dụng)')) {
                        currentTasks = currentTasks.filter(t => t.id !== task.id);
                        if (editingId === task.id) resetForm();
                        renderList();
                    }
                };
                document.getElementById(`dp-item-info-${task.id}`).onclick = () => loadToForm(task);
                document.getElementById(`dp-edit-${task.id}`).onclick = () => loadToForm(task);
            });
        };

        const loadToForm = (task) => {
            editingId = task.id;
            document.getElementById('dp-time').value = task.time;
            document.getElementById('dp-folder').value = task.folderId;
            const isDaily = (!task.mode || task.mode === 'daily');
            document.getElementById('dp-chk-daily').checked = isDaily;
            const dateInput = document.getElementById('dp-date');
            dateInput.disabled = isDaily;
            dateInput.value = isDaily ? '' : (task.date || '');

            document.querySelectorAll('.chk-dp-group').forEach(chk => {
                chk.checked = (task.groups || []).includes(chk.value);
            });
            document.getElementById('btn-dp-add').innerText = "Cập nhật";
            renderList();
        };

        const resetForm = () => {
            editingId = null;
            document.getElementById('dp-folder').value = '';
            document.getElementById('dp-chk-daily').checked = true;
            document.getElementById('dp-date').disabled = true;
            document.getElementById('btn-dp-add').innerText = "Thêm mới";
            document.querySelectorAll('.chk-dp-group').forEach(c => c.checked = false);
            renderList();
        };

        // --- HÀM LOAD DỮ LIỆU TỪ SERVER ---
        const loadFromCloud = () => {
            renderList(true); // Show loading
            GM_xmlhttpRequest({
                method: "GET",
                // Gọi API lấy dữ liệu type=deploy
                url: `${CONSTANTS.GSHEET.CONFIG_API}?action=load&type=deploy&user=${encodeURIComponent(currentUser)}`,
                onload: (res) => {
                    try {
                        const response = JSON.parse(res.responseText);
                        if (response.status === 'success') {
                            // Nếu có dữ liệu thì parse, không thì rỗng
                            if (response.data && response.data !== "undefined") {
                                currentTasks = (typeof response.data === 'string') ? JSON.parse(response.data) : response.data;
                            } else {
                                currentTasks = [];
                            }
                            if(!Array.isArray(currentTasks)) currentTasks = [];
                            // Chuẩn hóa ID nếu thiếu
                            currentTasks.forEach(t => { if(!t.id) t.id = Date.now() + Math.random(); });
                            
                            // Lưu tạm vào local để backup
                            const userCfg = UTILS.getPersistentConfig();
                            userCfg.deployTask = currentTasks;
                            UTILS.savePersistentConfig(userCfg);
                            
                            renderList();
                            UI.showToast("✅ Đã đồng bộ dữ liệu từ Cloud!");
                        } else {
                            renderList();
                            UI.showToast("⚠️ Không lấy được dữ liệu cũ: " + response.message);
                        }
                    } catch (e) {
                        renderList();
                        console.error(e);
                        UI.showToast("❌ Lỗi xử lý dữ liệu tải về");
                    }
                },
                onerror: () => {
                    renderList();
                    UI.showToast("❌ Lỗi kết nối mạng");
                }
            });
        };

        // --- KHỞI TẠO MODAL ---
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            const userCfg = UTILS.getPersistentConfig(); // Chỉ lấy danh sách Group từ config
            const groups = userCfg.lineGroups || [];
            
            let groupHtml = '';
            if(groups.length === 0) groupHtml = '<div style="font-size:10px; color:red">Chưa cấu hình Line Group trong Settings</div>';
            groups.forEach(g => {
                groupHtml += `<label style="display:flex; align-items:center; font-size:12px; margin-bottom:4px; cursor:pointer;">
                    <input type="checkbox" class="chk-dp-group" value="${g.id}" style="margin-right:5px;"> ${g.name}
                </label>`;
            });

            modal.innerHTML = `
                <div class="dp-content">
                    <button class="dp-btn-close" id="btn-dp-close">×</button>
                    <div class="dp-header">🚀 AUTO TRIỂN KHAI (Cloud)</div>
                    <div id="dp-task-list" class="dp-list-container"></div>

                    <div class="dp-form">
                        <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <div style="flex:1">
                                <label class="dp-toggle"><input type="checkbox" id="dp-chk-daily" checked> Lặp lại hàng ngày</label>
                                <input type="date" id="dp-date" class="dp-input" disabled>
                            </div>
                            <div style="flex:1">
                                <label class="dp-label">Giờ gửi:</label>
                                <input type="time" id="dp-time" class="dp-input">
                            </div>
                        </div>

                        <label class="dp-label">Google Drive Folder ID:</label>
                        <input type="text" id="dp-folder" class="dp-input" placeholder="ID thư mục (Ảnh/Text)...">
                        
                        <label class="dp-label">Nhóm nhận tin:</label>
                        <div class="dp-group-box">${groupHtml}</div>

                        <button id="btn-dp-add" class="dp-btn dp-btn-add">Thêm mới</button>
                    </div>
                    <button id="btn-dp-save" class="dp-btn dp-btn-save">☁️ LƯU LÊN SERVER</button>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('btn-dp-close').onclick = () => { modal.style.display = 'none'; };
            document.getElementById('dp-chk-daily').onchange = (e) => {
                document.getElementById('dp-date').disabled = e.target.checked;
            };

            // Nút Thêm/Sửa
            document.getElementById('btn-dp-add').onclick = () => {
                const time = document.getElementById('dp-time').value;
                const folderId = document.getElementById('dp-folder').value.trim();
                const isDaily = document.getElementById('dp-chk-daily').checked;
                const date = document.getElementById('dp-date').value;
                const selectedGroups = Array.from(document.querySelectorAll('.chk-dp-group:checked')).map(c => c.value);

                if(!time || !folderId || selectedGroups.length === 0) return alert("Vui lòng nhập Giờ, Folder ID và chọn ít nhất 1 nhóm!");
                if(!isDaily && !date) return alert("Vui lòng chọn ngày!");

                const taskObj = {
                    id: editingId || Date.now(),
                    isActive: true,
                    mode: isDaily ? 'daily' : 'once',
                    date: isDaily ? '' : date,
                    time: time,
                    folderId: folderId,
                    groups: selectedGroups,
                    lastRun: '', // Reset lastRun khi sửa đổi
                    status: 'pending'
                };

                if(editingId) {
                    const idx = currentTasks.findIndex(t => t.id === editingId);
                    if(idx !== -1) currentTasks[idx] = taskObj;
                    UI.showToast("Đã cập nhật (Bấm Lưu để áp dụng)!");
                } else {
                    currentTasks.push(taskObj);
                    UI.showToast("Đã thêm (Bấm Lưu để áp dụng)!");
                }
                resetForm();
            };

            // Nút Lưu lên Server
            document.getElementById('btn-dp-save').onclick = () => {
                const btn = document.getElementById('btn-dp-save');
                btn.innerText = "Đang lưu..."; btn.disabled = true;

                GM_xmlhttpRequest({
                    method: "POST",
                    url: CONSTANTS.GSHEET.CONFIG_API,
                    data: JSON.stringify({ user: currentUser, type: 'deploy', config: currentTasks }), 
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    onload: (res) => {
                        btn.innerText = "☁️ LƯU LÊN SERVER"; btn.disabled = false;
                        try {
                            const response = JSON.parse(res.responseText);
                            if (response.status === 'success') {
                                UI.showToast("✅ Lưu thành công!");
                                // Cập nhật local
                                const userCfg = UTILS.getPersistentConfig();
                                userCfg.deployTask = currentTasks;
                                UTILS.savePersistentConfig(userCfg);
                                modal.style.display = 'none';
                            } else { alert("Lỗi: " + response.message); }
                        } catch (e) { alert("Lỗi phản hồi Server"); }
                    },
                    onerror: () => { btn.disabled = false; alert("Lỗi kết nối!"); }
                });
            };
        }

        modal.style.display = 'flex';
        // Gọi hàm load dữ liệu ngay khi mở
        loadFromCloud();
    };

    return {
        name: "Auto Triển khai",
        icon: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="white"/></svg>`,
        bgColor: "#28a745",
        css: MY_CSS,
        action: runTool
    };
})
