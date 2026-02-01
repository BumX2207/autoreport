const MY_CSS = `
    /* Z-INDEX: 2147483646 */
    #tgdd-reminder-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483646; justify-content:center; align-items:center; }
    
    .rm-content { background:white; width:95%; max-width:450px; border-radius:15px; padding:20px; box-shadow:0 10px 40px rgba(0,0,0,0.3); animation: popIn 0.3s; font-family: sans-serif; display:flex; flex-direction:column; max-height:90vh; position: relative; }
    
    /* Header & Close Button */
    .rm-header { font-size:18px; font-weight:bold; margin-bottom:10px; text-align:center; color:#ff9800; border-bottom:2px solid #eee; padding-bottom:10px; flex-shrink:0; display:flex; justify-content:center; align-items:center; gap: 8px; }
    .rm-btn-close { position:absolute; top:15px; right:15px; background:none; border:none; font-size:24px; color:#999; cursor:pointer; line-height:1; z-index:10; transition:color 0.2s; }
    .rm-btn-close:hover { color:#333; }

    /* List Area */
    .rm-list-container { flex:1; overflow-y:auto; margin-bottom:15px; border:1px solid #eee; border-radius:8px; background:#f9f9f9; padding:5px; min-height:150px; position:relative; }
    .rm-item { background:white; border-radius:8px; padding:10px; margin-bottom:5px; border:1px solid #e0e0e0; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05); transition: background 0.2s; }
    .rm-item:hover { border-color:#ff9800; }
    .rm-item.editing { background:#fff3e0; border-color:#ff9800; }
    
    .rm-item-info { flex:1; cursor:pointer; }
    .rm-time { font-weight:bold; color:#d35400; font-size:14px; display:flex; align-items:center; gap:5px; }
    .rm-badge { font-size:10px; padding:2px 6px; border-radius:4px; color:white; font-weight:bold; }
    .rm-badge-daily { background:#4caf50; }
    .rm-badge-once { background:#2196f3; }
    
    .rm-text { font-size:12px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px; margin-top:3px; }
    
    /* Action Buttons */
    .rm-actions { display:flex; align-items:center; gap:5px; }
    .rm-btn-icon { cursor:pointer; padding:5px; border-radius:5px; display:flex; align-items:center; justify-content:center; }
    .rm-btn-edit { color:#2196f3; font-size:18px; }
    .rm-btn-del { color:#e74c3c; font-size:22px; padding:0 10px; font-weight:bold; }
    .rm-btn-edit:hover, .rm-btn-del:hover { background:#eee; }

    /* Form Area */
    .rm-form { border-top:2px solid #eee; padding-top:10px; flex-shrink:0; background:#fff; }
    .rm-row { display:flex; gap:10px; margin-bottom:8px; }
    .rm-col { flex:1; }
    
    .rm-label { font-size:11px; font-weight:bold; color:#555; display:block; margin-bottom:3px; }
    .rm-input { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing: border-box; font-size:13px; }
    .rm-input:focus { border-color:#ff9800; outline:none; }
    
    .rm-group-box { max-height:60px; overflow-y:auto; border:1px solid #eee; border-radius:6px; padding:5px; background:#fff; }
    
    .rm-toggle { display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; font-weight:bold; color:#4caf50; margin-bottom:5px; }
    .rm-toggle input { width:16px; height:16px; accent-color:#4caf50; }

    .rm-btn { width:100%; padding:10px; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; margin-top:5px; transition: 0.2s; }
    .rm-btn-add { background:#4caf50; }
    .rm-btn-update { background:#ff9800; }
    .rm-btn-save { background:#2196f3; margin-top:10px; }
    .rm-btn:active { transform:scale(0.98); }
    
    /* Loading State in List */
    .rm-loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 13px; }
    .rm-sync-spin { animation: spin 1s linear infinite; font-size: 24px; margin-bottom: 8px; color: #ff9800; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

const runTool = () => {
    const modalId = 'tgdd-reminder-modal';
    let modal = document.getElementById(modalId);

    let currentTasks = []; // Dữ liệu chỉ lưu trên RAM
    let editingId = null;
    const userCfg = UTILS.getPersistentConfig();
    const currentUser = AUTH_STATE.userName;

    // Hàm sắp xếp
    const sortTasks = () => {
        currentTasks.sort((a, b) => {
            const today = new Date().toISOString().split('T')[0];
            const dateA = (a.mode === 'daily' || !a.mode) ? today : a.date;
            const dateB = (b.mode === 'daily' || !b.mode) ? today : b.date;
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return a.time.localeCompare(b.time);
        });
    };

    // Render List
    const renderList = () => {
        const container = document.getElementById('rm-task-list');
        if(!container) return;
        container.innerHTML = '';
        
        if (currentTasks.length === 0) {
            container.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:#999; font-size:12px; text-align:center;">📭 Dữ liệu Cloud trống.<br>Thêm mới bên dưới nhé!</div>';
            return;
        }

        sortTasks();

        currentTasks.forEach((task) => {
            const div = document.createElement('div');
            div.className = `rm-item ${task.id === editingId ? 'editing' : ''}`;
            
            const isDaily = (!task.mode || task.mode === 'daily');
            const badgeHtml = isDaily ? `<span class="rm-badge rm-badge-daily">Hàng ngày</span>` : `<span class="rm-badge rm-badge-once">${task.date || '??'}</span>`;
            const opacityStyle = (task.status === 'completed') ? 'opacity: 0.5; text-decoration: line-through;' : '';

            div.innerHTML = `
                <div class="rm-item-info" onclick="document.getElementById('btn-edit-${task.id}').click()" style="${opacityStyle}">
                    <div class="rm-time">${badgeHtml} <span>⏰ ${task.time}</span></div>
                    <div class="rm-text" title="${task.msg}">${task.msg}</div>
                </div>
                <div class="rm-actions">
                    <div id="btn-edit-${task.id}" class="rm-btn-icon rm-btn-edit" title="Sửa">✎</div>
                    <div id="btn-del-${task.id}" class="rm-btn-icon rm-btn-del" title="Xóa">×</div>
                </div>
            `;
            container.appendChild(div);

            div.querySelector('.rm-btn-del').onclick = (e) => {
                e.stopPropagation();
                if(confirm('Bạn muốn xóa lịch nhắc này?')) {
                    currentTasks = currentTasks.filter(t => t.id !== task.id);
                    if (editingId === task.id) resetForm();
                    renderList();
                }
            };

            div.querySelector('.rm-btn-edit').onclick = (e) => {
                e.stopPropagation();
                loadToForm(task);
            };
        });
    };

    const loadToForm = (task) => {
        editingId = task.id;
        document.getElementById('rm-time').value = task.time;
        document.getElementById('rm-msg').value = task.msg;
        
        const isDaily = (!task.mode || task.mode === 'daily');
        const chkDaily = document.getElementById('chk-daily');
        const dateInput = document.getElementById('rm-date');
        
        chkDaily.checked = isDaily;
        dateInput.disabled = isDaily;
        dateInput.value = isDaily ? '' : (task.date || '');

        document.querySelectorAll('.chk-rm-new-group').forEach(chk => {
            chk.checked = (task.groups || []).includes(chk.value);
        });

        const btnAdd = document.getElementById('btn-rm-add');
        btnAdd.innerText = "Cập nhật thay đổi";
        btnAdd.className = "rm-btn rm-btn-update";
        
        renderList();
    };

    const resetForm = () => {
        editingId = null;
        document.getElementById('rm-msg').value = '';
        document.getElementById('chk-daily').checked = true;
        document.getElementById('rm-date').disabled = true;
        document.getElementById('rm-date').value = '';
        
        const btnAdd = document.getElementById('btn-rm-add');
        btnAdd.innerText = "Thêm vào danh sách";
        btnAdd.className = "rm-btn rm-btn-add";
        
        renderList();
    };

    // --- HÀM SYNC DỮ LIỆU TỪ CLOUD ---
    const syncFromCloud = () => {
        const container = document.getElementById('rm-task-list');
        if(!container) return;

        // 1. Hiển thị Loading ngay trong khung
        container.innerHTML = `
            <div class="rm-loading-state">
                <div class="rm-sync-spin">⏳</div>
                <div>Đang tải dữ liệu từ Cloud...</div>
            </div>
        `;

        if (!currentUser || currentUser === "---") {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:red;">Không kiểm tra được người dùng!<br>Vui lòng F5 load lại trang và đợi load user xong rồi hãy mở tiện ích lên.</div>';
            return;
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: `${CONSTANTS.GSHEET.CONFIG_API}?type=reminder&user=${encodeURIComponent(currentUser)}`,
            onload: (res) => {
                try {
                    const response = JSON.parse(res.responseText);
                    let cloudData = null;

                    if (response.status === 'success' && response.data) cloudData = response.data;
                    else if (response.config) cloudData = response.config;
                    else if (Array.isArray(response)) cloudData = response;

                    if (Array.isArray(cloudData)) {
                        // Cập nhật biến RAM
                        currentTasks = cloudData;
                        currentTasks.forEach(t => { if(!t.id) t.id = Date.now() + Math.random(); });
                        
                        // Render lại list (Loading sẽ biến mất vì innerHTML được reset trong renderList)
                        renderList();
                        UI.showToast("✅ Đã tải dữ liệu Cloud!");
                    } else {
                        // Không có dữ liệu
                        currentTasks = [];
                        renderList();
                    }
                } catch (e) {
                    console.error("Sync parse error", e);
                    container.innerHTML = '<div style="padding:20px; text-align:center; color:red;">Lỗi định dạng dữ liệu!</div>';
                }
            },
            onerror: () => {
                container.innerHTML = '<div style="padding:20px; text-align:center; color:red;">❌ Lỗi kết nối mạng!</div>';
            }
        });
    };

    // --- INIT UI ---
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        
        const groups = userCfg.lineGroups || [];
        let groupHtml = groups.length === 0 ? '<div style="color:red; font-size:11px;">Chưa có nhóm Line!</div>' : '';
        groups.forEach(g => {
            groupHtml += `<label style="display:flex; align-items:center; font-size:12px; margin-bottom:4px; cursor:pointer;">
                <input type="checkbox" class="chk-rm-new-group" value="${g.id}" style="margin-right:5px;"> ${g.name}
            </label>`;
        });

        modal.innerHTML = `
            <div class="rm-content">
                <button class="rm-btn-close" id="btn-rm-close" title="Đóng">×</button>
                <div class="rm-header">🔔 QUẢN LÝ NHẮC VIỆC</div>
                <div id="rm-task-list" class="rm-list-container"></div>
                <div class="rm-form">
                    <div class="rm-row">
                        <div class="rm-col">
                            <label class="rm-toggle"><input type="checkbox" id="chk-daily" checked> Lặp lại hàng ngày</label>
                            <input type="date" id="rm-date" class="rm-input" disabled>
                        </div>
                        <div class="rm-col">
                            <label class="rm-label">Giờ gửi:</label>
                            <input type="time" id="rm-time" class="rm-input">
                        </div>
                    </div>
                    <div class="rm-row">
                        <div class="rm-col"><label class="rm-label">Nội dung:</label><input type="text" id="rm-msg" class="rm-input" placeholder="Nhập nội dung..."></div>
                    </div>
                    <div class="rm-row">
                        <div class="rm-col"><label class="rm-label">Nhóm nhận tin:</label><div class="rm-group-box">${groupHtml}</div></div>
                    </div>
                    <button id="btn-rm-add" class="rm-btn rm-btn-add">Thêm vào danh sách</button>
                </div>
                <button id="btn-rm-save-cloud" class="rm-btn rm-btn-save">☁️ CẬP NHẬT LÊN CLOUD</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-rm-close').onclick = () => { modal.style.display = 'none'; };

        document.getElementById('chk-daily').onchange = (e) => {
            const dateInput = document.getElementById('rm-date');
            dateInput.disabled = e.target.checked;
            if(e.target.checked) dateInput.value = '';
            else { const d = new Date(); dateInput.value = d.toISOString().split('T')[0]; }
        };

        document.getElementById('btn-rm-add').onclick = () => {
            const time = document.getElementById('rm-time').value;
            const msg = document.getElementById('rm-msg').value.trim();
            const isDaily = document.getElementById('chk-daily').checked;
            const date = document.getElementById('rm-date').value;
            const selectedGroups = Array.from(document.querySelectorAll('.chk-rm-new-group:checked')).map(c => c.value);

            if(!time) return alert("Vui lòng chọn giờ!");
            if(!isDaily && !date) return alert("Vui lòng chọn ngày!");
            if(!msg) return alert("Vui lòng nhập nội dung!");
            if(selectedGroups.length === 0) return alert("Vui lòng chọn nhóm!");

            const taskObj = {
                id: editingId || Date.now(),
                isActive: true,
                mode: isDaily ? 'daily' : 'once',
                date: isDaily ? '' : date,
                time: time,
                msg: msg,
                groups: selectedGroups,
                lastRun: '',
                status: 'pending'
            };

            if (editingId) {
                const idx = currentTasks.findIndex(t => t.id === editingId);
                if(idx !== -1) currentTasks[idx] = taskObj;
                UI.showToast("Đã cập nhật (Cần lưu lên Cloud)!");
            } else {
                currentTasks.push(taskObj);
                UI.showToast("Đã thêm (Cần lưu lên Cloud)!");
            }
            resetForm();
        };

        document.getElementById('btn-rm-save-cloud').onclick = () => {
            if (!currentUser || currentUser === "---") return alert("Không tìm thấy user sử dụng!");

            const btn = document.getElementById('btn-rm-save-cloud');
            const oldText = btn.innerText;
            btn.innerText = "Đang lưu lên Cloud..."; btn.disabled = true;

            GM_xmlhttpRequest({
                method: "POST",
                url: CONSTANTS.GSHEET.CONFIG_API,
                // Lưu ý: Chỉ gửi lên Cloud, không lưu vào biến userCfg nữa
                data: JSON.stringify({ user: currentUser, type: 'reminder', config: currentTasks }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: (res) => {
                    btn.innerText = oldText; btn.disabled = false;
                    try {
                        const response = JSON.parse(res.responseText);
                        if (response.status === 'success') {
                            UI.showToast("✅ Lưu thành công!");
                            // Không lưu Local Storage ở đây
                            modal.style.display = 'none';
                        } else { alert("Lỗi: " + response.message); }
                    } catch (e) { alert("Lỗi phản hồi Server"); }
                },
                onerror: () => { btn.innerText = oldText; btn.disabled = false; alert("Lỗi kết nối!"); }
            });
        };
    }

    resetForm();
    
    // --- FIX Z-INDEX TOAST ---
    const toastEl = document.getElementById('tgdd-toast-notification');
    if (toastEl) document.body.appendChild(toastEl);

    modal.style.display = 'flex';

    // --- TRIGGER SYNC NGAY LẬP TỨC ---
    syncFromCloud();
};

return {
    name: "Nhắc việc",
    icon: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="white"/></svg>`,
    bgColor: "#ff9800",
    css: MY_CSS,
    action: runTool
};
