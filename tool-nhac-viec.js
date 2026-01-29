/* 
   MODULE: NHẮC VIỆC
   Đây là file module rời. Main Script sẽ tải file này về,
   truyền biến `context` vào để file này sử dụng.
*/
((context) => {
    // 1. Lấy các công cụ từ Main Script truyền vào
    const { UI, UTILS, DATA, CONSTANTS, AUTH_STATE, GM_xmlhttpRequest } = context;

    // 2. ĐỊNH NGHĨA CSS RIÊNG CHO TOOL NÀY
    const MY_CSS = `
        #tgdd-reminder-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(3px); z-index:2147483650; justify-content:center; align-items:center; }
        .rm-content { background:white; width:90%; max-width:400px; border-radius:15px; padding:20px; box-shadow:0 10px 40px rgba(0,0,0,0.3); animation: popIn 0.3s; font-family: sans-serif; }
        .rm-header { font-size:18px; font-weight:bold; margin-bottom:15px; text-align:center; color:#ff9800; border-bottom:2px solid #eee; padding-bottom:10px; }
        .rm-label { font-size:12px; font-weight:bold; color:#555; display:block; margin-bottom:5px; }
        .rm-group-box { max-height:100px; overflow-y:auto; border:1px solid #eee; border-radius:8px; padding:5px; background:#f9f9f9; margin-bottom:15px; }
        .rm-input { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; margin-bottom:15px; box-sizing: border-box; }
        .rm-btn-row { display:flex; gap:10px; }
        .rm-btn { flex:1; padding:10px; border:none; color:white; font-weight:bold; border-radius:8px; cursor:pointer; }
        .rm-btn-cancel { background:#ccc; }
        .rm-btn-save { background:#ff9800; }
    `;

    // 3. HÀM CHÍNH: CHẠY KHI BẤM VÀO ICON
    const runTool = () => {
        const modalId = 'tgdd-reminder-modal';
        let modal = document.getElementById(modalId);

        // A. Render UI nếu chưa có
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.innerHTML = `
                <div class="rm-content">
                    <div class="rm-header">🔔 CÀI ĐẶT NHẮC VIỆC</div>
                    
                    <label class="rm-label">Chọn nhóm gửi tin:</label>
                    <div id="remind-group-list" class="rm-group-box">Loading...</div>

                    <label class="rm-label">Thời gian gửi:</label>
                    <input type="time" id="remind-time" class="rm-input" style="font-weight:bold;">

                    <label class="rm-label">Nội dung tin nhắn:</label>
                    <textarea id="remind-msg" rows="4" placeholder="VD: Nhớ báo cáo thi đua..." class="rm-input" style="resize:none;"></textarea>

                    <div class="rm-btn-row">
                        <button id="btn-remind-cancel" class="rm-btn rm-btn-cancel">Hủy</button>
                        <button id="btn-remind-save" class="rm-btn rm-btn-save">Lưu Cloud ☁️</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Bắt sự kiện Hủy
            document.getElementById('btn-remind-cancel').onclick = () => { modal.style.display = 'none'; };
        }

        // B. Load dữ liệu
        const userCfg = UTILS.getPersistentConfig();
        const groups = userCfg.lineGroups || [];
        const savedReminder = userCfg.reminderTask || {};

        // Render list nhóm
        const groupListEl = document.getElementById('remind-group-list');
        if (groups.length === 0) {
            groupListEl.innerHTML = '<div style="font-size:11px; color:red;">Chưa cấu hình nhóm Line!</div>';
        } else {
            let html = '';
            groups.forEach((g) => {
                const isChecked = (savedReminder.groups || []).includes(g.id) ? 'checked' : '';
                html += `<label style="display:flex; align-items:center; padding:5px; cursor:pointer; border-bottom:1px solid #eee;">
                    <input type="checkbox" class="chk-remind-group" value="${g.id}" ${isChecked} style="margin-right:8px;">
                    <span style="font-size:12px;">${g.name}</span>
                </label>`;
            });
            groupListEl.innerHTML = html;
        }

        // Fill Form
        document.getElementById('remind-time').value = savedReminder.time || '';
        document.getElementById('remind-msg').value = savedReminder.msg || '';

        // C. Hiển thị Modal
        modal.style.display = 'flex';

        // D. Sự kiện LƯU
        document.getElementById('btn-remind-save').onclick = () => {
            const selectedGroups = Array.from(document.querySelectorAll('.chk-remind-group:checked')).map(c => c.value);
            const timeVal = document.getElementById('remind-time').value;
            const msgVal = document.getElementById('remind-msg').value.trim();

            if (selectedGroups.length === 0) { alert('Chọn ít nhất 1 nhóm!'); return; }
            if (!timeVal) { alert('Chọn thời gian!'); return; }
            if (!msgVal) { alert('Nhập nội dung!'); return; }

            const reminderPayload = {
                isActive: true,
                groups: selectedGroups,
                time: timeVal,
                msg: msgVal,
                lastRun: '' 
            };

            const currentUser = AUTH_STATE.userName;
            if (!currentUser || currentUser === "---") { alert("Chưa có User!"); return; }

            UI.showToast("☁️ Đang lưu Cột D...");
            const btn = document.getElementById('btn-remind-save');
            const oldText = btn.innerText; btn.innerText = "Lưu..."; btn.disabled = true;

            // Gọi API Save (Sử dụng hàm của Tampermonkey được truyền qua context)
            GM_xmlhttpRequest({
                method: "POST",
                url: CONSTANTS.GSHEET.CONFIG_API,
                data: JSON.stringify({
                    user: currentUser,
                    type: 'reminder', // Ghi vào cột D
                    config: reminderPayload
                }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                onload: (res) => {
                    btn.innerText = oldText; btn.disabled = false;
                    try {
                        const response = JSON.parse(res.responseText);
                        if (response.status === 'success') {
                            UI.showToast("✅ Lưu thành công!");
                            modal.style.display = 'none';
                            // Cập nhật local storage
                            userCfg.reminderTask = reminderPayload;
                            UTILS.savePersistentConfig(userCfg);
                        } else { alert("Lỗi: " + response.message); }
                    } catch (e) { alert("Lỗi phản hồi Server"); }
                },
                onerror: () => { btn.innerText = oldText; btn.disabled = false; alert("Lỗi mạng!"); }
            });
        };
    };

    // 4. TRẢ VỀ OBJECT CẤU HÌNH CHO MAIN SCRIPT
    return {
        name: "Nhắc việc",
        icon: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="white"/></svg>`,
        bgColor: "#ff9800",
        css: MY_CSS,     // Main script sẽ tự động inject CSS này
        action: runTool  // Hàm sẽ chạy khi click vào icon
    };
})
