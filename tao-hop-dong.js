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
        .con-group input[readonly] { background: #f1f5f9; color: #475569; cursor: not-allowed; }

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
        const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
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
            let shopOptionsHtml = '<option value="">--- Chọn siêu thị ---</option>';
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
                    <!-- NGÀY THÁNG KÝ & LOẠI FILE -->
                    <div class="con-panel con-row" style="padding:15px; gap:15px;">
                        <div class="con-col con-group" style="margin:0;">
                            <label>📅 Ngày ký hợp đồng (Ví dụ: 24/05/2026)</label>
                            <input type="text" id="con-date" placeholder="Nhập dd/mm/yyyy...">
                        </div>
                        <div class="con-col con-group" style="margin:0;">
                            <label>📄 Loại văn bản kết xuất</label>
                            <select id="con-file-type">
                                <option value="both">In cả hai (Hợp đồng + Thanh lý)</option>
                                <option value="contract">Chỉ in Hợp đồng mua bán</option>
                                <option value="liquidation">Chỉ in Biên bản thanh lý</option>
                            </select>
                        </div>
                    </div>

                    <!-- THÔNG TIN HAI BÊN BÁN - MUA -->
                    <div class="con-row">
                        <!-- BÊN MUA (BÊN A) -->
                        <div class="con-col con-panel">
                            <div class="con-sec-title bg-buy">🏢 I/ BÊN MUA (BÊN A)</div>
                            <div class="con-group"><label>Tên Đơn Vị Mua Hàng</label><input type="text" id="con-a-name" placeholder="Nhập tên đầy đủ công ty..."></div>
                            <div class="con-group"><label>Địa Chỉ Trụ Sở Đăng Ký</label><input type="text" id="con-a-address" placeholder="Số nhà, tên đường, quận/huyện..."></div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Mã Số Thuế</label><input type="text" id="con-a-tax" placeholder="MST bên A..."></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>SĐT / Fax</label><input type="text" id="con-a-phone" placeholder="Số liên lạc..."></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Số Tài Khoản</label><input type="text" id="con-a-bank-acc" placeholder="STK ngân hàng..."></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Ngân Hàng</label><input type="text" id="con-a-bank-name" placeholder="Tên ngân hàng - Chi nhánh..."></div>
                            </div>
                            <div class="con-row" style="gap:10px;">
                                <div class="con-col con-group" style="min-width:140px;"><label>Người Đại Diện</label><input type="text" id="con-a-rep" placeholder="Họ và tên..."></div>
                                <div class="con-col con-group" style="min-width:140px;"><label>Chức Vụ</label><input type="text" id="con-a-role" placeholder="Chức danh..."></div>
                            </div>
                        </div>

                        <!-- BÊN BÁN (BÊN B) -->
                        <div class="con-col con-panel">
                            <div class="con-sec-title bg-sell">🏪 II/ BÊN BÁN (BÊN B)</div>
                            <div class="con-group">
                                <label>Chọn Siêu Thị (Tự điền nhanh thông tin công ty)</label>
                                <select id="con-b-select">${shopOptionsHtml}</select>
                            </div>
                            <div class="con-group"><label>Tên Siêu Thị / Công Ty</label><input type="text" id="con-b-name" readonly></div>
                            <div class="con-group"><label>Mã Số Thuế</label><input type="text" id="con-b-tax" readonly></div>
                            <div class="con-group"><label>Địa Chỉ Trụ Sở Đăng Ký</label><input type="text" id="con-b-address" readonly></div>
                            <div class="con-group"><label>Địa Chỉ Giao Hàng</label><input type="text" id="con-b-delivery" placeholder="Địa chỉ nơi giao nhận hàng..."></div>
                            <div class="con-group"><label>Địa Chỉ Giao Hàng (Tiếng Anh)</label><input type="text" id="con-b-delivery-en" placeholder="Dành cho hợp đồng song ngữ..."></div>
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
                                    <td><input type="text" class="con-p-name" placeholder="Nhập chi tiết sản phẩm..." style="width:100%;"></td>
                                    <td><input type="number" class="con-p-qty" value="1" min="1" style="width:100%; text-align:center;"></td>
                                    <td><input type="text" class="con-p-price" placeholder="0" style="width:100%; text-align:right;"></td>
                                    <td class="con-p-total bold" style="text-align:right; padding:6px; background:#f5f6fa;">0</td>
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
                            <div class="con-grand-total" id="con-final-total">0</div>
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
                const bNameInp = app.querySelector('#con-b-name');
                const bTaxInp = app.querySelector('#con-b-tax');
                const bAddressInp = app.querySelector('#con-b-address');

                if (!selVal) { bNameInp.value = ''; bTaxInp.value = ''; bAddressInp.value = ''; return; }

                bTaxInp.value = "0303217354";
                bAddressInp.value = "128 Trần Quang Khải, P. Tân Định, Quận 1, TP. Hồ Chí Minh";

                const storeName = userCfg[selVal] || "";
                if (storeName.toUpperCase().startsWith('Đ')) {
                    bNameInp.value = `CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG - CHI NHÁNH SIÊU THỊ ĐIỆN MÁY XANH ${storeName.toUpperCase()}`;
                } else {
                    bNameInp.value = `CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG - CHI NHÁNH SIÊU THỊ ${storeName.toUpperCase()}`;
                }
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
                app.querySelector('#con-final-words').value = convertNumberToWords(finalTotal) + " đồng./.";
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

            // --- TẠO FILE IN PDF CHUYÊN NGHIỆP ---
            app.querySelector('#btn-con-generate').onclick = () => {
                const docType = app.querySelector('#con-file-type').value;
                const dateVal = app.querySelector('#con-date').value.trim();

                const aName = app.querySelector('#con-a-name').value.trim();
                const aAddress = app.querySelector('#con-a-address').value.trim();
                const aTax = app.querySelector('#con-a-tax').value.trim();
                const aPhone = app.querySelector('#con-a-phone').value.trim();
                const aBankAcc = app.querySelector('#con-a-bank-acc').value.trim();
                const aBankName = app.querySelector('#con-a-bank-name').value.trim();
                const aRep = app.querySelector('#con-a-rep').value.trim();
                const aRole = app.querySelector('#con-a-role').value.trim();

                const bName = app.querySelector('#con-b-name').value.trim();
                const bTax = app.querySelector('#con-b-tax').value.trim();
                const bAddress = app.querySelector('#con-b-address').value.trim();
                const bDelivery = app.querySelector('#con-b-delivery').value.trim();
                const bDeliveryEn = app.querySelector('#con-b-delivery-en').value.trim();

                if (!dateVal) { alert("⚠️ Vui lòng nhập ngày tháng ký hợp đồng!"); return; }
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

                const dateParts = dateVal.split('/');
                const dd = dateParts[0] || '...';
                const mm = dateParts[1] || '...';
                const yyyy = dateParts[2] || '...';

                let printHtml = `
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Kết xuất báo cáo PDF - AutoBI</title>
                        <style>
                            @media print {
                                body { width: 21cm; height: 29.7cm; margin: 1.5cm 1.5cm 1.5cm 2cm; font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; color: #000; }
                                .page-break { page-break-after: always; }
                            }
                            body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; color: #000; padding: 40px; max-width: 800px; margin: auto; background:#fff;}
                            .doc-title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-top: 20px; margin-bottom: 5px; }
                            .doc-subtitle { text-align: center; font-size: 13pt; font-style: italic; margin-bottom: 20px; }
                            .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 12pt; }
                            table, th, td { border: 1px solid black; }
                            th, td { padding: 6px 8px; text-align: left; }
                            th { text-align: center; font-weight: bold; background-color: #f2f2f2; }
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .bold { font-weight: bold; }
                        </style>
                    </head>
                    <body>
                `;

                if (docType === 'both' || docType === 'contract') {
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
                        <div class="page-break">
                            <table style="border:none; width:100%; margin:0; padding:0;">
                                <tr style="border:none;">
                                    <td style="border:none; width:45%; text-align:center; font-weight:bold; font-size:11pt; padding:0; vertical-align:top;">
                                        CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG<br>
                                        ------------------------
                                    </td>
                                    <td style="border:none; width:55%; text-align:center; font-weight:bold; font-size:11pt; padding:0; vertical-align:top;">
                                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
                                        Độc lập - Tự do - Hạnh phúc<br>
                                        ------------------------------------
                                    </td>
                                </tr>
                            </table>
                            
                            <div class="doc-title">HỢP ĐỒNG MUA BÁN HÀNG HÓA</div>
                            <div class="doc-subtitle">Số: ......../HĐMB/TGDD/2026</div>

                            <div style="font-style:italic; text-align:center; margin-bottom:15px;">- Căn cứ Bộ Luật Dân Sự số 91/2015/QH13 được Quốc hội nước CHXHCN Việt Nam thông qua ngày 24/11/2015;</div>
                            <div style="font-style:italic; text-align:center; margin-bottom:20px;">- Căn cứ vào nhu cầu và khả năng thực tế của hai bên;</div>

                            <div style="margin-bottom:15px;">Hôm nay, ngày ${dd} tháng ${mm} năm ${yyyy}, chúng tôi gồm có các bên:</div>

                            <div class="section-title">BÊN MUA (BÊN A): ${aName}</div>
                            <div style="margin-left:10px;">
                                - Địa chỉ đăng ký: ${aAddress}<br>
                                - Mã số thuế: ${aTax} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Điện thoại: ${aPhone}<br>
                                - Số tài khoản: ${aBankAcc} mở tại: ${aBankName}<br>
                                - Người đại diện: <b>${aRep}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Chức vụ: ${aRole}
                            </div>

                            <div class="section-title" style="margin-top:15px;">BÊN GIAO (BÊN B): CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG</div>
                            <div style="margin-left:10px;">
                                - Đại diện: <b>${bName}</b><br>
                                - Địa chỉ trụ sở: ${bAddress}<br>
                                - Mã số thuế: ${bTax}<br>
                                - Địa chỉ giao nhận hàng: ${bDelivery} ${bDeliveryEn ? `(${bDeliveryEn})` : ''}
                            </div>

                            <div style="margin-top:15px; text-align:justify;">Sau khi bàn bạc thống nhất, hai bên đồng ý ký kết hợp đồng mua bán với nội dung và các điều khoản cụ thể như sau:</div>

                            <div class="section-title" style="margin-top:15px;">ĐIỀU 1: CHI TIẾT SẢN PHẨM & SỐ LƯỢNG</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:40px;">STT</th>
                                        <th>Tên Sản Phẩm / Quy Cách</th>
                                        <th style="width:70px;">SL</th>
                                        <th style="width:120px;">Đơn Giá (VNĐ)</th>
                                        <th style="width:140px;">Thành Tiền (VNĐ)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productRowsHtml}
                                    <tr>
                                        <td colspan="4" class="bold text-right">Tổng tiền hàng chưa giảm:</td>
                                        <td class="text-right bold">${UTILS.formatNumber(totalBeforeDisc)}</td>
                                    </tr>
                                    ${discountRowHtml}
                                    <tr style="background:#f9f9f9;">
                                        <td colspan="4" class="bold text-right" style="font-size:13pt; color:#c00000;">TỔNG TIỀN CUỐI CÙNG THANH TOÁN (Đã gồm VAT):</td>
                                        <td class="text-right bold" style="font-size:13pt; color:#c00000;">${UTILS.formatNumber(finalTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style="font-style:italic; margin-bottom:20px;"><b>Số tiền viết bằng chữ:</b> <i>${finalWords}</i></div>

                            <div class="section-title">ĐIỀU 2: PHƯƠNG THỨC GIAO NHẬN VÀ THANH TOÁN</div>
                            <div style="text-align:justify; margin-bottom:30px;">
                                - Bên B có trách nhiệm giao hàng đúng chủng loại và đủ số lượng cho bên A tại địa chỉ yêu cầu.<br>
                                - Bên A thanh toán toàn bộ giá trị hợp đồng bằng phương thức chuyển khoản ngay sau khi nhận được hóa đơn tài chính và biên bản bàn giao từ Bên B.
                            </div>

                            <table style="border:none; width:100%; margin-top:30px;">
                                <tr style="border:none;">
                                    <td style="border:none; width:50%; text-align:center; font-weight:bold; padding:0;">
                                        ĐẠI DIỆN BÊN A<br>
                                        <span style="font-size:10pt; font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                                        <br><br><br><br><br>
                                        ${aRep}
                                    </td>
                                    <td style="border:none; width:50%; text-align:center; font-weight:bold; padding:0;">
                                        ĐẠI DIỆN BÊN B<br>
                                        <span style="font-size:10pt; font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                                        <br><br><br><br><br>
                                        Đại diện Siêu thị
                                    </td>
                                </tr>
                            </table>
                        </div>
                    `;
                }

                if (docType === 'both' || docType === 'liquidation') {
                    printHtml += `
                        <div>
                            <table style="border:none; width:100%; margin:0; padding:0;">
                                <tr style="border:none;">
                                    <td style="border:none; width:45%; text-align:center; font-weight:bold; font-size:11pt; padding:0; vertical-align:top;">
                                        CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG<br>
                                        ------------------------
                                    </td>
                                    <td style="border:none; width:55%; text-align:center; font-weight:bold; font-size:11pt; padding:0; vertical-align:top;">
                                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
                                        Độc lập - Tự do - Hạnh phúc<br>
                                        ------------------------------------
                                    </td>
                                </tr>
                            </table>

                            <div class="doc-title" style="margin-top:30px;">BIÊN BẢN BÀN GIAO VÀ THANH LÝ HỢP ĐỒNG</div>
                            
                            <div style="font-style:italic; text-align:center; margin-bottom:20px;">
                                Căn cứ vào Hợp đồng mua bán hàng hóa số: ......../HĐMB/TGDD/2026 ký ngày ${dd}/${mm}/${yyyy}.
                            </div>

                            <div style="margin-bottom:15px;">Hôm nay, ngày ${dd} tháng ${mm} năm ${yyyy}, chúng tôi gồm có:</div>

                            <div class="section-title">BÊN NHẬN (BÊN A): ${aName}</div>
                            <div style="margin-left:10px; margin-bottom:15px;">
                                - Đại diện: <b>${aRep}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Chức vụ: ${aRole}
                            </div>

                            <div class="section-title">BÊN GIAO (BÊN B): CÔNG TY CỔ PHẦN THẾ GIỚI DI ĐỘNG</div>
                            <div style="margin-left:10px; margin-bottom:20px;">
                                - Đại diện: <b>${bName}</b>
                            </div>

                            <div style="text-align:justify; margin-bottom:15px;">Hai bên thống nhất ký kết biên bản nghiệm thu bàn giao và thanh lý hợp đồng với các điều khoản sau:</div>

                            <div class="bold">KHOẢN 1: NỘI DUNG NGHIỆM THU BÀN GIAO</div>
                            <div style="text-align:justify; margin-bottom:15px;">
                                Bên B đã tiến hành bàn giao đầy đủ sản phẩm, hóa đơn tài chính hợp lệ và các phụ kiện đi kèm theo đúng thỏa thuận tại Điều 1 của Hợp đồng mua bán. Bên A xác nhận đã nhận đủ số lượng, sản phẩm hoạt động tốt, đạt tiêu chuẩn chất lượng yêu cầu.
                            </div>

                            <div class="bold">KHOẢN 2: GIÁ TRỊ QUYẾT TOÁN THANH LÝ</div>
                            <div style="text-align:justify; margin-bottom:15px;">
                                - Tổng giá trị quyết toán thực tế bàn giao: <b>${UTILS.formatNumber(finalTotal)} VNĐ</b><br>
                                - Bằng chữ: <i>${finalWords}</i><br>
                                - Bên A xác nhận có nghĩa vụ thanh toán đầy đủ số tiền trên cho Bên B theo đúng phương thức thỏa thuận.
                            </div>

                            <div class="bold">KHOẢN 3: ĐIỀU KHOẢN CHUNG</div>
                            <div style="text-align:justify; margin-bottom:30px;">
                                Hai bên thống nhất thanh lý Hợp đồng mua bán số: ......../HĐMB/TGDD/2026. Kể từ khi Bên A hoàn tất nghĩa vụ thanh toán, hợp đồng này chính thức hết hiệu lực, hai bên không còn bất kỳ tranh chấp hay khiếu nại nào liên quan.
                            </div>

                            <table style="border:none; width:100%; margin-top:30px;">
                                <tr style="border:none;">
                                    <td style="border:none; width:50%; text-align:center; font-weight:bold; padding:0;">
                                        ĐẠI DIỆN BÊN A<br>
                                        <span style="font-size:10pt; font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                                        <br><br><br><br><br>
                                        ${aRep}
                                    </td>
                                    <td style="border:none; width:50%; text-align:center; font-weight:bold; padding:0;">
                                        ĐẠI DIỆN BÊN B<br>
                                        <span style="font-size:10pt; font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                                        <br><br><br><br><br>
                                        Đại diện Siêu thị
                                    </td>
                                </tr>
                            </table>
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
