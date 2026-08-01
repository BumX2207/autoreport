((context) => {
    // Giải nén các công cụ bổ trợ được chuyển giao từ hệ thống chính
    const { UI, UTILS, AUTH_STATE } = context;

    // ===============================================================
    // BỘ TIỆN ÍCH AN TOÀN NỘI BỘ (Độc lập 100% chống lỗi lệch phiên bản)
    // ===============================================================
    const safeParseNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/[^0-9.-]/g, '').replace(/,/g, '')) || 0;
    };

    const safeFormatNumber = (num) => {
        if (!num && num !== 0) return '';
        return new Intl.NumberFormat('en-US').format(Math.round(num || 0));
    };

    // ===============================================================
    // CSS GIAO DIỆN (Dựng form nhập liệu màu sắc trực quan giống hình vẽ)
    // ===============================================================
    const MY_CSS = `
        #con-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#f0f2f5; z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow:hidden; box-sizing: border-box; }
        #con-app * { box-sizing: border-box; }
        
        /* Header */
        .con-header { background:#fff; padding:15px 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:space-between; align-items:center; z-index:20; height:60px; flex-shrink: 0; }
        .con-logo { font-size:18px; font-weight:900 !important; color:#6c5ce7; text-transform:uppercase; display:flex; align-items:center; gap:10px;}
        .con-btn-close { background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; font-size:16px;}
        .con-btn-close:hover { background:#d63031; color:white; transform:scale(1.1);}

        /* Body Layout */
        .con-body { flex: 1; padding: 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; max-width: 1100px; margin: 0 auto; width: 100%; }
        .con-panel { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 20px; border: 1px solid #e2e8f0; }
        
        .con-row { display: flex; gap: 20px; flex-wrap: wrap; }
        .con-col { flex: 1; min-width: 320px; }

        /* Form groups */
        .con-group { margin-bottom: 12px; }
        .con-group label { display: block; font-size: 11px; font-weight: 800; margin-bottom: 4px; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; }
        .con-group input, .con-group select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; outline: none; transition: 0.15s; font-weight: bold; color: #2d3436; }
        .con-group input:focus, .con-group select:focus { border-color: #6c5ce7; box-shadow: 0 0 0 3px rgba(108, 92, 230, 0.15); }

        /* Section Title Cards */
        .con-sec-title { font-weight: 800; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .bg-buy { background: #1e3799; }
        .bg-sell { background: #009432; }
        .bg-products { background: #6c5ce7; }
        .bg-total { background: #2f3542; }

        /* Table Products */
        .con-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
        .con-table th, .con-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        .con-table th { background: #f8fafc; font-weight: 800; font-size: 12px; color: #475569; text-transform: uppercase; text-align: center; }
        .con-table td input { width: 100%; border: none; outline: none; padding: 4px; font-size: 13.5px; font-weight: bold; }
        .con-table td input:focus { background: #f8fafc; }

        /* Buttons */
        .con-btn-add-row { background: #ffffff; color: #6c5ce7; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; transition: 0.2s; }
        .con-btn-add-row:hover { background: #f1f0ff; }
        .con-btn-del-row { background: #ff7675; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        .con-btn-del-row:hover { background: #d63031; }

        .con-btn-generate { background: linear-gradient(135deg, #6c5ce7, #4834d4); color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; width: 100%; box-shadow: 0 8px 25px rgba(108, 92, 230, 0.4); text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; margin-top: 10px; }
        .con-btn-generate:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(108, 92, 230, 0.5); }
        .con-btn-generate:active { transform: translateY(0); }

        .con-grand-total { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; text-align: right; font-size: 18px; font-weight: 900; color: #c00000; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); height: 40px; display: flex; align-items: center; justify-content: flex-end; }

        @media (max-width: 768px) {
            .con-row { flex-direction: column; gap: 15px; }
            .con-col { width: 100%; }
        }
    `;

    // ===============================================================
    // BỘ BIÊN DỊCH SỐ TIỀN SANG CHỮ TIẾNG VIỆT CHUẨN VĂN PHÒNG
    // ===============================================================
    const convertNumberToWords = (number) => {
        if (number === 0) return "Không";
        const units = ["", "ngàn", "triệu", "tỷ", "ngàn tỷ", "triệu tỷ"];
        const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
        
        const readThreeDigits = (num, showZero) => {
            let str = "";
            const hundreds = Math.floor(num / 100);
            const tens = Math.floor((num % 100) / 10);
            const ones = num % 10;

            if (hundreds > 0 || showZero) {
                str += digits[hundreds] + " trăm ";
            }

            if (tens > 1) {
                str += digits[tens] + " mươi ";
            } else if (tens === 1) {
                str += "mười ";
            } else if (showZero && ones > 0) {
                str += "lẻ ";
            }

            if (ones === 1 && tens > 1) {
                str += "mốt";
            } else if (ones === 5 && tens > 0) {
                str += "lăm";
            } else if (ones > 0) {
                str += digits[ones];
            }
            return str.trim();
        };

        let str = "";
        let groupIdx = 0;
        let temp = number;

        while (temp > 0) {
            const groupVal = temp % 1000;
            if (groupVal > 0) {
                const groupStr = readThreeDigits(groupVal, temp > 1000);
                str = groupStr + " " + units[groupIdx] + " " + str;
            }
            temp = Math.floor(temp / 1000);
            groupIdx++;
        }

        str = str.trim().replace(/\s+/g, ' ');
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const formatVietnameseDate = (dateStr) => {
        if (!dateStr) return "ngày ... Tháng ... năm ...";
        const parts = dateStr.split('/');
        if (parts.length !== 3) return `ngày ${dateStr}`;
        return `ngày ${parts[0]} Tháng ${parts[1]} năm ${parts[2]}`;
    };

    const formatVietnameseDateCapital = (dateStr) => {
        if (!dateStr) return "ngày ... Tháng ... Năm ...";
        const parts = dateStr.split('/');
        if (parts.length !== 3) return `ngày ${dateStr}`;
        return `ngày ${parts[0]} Tháng ${parts[1]} Năm ${parts[2]}`;
    };

    const padZero = (num) => String(num).padStart(2, '0');

    // ===============================================================
    // TIỆN ÍCH CHÍNH (ACTION HƠN 100% HIỆU SUẤT TRUY VẤN)
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('con-app');
        const userCfg = UTILS.getPersistentConfig();

        // KHAI BÁO BIẾN DRAFT ID PHẠM VI HÀM (KHẮC PHỤC LỖI KHÔNG XÁC ĐỊNH BIẾN)
        let currentDraftId = "draft_" + Date.now();
        
        // Trích xuất mã số user từ AUTH_STATE
        const extractUserId = (str) => {
            if (!str) return "";
            const match = str.match(/\d+/);
            return match ? match[0] : str.trim();
        };
        const currentUserId = AUTH_STATE ? extractUserId(AUTH_STATE.userName) : "";
        
        // URL WEB APP ĐỒNG BỘ ĐÃ ĐƯỢC CẬP NHẬT THEO ĐÚNG YÊU CẦU CỦA BẠN
        const webAppUrl = "https://script.google.com/macros/s/AKfycbw-KMUUL5rHPeSxGGbFbTs_2VMuP8OH5ehoDci_zAIACKhl0Tip9TTzJ5r-fLwu5He1GQ/exec";

        // ĐỒNG BỘ BỘ GIẢI MÃ PHẢN HỒI AN TOÀN TRÁNH BÌ LỖI CHẰNG CHÉO HTML TỪ GOOGLE
        const safeParseJsonResponse = async (res) => {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (err) {
                if (text.includes("<!DOCTYPE") || text.includes("<html")) {
                    throw new Error("Google Apps Script trả về trang báo lỗi HTML (thay vì dữ liệu JSON).\\nCó thể bạn chưa phân quyền Web App là 'Anyone' (Bất kỳ ai) hoặc bộ nhớ lưu trữ vượt quá giới hạn 9KB.");
                }
                throw new Error("Lỗi giải mã JSON phản hồi: " + err.message);
            }
        };

        // Đồng bộ chuẩn hóa cấu trúc dữ liệu cũ (Dự phòng tương thích ngược)
        const normalizeCloudData = (info) => {
            let data = info || {};
            if (data.name && !data.sellerInfo) {
                const oldSeller = { ...data };
                data = { sellerInfo: oldSeller, drafts: [] };
            }
            if (!data.sellerInfo) data.sellerInfo = {};
            if (!data.drafts) data.drafts = [];
            return data;
        };

        // Hàm điền tự động toàn bộ trường của Bên B và thiết lập mặc định thông tin chung cố định
        const fillBFields = (info) => {
            if (!info) return;
            const activeApp = document.getElementById('con-app') || app;
            if (!activeApp) return;

            const fields = {
                '#con-b-name': info.name,
                '#con-b-address': info.address,
                '#con-b-store': info.store,
                '#con-b-tax': info.tax,
                '#con-b-phone': info.phone,
                '#con-b-bank-acc': info.bankAcc,
                '#con-b-bank-name': info.bankName,
                '#con-b-rep-hd': info.rep,
                '#con-b-role-hd': info.role,
                '#con-b-uq': info.uq,
                '#con-b-rep-tl': info.repTl,
                '#con-b-role-tl': info.roleTl,
                '#con-b-honor-hd': info.honorHd,
                '#con-b-honor-tl': info.honorTl,
                '#con-q-drive-folder': info.driveFolderId, // Nạp mặc định ID Google Drive chung cố định
                '#con-common-phone': info.commonPhone,     // Nạp mặc định Số điện thoại liên hệ chung cố định
                '#con-store-address': info.storeAddress,   // Nạp mặc định Địa chỉ siêu thị chung cố định
                '#con-b-select': info.bSelectVal           // Nạp mặc định Siêu thị được chọn chung cố định
            };
            for (let selector in fields) {
                const val = fields[selector];
                if (val !== undefined) {
                    const el = activeApp.querySelector(selector);
                    if (el) el.value = val;
                }
            }
        };

        // --- DỜI HÀM VẼ DROPDOWN LÊN ĐẦU PHẠM VI TRUY CẬP ---
        const renderDraftDropdown = () => {
            const activeApp = document.getElementById('con-app') || app;
            if (!activeApp) return;
            const dropdown = activeApp.querySelector('#con-draft-select');
            if (!dropdown) return;
            const cloudData = normalizeCloudData(userCfg.shopConfigColL);
            const drafts = cloudData.drafts || [];
            
            let html = '<option value="">📂 --- Xem lại bản nháp gần nhất ---</option>';
            drafts.forEach(d => {
                html += `<option value="${d.id}" ${d.id === currentDraftId ? 'selected' : ''}>${d.label}</option>`;
            });
            dropdown.innerHTML = html;
        };

        // 1. Tải nhanh từ Local Storage (Offline Fallback)
        try {
            const localData = localStorage.getItem('con_shop_config_col_l');
            if (localData) {
                const info = normalizeCloudData(JSON.parse(localData));
                userCfg.shopConfigColL = info;
                setTimeout(() => {
                    fillBFields(info.sellerInfo);
                    renderDraftDropdown();
                }, 50);
            }
        } catch (e) {}

        // 2. Đồng bộ nạp dữ liệu đầy đủ từ Cloud
        if (currentUserId) {
            (async () => {
                try {
                    const res = await fetch(webAppUrl, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({
                            action: "loadConfig",
                            user: currentUserId
                        })
                    });
                    const resData = await safeParseJsonResponse(res);
                    if (resData.status === 'success' && resData.data) {
                        const info = normalizeCloudData(JSON.parse(resData.data));
                        userCfg.shopConfigColL = info;
                        localStorage.setItem('con_shop_config_col_l', resData.data);
                        
                        UTILS.savePersistentConfig(userCfg); 
                        fillBFields(info.sellerInfo);
                    }
                } catch (err) {
                    console.warn("[Auto BI] Không thể đồng bộ cấu hình từ Cloud:", err.message);
                } finally {
                    renderDraftDropdown();
                }
            })();
        } else {
            renderDraftDropdown();
        }
        
        if (!app) {
            app = document.createElement('div');
            app.id = 'con-app';

            // Sinh danh sách dropdown siêu thị tự động từ cấu hình gốc
            let shopOptionsHtml = '<option value="">--- Nhấp chọn siêu thị ---</option>';
            const shops = [
                { id: 'shop1', name: userCfg.shop1 },
                { id: 'shop2', name: userCfg.shop2 },
                { id: 'shop3', name: userCfg.shop3 },
                { id: 'shop4', name: userCfg.shop4 },
                { id: 'shop5', name: userCfg.shop5 }
            ];
            shops.forEach(s => {
                if (s.name) shopOptionsHtml += `<option value="${s.id}">${s.name}</option>`;
            });

            app.innerHTML = `
                <div class="con-header" style="display:flex; justify-content:space-between; align-items:center; gap:15px; height:60px;">
                    <div class="con-logo" style="flex-shrink:0;">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 15H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                        <span>Tạo Hợp Đồng</span>
                    </div>
                    
                    <!-- THANH ĐIỀU HƯỚNG TIỆN ÍCH DRAFT -->
                    <div style="display:flex; align-items:center; gap:10px; flex:1; justify-content:start; max-width:680px;">
                        <select id="con-draft-select" style="padding:6px 12px; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold; font-size:12.5px; max-width:260px; background:#f8fafc; outline:none; cursor:pointer;">
                            <option value="">📂 --- Xem lại bản nháp gần nhất ---</option>
                        </select>
                        <button id="btn-con-new-draft" style="background:#6c5ce7; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:12.5px; cursor:pointer; transition:0.2s;">＋ Tạo Mới</button>
                        <button id="btn-con-save-draft" style="background:#2ed573; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:12.5px; cursor:pointer; transition:0.2s;">💾 Lưu Thông Tin</button>
                    </div>
                    
                    <button class="con-btn-close" id="con-btn-close" style="flex-shrink:0;">✖</button>
                </div>
                
                <div class="con-body">
                    <!-- THÔNG TIN CHUNG VĂN BẢN -->
                    <div class="con-panel">
                        <div class="con-sec-title bg-total">📅 THÔNG TIN CHUNG</div>
                        <div class="con-row" style="gap:15px;">
                            <div class="con-col con-group" style="min-width: 150px;">
                                <label>Số Hợp Đồng</label>
                                <input type="text" id="con-no" value="0104-2026 /KD-ĐMX/HĐMB">
                            </div>
                            <div class="con-col con-group" style="min-width: 150px;">
                                <label>Ngày Ký Hợp Đồng</label>
                                <input type="text" id="con-date-hd" value="12/04/2026" placeholder="dd/mm/yyyy">
                            </div>
                            <!-- CẬP NHẬT NHÃN THEO YÊU CẦU: "Ngày nghiệm thu" -->
                            <div class="con-col con-group" style="min-width: 150px;">
                                <label>Ngày nghiệm thu</label>
                                <input type="text" id="con-date-tl" value="14/04/2026" placeholder="dd/mm/yyyy">
                            </div>
                            <!-- THIẾT LẬP CĂN LỀ ĐỘNG CHO TRANG IN -->
                            <div class="con-col con-group" style="min-width: 110px;">
                                <label>📐 Lề Trên (cm)</label>
                                <input type="number" id="con-print-margin-top" value="1.8" step="0.1" min="0" max="10" style="text-align: center;">
                            </div>
                            <div class="con-col con-group" style="min-width: 110px;">
                                <label>📐 Lề Dưới (cm)</label>
                                <input type="number" id="con-print-margin-bottom" value="1.0" step="0.1" min="0.5" max="10" style="text-align: center;">
                            </div>
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>🏪 Chọn Siêu Thị</label>
                                <select id="con-b-select">${shopOptionsHtml}</select>
                            </div>
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>📞 Số điện thoại liên hệ</label>
                                <input type="text" id="con-common-phone" value="0979435599 - Hữu Thọ" placeholder="Số điện thoại - Tên người liên hệ">
                            </div>
                            <div class="con-col con-group" style="min-width: 250px;">
                                <label>📍 Địa chỉ siêu thị (Báo giá)</label>
                                <input type="text" id="con-store-address" value="248 Nguyễn Tất Thành, Liên Sơn, Lắk, Đắk Lắk" placeholder="Nhập địa chỉ siêu thị bán hàng...">
                            </div>
                            <div class="con-col con-group" style="min-width: 250px;" id="group-drive-folder">
                                <label>📁 ID Thư mục Google Drive lưu ảnh</label>
                                <input type="text" id="con-q-drive-folder" value="" placeholder="Dán ID hoặc Link thư mục Drive của bạn...">
                            </div>
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>📄 Loại văn bản kết xuất</label>
                                <select id="con-file-type">
                                    <option value="contract">In hợp đồng mua bán</option>
                                    <option value="liquidation">Biên bản bàn giao thanh lý</option>
                                    <option value="quotation">In bảng báo giá</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- THÔNG TIN HAI BÊN BÁN - MUA -->
                    <div class="con-row">
                        <!-- BÊN MUA (BÊN A) -->
                        <div class="con-col con-panel" id="panel-side-a">
                            <div class="con-sec-title bg-buy">🏢 I/ BÊN MUA (BÊN A)</div>
                            <div class="con-group"><label>Tên Đơn Vị Mua Hàng</label><input type="text" id="con-a-name" value="Phòng Giao Dịch Ngân Hàng Chính Sách Xã Hội Lăk"></div>
                            <div class="con-group"><label>Địa Chỉ Trụ Sở Đăng Ký</label><input type="text" id="con-a-address" value="203 Nguyễn Tất Thành, Xã Liên Sơn Lắk, Tỉnh Đắk Lắk"></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Mã Số Thuế</label><input type="text" id="con-a-tax" value="0100695387-043"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>SĐT / Fax</label><input type="text" id="con-a-phone" value="0979435599"></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Số Tài Khoản</label><input type="text" id="con-a-bank-acc" value="" placeholder="STK bên A (nếu có)..."></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Ngân Hàng</label><input type="text" id="con-a-bank-name" value="" placeholder="Tên ngân hàng bên A (nếu có)..."></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:80px; flex:0.4;">
                                    <label>Danh xưng</label>
                                    <select id="con-a-honor">
                                        <option value="Ông" selected>Ông</option>
                                        <option value="Bà">Bà</option>
                                    </select>
                                </div>
                                <div class="con-col con-group" style="min-width:140px; flex:1.6;"><label>Người Đại Diện</label><input type="text" id="con-a-rep" value="Bùi Quang Tuyên"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ</label><input type="text" id="con-a-role" value="Giám Đốc"></div>
                            </div>
                        </div>

                        <!-- KHÁCH HÀNG NHẬN BÁO GIÁ -->
                        <div class="con-col con-panel" id="panel-quotation-client" style="display:none;">
                            <div class="con-sec-title bg-buy">🏢 I/ THÔNG TIN BÁO GIÁ</div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:80px; flex:0.4;">
                                    <label>Danh xưng</label>
                                    <select id="con-q-client-honor">
                                        <option value="Anh">Anh</option>
                                        <option value="Chị" selected>Chị</option>
                                        <option value="Ông">Ông</option>
                                        <option value="Bà">Bà</option>
                                    </select>
                                </div>
                                <div class="con-col con-group" style="min-width:180px; flex:1.6;"><label>Tên khách hàng</label><input type="text" id="con-q-client-name" value="Trịnh Thị Trang"></div>
                            </div>
                            <div class="con-group"><label>Điện thoại</label><input type="text" id="con-q-client-phone" value="0941034995"></div>
                            <div class="con-group"><label>Tên công ty</label><input type="text" id="con-q-client-company" value="Ngân hàng THương mại cổ phần bản việt - PGD Lắk"></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Email</label><input type="text" id="con-q-client-email" value="test@company.com"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Địa chỉ</label><input type="text" id="con-q-client-address" value="Số 212 Nguyễn Tất Thành, Xã Liên Sơn Lắk, Tỉnh Đắk Lắk"></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Ngày báo giá</label><input type="text" id="con-q-date" value="29/06/2026" placeholder="dd/mm/yyyy"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Hiệu lực đến</label><input type="text" id="con-q-valid-until" value="06/07/2026" placeholder="dd/mm/yyyy"></div>
                            </div>
                        </div>

                        <!-- BÊN BÁN (BÊN B) -->
                        <div class="con-col con-panel" id="panel-side-b">
                            <div class="con-sec-title bg-sell">🏪 II/ BÊN BÁN (BÊN B)</div>
                            <div class="con-group"><label>Tên Chi Nhánh / Công ty</label><input type="text" id="con-b-name" value="CHI NHÁNH CÔNG TY CỔ PHẦN ĐẦU TƯ ĐIỆY MÁY XANH"></div>
                            <div class="con-group"><label>Địa Chỉ Trụ Sở Đăng Ký</label><input type="text" id="con-b-address" value="Số A12 Trần Hưng Đạo, Phường Buôn Ma Thuột, Tỉnh Đắk Lắk, Việt Nam"></div>
                            <div class="con-group"><label>Siêu Thị Bán Hàng</label><input type="text" id="con-b-store" value="ĐMM_DLA_LAK - 248 Nguyễn Tất Thành (Liên Sơn)"></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Mã Số Thuế</label><input type="text" id="con-b-tax" value="0303217354-002"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Điện thoại / Fax</label><input type="text" id="con-b-phone" value="18001060 – (+84) 8 38125957"></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Số Tài Khoản</label><input type="text" id="con-b-bank-acc" value="1243 666 888 (VNĐ)"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Ngân Hàng</label><input type="text" id="con-b-bank-name" value="Ngoại Thương Việt Nam (VCB)– CN Tân Bình TP.HCM"></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:80px; flex:0.4;">
                                    <label>Danh xưng</label>
                                    <select id="con-b-honor-hd">
                                        <option value="Ông">Ông</option>
                                        <option value="Bà" selected>Bà</option>
                                    </select>
                                </div>
                                <div class="con-col con-group" style="min-width:140px; flex:1.6;"><label>Đại Diện</label><input type="text" id="con-b-rep-hd" value="Đỗ Thị Thái Thanh"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ</label><input type="text" id="con-b-role-hd" value="Giám Đốc Bán Hàng"></div>
                            </div>
                            <div class="con-group"><label>Ủy Quyền</label><input type="text" id="con-b-uq" value="Theo giấy Uỷ Quyền số 12/2026/ĐMX/UQ ký ngày 24/03/2026"></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:80px; flex:0.4;">
                                    <label>Danh xưng</label>
                                    <select id="con-b-honor-tl">
                                        <option value="Ông">Ông</option>
                                        <option value="Bà" selected>Bà</option>
                                    </select>
                                </div>
                                <div class="con-col con-group" style="min-width:140px; flex:1.6;"><label>Đại Diện</label><input type="text" id="con-b-rep-tl" value="ĐỖ THỊ THÁI THANH"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ</label><input type="text" id="con-b-role-tl" value="Giám Đốc Vùng (RSM)"></div>
                            </div>
                        </div>
                    </div>

                    <!-- CHI TIẾT SẢN PHẨM & SỐ LƯỢNG -->
                    <div class="con-panel">
                        <div class="con-sec-title bg-products">
                            <span>📦 III/ CHI TIẾT SẢN PHẨM & SỐ LƯỢNG</span>
                            <button class="con-btn-add-row" id="btn-con-add-row">＋ Thêm dòng sản phẩm</button>
                        </div>
                        <table class="con-table">
                            <thead>
                                <tr>
                                    <th style="width:40px;">STT</th>
                                    <th class="col-image" style="width:80px; display:none;">Hình ảnh</th>
                                    <th>TÊN SẢN PHẨM / MÔ TẢ CHI TIẾT</th>
                                    <th style="width:70px;">SL</th>
                                    <th class="col-retail-price" style="width:130px; display:none;">Giá gốc</th>
                                    <th class="col-price-header" style="width:130px;">ĐƠN GIÁ</th>
                                    <th style="width:150px;">THÀNH TIỀN</th>
                                    <th style="width:50px;">XÓA</th>
                                </tr>
                            </thead>
                            <tbody id="tbl-con-products-body">
                                <tr class="con-product-row">
                                    <td class="con-stt" style="text-align:center; font-weight:bold; vertical-align:middle;">1</td>
                                    <td class="col-image" style="display:none; text-align:center; vertical-align:middle;">
                                        <div style="position:relative; width:60px; height:60px; border:1px dashed #cbd5e1; border-radius:6px; margin:0 auto; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc;">
                                            <span class="img-placeholder" style="font-size:16px; color:#94a3b8; font-weight:bold;">＋</span>
                                            <img class="con-p-img-preview" style="display:none; width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;">
                                            <input type="file" class="con-p-img-file" accept="image/*" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;">
                                        </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <input type="text" class="con-p-name" value="Máy lạnh âm trần LG Inverter 2.5 HP ZTNQ24GPLA0" style="width:100%;">
                                        <textarea class="con-p-desc" style="width:100%; display:none; height:65px; border:1px solid #cbd5e1; border-radius:8px; padding:6px; font-size:13px; font-weight:bold; outline:none; resize:none;" placeholder="- Nhập mô tả sản phẩm (Enter để xuống dòng...)"></textarea>
                                    </td>
                                    <td style="vertical-align:middle;"><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                                    <td class="col-retail-price" style="display:none; vertical-align:middle;"><input type="text" class="con-p-retail-price" value="18,990,000" style="width:100%; text-align:right;"></td>
                                    <td style="vertical-align:middle;"><input type="text" class="con-p-price" value="18,490,000" style="width:100%; text-align:right;"></td>
                                    <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa; vertical-align:middle;">18,490,000</td>
                                    <td style="text-align:center; vertical-align:middle;"><button class="con-btn-del-row">✖</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- GIẢM GIÁ & TỔNG TIỀN -->
                    <div class="con-panel con-row" style="gap:15px; align-items:flex-end;">
                        <div class="con-col con-group" style="flex:1.5; margin:0;"><label>Chương Trình Ưu Đãi / Giảm Giá</label><input type="text" id="con-discount-name" placeholder="Nội dung giảm giá (nếu có)..."></div>
                        <div class="con-col con-group" style="flex:1; margin:0;"><label>Giá Trị Giảm (VNĐ)</label><input type="text" id="con-discount-val" placeholder="0" style="text-align:right;"></div>
                        <div class="con-col con-group" style="flex:1.5; margin:0;">
                            <label style="color:#c00000; font-weight:bold;">💰 TỔNG TIỀN CUỐI CÙNG (VNĐ)</label>
                            <div class="con-grand-total" id="con-final-total">29,090,000</div>
                        </div>
                    </div>
                    <div class="con-panel con-group" style="margin-top:-10px;">
                        <label>✍️ SỐ TIỀN BẰNG CHỮ TIẾNG VIỆT</label>
                        <input type="text" id="con-final-words" style="background:#f1f5f9; color:#2e7d32;" readonly>
                    </div>

                    <!-- NÚT KẾT XUẤT -->
                    <button id="btn-con-generate" class="con-btn-generate">🖨️ Tạo Hợp Đồng & Tải PDF</button>
                </div>
            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // ==========================================
            // ĐĂNG KÝ CÁC SỰ KIỆN TƯƠNG TÁC ĐỘNG
            // ==========================================
            const tbody = app.querySelector('#tbl-con-products-body');

            // Đóng app
            app.querySelector('#con-btn-close').onclick = () => { app.style.display = 'none'; };

            // --- LOGIC CHUYỂN ĐỔI CHẾ ĐỘ HIỂN THỊ CÁC CỘT BÁO CÁO ---
            const toggleFileType = () => {
                const fileType = app.querySelector('#con-file-type').value;
                const panelA = app.querySelector('#panel-side-a');
                const panelB = app.querySelector('#panel-side-b');
                const panelQuotation = app.querySelector('#panel-quotation-client');
                const priceHeader = app.querySelector('.col-price-header');
                const btnGenerate = app.querySelector('#btn-con-generate');

                if (fileType === 'quotation') {
                    panelA.style.display = 'none';
                    panelB.style.display = 'none';
                    panelQuotation.style.display = 'block';

                    app.querySelectorAll('.col-image, .col-retail-price').forEach(el => el.style.display = 'table-cell');
                    app.querySelectorAll('.con-p-desc').forEach(el => el.style.display = 'block');
                    app.querySelectorAll('.con-p-name').forEach(el => el.style.display = 'none');
                    priceHeader.innerText = "GIÁ ĐÃ GIẢM";
                    btnGenerate.innerText = "🖨️ Tạo Báo Giá & Tải PDF";
                } else {
                    panelA.style.display = 'block';
                    panelB.style.display = 'block';
                    panelQuotation.style.display = 'none';

                    app.querySelectorAll('.col-image, .col-retail-price').forEach(el => el.style.display = 'none');
                    app.querySelectorAll('.con-p-desc').forEach(el => el.style.display = 'none');
                    app.querySelectorAll('.con-p-name').forEach(el => el.style.display = 'block');
                    priceHeader.innerText = "ĐƠN GIÁ (VNĐ)";
                    btnGenerate.innerText = "🖨️ Tạo Hợp Đồng & Tải PDF";
                }
                recalculateTotals();
            };
            app.querySelector('#con-file-type').onchange = toggleFileType;

            // --- ĐỒNG BỘ HOÁ SỰ KIỆN CHO TỪNG DÒNG SẢN PHẨM ---
            const bindRowEvents = (row) => {
                const qtyInp = row.querySelector('.con-p-qty');
                const priceInp = row.querySelector('.con-p-price');
                const retailPriceInp = row.querySelector('.con-p-retail-price');
                const imgFileInput = row.querySelector('.con-p-img-file');
                const imgPreview = row.querySelector('.con-p-img-preview');
                const imgPlaceholder = row.querySelector('.img-placeholder');
                const descTextarea = row.querySelector('.con-p-desc');

                priceInp.oninput = (e) => {
                    e.target.value = UTILS.formatInputNumber(e.target.value.replace(/[^0-9]/g, ''));
                    recalculateTotals();
                };
                if (retailPriceInp) {
                    retailPriceInp.oninput = (e) => {
                        e.target.value = UTILS.formatInputNumber(e.target.value.replace(/[^0-9]/g, ''));
                    };
                }
                qtyInp.oninput = recalculateTotals;

                if (imgFileInput) {
                    imgFileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const driveFolderIdRaw = app.querySelector('#con-q-drive-folder').value.trim();
                            if (!driveFolderIdRaw) {
                                alert("⚠️ Vui lòng nhập ID hoặc dán đường Link thư mục Google Drive lưu ảnh vào ô khai báo ở phần chung!");
                                return;
                            }

                            let driveFolderId = driveFolderIdRaw;
                            if (driveFolderId.indexOf("folders/") !== -1) {
                                driveFolderId = driveFolderId.split("folders/")[1].split("?")[0].split("/")[0];
                            }

                            imgPlaceholder.innerText = "⏳";
                            imgPlaceholder.style.fontSize = "12px";

                            const reader = new FileReader();
                            reader.onload = (event) => {
                                fetch(webAppUrl, {
                                    method: "POST",
                                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                                    body: JSON.stringify({
                                        action: "upload_file",
                                        folderId: driveFolderId,
                                        fileName: "con_prod_" + Date.now() + "_" + file.name,
                                        data: event.target.result
                                    })
                                })
                                .then(res => safeParseJsonResponse(res))
                                .then(resData => {
                                    if (resData.status === 'success' && resData.url) {
                                        imgPreview.src = resData.url;
                                        imgPreview.style.display = 'block';
                                        imgPlaceholder.style.display = 'none';
                                        row.dataset.imageB64 = resData.url;
                                    } else {
                                        alert("❌ Lỗi tải lên Drive: " + resData.message);
                                        imgPlaceholder.innerText = "＋";
                                        imgPlaceholder.style.fontSize = "16px";
                                    }
                                })
                                .catch(err => {
                                    alert("❌ Lỗi kết nối khi tải ảnh lên Drive: " + err.message);
                                    imgPlaceholder.innerText = "＋";
                                    imgPlaceholder.style.fontSize = "16px";
                                });
                            };
                            reader.readAsDataURL(file);
                        }
                    };
                }

                if (descTextarea) {
                    descTextarea.onkeydown = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const start = descTextarea.selectionStart;
                            const end = descTextarea.selectionEnd;
                            const text = descTextarea.value;
                            descTextarea.value = text.substring(0, start) + "\n- " + text.substring(end);
                            descTextarea.selectionStart = descTextarea.selectionEnd = start + 3;
                            descTextarea.dispatchEvent(new Event('input'));
                        }
                    };
                    descTextarea.onfocus = () => {
                        if (descTextarea.value.trim() === '') {
                            descTextarea.value = '- ';
                        }
                    };
                }
            };

            app.querySelector('#con-b-select').onchange = (e) => {
                const selVal = e.target.value;
                if (!selVal) return;
                const storeName = userCfg[selVal] || "";
                app.querySelector('#con-b-store').value = storeName.toUpperCase();
            };

            // --- CHỌN BẢN NHÁP TỪ DROPDOWN ---
            app.querySelector('#con-draft-select').onchange = (e) => {
                const selectedDraftId = e.target.value;
                if (!selectedDraftId) return;

                const cloudData = normalizeCloudData(userCfg.shopConfigColL);
                const drafts = cloudData.drafts || [];
                const draft = drafts.find(d => d.id === selectedDraftId);
                if (!draft) return;

                currentDraftId = draft.id;

                app.querySelector('#con-file-type').value = draft.fileType || 'contract';
                app.querySelector('#con-no').value = draft.conNo || '';
                app.querySelector('#con-date-hd').value = draft.dateHd || '';
                app.querySelector('#con-date-tl').value = draft.dateTl || '';
                app.querySelector('#con-print-margin-top').value = draft.printMarginTop !== undefined ? draft.printMarginTop : '1.8';
                app.querySelector('#con-print-margin-bottom').value = draft.printMarginBottom !== undefined ? draft.printMarginBottom : '1.0';

                app.querySelector('#con-a-name').value = draft.aName || '';
                app.querySelector('#con-a-address').value = draft.aAddress || '';
                app.querySelector('#con-a-tax').value = draft.aTax || '';
                app.querySelector('#con-a-phone').value = draft.aPhone || '';
                app.querySelector('#con-a-bank-acc').value = draft.aBankAcc || '';
                app.querySelector('#con-a-bank-name').value = draft.aBankName || '';
                app.querySelector('#con-a-rep').value = draft.aRep || '';
                app.querySelector('#con-a-role').value = draft.aRole || '';
                app.querySelector('#con-a-honor').value = draft.aHonor || 'Ông';

                app.querySelector('#con-q-client-name').value = draft.qClientName || '';
                app.querySelector('#con-q-client-phone').value = draft.qClientPhone || '';
                app.querySelector('#con-q-client-company').value = draft.qClientCompany || '';
                app.querySelector('#con-q-client-email').value = draft.qClientEmail || '';
                app.querySelector('#con-q-client-address').value = draft.qClientAddress || '';
                app.querySelector('#con-q-date').value = draft.qDate || '';
                app.querySelector('#con-q-valid-until').value = draft.qValidUntil || '';
                app.querySelector('#con-q-client-honor').value = draft.qClientHonor || 'Anh';

                app.querySelector('#con-discount-name').value = draft.discountName || '';
                app.querySelector('#con-discount-val').value = draft.discountVal || '0';

                tbody.innerHTML = '';
                if (draft.products && draft.products.length > 0) {
                    draft.products.forEach((p, idx) => {
                        const tr = document.createElement('tr');
                        tr.className = 'con-product-row';
                        tr.dataset.imageB64 = p.imageB64 || '';
                        const hasImg = !!p.imageB64;

                        tr.innerHTML = `
                            <td class="con-stt" style="text-align:center; font-weight:bold; vertical-align:middle;">${idx + 1}</td>
                            <td class="col-image" style="display:none; text-align:center; vertical-align:middle;">
                                <div style="position:relative; width:60px; height:60px; border:1px dashed #cbd5e1; border-radius:6px; margin:0 auto; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc;">
                                    <span class="img-placeholder" style="font-size:16px; color:#94a3b8; font-weight:bold; ${hasImg ? 'display:none;' : ''}">＋</span>
                                    <img class="con-p-img-preview" src="${p.imageB64 || ''}" style="${hasImg ? 'display:block;' : 'display:none;'} width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;">
                                    <input type="file" class="con-p-img-file" accept="image/*" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;">
                                </div>
                            </td>
                            <td style="vertical-align:middle;">
                                <input type="text" class="con-p-name" value="${p.name || ''}" placeholder="Nhập chi tiết sản phẩm..." style="width:100%;">
                                <textarea class="con-p-desc" style="width:100%; display:none; height:65px; border:1px solid #cbd5e1; border-radius:8px; padding:6px; font-size:13px; font-weight:bold; outline:none; resize:none;" placeholder="- Nhập mô tả sản phẩm (Enter để xuống dòng...)">${p.desc || ''}</textarea>
                            </td>
                            <td style="vertical-align:middle;"><input type="number" class="con-p-qty" value="${p.qty || 1}" min="1" style="width:100%; text-align:center;"></td>
                            <td class="col-retail-price" style="display:none; vertical-align:middle;"><input type="text" class="con-p-retail-price" value="${p.retailPrice || '0'}" style="width:100%; text-align:right;"></td>
                            <td style="vertical-align:middle;"><input type="text" class="con-p-price" value="${p.price || '0'}" style="width:100%; text-align:right;"></td>
                            <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa; vertical-align:middle;">0</td>
                            <td style="text-align:center; vertical-align:middle;"><button class="con-btn-del-row">✖</button></td>
                        `;

                        tr.querySelector('.con-btn-del-row').onclick = () => {
                            if (tbody.querySelectorAll('.con-product-row').length > 1) {
                                tr.remove(); recalculateTotals();
                            } else {
                                alert("⚠️ Phải giữ lại ít nhất 1 sản phẩm!");
                            }
                        };

                        bindRowEvents(tr);
                        tbody.appendChild(tr);
                    });
                }

                toggleFileType();
                recalculateTotals();
            };

            // --- SỰ KIỆN NÚT TẠO MỚI ---
            app.querySelector('#btn-con-new-draft').onclick = () => {
                currentDraftId = "draft_" + Date.now();
                app.querySelector('#con-draft-select').value = "";

                app.querySelector('#con-no').value = "0104-2026 /KD-ĐMX/HĐMB";
                
                app.querySelector('#con-a-name').value = "";
                app.querySelector('#con-a-address').value = "";
                app.querySelector('#con-a-tax').value = "";
                app.querySelector('#con-a-phone').value = "";
                app.querySelector('#con-a-bank-acc').value = "";
                app.querySelector('#con-a-bank-name').value = "";
                app.querySelector('#con-a-rep').value = "";
                app.querySelector('#con-a-role').value = "";
                app.querySelector('#con-a-honor').value = "Ông";
                app.querySelector('#con-print-margin-top').value = "1.8";
                app.querySelector('#con-print-margin-bottom').value = "1.0";

                app.querySelector('#con-q-client-name').value = "";
                app.querySelector('#con-q-client-phone').value = "";
                app.querySelector('#con-q-client-company').value = "";
                app.querySelector('#con-q-client-email').value = "";
                app.querySelector('#con-q-client-address').value = "";
                
                const t = new Date();
                const dStr = `${padZero(t.getDate())}/${padZero(t.getMonth()+1)}/${t.getFullYear()}`;
                app.querySelector('#con-q-date').value = dStr;
                app.querySelector('#con-q-valid-until').value = "";
                app.querySelector('#con-q-client-honor').value = "Anh";

                app.querySelector('#con-discount-name').value = "";
                app.querySelector('#con-discount-val').value = "0";

                tbody.innerHTML = `
                    <tr class="con-product-row">
                        <td class="con-stt" style="text-align:center; font-weight:bold; vertical-align:middle;">1</td>
                        <td class="col-image" style="display:none; text-align:center; vertical-align:middle;">
                            <div style="position:relative; width:60px; height:60px; border:1px dashed #cbd5e1; border-radius:6px; margin:0 auto; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc;">
                                <span class="img-placeholder" style="font-size:16px; color:#94a3b8; font-weight:bold;">＋</span>
                                <img class="con-p-img-preview" style="display:none; width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;">
                                <input type="file" class="con-p-img-file" accept="image/*" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;">
                            </div>
                        </td>
                        <td style="vertical-align:middle;">
                            <input type="text" class="con-p-name" placeholder="Nhập chi tiết sản phẩm..." style="width:100%;">
                            <textarea class="con-p-desc" style="width:100%; display:none; height:65px; border:1px solid #cbd5e1; border-radius:8px; padding:6px; font-size:13px; font-weight:bold; outline:none; resize:none;" placeholder="- Nhập mô tả sản phẩm (Enter để xuống dòng...)"></textarea>
                        </td>
                        <td style="vertical-align:middle;"><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                        <td class="col-retail-price" style="display:none; vertical-align:middle;"><input type="text" class="con-p-retail-price" value="0" style="width:100%; text-align:right;"></td>
                        <td style="vertical-align:middle;"><input type="text" class="con-p-price" placeholder="0" style="width:100%; text-align:right;"></td>
                        <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa; vertical-align:middle;">0</td>
                        <td style="text-align:center; vertical-align:middle;"><button class="con-btn-del-row">✖</button></td>
                    </tr>
                `;
                bindRowEvents(tbody.querySelector('.con-product-row'));
                toggleFileType();
                alert("✨ Đã tạo phiên làm việc trống mới!");
            };

            // --- SỰ KIỆN LƯU THÔNG TIN BẢN NHÁP ---
            const executeSaveDraft = async (silent = false, callback = null) => {
                const btnSaveDraft = app.querySelector('#btn-con-save-draft');
                const origText = btnSaveDraft ? btnSaveDraft.innerText : "💾 Lưu Thông Tin";

                if (!silent && btnSaveDraft) {
                    btnSaveDraft.disabled = true;
                    btnSaveDraft.style.opacity = "0.6";
                    btnSaveDraft.innerText = "⏳ Đang lưu...";
                }

                try {
                    const fileType = app.querySelector('#con-file-type').value;
                    const clientName = fileType === 'quotation' 
                        ? app.querySelector('#con-q-client-name').value.trim() 
                        : app.querySelector('#con-a-name').value.trim();

                    const now = new Date();
                    const labelStr = `${clientName || "Khách mới"} - ${padZero(now.getDate())}/${padZero(now.getMonth()+1)} ${padZero(now.getHours())}h${padZero(now.getMinutes())}`;

                    const draftProducts = [];
                    tbody.querySelectorAll('.con-product-row').forEach((r) => {
                        draftProducts.push({
                            name: r.querySelector('.con-p-name').value.trim(),
                            desc: r.querySelector('.con-p-desc').value.trim(),
                            qty: parseInt(r.querySelector('.con-p-qty').value) || 0,
                            retailPrice: r.querySelector('.con-p-retail-price').value.trim(),
                            price: r.querySelector('.con-p-price').value.trim(),
                            imageB64: r.dataset.imageB64 || ''
                        });
                    });

                    const draftObj = {
                        id: currentDraftId,
                        label: labelStr,
                        fileType: fileType,
                        conNo: app.querySelector('#con-no').value.trim(),
                        dateHd: app.querySelector('#con-date-hd').value.trim(),
                        dateTl: app.querySelector('#con-date-tl').value.trim(),
                        printMarginTop: parseFloat(app.querySelector('#con-print-margin-top').value) || 1.8,
                        printMarginBottom: parseFloat(app.querySelector('#con-print-margin-bottom').value) || 1.0,

                        aName: app.querySelector('#con-a-name').value.trim(),
                        aAddress: app.querySelector('#con-a-address').value.trim(),
                        aTax: app.querySelector('#con-a-tax').value.trim(),
                        aPhone: app.querySelector('#con-a-phone').value.trim(),
                        aBankAcc: app.querySelector('#con-a-bank-acc').value.trim(),
                        aBankName: app.querySelector('#con-a-bank-name').value.trim(),
                        aRep: app.querySelector('#con-a-rep').value.trim(),
                        aRole: app.querySelector('#con-a-role').value.trim(),
                        aHonor: app.querySelector('#con-a-honor').value,

                        qClientName: app.querySelector('#con-q-client-name').value.trim(),
                        qClientPhone: app.querySelector('#con-q-client-phone').value.trim(),
                        qClientCompany: app.querySelector('#con-q-client-company').value.trim(),
                        qClientEmail: app.querySelector('#con-q-client-email').value.trim(),
                        qClientAddress: app.querySelector('#con-q-client-address').value.trim(),
                        qDate: app.querySelector('#con-q-date').value.trim(),
                        qValidUntil: app.querySelector('#con-q-valid-until').value.trim(),
                        qClientHonor: app.querySelector('#con-q-client-honor').value,

                        products: draftProducts,
                        discountName: app.querySelector('#con-discount-name').value.trim(),
                        discountVal: app.querySelector('#con-discount-val').value.trim()
                    };

                    let cloudData = normalizeCloudData(userCfg.shopConfigColL);
                    
                    cloudData.sellerInfo = {
                        name: app.querySelector('#con-b-name').value.trim(),
                        address: app.querySelector('#con-b-address').value.trim(),
                        store: app.querySelector('#con-b-store').value.trim(),
                        tax: app.querySelector('#con-b-tax').value.trim(),
                        phone: app.querySelector('#con-b-phone').value.trim(),
                        bankAcc: app.querySelector('#con-b-bank-acc').value.trim(),
                        bankName: app.querySelector('#con-b-bank-name').value.trim(),
                        rep: app.querySelector('#con-b-rep-hd').value.trim(),
                        role: app.querySelector('#con-b-role-hd').value.trim(),
                        uq: app.querySelector('#con-b-uq').value.trim(),
                        repTl: app.querySelector('#con-b-rep-tl').value.trim(),
                        roleTl: app.querySelector('#con-b-role-tl').value.trim(),
                        honorHd: app.querySelector('#con-b-honor-hd').value,
                        honorTl: app.querySelector('#con-b-honor-tl').value,
                        
                        driveFolderId: app.querySelector('#con-q-drive-folder').value.trim(), 
                        commonPhone: app.querySelector('#con-common-phone').value.trim(),     
                        storeAddress: app.querySelector('#con-store-address').value.trim(),   
                        bSelectVal: app.querySelector('#con-b-select').value                  
                    };

                    let drafts = cloudData.drafts || [];
                    const existingIdx = drafts.findIndex(d => d.id === currentDraftId);
                    if (existingIdx !== -1) {
                        drafts[existingIdx] = draftObj;
                    } else {
                        drafts.unshift(draftObj);
                    }

                    if (drafts.length > 5) {
                        drafts = drafts.slice(0, 5);
                    }
                    cloudData.drafts = drafts;

                    userCfg.shopConfigColL = cloudData;
                    localStorage.setItem('con_shop_config_col_l', JSON.stringify(cloudData));
                    UTILS.savePersistentConfig(userCfg);

                    if (currentUserId) {
                        const res = await fetch(webAppUrl, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain;charset=utf-8" },
                            body: JSON.stringify({
                                action: "saveConfig",
                                user: currentUserId,
                                data: JSON.stringify(cloudData)
                            })
                        });
                        const resData = await safeParseJsonResponse(res);
                        if (resData.status === 'success') {
                            if (!silent) alert("Đã lưu toàn bộ thông tin thành công!");
                            renderDraftDropdown();
                        } else if (!silent) {
                            alert("❌ Lỗi Cloud: " + resData.message);
                        }
                    } else if (!silent) {
                        alert("⚠️ Đã lưu offline! (Không tìm thấy mã User định danh)");
                    }
                } catch (err) {
                    console.warn("Lỗi lưu nháp:", err.message);
                    if (!silent) alert("❌ Lỗi: " + err.message);
                } finally {
                    if (btnSaveDraft) {
                        btnSaveDraft.disabled = false;
                        btnSaveDraft.style.opacity = "1";
                        btnSaveDraft.innerText = origText;
                    }
                    // LUÔN LUÔN GỌI CALLBACK ĐỂ TIẾP TỤC IN PDF
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            };

            app.querySelector('#btn-con-save-draft').onclick = () => {
                executeSaveDraft(false);
            };
            
            // Hàm tính toán tổng tiền
            const recalculateTotals = () => {
                const rows = tbody.querySelectorAll('.con-product-row');
                let grandTotal = 0;

                rows.forEach((row, idx) => {
                    row.querySelector('.con-stt').innerText = idx + 1;

                    const qty = parseInt(row.querySelector('.con-p-qty').value) || 0;
                    const price = UTILS.parseFormattedNumber(row.querySelector('.con-p-price').value) || 0;
                    const total = qty * price;

                    row.querySelector('.con-p-total').innerText = UTILS.formatNumber(total);
                    grandTotal += total;
                });

                const discountVal = UTILS.parseFormattedNumber(app.querySelector('#con-discount-val').value) || 0;
                const finalTotal = Math.max(0, grandTotal - discountVal);

                app.querySelector('#con-final-total').innerText = UTILS.formatNumber(finalTotal);
                app.querySelector('#con-final-words').value = convertNumberToWords(finalTotal) + " đồng chẵn";
            };

            // Gắn sự kiện cho dòng đầu
            const firstRow = tbody.querySelector('.con-product-row');
            bindRowEvents(firstRow);
            firstRow.querySelector('.con-btn-del-row').onclick = () => {
                if (tbody.querySelectorAll('.con-product-row').length > 1) {
                    firstRow.remove(); recalculateTotals();
                } else {
                    alert("⚠️ Phải giữ lại ít nhất 1 sản phẩm!");
                }
            };

            // Nút thêm dòng mới
            app.querySelector('#btn-con-add-row').onclick = () => {
                const rowsCount = tbody.querySelectorAll('.con-product-row').length;
                const tr = document.createElement('tr');
                tr.className = 'con-product-row';
                tr.innerHTML = `
                    <td class="con-stt" style="text-align:center; font-weight:bold; vertical-align:middle;">${rowsCount + 1}</td>
                    <td class="col-image" style="display:none; text-align:center; vertical-align:middle;">
                        <div style="position:relative; width:60px; height:60px; border:1px dashed #cbd5e1; border-radius:6px; margin:0 auto; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc;">
                            <span class="img-placeholder" style="font-size:16px; color:#94a3b8; font-weight:bold;">＋</span>
                            <img class="con-p-img-preview" style="display:none; width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;">
                            <input type="file" class="con-p-img-file" accept="image/*" style="opacity:0; position:absolute; top:0; left:0; width:100%; height:100%; cursor:pointer;">
                        </div>
                    </td>
                    <td style="vertical-align:middle;">
                        <input type="text" class="con-p-name" placeholder="Nhập chi tiết sản phẩm..." style="width:100%;">
                        <textarea class="con-p-desc" style="width:100%; display:none; height:65px; border:1px solid #cbd5e1; border-radius:8px; padding:6px; font-size:13px; font-weight:bold; outline:none; resize:none;" placeholder="- Nhập mô tả sản phẩm (Enter để xuống dòng...)"></textarea>
                    </td>
                    <td style="vertical-align:middle;"><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                    <td class="col-retail-price" style="display:none; vertical-align:middle;"><input type="text" class="con-p-retail-price" value="0" style="width:100%; text-align:right;"></td>
                    <td style="vertical-align:middle;"><input type="text" class="con-p-price" placeholder="0" style="width:100%; text-align:right;"></td>
                    <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa; vertical-align:middle;">0</td>
                    <td style="text-align:center; vertical-align:middle;"><button class="con-btn-del-row">✖</button></td>
                `;

                tr.querySelector('.con-btn-del-row').onclick = () => {
                    tr.remove(); recalculateTotals();
                };

                bindRowEvents(tr);
                tbody.appendChild(tr);
                
                const fileType = app.querySelector('#con-file-type').value;
                tr.querySelectorAll('.col-image, .col-retail-price').forEach(el => el.style.display = fileType === 'quotation' ? 'table-cell' : 'none');
                tr.querySelector('.con-p-desc').style.display = fileType === 'quotation' ? 'block' : 'none';
                tr.querySelector('.con-p-name').style.display = fileType === 'quotation' ? 'none' : 'block';
            };

            app.querySelector('#con-discount-val').oninput = (e) => {
                e.target.value = UTILS.formatInputNumber(e.target.value.replace(/[^0-9]/g, ''));
                recalculateTotals();
            };

            recalculateTotals();

            // --- TẠO FILE IN PDF CHUYÊN NGHIỆP ---
            app.querySelector('#btn-con-generate').onclick = () => {
                const docType = app.querySelector('#con-file-type').value;
                const conNo = app.querySelector('#con-no').value.trim();
                const dateHd = app.querySelector('#con-date-hd').value.trim();
                const dateTl = app.querySelector('#con-date-tl').value.trim();
                const storeAddress = app.querySelector('#con-store-address').value.trim();

                const aName = app.querySelector('#con-a-name').value.trim();
                const aAddress = app.querySelector('#con-a-address').value.trim();
                const aTax = app.querySelector('#con-a-tax').value.trim();
                const aPhone = app.querySelector('#con-a-phone').value.trim();
                const aBankAcc = app.querySelector('#con-a-bank-acc').value.trim();
                const aBankName = app.querySelector('#con-a-bank-name').value.trim();
                const aRep = app.querySelector('#con-a-rep').value.trim();
                const aRole = app.querySelector('#con-a-role').value.trim();
                const aHonor = app.querySelector('#con-a-honor').value; 

                const bName = app.querySelector('#con-b-name').value.trim();
                const bAddress = app.querySelector('#con-b-address').value.trim();
                const bStore = app.querySelector('#con-b-store').value.trim();
                const bTax = app.querySelector('#con-b-tax').value.trim();
                const bPhone = app.querySelector('#con-b-phone').value.trim();
                const bBankAcc = app.querySelector('#con-b-bank-acc').value.trim();
                const bBankName = app.querySelector('#con-b-bank-name').value.trim();
                
                const bRepHd = app.querySelector('#con-b-rep-hd').value.trim();
                const bRoleHd = app.querySelector('#con-b-role-hd').value.trim();
                const bUq = app.querySelector('#con-b-uq').value.trim();
                const bRepTl = app.querySelector('#con-b-rep-tl').value.trim();
                const bRoleTl = app.querySelector('#con-b-role-tl').value.trim();
                const bHonorHd = app.querySelector('#con-b-honor-hd').value;
                const bHonorTl = app.querySelector('#con-b-honor-tl').value;

                const marginTop = parseFloat(app.querySelector('#con-print-margin-top').value) || 1.8;
                const marginBottom = parseFloat(app.querySelector('#con-print-margin-bottom').value) || 1.0;
                const commonPhone = app.querySelector('#con-common-phone').value.trim();

                if (docType !== 'quotation') {
                    if (!dateHd || !dateTl) { alert("⚠️ Vui lòng nhập đầy đủ ngày tháng ký hợp đồng và nghiệm thu!"); return; }
                    if (!aName || !bName) { alert("⚠️ Vui lòng nhập đầy đủ thông tin hai bên Mua & Bán!"); return; }
                } else {
                    const qClientName = app.querySelector('#con-q-client-name').value.trim();
                    if (!qClientName) { alert("⚠️ Vui lòng nhập đầy đủ tên Khách hàng!"); return; }
                }

                const btnGenerate = app.querySelector('#btn-con-generate');
                const origGenText = btnGenerate.innerText;

                btnGenerate.disabled = true;
                btnGenerate.innerText = "⏳ Đang tự động lưu nháp...";

                const proceedWithPrinting = () => {
                    btnGenerate.disabled = false;
                    btnGenerate.innerText = origGenText;

                    const products = [];
                    tbody.querySelectorAll('.con-product-row').forEach((r, idx) => {
                        products.push({
                            stt: idx + 1,
                            name: r.querySelector('.con-p-name').value.trim() || 'Sản phẩm ' + (idx + 1),
                            qty: parseInt(r.querySelector('.con-p-qty').value) || 0,
                            price: UTILS.parseFormattedNumber(r.querySelector('.con-p-price').value) || 0
                        });
                    });

                    const discountName = app.querySelector('#con-discount-name').value.trim();
                    const discountValue = UTILS.parseFormattedNumber(app.querySelector('#con-discount-val').value) || 0;
                    const finalTotal = UTILS.parseFormattedNumber(app.querySelector('#con-final-total').innerText) || 0;
                    const finalWords = app.querySelector('#con-final-words').value;

                    const getBrandName = (storeName) => {
                        if (!storeName) return "Thế giới Di động";
                        const firstChar = storeName.trim().charAt(0).toUpperCase();
                        if (firstChar === 'Đ') return "Điện máy Xanh";
                        if (firstChar === 'A') return "Topzone";
                        return "Thế giới Di động";
                    };

                    let printHtml = `
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <title>Kết xuất báo cáo PDF - AutoBI</title>
                            <style>
                            @page {
                                size: A4;
                                margin-top: ${marginTop}cm;
                                margin-bottom: ${marginBottom}cm;
                                margin-left: 2cm;
                                margin-right: 1.5cm;
                            }
                            @media print {
                                html, body {
                                    background-color: #ffffff !important;
                                    background: #ffffff !important;
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                .page-container { 
                                    width: 100% !important; 
                                    min-height: auto !important; 
                                    box-sizing: border-box !important;
                                    display: block !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    background: transparent !important;
                                    font-size: 10pt !important;
                                    line-height: 1.3 !important;
                                    position: static !important;
                                }
                                .page-content {
                                    padding-bottom: 0 !important;
                                }
                                .print-footer {
                                    position: fixed !important;
                                    bottom: 0.8cm !important; 
                                    left: 2cm !important;
                                    right: 1.5cm !important;
                                    border-top: 1px solid black !important;
                                    padding-top: 5px !important;
                                    font-size: 9.5pt !important;
                                    font-weight: bold !important;
                                    background: #fff !important;
                                    display: flex !important;
                                    justify-content: space-between !important;
                                    height: auto !important;
                                    z-index: 9999;
                                }
                                .print-footer .page-num::after {
                                    content: counter(page);
                                }
                                .info-table td, .prod-table th, .prod-table td {
                                    padding: 4px 6px !important;
                                }
                                .section-title {
                                    margin-top: 8px !important;
                                    margin-bottom: 3px !important;
                                }
                                p, div {
                                    margin-top: 3px !important;
                                    margin-bottom: 3px !important;
                                }
                                .prod-table {
                                    page-break-inside: auto !important;
                                }
                                .prod-table tr {
                                    page-break-inside: avoid !important;
                                    page-break-after: auto !important;
                                }
                                .prod-table thead {
                                    display: table-row-group !important;
                                }
                                .avoid-break {
                                    page-break-inside: avoid !important;
                                }
                                .page-break {
                                    page-break-before: always !important;
                                    height: 0 !important;
                                    margin: 0 !important;
                                    border: none !important;
                                }
                            }
                            body { 
                                font-family: "Times New Roman", Times, serif;
                                font-size: 11pt; 
                                line-height: 1.35; 
                                color: #000; 
                                background: #f0f2f5; 
                                padding: 20px; 
                                margin: 0; 
                            }
                            .page-container { 
                                width: 21cm; 
                                min-height: 29.7cm; 
                                box-sizing: border-box;
                                background: #fff; 
                                padding: 1.8cm 1.5cm 2.2cm 2cm; 
                                margin: 0 auto 30px auto; 
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                                display: block;
                                position: relative;
                            }
                            .print-footer { 
                                display: none;
                            }
                            .page-break {
                                border-top: 1px dashed #cbd5e1;
                                margin: 40px 0;
                                height: 1px;
                            }
                            .doc-title { text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; }
                            .doc-subtitle { text-align: center; font-size: 11pt; margin-bottom: 15px; }
                            .section-title { font-weight: bold; margin-top: 12px; margin-bottom: 5px; text-transform: uppercase; }
                            
                            .info-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
                            .info-table td { border: none; padding: 5px 8px; vertical-align: top; }
                            
                            .prod-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
                            .prod-table th, .prod-table td { border: 1px solid black; padding: 6px 8px; }
                            .prod-table th { text-align: center; font-weight: bold; background-color: #f2f2f2; }
                            
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .bold { font-weight: bold; }
                            .italic { font-style: italic; }
                            .red-text { color: red !important; }
                            </style>
                        </head>
                        <body>
                    `;

                    // ==================== TRANG 1: HỢP ĐỒNG MUA BÁN ====================
                    if (docType === 'contract') {
                        let totalBeforeDisc = products.reduce((sum, p) => sum + (p.qty * p.price), 0);
                        let productRowsHtml = products.map(p => `
                            <tr>
                                <td class="text-center">${p.stt}</td>
                                <td>${p.name}</td>
                                <td class="text-center">${p.qty}</td>
                                <td class="text-right">${UTILS.formatNumber(p.price)}</td>
                                <td class="text-right">${UTILS.formatNumber(p.qty * p.price)}</td>
                            </tr>
                        `).join('');

                        let discountRowHtml = '';
                        if (discountValue > 0) {
                            discountRowHtml = `
                                <tr>
                                    <td colspan="4" class="bold text-right">${discountName || 'Chiết khấu / Giảm giá'}:</td>
                                    <td class="text-right bold" style="color:red;">-${UTILS.formatNumber(discountValue)}</td>
                                </tr>
                            `;
                        }

                        printHtml += `
                            <div class="page-container">
                                <div class="page-content">
                                    <div style="text-align: center; font-weight: bold; font-size: 16pt; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;">
                                        HỢP ĐỒNG MUA BÁN
                                    </div>
                                    <div style="text-align: center; font-size: 11.5pt; margin-bottom: 15px;">
                                        Số./No.: ${conNo}
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">Hôm nay, ngày ${dateHd} (“Ngày Ký”), chúng tôi gồm có:</div>

                                    <table class="info-table">
                                        <tr>
                                            <td colspan="3" class="bold" style="background-color:#f2f2f2;">BÊN MUA (BÊN A): ${aName}</td>
                                        </tr>
                                        <tr>
                                            <td style="width: 25%; font-weight: bold;">Trụ sở đăng ký</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${aAddress}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Mã số thuế</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${aTax}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Điện thoại – Fax</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${aPhone}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Số tài khoản</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${aBankAcc}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Tại ngân hàng</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${aBankName}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Đại diện bởi</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>
                                                <div class="bold">${aHonor}: ${aRep}</div>
                                                <div>Chức vụ : ${aRole}</div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colspan="3" class="bold" style="background-color:#f2f2f2;">BÊN BÁN (BÊN B): ${bName}</td>
                                        </tr>
                                        <tr>
                                            <td style="width: 25%; font-weight: bold;">Trụ sở đăng ký</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bAddress}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Tên Siêu Thị</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bStore}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Mã số thuế</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bTax}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Điện thoại – Fax</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bPhone}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Số tài khoản</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bBankAcc}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Tại ngân hàng</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>${bBankName}</td>
                                        </tr>
                                        <tr>
                                            <td style="font-weight: bold;">Đại diện bởi</td>
                                            <td style="text-align: center; font-weight: bold;">:</td>
                                            <td>
                                                <div class="bold">${bHonorHd}: ${bRepHd}</div>
                                                <div class="bold">Chức vụ: ${bRoleHd}</div>
                                                <div class="italic">(${bUq})</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="margin-top: 10px; margin-bottom: 10px;">Sau khi bàn bạc, hai bên thống nhất ký kết Hợp Đồng Mua Bán này (“Hợp Đồng”) với các điều khoản sau:</div>

                                    <div class="bold">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</div>
                                    <div style="text-align: justify; margin-bottom: 10px;">
                                        1.1 Bên B đồng ý bán và Bên A đồng ý mua sản phẩm của Bên B với chủng loại, tính năng kỹ thuật và giá cả cụ thể như sau (Sau đây gọi tắt là “Sản Phẩm”):
                                    </div>

                                    <table class="prod-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 6%;">STT</th>
                                                <th style="width: 50%;">Tên Sản Phẩm</th>
                                                <th style="width: 10%;">Số Lượng</th>
                                                <th style="width: 17%;">Đơn Giá (VND) - Đã bao gồm thuế VAT 8%</th>
                                                <th style="width: 17%;">Thành Tiền (VND) - Đã bao gồm 8% VAT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productRowsHtml}
                                            <tr class="bold" style="background:#f2f2f2;">
                                                <td colspan="4" class="text-right">Tổng tiền (bao gồm VAT 8%)</td>
                                                <td class="text-right">${UTILS.formatNumber(finalTotal)}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div class="bold" style="margin-bottom: 10px;">Tổng giá bằng chữ: ${finalWords}</div>

                                    <div style="text-align: justify; font-size: 10.5pt; margin-bottom: 15px;">
                                        1.2 Tổng tiền mà Bên A phải thanh toán cho Bên B theo quy định tại Điều 1.1 (“Giá Sản Phẩm”) là chi phí cố định không thay đổi trong suốt quá trình thực hiện Hợp Đồng và chưa bao gồm phần chi phí vật tư và/hoặc các chi phí khác phát sinh khi lắp đặt (nếu có). Các chi phí phát sinh này được quy định tại website: <b>https://www.dienmayxanh.com/kinh-nghiem-hay/chinh-sach-giao-hang-lap-dat-1261528</b> vào thời điểm lắp đặt.
                                    </div>

                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        1.3 Giá Sản Phẩm được Bên A thanh toán cho Bên B theo quy định tại Điều 3 Hợp Đồng này. Chi phí vật tư và/hoặc chi phí khác phát sinh khi lắp đặt sẽ được thanh toán bằng tiền mặt/chuyển khoản ngay khi Bên B lắp đặt cho Bên A hoàn tất.<br><br>
                                        1.4 Trường hợp Sản Phẩm cần lắp đặt thì Bên A chịu trách nhiệm chuẩn bị các thiết bị sau và điểm chờ đấu nối cụ thể:<br>
                                        a. Điểm lắp đặt cao trên 4m (tính từ sàn) thì Bên A tự chuẩn bị thang phù hợp hoặc dàn giáo.<br>
                                        b. Liên quan đến thiết bị cần cấp và thoát nước, Bên A cần phải có ống âm chờ cấp vào máy và ra các thiết bị sẵn tại vị trí lắp máy (Đầu chờ nước cấp, đầu ra nóng, Bộ pha nước ra nóng lạnh, ống thoát nước, v.v.).
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 2: THỜI GIAN VÀ ĐIỀU KIỆN GIAO HÀNG</div>
                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        2.1 Thời gian giao hàng: Bên B thực hiện giao Hàng hóa trong vòng ba (03) ngày kể từ ngày Bên B được Ngân hàng báo có đúng, đầy đủ Giá Sản Phẩm vào tài khoản ngân hàng của Bên B. Trường hợp ngày Ngân hàng báo có rơi vào thứ bảy, chủ nhật hoặc ngày nghỉ Lễ, Tết theo quy định pháp luật thì thời hạn bắt đầu được tính từ ngày làm việc tiếp theo hoặc theo thông báo của Bên B (tùy trường hợp).<br><br>
                                        2.2 Địa điểm giao hàng: ${aAddress}
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 3: THANH TOÁN</div>
                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        3.1 Bên A sẽ thanh toán 100% Giá Sản Phẩm cho Bên B bằng cách chuyển khoản vào tài khoản ngân hàng của Bên B sau khi Hợp Đồng được ký kết. Thông tin tài khoản ngân hàng của Bên B:<br>
                                        <div style="margin-left: 20px;">
                                            - Chủ tài khoản: <b>CÔNG TY CỔ PHẦN ĐẦU TƯ ĐIỆN MÁY XANH</b><br>
                                            - Số tài khoản: <b>${bBankAcc}</b><br>
                                            - Tại ngân hàng: <b>${bBankName}</b>
                                        </div><br>
                                        3.2 Xuất hóa đơn:<br>
                                        a. Giao hàng khu vực Hồ Chí Minh: Bên B trực tiếp giao hàng và xuất hóa đơn cho Bên A.<br>
                                        b. Giao hàng ở tỉnh: Bên B ủy quyền cho Chi nhánh của Bên B tại các tỉnh giao hàng và xuất hóa đơn cho Bên A.
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 4: CHÍNH SÁCH BẢO HÀNH, ĐỔI, TRẢ SẢN PHẨM VÀ HOÀN TIỀN</div>
                                    <div style="text-align: justify; font-size: 10.5pt; margin-bottom: 15px;">
                                        4.1 Sản Phẩm do Bên B cung cấp sẽ được bảo hành theo tiêu chuẩn của nhà sản xuất hoặc nhà phân phối. Sản phẩm sẽ được kích hoạt bảo hành ngay tại thời điểm Bên B xuất hóa đơn VAT cho Bên A.<br>
                                        4.2 chính sách bảo hành của nhà sản xuất hoặc nhà phân phối được đính kèm theo sản phẩm hoặc có thể tham khảo tại website của nhà sản xuất hoặc nhà phân phối.<br>
                                        4.3 Nếu sản phẩm có áp dụng chính sách đổi trả hoặc hoàn tiền của Bên B vui lòng xem chính sách tại website https://www.dienmayxanh.com/bao-hanh-doi-tra (hoặc https://www.thegioididong.com/chinh-sach-bao-hanh-san-pham áp dụng tùy từng loại sản phẩm). Bên B bảo lưu quyền thay đổi các chính sách này tại từng thời điểm và không cần sự chấp thuận của Bên A.<br>
                                        4.4 Cho mục đích bảo hành hoặc khiếu nại về Sản Phẩm Bên A liên hệ số điện thoại như được công khai tại website https://www.dienmayxanh.com/ hoặc https://www.thegioididong.com/.
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 5: NGHĨA VỤ CỦA CÁC BÊN</div>
                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        5.1 Nghĩa vụ của Bên A:<br>
                                        a. Cam kết không tiết lộ cho bên thứ ba bất kỳ thông tin nào có liên quan đến việc thực hiện Hợp đồng này.<br>
                                        b. Thanh toán cho Bên B Giá Sản Phẩm và chi phí vật tư đúng và đầy đủ theo quy định Hợp Đồng này.<br>
                                        c. Bên A đồng ý với chính sách thu thập thông tin và xử lý dữ liệu của Bên B theo các điều khoản và điều kiện đã được quy định tại website https://www.dienmayxanh.com/ hoặc https://www.thegioididong.com/.
                                        d. Thực hiện đúng các cam kết được ghi trong Hợp Đồng này.<br><br>
                                        5.2 Nghĩa vụ của Bên B:<br>
                                        a. Đảm bảo cung cấp Sản Phẩm mới 100%, đúng với quy cách, giá cả, thời gian giao hàng theo cam kết tại Điều 1 and Điều 2 Hợp Đồng này.<br>
                                        b. Cam kết không tiết lộ cho bên thứ ba bất kỳ thông tin nào có liên quan đến việc thực hiện Hợp đồng này.<br>
                                        c. Thực hiện đúng các cam kết được ghi trong Hợp Đồng này.
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 6: THỜI HẠN HỢP ĐỒNG</div>
                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        Hợp Đồng này tự động chấm dứt trong trường hợp sau:<br>
                                        6.1 Bên A không thực hiện nghĩa vụ thanh toán trong vòng 10 (mười) ngày làm việc kể từ Ngày Ký thì xem như Bên A không có nhu cầu mua hàng và Bên B không có nghĩa vụ giữ giá, hàng hóa cho Bên A. Khi đó, Hợp Đồng tự động chấm dứt. Trường hợp Bên A tiếp tục mua hàng thì Hai Bên phải ký lại Hợp Đồng mới; hoặc<br>
                                        6.2 Bên A đã thực hiện nghĩa vụ thanh toán: Hợp đồng này tự động chấm dứt sau khi Hai Bên hoàn thành các nghĩa vụ quy định tại Hợp Đồng. Riêng các điều khoản về bảo hành vẫn có hiệu lực cho đến khi hết thời hạn bảo hành theo quy định của nhà sản xuất hoặc nhà phân phối.
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 7: CAM KẾT CHỐNG THAM NHŨNG</div>
                                    <div style="text-align: justify; margin-bottom: 15px;">
                                        7.1 Các bên cam kết tuân thủ luật pháp chống tham nhũng, không tham gia bất kỳ hành vi hối lộ, gian lận, tặng quà hoặc gợi ý tặng quà dưới bất kỳ hình thức nào cho nhân viên của bên kia nhằm đạt được lợi ích quá trình thực hiện hợp đồng. Nếu phát hiện vi phạm, bên bị vi phạm có quyền chấm dứt hợp đồng ngay lập tức, và bên vi phạm phải bồi thường mọi thiệt hại phát sinh.<br>
                                        7.2 Bên Mua chỉ thanh toán số tiền đã được các bên thống nhất trong hợp đồng hoặc các văn bản thanh toán liên quan. Bên Mua chỉ thanh toán vào tài khoản của Bên Bán như trên và không được thanh toán vào bất kỳ tài khoản cá nhân/tổ chức nào khác.
                                    </div>

                                    <div class="bold" style="margin-top: 15px;">ĐIỀU 8: CAM KẾT CHUNG</div>
                                    <div style="text-align: justify; margin-bottom: 30px;">
                                        8.1 Hai Bên cam kết thực hiện đúng những điều ghi trên Hợp Đồng này. Mọi sự thay đổi trong Hợp Đồng này phải lập phụ lục hợp đồng và phải có chữ ký xác nhận của cả Hai Bên. Nếu một trong Hai Bên cố ý vi phạm các điều khoản của Hợp Đồng này sẽ phải chịu trách nhiệm về các hành vi vi phạm đó.<br>
                                        8.2 Trong trường hợp xảy ra tranh chấp, hai bên cố gắng cùng nhau bàn bạc các biện pháp giải quyết trên tinh thần hòa giải, có thiện chí và hợp tác. Nếu vẫn không thể thống nhất cách giải quyết thì hai bên sẽ đưa vụ việc ra Tòa án có thẩm quyền giải quyết, toàn bộ chi phí xét xử do bên thua chịu.<br>
                                        8.3 Hợp đồng này được lập thành 02 (hai) bản, mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.
                                    </div>

                                    <div class="avoid-break">
                                        <table style="width:100%; border:none; margin-top:40px;">
                                            <tr style="border:none;">
                                                <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">
                                                    Đại Diện Bên A<br><br><br><br><br><br>
                                                    <div style="font-weight: normal; text-align: left; padding-left: 20px;">
                                                        <b>Bởi:</b> ${aName}<br>
                                                        <b>${aHonor} :</b> ${aRep}<br>
                                                        <b>Chức vụ:</b> ${aRole}
                                                    </div>
                                                </td>
                                                <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">
                                                    Đại Diện Bên B<br><br><br><br><br><br>
                                                    <div style="font-weight: normal; text-align: left; padding-left: 20px;">
                                                        <b>Bởi:</b> ${bName}<br>
                                                        <b>${bHonorHd} :</b> ${bRepHd}<br>
                                                        <b>Chức vụ:</b> ${bRoleHd.toUpperCase()}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="print-footer">
                                <span>Pháp Chế_111124_ĐMX_VN</span>
                                <span class="page-num"></span>
                            </div>
                        `;
                    }

                    // ==================== TRANG 2: BIÊN BẢN NGHIỆM THU & THANH LÝ ====================
                    if (docType === 'liquidation') {
                        let handoverProductsHtml = products.map(p => `
                            <tr>
                                <td class="text-center red-text">${padZero(p.stt)}</td>
                                <td>${p.name}</td>
                                <td class="text-center red-text bold">${padZero(p.qty)}</td>
                            </tr>
                        `).join('');

                        printHtml += `
                            <div class="page-container" style="font-family: 'Times New Roman', serif;">
                                <div class="page-content">
                                    <div>
                                        <div style="text-align: center; font-size: 14pt; font-weight: bold;">
                                            BIÊN BẢN NGHIỆM THU, GIAO NHẬN HÀNG HÓA
                                        </div>
                                        <div class="text-center red-text" style="font-weight: bold; font-size: 11pt; margin-top: 4px;">
                                            Số: ${conNo.replace('/HĐMB', '')}-/BBNT
                                        </div>
                                        <div class="text-center red-text italic" style="font-size: 11.5pt; margin-top: 5px;">
                                            Căn cứ Hợp đồng số ${conNo}
                                        </div>
                                        <div style="margin-left: 15px; font-size: 11.5pt; margin-top: 10px;">
                                            - Căn cứ việc giao nhận hàng hóa, sản phẩm hoàn thành.
                                        </div>
                                        <div class="red-text italic" style="margin-left: 15px; font-weight: bold; margin-top: 5px;">
                                            Hôm nay, ${formatVietnameseDate(dateTl)}
                                        </div>

                                        <div style="margin-top: 15px;">
                                            <span class="bold red-text">Bên A :</span> <span class="bold">${aName}</span><br>
                                            <div style="margin-left: 20px; line-height: 1.5;">
                                                <span class="red-text">- Địa chỉ :</span> ${aAddress}<br>
                                                <span class="red-text">- Đại diện là:</span> <span class="bold">${aRep}</span><br>
                                                <span class="red-text">- Chức vụ:</span> Giám đốc
                                            </div>
                                        </div>

                                        <div style="margin-top: 15px;">
                                            <span class="bold">Bên B :</span> <span class="bold">${bName}</span><br>
                                            <div style="margin-left: 20px; line-height: 1.5;">
                                                <span class="red-text">- Địa chỉ :</span> <span class="red-text">${bStore.split(' - ')[1] || bAddress}</span><br>
                                                <span class="red-text">- Đại diện là:</span> <span class="bold red-text">${bHonorTl}: ${bRepTl}</span><br>
                                                <span class="red-text">- Chức vụ:</span> ${bRoleTl}
                                            </div>
                                        </div>

                                        <div style="margin-top: 15px; margin-bottom: 10px;">
                                            Tiến hành bàn giao hàng hóa, sản phẩm/Dịch vụ như sau: Bên B giao cho bên A:
                                        </div>

                                        <table class="prod-table">
                                            <thead>
                                                <tr class="red-text">
                                                    <th style="width: 10%; color: red;">STT</th>
                                                    <th style="width: 70%; color: red; text-align: left;">Mô tả hàng hóa</th>
                                                    <th style="width: 20%; color: red;">Số lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${handoverProductsHtml}
                                            </tbody>
                                        </table>

                                        <div style="text-align: justify; margin-top: 20px; line-height: 1.4;">
                                            Hai bên xác nhận số hàng hóa, sản phẩm trên đã được giao nhận đầy đủ và đúng theo yêu cầu và sẽ lập biên bản thanh lý hợp đồng này sau khi biên bản giao nhận được lập.<br><br>
                                            Biên bản được làm thành 2 bản, có giá trị như nhau. Mỗi bên giữ 1 bản.
                                        </div>

                                        <div class="avoid-break">
                                            <table style="width:100%; border:none; margin-top:40px;">
                                                <tr style="border:none;">
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN A</td>
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN B</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>

                                    <div class="page-break"></div>

                                    <div>
                                        <div style="text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase;">
                                            BIÊN BẢN THANH LÝ HỢP ĐỒNG
                                        </div>
                                        <div class="text-center" style="font-weight: bold; font-size: 11pt; margin-top: 4px;">
                                            Số: ${conNo.replace('HĐMB', 'BBTL')}
                                        </div>

                                        <div style="margin-left: 15px; margin-top: 20px; line-height: 1.5;">
                                            <span class="red-text">- Căn cứ Hợp đồng số ${conNo}</span><br>
                                            <span>- Căn cứ Biên bản giao nhận hàng hóa, sản phẩm/dịch vụ ngày:</span><br>
                                            <span class="red-text">- Hôm nay ngày ${formatVietnameseDateCapital(dateTl)}.</span>
                                        </div>

                                        <div style="margin-top: 20px; margin-bottom: 20px;">
                                            <div class="bold" style="text-decoration: underline; margin-bottom: 5px;">BÊN MUA (BÊN A): ${aName}</div>
                                            <table style="width: 100%; border:none;">
                                                <tr style="border:none;"><td style="width:25%; border:none; padding:2px 0;"><b>Trụ sở đăng ký</b></td><td style="width:2%; border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0;">${aAddress}</td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Mã số thuế</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0;">${aTax}</td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Đại diện bởi</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0;"><b>${aRep}</b></td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Chức vụ</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0;">Giám đốc</td></tr>
                                            </table>
                                        </div>

                                        <div style="margin-top: 15px; margin-bottom: 25px;">
                                            <div class="bold" style="text-decoration: underline; margin-bottom: 5px;">BÊN BÁN (BÊN B): ${bName}</div>
                                            <table style="width: 100%; border:none;">
                                                <tr style="border:none;"><td style="width:25%; border:none; padding:2px 0; color:red;"><b>Trụ sở đăng ký</b></td><td style="width:2%; border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>${bAddress}</b></td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0; color:red;"><b>Siêu thị bán hàng</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>${bStore}</b></td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Mã số thuế</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0;"><span style="color:red; font-weight:bold;">${bTax}</span></td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Đại diện bởi</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>${bHonorTl}: ${bRepTl}</b></td></tr>
                                                <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Chức vụ</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>Giám Đốc Vùng</b></td></tr>
                                            </table>
                                        </div>

                                        <div style="margin-bottom: 15px;">Hai bên thống nhất thỏa thuận nội dung thanh lý hợp đồng như sau:</div>

                                        <div class="bold">Điều 1: Nội dung giao dịch</div>
                                        <div style="margin-left: 20px; margin-bottom: 15px; line-height: 1.5;">
                                            1.1 Bên A đã nhận đủ số lượng hàng hóa, sản phẩm/dịch vụ theo hợp đồng đã ký<br>
                                            1.2 Chất lượng và Quy cách hàng hóa, sản phẩm : đảm bảo đạt yêu cầu<br>
                                            1.3 Bên A đã nhận hóa đơn do bên B xuất theo quy định
                                        </div>

                                        <div class="bold">Điều 2: Giá trị thanh lý :</div>
                                        <div style="margin-left: 20px; margin-bottom: 25px; line-height: 1.5;">
                                            <span class="red-text">2.1 Tổng giá trị thanh lý : ${UTILS.formatNumber(finalTotal)} đồng (${finalWords}).</span><br>
                                            <span class="red-text">2.2 Thời gian thanh toán : Trước khi bên B giao hàng</span>
                                        </div>

                                        <div style="margin-bottom: 30px;">
                                            Thanh lý hợp đồng này được làm thành 2 bản, có giá trị như nhau. Mỗi bên giữ 1 bản.
                                        </div>

                                        <div class="avoid-break">
                                            <table style="width:100%; border:none; margin-top:40px;">
                                                <tr style="border:none;">
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN A</td>
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN B</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="print-footer" style="font-family: 'Times New Roman', serif;">
                                    <span style="font-weight: bold; color: #111;">dienmayxanh</span>
                                    <span class="page-num"></span>
                                </div>
                            </div>
                        `;
                    }

                    // ==================== TRANG 3: BẢNG BÁO GIÁ ====================
                    if (docType === 'quotation') {
                        const qClientName = app.querySelector('#con-q-client-name').value.trim();
                        const qClientPhone = app.querySelector('#con-q-client-phone').value.trim();
                        const qClientCompany = app.querySelector('#con-q-client-company').value.trim();
                        const qClientEmail = app.querySelector('#con-q-client-email').value.trim();
                        const qClientAddress = app.querySelector('#con-q-client-address').value.trim();
                        const qDate = app.querySelector('#con-q-date').value.trim();
                        const qValidUntil = app.querySelector('#con-q-valid-until').value.trim();
                        const qClientHonor = app.querySelector('#con-q-client-honor').value;

                        const quoteProducts = [];
                        tbody.querySelectorAll('.con-product-row').forEach((r, idx) => {
                            quoteProducts.push({
                                stt: idx + 1,
                                img: r.dataset.imageB64 || '',
                                desc: r.querySelector('.con-p-desc').value.trim() || '',
                                qty: parseInt(r.querySelector('.con-p-qty').value) || 0,
                                retailPrice: UTILS.parseFormattedNumber(r.querySelector('.con-p-retail-price').value) || 0,
                                price: UTILS.parseFormattedNumber(r.querySelector('.con-p-price').value) || 0,
                                total: (parseInt(r.querySelector('.con-p-qty').value) || 0) * (UTILS.parseFormattedNumber(r.querySelector('.con-p-price').value) || 0)
                            });
                        });

                        let quoteRowsHtml = quoteProducts.map(p => {
                            const formattedDesc = p.desc.replace(/\n/g, '<br>');
                            const imgHtml = p.img ? `<img src="${p.img}" style="max-width: 65px; max-height: 65px; object-fit: contain;">` : '<span style="color:#ccc; font-size:9px;">Chưa chọn hình</span>';
                            return `
                                <tr>
                                    <td class="text-center" style="vertical-align: middle; padding: 4px;">${imgHtml}</td>
                                    <td style="text-align: left; vertical-align: top; line-height: 1.4; color: red; font-size: 10pt; font-weight: bold; padding: 6px;">${formattedDesc}</td>
                                    <td class="text-center" style="vertical-align: middle; color: red; font-weight: bold; font-size: 10.5pt; padding: 4px;">${p.qty}</td>
                                    <td class="text-right" style="vertical-align: middle; color: red; font-size: 10.5pt; padding: 4px;">${UTILS.formatNumber(p.retailPrice)}</td>
                                    <td class="text-right" style="vertical-align: middle; color: red; font-weight: bold; font-size: 10.5pt; padding: 4px;">${UTILS.formatNumber(p.price)}</td>
                                    <td class="text-right" style="vertical-align: middle; font-weight: bold; font-size: 10.5pt; padding: 4px;">${UTILS.formatNumber(p.total)}</td>
                                </tr>
                            `;
                        }).join('');

                        printHtml += `
                            <div class="page-container">
                                <div class="page-content" style="font-family: 'Times New Roman', Times, serif;">
                                    <table style="width: 100%; border: none; margin-bottom: 15px;">
                                        <tr style="border: none;">
                                            <td style="width: 60%; text-align: left; vertical-align: top; border: none; padding: 0; line-height: 1.45;">
                                                <div style="font-weight: 900; font-size: 12.5pt; text-transform: uppercase;">CHI NHÁNH CÔNG TY CỔ PHẦN ĐẦU TƯ</div>
                                                <div style="font-weight: 900; font-size: 12.5pt; text-transform: uppercase; margin-bottom: 5px;">ĐIỆN MÁY XANH</div>
                                                <div style="font-size: 9.5pt; color: red; font-weight: bold;">Địa chỉ: ${storeAddress}</div>
                                                <div style="font-size: 9.5pt; font-weight: bold;">Điện thoại: ${bPhone}</div>
                                                <div style="font-size: 9.5pt; color: red; font-weight: bold;">Mã số thuế: ${bTax}</div>
                                            </td>
                                            <td style="width: 40%; text-align: right; vertical-align: top; border: none; padding: 0;">
                                                <img src="https://lh3.googleusercontent.com/d/1LSP7koB6KSVG4oUn3jh42ysdTEp92NT4" style="height: 48px; object-fit: contain;">
                                            </td>
                                        </tr>
                                    </table>

                                    <table style="width: 100%; border: none; margin-bottom: 12px;">
                                        <tr style="border: none;">
                                            <td style="width: 58%; text-align: left; vertical-align: top; border: none; padding: 0;">
                                                <div style="background-color: #000; color: #fff; font-weight: bold; font-size: 9.5pt; padding: 4px 10px; text-transform: uppercase; display: inline-block; margin-bottom: 8px;">Kính gửi Quý khách:</div>
                                                <table style="width: 100%; border: none;">
                                                    <tr style="border: none;"><td style="width: 25%; font-weight: bold; border: none; padding: 2px 0; font-size: 9.5pt;">${qClientHonor}:</td><td style="border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">${qClientName}</td></tr>
                                                    <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">Điện thoại:</td><td style="border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">${qClientPhone}</td></tr>
                                                    <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">Tên công ty:</td><td style="border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">${qClientCompany}</td></tr>
                                                    <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">Email:</td><td style="border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">${qClientEmail}</td></tr>
                                                    <tr style="border: none;"><td style="font-weight: bold; border: none; padding: 2px 0; font-size: 9.5pt;">Địa chỉ:</td><td style="border: none; padding: 2px 0; color: red; font-weight: bold; font-size: 10pt;">${qClientAddress}</td></tr>
                                                </table>
                                            </td>
                                            <td style="width: 42%; text-align: right; vertical-align: top; border: none; padding: 0;">
                                                <div style="font-size: 20pt; font-weight: 900; letter-spacing: 0.5px; color: #000; margin-top: 0px; margin-bottom: 10px; font-family: 'Times New Roman', Times, serif; line-height: 1.1;">BẢNG BÁO GIÁ</div>
                                                <div style="font-size: 9.5pt; font-weight: bold;">Ngày báo giá: <span style="color: red; font-weight: bold; margin-left: 5px;">${qDate}</span></div>
                                                <div style="font-size: 9.5pt; font-weight: bold; margin-top: 4px;">Hiệu lực đến: <span style="color: red; font-weight: bold; margin-left: 5px;">${qValidUntil}</span></div>
                                            </td>
                                        </tr>
                                    </table>

                                    <table class="prod-table" style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt;">
                                        <thead>
                                            <tr style="background-color: #000000 !important; color: #ffffff !important; -webkit-print-color-adjust: exact;">
                                                <th style="width: 12%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: center;">Hình ảnh</th>
                                                <th style="width: 43%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: left;">Mô tả hàng hoá</th>
                                                <th style="width: 7%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: center;">SL</th>
                                                <th style="width: 12%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: right;">Giá bán lẻ</th>
                                                <th style="width: 13%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: right;">Giá đã giảm</th>
                                                <th style="width: 13%; color: #ffffff !important; background-color: #000000 !important; font-weight: bold; border: 1px solid #000; padding: 5px; text-align: right;">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${quoteRowsHtml}
                                            <tr style="background-color: #f2f2f2; font-weight: bold;">
                                                <td colspan="5" class="text-right" style="padding: 5px; border: 1px solid #000;">Giảm giá</td>
                                                <td class="text-right" style="padding: 5px; border: 1px solid #000; color: red;">${UTILS.formatNumber(discountValue)}</td>
                                            </tr>
                                            <tr style="background-color: #f2f2f2; font-weight: bold; font-size: 10pt;">
                                                <td colspan="5" class="text-right" style="padding: 5px; border: 1px solid #000; text-transform: uppercase;">Tổng cộng (VND)</td>
                                                <td class="text-right" style="padding: 5px; border: 1px solid #000; color: #000; font-size: 11pt; font-weight: 900;">${UTILS.formatNumber(finalTotal)}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div style="border: 1px solid #000; padding: 8px; margin-bottom: 15px; line-height: 1.45; font-size: 9pt;">
                                        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">Các điều khoản lưu ý:</div>
                                        <div>1. Giá trên đã bao gồm VAT,</div>
                                        <div>2. Thanh toán bằng chuyển khoản hoặc tiền mặt trước khi nhận hàng</div>
                                        <div>3. Hàng hoá được bảo hành theo tiêu chuẩn nhà sản xuất và phân phối</div>
                                        <div>4. Hàng hóa được giao tại 34 tỉnh thành</div>
                                    </div>

                                    <div style="text-align: center; font-size: 9.5pt; line-height: 1.4;">
                                        <div>Nếu quý khách cần hỗ trợ thêm thông tin, vui lòng liên hệ với:</div>
                                        <div style="font-weight: bold; color: red; margin-top: 1px;">Siêu thị : ${getBrandName(bStore)} - ${storeAddress}</div>
                                        <div style="font-weight: bold; margin-top: 1px;">Điện thoại: ${commonPhone}</div>
                                        <div style="font-weight: bold; font-style: italic; margin-top: 10px; font-size: 10pt;">Cảm ơn Quý khách hàng!</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    printHtml += `</body></html>`;

                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(printHtml);
                        printWindow.document.close();
                        setTimeout(() => { printWindow.print(); }, 500);
                    } else {
                        alert("⚠️ Lỗi: Trình duyệt của bạn chặn Pop-up! Vui lòng cho phép Pop-up để tải file.");
                    }
                };

                // KÍCH HOẠT LƯU NHÁP VÀ LUÔN LUÔN TIẾP TỤC IN
                executeSaveDraft(true, () => {
                    proceedWithPrinting();
                });
                
            };
        }

        app.style.display = 'flex';
    };

    return {
        name: "Tạo Hợp Đồng v1",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 15H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
        bgColor: "#6c5ce7",
        action: runTool
    };
})
