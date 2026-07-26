((context) => {
    // Giải nén các công cụ bổ trợ được chuyển giao từ hệ thống chính
    const { UI, UTILS } = context;

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
        
        if (!app) {
            app = document.createElement('div');
            app.id = 'con-app';

            // Sinh danh sách dropdown siêu thị tự động từ cấu hình gốc
            let shopOptionsHtml = '<option value="">--- Chọn siêu thị nhanh ---</option>';
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
                <div class="con-header">
                    <div class="con-logo">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 15H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                        Tạo Hợp Đồng & Thanh Lý Báo Cáo
                    </div>
                    <button class="con-btn-close" id="con-btn-close">✖</button>
                </div>
                
                <div class="con-body">
                    <!-- THÔNG TIN CHUNG HỢP ĐỒNG -->
                    <div class="con-panel">
                        <div class="con-sec-title bg-total">📅 THÔNG TIN CHUNG VĂN BẢN</div>
                        <div class="con-row" style="gap:15px;">
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>Số Hợp Đồng</label>
                                <input type="text" id="con-no" value="0104-2026 /KD-ĐMX/HĐMB">
                            </div>
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>Ngày Ký Hợp Đồng</label>
                                <input type="text" id="con-date-hd" value="12/04/2026" placeholder="dd/mm/yyyy">
                            </div>
                            <div class="con-col con-group" style="min-width: 180px;">
                                <label>Ngày Nghiệm Thu/Thanh Lý</label>
                                <input type="text" id="con-date-tl" value="14/04/2026" placeholder="dd/mm/yyyy">
                            </div>
                            <div class="con-col con-group" style="min-width: 200px;">
                                <label>📄 Loại văn bản kết xuất</label>
                                <select id="con-file-type">
                                    <option value="contract">In hợp đồng mua bán</option>
                                    <option value="liquidation">Biên bản bàn giao thanh lý</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- THÔNG TIN HAI BÊN BÁN - MUA -->
                    <div class="con-row">
                        <!-- BÊN MUA (BÊN A) -->
                        <div class="con-col con-panel">
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
                                <div class="con-col con-group" style="min-width:140px;"><label>Người Đại Diện</label><input type="text" id="con-a-rep" value="Bùi Quang Tuyên"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ</label><input type="text" id="con-a-role" value="Giám đốc"></div>
                            </div>
                        </div>

                        <!-- BÊN BÁN (BÊN B) -->
                        <div class="con-col con-panel">
                            <div class="con-sec-title bg-sell">🏪 II/ BÊN BÁN (BÊN B)</div>
                            <div class="con-group">
                                <label>Chọn Siêu Thị nhanh</label>
                                <select id="con-b-select">${shopOptionsHtml}</select>
                            </div>
                            <div class="con-group"><label>Tên Chi Nhánh / Công ty</label><input type="text" id="con-b-name" value="CHI NHÁNH CÔNG TY CỔ PHẦN ĐẦU TƯ ĐIỆN MÁY XANH"></div>
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
                                <div class="con-col con-group" style="min-width:140px;"><label>Đại Diện (Hợp Đồng)</label><input type="text" id="con-b-rep-hd" value="Đỗ Thị Thái Thanh"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ (Hợp Đồng)</label><input type="text" id="con-b-role-hd" value="Giám Đốc Bán Hàng"></div>
                            </div>
                            <div class="con-group"><label>Ủy Quyền (Hợp Đồng)</label><input type="text" id="con-b-uq" value="Theo giấy Uỷ Quyền số 12/2026/ĐMX/UQ ký ngày 24/03/2026"></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Đại Diện (Thanh Lý)</label><input type="text" id="con-b-rep-tl" value="ĐỖ THỊ THÁI THANH"></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ (Thanh Lý)</label><input type="text" id="con-b-role-tl" value="Giám Đốc Vùng (RSM)"></div>
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
                                    <th style="width:50px;">STT</th>
                                    <th>TÊN SẢN PHẨM / DỊCH VỤ</th>
                                    <th style="width:100px;">SỐ LƯỢNG</th>
                                    <th style="width:140px;">ĐƠN GIÁ (VNĐ)</th>
                                    <th style="width:180px;">THÀNH TIỀN (VNĐ)</th>
                                    <th style="width:60px;">XÓA</th>
                                </tr>
                            </thead>
                            <tbody id="tbl-con-products-body">
                                <tr class="con-product-row">
                                    <td class="con-stt" style="text-align:center; font-weight:bold;">1</td>
                                    <td><input type="text" class="con-p-name" value="Máy lạnh âm trần LG Inverter 2.5 HP ZTNQ24GPLA0" style="width:100%;"></td>
                                    <td><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                                    <td><input type="text" class="con-p-price" value="29,090,000" style="width:100%; text-align:right;"></td>
                                    <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa;">29,090,000</td>
                                    <td style="text-align:center;"><button class="con-btn-del-row">✖</button></td>
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
                        <label>✍️ SỐ TIỀN BẰNG CHỮ TIẾNG VIỆT (Tự động dịch)</label>
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

            // Dropdown chọn siêu thị Bên B
            app.querySelector('#con-b-select').onchange = (e) => {
                const selVal = e.target.value;
                if (!selVal) return;
                const storeName = userCfg[selVal] || "";
                app.querySelector('#con-b-store').value = storeName.toUpperCase();
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

            const bindRowEvents = (row) => {
                const qtyInp = row.querySelector('.con-p-qty');
                const priceInp = row.querySelector('.con-p-price');

                priceInp.oninput = (e) => {
                    e.target.value = UTILS.formatInputNumber(e.target.value.replace(/[^0-9]/g, ''));
                    recalculateTotals();
                };
                qtyInp.oninput = recalculateTotals;
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
                    <td class="con-stt" style="text-align:center; font-weight:bold;">${rowsCount + 1}</td>
                    <td><input type="text" class="con-p-name" placeholder="Nhập chi tiết sản phẩm..." style="width:100%;"></td>
                    <td><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                    <td><input type="text" class="con-p-price" placeholder="0" style="width:100%; text-align:right;"></td>
                    <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa;">0</td>
                    <td style="text-align:center;"><button class="con-btn-del-row">✖</button></td>
                `;

                tr.querySelector('.con-btn-del-row').onclick = () => {
                    tr.remove(); recalculateTotals();
                };

                bindRowEvents(tr);
                tbody.appendChild(tr);
            };

            app.querySelector('#con-discount-val').oninput = (e) => {
                e.target.value = UTILS.formatInputNumber(e.target.value.replace(/[^0-9]/g, ''));
                recalculateTotals();
            };

            // Khởi tạo tính toán ban đầu
            recalculateTotals();

            // --- TẠO FILE IN PDF CHUYÊN NGHIỆP ---
            app.querySelector('#btn-con-generate').onclick = () => {
                const docType = app.querySelector('#con-file-type').value;
                const conNo = app.querySelector('#con-no').value.trim();
                const dateHd = app.querySelector('#con-date-hd').value.trim();
                const dateTl = app.querySelector('#con-date-tl').value.trim();

                const aName = app.querySelector('#con-a-name').value.trim();
                const aAddress = app.querySelector('#con-a-address').value.trim();
                const aTax = app.querySelector('#con-a-tax').value.trim();
                const aPhone = app.querySelector('#con-a-phone').value.trim();
                const aBankAcc = app.querySelector('#con-a-bank-acc').value.trim();
                const aBankName = app.querySelector('#con-a-bank-name').value.trim();
                const aRep = app.querySelector('#con-a-rep').value.trim();
                const aRole = app.querySelector('#con-a-role').value.trim();

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

                if (!dateHd || !dateTl) { alert("⚠️ Vui lòng nhập đầy đủ ngày tháng ký hợp đồng và nghiệm thu!"); return; }
                if (!aName || !bName) { alert("⚠️ Vui lòng nhập đầy đủ thông tin hai bên Mua & Bán!"); return; }

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

                let printHtml = `
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Kết xuất báo cáo PDF - AutoBI</title>
                        <style>
                            @page {
                                size: A4;
                                margin: 0;
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
                                /* Style cho Hợp Đồng Mua Bán - Hệ bảng cấu trúc ngắt trang chống tràn */
                                .print-layout-table {
                                    width: 100% !important;
                                    border-collapse: collapse !important;
                                    border: none !important;
                                    background: #ffffff !important;
                                }
                                .print-layout-table td {
                                    border: none !important;
                                }
                                .print-content {
                                    padding: 1.2cm 1.2cm 0 1.8cm !important;
                                    font-size: 10pt !important;
                                    line-height: 1.3 !important;
                                    background: #ffffff !important;
                                    font-family: "Times New Roman", Times, serif;
                                }
                                .footer-spacer {
                                    height: 1.6cm !important;
                                }
                                .fixed-footer-note {
                                    position: fixed !important;
                                    bottom: 0.6cm !important;
                                    left: 1.8cm !important;
                                    right: 1.2cm !important;
                                    height: 30px !important;
                                    border-top: 1px solid black !important;
                                    display: flex !important;
                                    justify-content: space-between !important;
                                    align-items: center !important;
                                    font-size: 9.5pt !important;
                                    font-weight: bold !important;
                                    background: #ffffff !important;
                                    z-index: 9999 !important;
                                    font-family: "Times New Roman", Times, serif;
                                }
                                .print-page-num::after {
                                    counter-increment: page;
                                    content: counter(page);
                                }

                                /* Style cho Biên Bản Nghiệm Thu & Thanh Lý */
                                .page-container { 
                                    width: 21cm !important; 
                                    min-height: 29.5cm !important; 
                                    height: auto !important; 
                                    box-sizing: border-box !important;
                                    display: flex !important;
                                    flex-direction: column !important;
                                    justify-content: space-between !important;
                                    padding: 1cm 1.2cm 1.8cm 1.6cm !important; 
                                    page-break-after: always !important; 
                                    page-break-inside: avoid !important;
                                    background: #ffffff !important;
                                    background-color: #ffffff !important;
                                    box-shadow: none !important;
                                    margin: 0 !important;
                                    border: none !important;
                                    font-size: 10pt !important;
                                    line-height: 1.25 !important;
                                    position: relative !important;
                                }
                                .info-table, .prod-table, .sig-table {
                                    page-break-inside: avoid !important;
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
                                .absolute-footer-note {
                                    position: absolute !important;
                                    bottom: 0.6cm !important;
                                    left: 1.6cm !important;
                                    right: 1.2cm !important;
                                    height: 30px !important;
                                    border-top: 1px solid black !important;
                                    display: flex !important;
                                    justify-content: space-between !important;
                                    font-size: 9.5pt !important;
                                    font-weight: bold !important;
                                    background: #ffffff !important;
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
                            
                            /* Screen style fallback */
                            .print-layout-table {
                                width: 21cm;
                                margin: 0 auto 30px auto;
                                background: #fff;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                                border-collapse: collapse;
                            }
                            .print-content {
                                padding: 1.5cm 1.5cm 0 2cm;
                            }
                            .footer-spacer {
                                height: 1.6cm;
                            }
                            .fixed-footer-note {
                                display: none;
                            }
                            @media screen {
                                .fixed-footer-note {
                                    display: flex;
                                    width: 21cm;
                                    margin: -30px auto 30px auto;
                                    padding-top: 5px;
                                    border-top: 1px solid black;
                                    justify-content: space-between;
                                    font-size: 9.5pt;
                                    font-weight: bold;
                                    background: #fff;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                                    box-sizing: border-box;
                                    padding-left: 2cm;
                                    padding-right: 1.5cm;
                                    height: 40px;
                                }
                            }

                            .page-container { 
                                width: 21cm; 
                                height: 29.7cm; 
                                box-sizing: border-box;
                                background: #fff; 
                                padding: 1.5cm 1.5cm 1.2cm 2cm; 
                                margin: 0 auto 30px auto; 
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                position: relative;
                            }
                            .page-content {
                                flex-grow: 1;
                            }
                            .doc-title { text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; }
                            .doc-subtitle { text-align: center; font-size: 11pt; margin-bottom: 15px; }
                            .section-title { font-weight: bold; margin-top: 12px; margin-bottom: 5px; text-transform: uppercase; }
                            
                            .info-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
                            .info-table td { border: 1px solid black; padding: 5px 8px; vertical-align: top; }
                            
                            .prod-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
                            .prod-table th, .prod-table td { border: 1px solid black; padding: 6px 8px; }
                            .prod-table th { text-align: center; font-weight: bold; background-color: #f2f2f2; }
                            
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .bold { font-weight: bold; }
                            .italic { font-style: italic; }
                            .red-text { color: red !important; }
                            
                            .footer-note { border-top: 1px solid black; margin-top: 15px; padding-top: 5px; display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: bold; }
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
                        <table class="print-layout-table">
                            <tbody>
                                <tr>
                                    <td>
                                        <div class="print-content">
                                            <!-- === LOGICAL PAGE 1 === -->
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
                                                    <td style="width: 2%; text-align: center; font-weight: bold;">:</td>
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
                                                        <div class="bold">${aRep}</div>
                                                        <div>Chức vụ : ${aRole}</div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3" class="bold" style="background-color:#f2f2f2;">BÊN BÁN (BÊN B): ${bName}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight: bold;">Trụ sở đăng ký</td>
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
                                                        <div class="bold">Ông/Bà: ${bRepHd}</div>
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

                                            <div style="text-align: justify; font-size: 10pt; margin-bottom:15px;">
                                                1.2 Tổng tiền mà Bên A phải thanh toán cho Bên B theo quy định tại Điều 1.1 (“Giá Sản Phẩm”) là chi phí cố định không thay đổi trong suốt quá trình thực hiện Hợp Đồng và chưa bao gồm phần chi phí vật tư và/hoặc các chi phí khác phát sinh khi lắp đặt (nếu có). Các chi phí phát sinh này được quy định tại website: <b>https://www.dienmayxanh.com/kinh-nghiem-hay/chinh-sach-giao-hang-lap-dat-1261528</b> vào thời điểm lắp đặt.
                                            </div>

                                            <!-- ÉP NGẮT TRANG TỰ NHIÊN SAU ĐIỀU 1.2 -->
                                            <div style="page-break-after: always; height: 1px; clear: both;"></div>

                                            <!-- === LOGICAL PAGE 2 === -->
                                            <div style="text-align: justify;">
                                                1.3 Giá Sản Phẩm được Bên A thanh toán cho Bên B theo quy định tại Điều 3 Hợp Đồng này. Chi phí vật tư và/hoặc chi phí khác phát sinh khi lắp đặt sẽ được thanh toán bằng tiền mặt/chuyển khoản ngay khi Bên B lắp đặt cho Bên A hoàn tất.<br><br>
                                                1.4 Trường hợp Sản Phẩm cần lắp đặt thì Bên A chịu trách nhiệm chuẩn bị các thiết bị sau và điểm chờ đấu nối cụ thể:<br>
                                                a. Điểm lắp đặt cao trên 4m (tính từ sàn) thì Bên A tự chuẩn bị thang phù hợp hoặc dàn giáo.<br>
                                                b. Liên quan đến thiết bị cần cấp và thoát nước, Bên A cần phải có ống âm chờ cấp vào máy và ra các thiết bị sẵn tại vị trí lắp máy (Đầu chờ nước cấp, đầu ra nóng, Bộ pha nước ra nóng lạnh, ống thoát nước, v.v.).
                                            </div>

                                            <div class="bold" style="margin-top: 15px;">ĐIỀU 2: THỜI GIAN VÀ ĐIỀU KIỆN GIAO HÀNG</div>
                                            <div style="text-align: justify;">
                                                2.1 Thời gian giao hàng: Bên B thực hiện giao Hàng hóa trong vòng ba (03) ngày kể từ ngày Bên B được Ngân hàng báo có đúng, đầy đủ Giá Sản Phẩm vào tài khoản ngân hàng của Bên B. Trường hợp ngày Ngân hàng báo có rơi vào thứ bảy, chủ nhật hoặc ngày nghỉ Lễ, Tết theo quy định pháp luật thì thời hạn bắt đầu được tính từ ngày làm việc tiếp theo hoặc theo thông báo của Bên B (tùy trường hợp).<br><br>
                                                2.2 Địa điểm giao hàng: ${aAddress}
                                            </div>

                                            <div class="bold" style="margin-top: 15px;">ĐIỀU 3: THANH TOÁN</div>
                                            <div style="text-align: justify;">
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
                                            <div style="text-align: justify; font-size: 10pt;">
                                                4.1 Sản Phẩm do Bên B cung cấp sẽ được bảo hành theo tiêu chuẩn của nhà sản xuất hoặc nhà phân phối. Sản phẩm sẽ được kích hoạt bảo hành ngay tại thời điểm Bên B xuất hóa đơn VAT cho Bên A.<br>
                                                4.2 Chính sách bảo hành của nhà sản xuất hoặc nhà phân phối được đính kèm theo sản phẩm hoặc có thể tham khảo tại website của nhà sản xuất hoặc nhà phân phối.<br>
                                                4.3 Nếu sản phẩm có áp dụng chính sách đổi trả hoặc hoàn tiền của Bên B vui lòng xem chính sách tại website https://www.dienmayxanh.com/bao-hanh-doi-tra (hoặc https://www.thegioididong.com/chinh-sach-bao-hanh-san-pham áp dụng tùy từng loại sản phẩm). Bên B bảo lưu quyền thay đổi các chính sách này tại từng thời điểm và không cần sự chấp thuận của Bên A.<br>
                                                4.4 Cho mục đích bảo hành hoặc khiếu nại về Sản Phẩm Bên A liên hệ số điện thoại như được công khai tại website https://www.dienmayxanh.com/ hoặc https://www.thegioididong.com/.
                                            </div>

                                            <div class="bold" style="margin-top: 15px;">ĐIỀU 5: NGHĨA VỤ CỦA CÁC BÊN</div>
                                            <div style="text-align: justify;">
                                                5.1 Nghĩa vụ của Bên A:<br>
                                                a. Cam kết không tiết lộ cho bên thứ ba bất kỳ thông tin nào có liên quan đến việc thực hiện Hợp đồng này.<br>
                                                b. Thanh toán cho Bên B Giá Sản Phẩm và chi phí vật tư đúng và đầy đủ theo quy định Hợp Đồng này.<br>
                                                c. Bên A đồng ý với chính sách thu thập thông tin và xử lý dữ liệu của Bên B theo các điều khoản và điều kiện đã được quy định tại website https://www.dienmayxanh.com/ hoặc https://www.thegioididong.com/.<br>
                                                d. Thực hiện đúng các cam kết được ghi trong Hợp Đồng này.<br><br>
                                                5.2 Nghĩa vụ của Bên B:<br>
                                                a. Đảm bảo cung cấp Sản Phẩm mới 100%, đúng với quy cách, giá cả, thời gian giao hàng theo cam kết tại Điều 1 và Điều 2 Hợp Đồng này.<br>
                                                b. Cam kết không tiết lộ cho bên thứ ba bất kỳ thông tin nào có liên quan đến việc thực hiện Hợp đồng này.<br>
                                                c. Thực hiện đúng các cam kết được ghi trong Hợp Đồng này.
                                            </div>

                                            <!-- ÉP NGẮT TRANG TỰ NHIÊN SAU ĐIỀU 5 -->
                                            <div style="page-break-after: always; height: 1px; clear: both;"></div>

                                            <!-- === LOGICAL PAGE 3 === -->
                                            <div class="bold">ĐIỀU 6: THỜI HẠN HỢP ĐỒNG</div>
                                            <div style="text-align: justify; margin-bottom: 15px;">
                                                Hợp Đồng này tự động chấm dứt trong trường hợp sau:<br>
                                                6.1 Bên A không thực hiện nghĩa vụ thanh toán trong vòng 10 (mười) ngày làm việc kể từ Ngày Ký thì xem như Bên A không có nhu cầu mua hàng và Bên B không có nghĩa vụ giữ giá, hàng hóa cho Bên A. Khi đó, Hợp Đồng tự động chấm dứt. Trường hợp Bên A tiếp tục mua hàng thì Hai Bên phải ký lại Hợp Đồng mới; hoặc<br>
                                                6.2 Bên A đã thực hiện nghĩa vụ thanh toán: Hợp đồng này tự động chấm dứt sau khi Hai Bên hoàn thành các nghĩa vụ quy định tại Hợp Đồng. Riêng các điều khoản về bảo hành vẫn có hiệu lực cho đến khi hết thời hạn bảo hành theo quy định của nhà sản xuất hoặc nhà phân phối.
                                            </div>

                                            <div class="bold">ĐIỀU 7: CAM KẾT CHỐNG THAM NHŨNG</div>
                                            <div style="text-align: justify; margin-bottom: 15px;">
                                                7.1 Các bên cam kết tuân thủ luật pháp chống tham nhũng, không tham gia bất kỳ hành vi hối lộ, gian lận, tặng quà hoặc gợi ý tặng quà dưới bất kỳ hình thức nào cho nhân viên của bên kia nhằm đạt được lợi ích quá trình thực hiện hợp đồng. Nếu phát hiện vi phạm, bên bị vi phạm có quyền chấm dứt hợp đồng ngay lập tức, và bên vi phạm phải bồi thường mọi thiệt hại phát sinh.<br>
                                                7.2 Bên Mua chỉ thanh toán số tiền đã được các bên thống nhất trong hợp đồng hoặc các văn bản thanh toán liên quan. Bên Mua chỉ thanh toán vào tài khoản của Bên Bán như trên và không được thanh toán vào bất kỳ tài khoản cá nhân/tổ chức nào khác.
                                            </div>

                                            <div class="bold">ĐIỀU 8: CAM KẾT CHUNG</div>
                                            <div style="text-align: justify; margin-bottom: 30px;">
                                                8.1 Hai Bên cam kết thực hiện đúng những điều ghi trên Hợp Đồng này. Mọi sự thay đổi trong Hợp Đồng này phải lập phụ lục hợp đồng và phải có chữ ký xác nhận của cả Hai Bên. Nếu một trong Hai Bên cố ý vi phạm các điều khoản của Hợp Đồng này sẽ phải chịu trách nhiệm về các hành vi vi phạm đó.<br>
                                                8.2 Trong trường hợp xảy ra tranh chấp, hai bên cố gắng cùng nhau bàn bạc các biện pháp giải quyết trên tinh thần hòa giải, có thiện chí và hợp tác. Nếu vẫn không thể thống nhất cách giải quyết thì hai bên sẽ đưa vụ việc ra Tòa án có thẩm quyền giải quyết, toàn bộ chi phí xét xử do bên thua chịu.<br>
                                                8.3 Hợp đồng này được lập thành 02 (hai) bản, mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.
                                            </div>

                                            <table class="sig-table" style="width:100%; border:none; margin-top:40px;">
                                                <tr style="border:none;">
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">
                                                        Đại Diện Bên A<br><br><br><br><br><br>
                                                        <div style="font-weight: normal; text-align: left; padding-left: 20px;">
                                                            <b>Bởi:</b> ${aName}<br>
                                                            <b>Tên:</b> ${aRep}<br>
                                                            <b>Chức vụ:</b> ${aRole}
                                                        </div>
                                                    </td>
                                                    <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">
                                                        Đại Diện Bên B<br><br><br><br><br><br>
                                                        <div style="font-weight: normal; text-align: left; padding-left: 20px;">
                                                            <b>Bởi:</b> ${bName}<br>
                                                            <b>Bà :</b> ${bRepHd}<br>
                                                            <b>Chức vụ:</b> ${bRoleHd.toUpperCase()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td>
                                        <div class="footer-spacer"></div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        <div class="fixed-footer-note">
                            <span>Pháp Chế_111124_ĐMX_VN</span>
                            <span class="print-page-num"></span>
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
                        <!-- TRANG 1 BIÊN BẢN NGHIỆM THU -->
                        <div class="page-container" style="font-family: 'Times New Roman', serif;">
                            <div class="page-content">
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
                                        <span class="red-text">- Đại diện là:</span> <span class="bold red-text">Ông /Bà: ${bRepTl}</span><br>
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

                                <table class="sig-table" style="width:100%; border:none; margin-top:40px;">
                                    <tr style="border:none;">
                                        <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN A</td>
                                        <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN B</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="absolute-footer-note">
                                <span style="font-weight: bold; color: #111;">dienmayxanh</span>
                                <span>1/2</span>
                            </div>
                        </div>

                        <!-- TRANG 2 BIÊN BẢN THANH LÝ -->
                        <div class="page-container" style="font-family: 'Times New Roman', serif;">
                            <div class="page-content">
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
                                        <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Đại diện bởi</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>Ông /bà RSM ${bRepTl}</b></td></tr>
                                        <tr style="border:none;"><td style="border:none; padding:2px 0;"><b>Chức vụ</b></td><td style="border:none; padding:2px 0;">:</td><td style="border:none; padding:2px 0; color:red;"><b>Giám Đốc Vùng</b></td></tr>
                                    </table>
                                </div>

                                <div style="margin-bottom: 15px;">Hai bên thống nhất ký kết biên bản nghiệm thu bàn giao và thanh lý hợp đồng với các điều khoản sau:</div>

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

                                <table class="sig-table" style="width:100%; border:none; margin-top:40px;">
                                    <tr style="border:none;">
                                        <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN A</td>
                                        <td style="width: 50%; text-align: center; font-weight: bold; border:none; padding: 0;">ĐẠI DIỆN BÊN B</td>
                                    </tr>
                                </table>
                            </div>
                            <div class="absolute-footer-note">
                                <span style="font-weight: bold; color: #111;">dienmayxanh</span>
                                <span>2/2</span>
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
        };

        app.style.display = 'flex';
    };

    return {
        name: "Tạo Hợp Đồng",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 15H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
        bgColor: "#6c5ce7",
        action: runTool
    };
})
