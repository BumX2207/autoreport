/* 
   MODULE: AUTO TRIỂN KHAI
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
        .dp-time { font-weight:bold; color:#2e7d32; font-size:14px; display:flex; align-items:center; gap: 5px; }
        .dp-text { font-size:13px; font-weight: 600; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; margin-top: 2px;}
        .dp-sub-text { font-size: 10px; color: #888; margin-top: 2px; }
        .dp-badge { font-size:10px; padding:2px 6px; border-radius:4px; color:white; font-weight:bold; background:#28a745; }
        .dp-form { border-top:2px solid #eee; padding-top:10px; flex-shrink:0; background:#fff; }
        .dp-label { font-size:11px; font-weight:bold; color:#555; display:block; margin-bottom:3px; }
        .dp-input { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing: border-box; font-size:13px; }
        .dp-group-box { min-height:100px; max-height:110px; overflow-y:auto; border:1px solid #eee; border-radius:6px; padding:5px; background:#fff; }
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

        if (modal) {
            modal.remove();
        }

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
                const displayName = task.taskName || task.folderId || 'Không tên';

                div.innerHTML = `
                    <div style="flex:1; cursor:pointer;" id="dp-item-info-${task.id}" title="ID Folder: ${task.folderId}">
                        <div class="dp-time">
                            <span class="dp-badge" style="${task.status === 'done' && task.mode === 'once' ? 'background:#999' : ''}">
                                ${isDaily ? 'Hàng ngày' : task.date}
                            </span>
                            <span>⏰ ${task.time}</span>
                        </div>
                        <div class="dp-text">📂 ${displayName}</div>
                    </div>
                    <div>
                        <span class="dp-icon-btn" id="dp-edit-${task.id}">✎</span>
                        <span class="dp-icon-btn" id="dp-del-${task.id}" style="color:red; font-weight:bold;">×</span>
                    </div>
                `;
                container.appendChild(div);

                document.getElementById(`dp-del-${task.id}`).onclick = () => {
                    if(confirm('Xóa lịch này? (Sau khi xóa cần bấm LƯU LÊN SERVER để áp dụng)')) {
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
            document.getElementById('dp-name').value = task.taskName || '';
            
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
            document.getElementById('dp-name').value = '';
            document.getElementById('dp-chk-daily').checked = true;
            document.getElementById('dp-date').disabled = true;
            document.getElementById('btn-dp-add').innerText = "Thêm mới";
            document.querySelectorAll('.chk-dp-group').forEach(c => c.checked = false);
            renderList();
        };

        // --- HÀM LOAD DỮ LIỆU TỪ SERVER ---
        const loadFromCloud = () => {
            renderList(true);
            GM_xmlhttpRequest({
                method: "GET",
                url: `${CONSTANTS.GSHEET.CONFIG_API}?action=load&type=deploy&user=${encodeURIComponent(currentUser)}`,
                onload: (res) => {
                    try {
                        const response = JSON.parse(res.responseText);
                        if (response.status === 'success') {
                            if (response.data && response.data !== "undefined") {
                                currentTasks = (typeof response.data === 'string') ? JSON.parse(response.data) : response.data;
                            } else {
                                currentTasks = [];
                            }
                            if(!Array.isArray(currentTasks)) currentTasks = [];
                            
                            currentTasks.forEach(t => { 
                                if(!t.id) t.id = Date.now() + Math.random();
                                if((!t.mode || t.mode === 'daily') && t.status === 'done') {
                                    t.status = 'pending';
                                }
                            });

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
        modal = document.createElement('div');
        modal.id = modalId;
        const userCfg = UTILS.getPersistentConfig();
        const groups = userCfg.lineGroups || [];
        
        let groupHtml = '';
        if(groups.length === 0) groupHtml = '<div style="font-size:10px; color:red">Chưa cấu hình Line Group trong Khai báo</div>';
        groups.forEach(g => {
            groupHtml += `<label style="display:flex; align-items:center; font-size:12px; margin-bottom:4px; cursor:pointer;">
                <input type="checkbox" class="chk-dp-group" value="${g.id}" style="margin-right:5px;"> ${g.name}
            </label>`;
        });

        modal.innerHTML = `
            <div class="dp-content">
                <button class="dp-btn-close" id="btn-dp-close">×</button>
                <div class="dp-header">🚀 AUTO TRIỂN KHAI</div>
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

                    <div style="display:flex; gap:10px; margin-bottom:8px;">
                        <div style="flex:1">
                            <label class="dp-label">Tên công việc:</label>
                            <input type="text" id="dp-name" class="dp-input" placeholder="VD: Triển khai sáng">
                        </div>
                        <div style="flex:1">
                            <label class="dp-label">Folder ID:</label>
                            <input type="text" id="dp-folder" class="dp-input" placeholder="ID Drive folder...">
                        </div>
                    </div>
                    
                    <label class="dp-label">Nhóm nhận tin:</label>
                    <div class="dp-group-box">${groupHtml}</div>

                    <button id="btn-dp-add" class="dp-btn dp-btn-add">Thêm mới</button>
                </div>
                <button id="btn-dp-save" class="dp-btn dp-btn-save">☁️ LƯU LÊN SERVER</button>
            </div>
        `;
        document.body.appendChild(modal);

        // --- SỰ KIỆN ĐÓNG MODAL (Nút X) ---
        document.getElementById('btn-dp-close').onclick = () => { 
            modal.style.display = 'none'; 
            toggleBottomNav(true); // Hiện lại Nav
        };
        
        document.getElementById('dp-chk-daily').onchange = (e) => {
            document.getElementById('dp-date').disabled = e.target.checked;
        };

        document.getElementById('btn-dp-add').onclick = () => {
            const time = document.getElementById('dp-time').value;
            const folderId = document.getElementById('dp-folder').value.trim();
            const taskName = document.getElementById('dp-name').value.trim();
            const isDaily = document.getElementById('dp-chk-daily').checked;
            const date = document.getElementById('dp-date').value;
            const selectedGroups = Array.from(document.querySelectorAll('.chk-dp-group:checked')).map(c => c.value);

            if(!time || !folderId || !taskName || selectedGroups.length === 0) return alert("Vui lòng nhập đầy đủ: Tên, Giờ, ID và Nhóm!");
            if(!isDaily && !date) return alert("Vui lòng chọn ngày!");

            const taskObj = {
                id: editingId || Date.now(),
                isActive: true,
                mode: isDaily ? 'daily' : 'once',
                date: isDaily ? '' : date,
                time: time,
                folderId: folderId,
                taskName: taskName,
                groups: selectedGroups,
                lastRun: '',
                status: 'pending' 
            };

            if(editingId) {
                const idx = currentTasks.findIndex(t => String(t.id) === String(editingId));
                if(idx !== -1) {
                    currentTasks[idx] = taskObj;
                } else {
                    currentTasks.push(taskObj); 
                }
                UI.showToast("Đã cập nhật (Bấm LƯU LÊN SERVER để áp dụng)!");
            } else {
                currentTasks.push(taskObj);
                UI.showToast("Đã thêm (Bấm LƯU LÊN SERVER để áp dụng)!");
            }
            resetForm();
        };

        document.getElementById('btn-dp-save').onclick = () => {
            const btn = document.getElementById('btn-dp-save');
            btn.innerText = "Đang lưu..."; btn.disabled = true;

            currentTasks.forEach(t => {
                if ((!t.mode || t.mode === 'daily') && t.status === 'done') {
                    t.status = 'pending';
                }
            });

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
                            const userCfg = UTILS.getPersistentConfig();
                            userCfg.deployTask = currentTasks;
                            UTILS.savePersistentConfig(userCfg);
                            
                            modal.style.display = 'none';
                            toggleBottomNav(true); // Hiện lại Nav khi lưu xong và đóng modal
                        } else { alert("Lỗi: " + response.message); }
                    } catch (e) { alert("Lỗi phản hồi Server"); }
                },
                onerror: () => { btn.disabled = false; alert("Lỗi kết nối!"); }
            });
        };

        modal.style.display = 'flex';
        toggleBottomNav(false); // Ẩn Nav ngay khi mở modal
        loadFromCloud();
    };

    return {
        name: "Auto Triển khai",
        icon: `<svg viewBox="0 0 1024 1024"><path d="M400.3 744.5c2.1-0.7 4.1-1.4 6.2-2-2 0.6-4.1 1.3-6.2 2z m0 0c2.1-0.7 4.1-1.4 6.2-2-2 0.6-4.1 1.3-6.2 2z" fill="#39393A"></path><path d="M511.8 256.6c24.4 0 44.2 19.8 44.2 44.2S536.2 345 511.8 345s-44.2-19.8-44.2-44.2 19.9-44.2 44.2-44.2m0-20c-35.5 0-64.2 28.7-64.2 64.2s28.7 64.2 64.2 64.2 64.2-28.7 64.2-64.2-28.7-64.2-64.2-64.2z" fill="#E73B37"></path><path d="M730.7 529.5c0.4-8.7 0.6-17.4 0.6-26.2 0-179.6-86.1-339.1-219.3-439.5-133.1 100.4-219.2 259.9-219.2 439.5 0 8.8 0.2 17.5 0.6 26.1-56 56-90.6 133.3-90.6 218.7 0 61.7 18 119.1 49.1 167.3 30.3-49.8 74.7-90.1 127.7-115.3 39-18.6 82.7-29 128.8-29 48.3 0 93.9 11.4 134.3 31.7 52.5 26.3 96.3 67.7 125.6 118.4 33.4-49.4 52.9-108.9 52.9-173.1 0-85.4-34.6-162.6-90.5-218.6zM351.1 383.4c9.2-37.9 22.9-74.7 40.6-109.5a502.1 502.1 0 0 1 63.6-95.9c17.4-20.6 36.4-39.9 56.8-57.5 20.4 17.6 39.4 36.9 56.8 57.5 24.8 29.5 46.2 61.8 63.6 95.9 17.7 34.8 31.4 71.6 40.6 109.5 8.7 35.8 13.5 72.7 14.2 109.9C637.4 459 577 438.9 512 438.9c-65 0-125.3 20.1-175.1 54.4 0.7-37.2 5.5-74.1 14.2-109.9z m-90.6 449.2c-9.1-27-13.7-55.5-13.7-84.4 0-35.8 7-70.6 20.8-103.2 8.4-19.8 19-38.4 31.9-55.5 9.7 61.5 29.5 119.7 57.8 172.6-36.4 17.8-69 41.6-96.8 70.5z m364.2-85.3c-0.7-0.3-1.5-0.5-2.2-0.8-0.4-0.2-0.9-0.3-1.3-0.5-0.6-0.2-1.3-0.5-1.9-0.7-0.8-0.3-1.5-0.5-2.3-0.8-0.8-0.3-1.5-0.5-2.3-0.7l-0.9-0.3c-1-0.3-2.1-0.7-3.1-1-1.2-0.4-2.4-0.7-3.5-1.1l-3-0.9c-0.2-0.1-0.4-0.1-0.7-0.2-1.1-0.3-2.3-0.7-3.4-1-1.2-0.3-2.4-0.6-3.5-0.9l-3.6-0.9-3.6-0.9c-1-0.3-2.1-0.5-3.1-0.7-1.2-0.3-2.4-0.5-3.6-0.8-1.3-0.3-2.5-0.6-3.8-0.8h-0.3c-0.9-0.2-1.9-0.4-2.8-0.6-0.4-0.1-0.7-0.1-1.1-0.2-1.1-0.2-2.2-0.4-3.4-0.6-1.2-0.2-2.4-0.4-3.6-0.7l-5.4-0.9c-0.9-0.1-1.9-0.3-2.8-0.4-0.8-0.1-1.6-0.3-2.5-0.4-2.6-0.4-5.1-0.7-7.7-1-1.2-0.1-2.3-0.3-3.5-0.4h-0.4c-0.9-0.1-1.8-0.2-2.8-0.3-1.1-0.1-2.1-0.2-3.2-0.3-1.7-0.2-3.4-0.3-5.1-0.4-0.8-0.1-1.5-0.1-2.3-0.2-0.9-0.1-1.9-0.1-2.8-0.2-0.4 0-0.8 0-1.2-0.1-1.1-0.1-2.1-0.1-3.2-0.2-0.5 0-1-0.1-1.5-0.1-1.3-0.1-2.6-0.1-3.9-0.1-0.8 0-1.5-0.1-2.3-0.1-1.2 0-2.4 0-3.5-0.1h-13.9c-2.3 0-4.6 0.1-6.9 0.2-0.9 0-1.9 0.1-2.8 0.1-0.8 0-1.5 0.1-2.3 0.1-1.4 0.1-2.8 0.2-4.1 0.3-1.4 0.1-2.7 0.2-4.1 0.3-1.4 0.1-2.7 0.2-4.1 0.4-0.6 0-1.2 0.1-1.8 0.2l-7.8 0.9c-1.1 0.1-2.1 0.3-3.2 0.4-1 0.1-2.1 0.3-3.1 0.4-3.2 0.5-6.4 0.9-9.5 1.5-0.7 0.1-1.4 0.2-2.1 0.4-0.9 0.1-1.7 0.3-2.6 0.5-1.1 0.2-2.3 0.4-3.4 0.6-0.9 0.2-1.7 0.3-2.6 0.5-0.4 0.1-0.8 0.1-1.1 0.2-0.7 0.1-1.4 0.3-2.1 0.4-1.2 0.3-2.4 0.5-3.6 0.8-1.2 0.3-2.4 0.5-3.6 0.8-0.2 0-0.4 0.1-0.6 0.1-0.5 0.1-1 0.2-1.5 0.4-1.1 0.3-2.3 0.6-3.5 0.9-1.3 0.3-2.5 0.6-3.8 1-0.4 0.1-0.9 0.2-1.4 0.4-1.3 0.4-2.7 0.7-4 1.1-1.5 0.4-3 0.9-4.6 1.3-1 0.3-2.1 0.6-3.1 1-2.1 0.6-4.1 1.3-6.2 2-0.7 0.2-1.4 0.5-2.1 0.7-15-27.5-27.4-56.4-37-86.2-11.7-36.1-19.2-73.6-22.5-111.6-0.6-6.7-1-13.3-1.3-20-0.1-1.2-0.1-2.4-0.1-3.6-0.1-1.2-0.1-2.4-0.1-3.6 0-1.2-0.1-2.4-0.1-3.6 0-1.2-0.1-2.4-0.1-3.7 18.8-14 39.2-25.8 61-35 36.1-15.3 74.5-23 114.1-23 39.6 0 78 7.8 114.1 23 21.8 9.2 42.2 20.9 61 35v0.1c0 1 0 1.9-0.1 2.9 0 1.4-0.1 2.8-0.1 4.3 0 0.7 0 1.3-0.1 2-0.1 1.8-0.1 3.5-0.2 5.3-0.3 6.7-0.8 13.3-1.3 20-3.3 38.5-11 76.5-23 113-9.7 30.3-22.3 59.4-37.6 87.1z m136.8 90.9a342.27 342.27 0 0 0-96.3-73.2c29.1-53.7 49.5-112.8 59.4-175.5 12.8 17.1 23.4 35.6 31.8 55.5 13.8 32.7 20.8 67.4 20.8 103.2 0 31-5.3 61.3-15.7 90z" fill="#39393A"></path><path d="M512 819.3c8.7 0 24.7 22.9 24.7 60.4s-16 60.4-24.7 60.4-24.7-22.9-24.7-60.4 16-60.4 24.7-60.4m0-20c-24.7 0-44.7 36-44.7 80.4 0 44.4 20 80.4 44.7 80.4s44.7-36 44.7-80.4c0-44.4-20-80.4-44.7-80.4z" fill="#E73B37" fill="white"/></svg>`,
        bgColor: "blanchedalmond",
        css: MY_CSS,
        action: runTool
    };
})
