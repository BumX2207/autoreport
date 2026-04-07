((context) => {
    // ===============================================================
    // 1. DATA CƠ SỞ & LẤY THÔNG TIN USER (VIP CHECK)
    // ===============================================================
    const DATA = {
        dienthoai1:[90000, 300000, 550000, 750000, 1050000, 1250000, 1550000, 2000000, 2500000],
        dienthoai2:[170000, 570000, 1050000, 1450000, 2000000, 2380000, 2950000, 3800000, 4750000],
        laptop1:[280000, 500000, 700000, 1050000, 1250000, 1550000, 1900000, 2400000, 3400000],
        laptop2:[530000, 950000, 1350000, 2000000, 2380000, 2950000, 3600000, 4550000, 6450000],
        tivi1:[280000, 500000, 750000, 1050000, 1250000, 1550000, 2000000, 2500000, 4300000],
        tivi2:[530000, 950000, 1450000, 2000000, 2380000, 2950000, 3800000, 4750000, 8150000],
        tulanh1:[220000, 390000, 600000, 880000, 1100000, 1200000, 1550000, 2000000, 3100000],
        tulanh2:[420000, 740000, 1150000, 1680000, 2100000, 2300000, 2950000, 3800000, 5900000],
        maygiat1:[270000, 440000, 660000, 950000, 1200000, 1450000, 1750000, 2200000, 3300000],
        maygiat2:[510000, 850000, 1250000, 1800000, 2300000, 2750000, 3350000, 4200000, 6300000],
        maylanh1:[240000, 420000, 640000, 920000, 1150000, 1300000, 1650000, 2100000, 3200000],
        maylanh2:[460000, 800000, 1250000, 1750000, 2300000, 2500000, 3150000, 4000000, 6100000]
    };

    const getUserContext = () => {
        const userObj = window.GLOBAL_AUTH ? window.GLOBAL_AUTH.currentUserData : null;
        if (!userObj) return { isLogged: false, isVip: false };
        return { isLogged: true, isVip: userObj.vip && userObj.vip.toString().toUpperCase() === "VIP" };
    };

    // ===============================================================
    // 2. CSS GIAO DIỆN (ĐÃ FIX CHECKBOX 1 HÀNG & CHUẨN FORM NHỎ GỌN)
    // ===============================================================
    const MY_CSS = `
        @keyframes slideInUp { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        
        #bh-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); z-index:2147483647; font-family: 'Segoe UI', system-ui, sans-serif; flex-direction:column; overflow: hidden; box-sizing: border-box; }
        #bh-app * { box-sizing: border-box; }
        
        /* Header Gọn Nhẹ */
        .bh-header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); padding: 8px 15px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; z-index: 20; height: 45px; flex-shrink: 0;}
        .bh-logo { font-size: 15px; font-weight: 900 !important; color: #00b894; text-transform: uppercase; display: flex; align-items: center; gap: 6px;}
        .bh-btn-close { background: #fff; color: #ff4757; border: 1px solid rgba(255,71,87,0.2); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; }
        
        /* Body Cố định cuộn bên trong */
        .bh-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin: 0 auto; width: 100%; height: 100%; overflow-y: auto; animation: slideInUp 0.3s ease-out; }
        
        /* Card dùng chung */
        .bh-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); padding: 10px; border: 1px solid #fff; flex-shrink: 0;}
        
        /* FIX YÊU CẦU: Checkbox ép nằm trên 1 hàng duy nhất */
        .bh-checkbox-group { display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; margin-bottom: 10px; font-size: 12px; font-weight: 700; overflow-x: auto; white-space: nowrap; gap: 4px; scrollbar-width: none; }
        .bh-checkbox-group::-webkit-scrollbar { display: none; }
        .bh-checkbox-group label { display: flex; align-items: center; gap: 3px; cursor: pointer; color:#2d3436; }
        .bh-checkbox-group input[type="checkbox"] { width: 14px; height: 14px; cursor: pointer; accent-color: #00b894; margin:0;}

        /* Bảng input */
        .bh-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .bh-table td { padding: 6px 2px; border-bottom: 1px dashed #f1f2f6; vertical-align: middle; }
        .bh-table tr:last-child td { border-bottom: none; }
        
        .bh-label { width: 38%; font-weight: 600; color: #636e72; }
        .bh-input-td { width: 62%; position: relative; }
        
        /* Input & Select & Text Giả */
        .bh-table input[type="text"], .bh-table input[type="number"], .bh-table select, .bh-fake-input { 
            width: 100%; padding: 6px 8px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; font-weight: 700; outline: none; background: #f4f6f8; transition: 0.2s; box-sizing: border-box; display: block; height: 32px; color: #2d3436;
        }
        .bh-table select { cursor: pointer; appearance: auto; }
        .bh-fake-input { background: transparent; text-align: right; font-weight: 900 !important; border: none; padding-right: 2px;}

        .bh-table input:focus, .bh-table select:focus { background: #fff; border-color: #00b894; box-shadow: 0 0 0 2px rgba(0, 184, 148, 0.2); }
        .bh-table input.txt-right { text-align: right; }
        .bh-table input.txt-center { text-align: center; }

        .bh-input-wrapper { display: flex; gap: 5px; width: 100%; align-items: center; }
        .bh-input-wrapper input, .bh-input-wrapper select { flex: 1; min-width: 0; }
        
        /* Nút VIP chọn sản phẩm */
        #bh-vip-select { flex: 0 0 100px; background: linear-gradient(135deg, #FFD700, #FDB931); color: #5d4037; font-weight: 900; font-size: 12px; border:none; box-shadow: 0 2px 5px rgba(255,215,0,0.4); text-align:center; padding:0 4px;}

        /* Background tiêu đề bảng 1 */
        .bh-group-title { font-weight: 800; text-align: center; padding: 6px !important; color: #2d3436; border-radius: 6px; margin-top: 6px; font-size:12px; text-transform:uppercase;}
        .bg-kv { background: #ffeaa7; } .bg-rv { background: #fab1a0; } .bg-mr { background: #81ecec; } .bg-11 { background: #a29bfe; color: white !important;}
        
        .bh-note { color: #00b894; font-size: 11px; font-weight: 700; margin-top: 8px; text-align: center; display:none; background: #f0fff4; padding: 6px; border-radius: 6px;}

        .bh-hide { display: none !important; }
        .bh-flex-row { display: flex; align-items: center; justify-content: space-between; gap: 5px; }
        .bh-radio-wrap { display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; font-weight:600;}
        .bh-radio-wrap input[type="radio"] { accent-color: #0984e3; cursor:pointer; margin:0;}
    `;

    // ===============================================================
    // 3. LOGIC TÍNH TOÁN CỐT LÕI
    // ===============================================================
    const formatNum = (x) => x ? Number(x).toLocaleString('vi-VN') : '0';
    const roundCustom = (number, digits = -3) => {
        const factor = Math.pow(10, Math.abs(digits));
        return Math.round(number / factor) * factor; // Làm tròn đến hàng nghìn
    };

    const getPhiDienThoai = (x) => {
        if (x <= 2000000) return 0; if (x <= 5000000) return 1; if (x <= 10000000) return 2;
        if (x <= 15000000) return 3; if (x <= 20000000) return 4; if (x <= 25000000) return 5;
        if (x <= 30000000) return 6; if (x <= 40000000) return 7; return 8;
    };

    const getPhiTivi = (x) => {
        if (x <= 5000000) return 0; if (x <= 10000000) return 1; if (x <= 15000000) return 2;
        if (x <= 20000000) return 3; if (x <= 25000000) return 4; if (x <= 30000000) return 5;
        if (x <= 40000000) return 6; if (x <= 50000000) return 7; return 8;
    };

    const getPhiKhac = (x) => {
        if (x <= 5000000) return 0; if (x <= 10000000) return 1; if (x <= 15000000) return 2;
        if (x <= 20000000) return 3; if (x <= 25000000) return 4; if (x <= 30000000) return 5;
        if (x <= 40000000) return 6; if (x <= 50000000) return 7; return 8;
    };

    const checkTiLe = (a) => {
        a = parseInt(a);
        if (a < 7) return 2.6 / 100;
        if (a >= 7 && a <= 9) return 2.9 / 100;
        return 3.5 / 100;
    };

    // Hàm quy đổi Nhóm hàng (Chữ hoặc Số ở Cột D) ra Value của Dropdown
    const mapGroupToValue = (groupStr) => {
        if(!groupStr) return "1";
        let g = groupStr.toString().trim().toLowerCase();
        
        // Nếu file GSheet ghi sẵn số 1, 2, 3...
        if (!isNaN(g) && parseInt(g) >= 1 && parseInt(g) <= 15) return parseInt(g).toString();

        // Nhận diện theo tên chữ
        if (g.includes('điện thoại') || g.includes('dtdd')) return "1";
        if (g.includes('tablet') || g.includes('bảng')) return "2";
        if (g.includes('laptop') || g.includes('máy tính xách tay')) return "3";
        if (g.includes('watch') || g.includes('đồng hồ')) return "4";
        if (g.includes('tivi') || g.includes('tv')) return "5";
        if (g.includes('tủ lạnh')) return "6";
        if (g.includes('tủ đông')) return "7";
        if (g.includes('tủ mát')) return "8";
        if (g.includes('giặt')) return "9";
        if (g.includes('sấy')) return "10";
        if (g.includes('rửa')) return "11";
        if (g.includes('loa')) return "12";
        if (g.includes('lạnh') || g.includes('điều hòa')) return "13";
        if (g.includes('lọc nước')) return "14";
        if (g.includes('gia dụng')) return "15";

        return "1"; // Mặc định điện thoại
    };

    // ===============================================================
    // 4. KHỞI TẠO TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('bh-app');
        const userInfo = getUserContext();
        let vipProducts = []; // Lưu cache list sp

        if (!app) {
            app = document.createElement('div');
            app.id = 'bh-app';
            app.innerHTML = `
                <div class="bh-header">
                    <div class="bh-logo">Tính Trả Góp & Bảo Hiểm</div>
                    <button class="bh-btn-close" id="bh-btn-close">✖</button>
                </div>
                
                <div class="bh-body">
                    <!-- Khối Tính Toán -->
                    <div class="bh-card" style="background: linear-gradient(145deg, #1e293b, #0f172a); color: white; border:none; padding:12px;">
                        <table class="bh-table" style="color:white; border:none;">
                            <!-- DÒNG NHẬP SẢN PHẨM CÓ NÚT VIP -->
                            <tr>
                                <td colspan="2" style="border:none; padding:0 0 10px 0;">
                                    <div class="bh-input-wrapper">
                                        <input type="text" id="bh-tensp" placeholder="Tên sản phẩm..." style="background: rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);">
                                        <select id="bh-vip-select" class="bh-hide">
                                            <option value="">✦ Kéo Data</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label" style="color:#cbd5e1;">Nhóm Hàng:</td>
                                <td class="bh-input-td" style="border:none;">
                                    <select id="bh-nhomhang" class="txt-center" style="background: rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);">
                                        <option value="1" style="color:#000">Điện thoại</option>
                                        <option value="2" style="color:#000">Tablet</option>
                                        <option value="3" style="color:#000">Laptop</option>
                                        <option value="4" style="color:#000">Smart Watch</option>
                                        <option value="5" style="color:#000">Tivi</option>
                                        <option value="6" style="color:#000">Tủ lạnh</option>
                                        <option value="7" style="color:#000">Tủ đông</option>
                                        <option value="8" style="color:#000">Tủ mát</option>
                                        <option value="9" style="color:#000">Máy giặt</option>
                                        <option value="10" style="color:#000">Máy sấy</option>
                                        <option value="11" style="color:#000">Máy rửa chén</option>
                                        <option value="12" style="color:#000">Loa thanh/kéo</option>
                                        <option value="13" style="color:#000">Máy lạnh</option>
                                        <option value="14" style="color:#000">Máy lọc nước</option>
                                        <option value="15" style="color:#000">Gia dụng</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label" style="color:#cbd5e1;">Giá Gốc:</td>
                                <td class="bh-input-td" style="border:none;">
                                    <input type="text" id="bh-giagoc" class="txt-right" placeholder="0" inputmode="numeric" style="background: rgba(255,255,255,0.9); color:#d63031;">
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label" style="color:#cbd5e1;">Giá Bán:</td>
                                <td class="bh-input-td" style="border:none;">
                                    <input type="text" id="bh-giaban" class="txt-right" placeholder="0" inputmode="numeric" style="background: rgba(255,255,255,0.9); color:#0984e3;">
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Khối Tùy Chọn Trả Góp & Kết Quả -->
                    <div class="bh-card">
                        <table class="bh-table">
                            <tr>
                                <td class="bh-label">Ngân hàng:</td>
                                <td class="bh-input-td">
                                    <select id="bh-phidongtien" class="txt-center">
                                        <option value="11000">Home Credit (11k)</option>
                                        <option value="12000">FE / MAFC (12k)</option>
                                        <option value="10000">ACS / SHINHAN (10k)</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Trả trước:</td>
                                <td class="bh-input-td">
                                    <div class="bh-input-wrapper">
                                        <input type="text" id="bh-tratruoc" class="txt-right" value="30" inputmode="numeric">
                                        <select id="bh-kieutratruoc" style="flex: 0 0 55px; padding:6px 2px;">
                                            <option value="1">%</option>
                                            <option value="2">VND</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Lãi suất & Kỳ:</td>
                                <td class="bh-input-td">
                                    <div class="bh-input-wrapper">
                                        <input type="number" id="bh-laisuat" class="txt-center" value="0" step="0.1" min="0" placeholder="%"> 
                                        <select id="bh-kygop" class="txt-center" style="flex: 0 0 55px; padding:6px 2px;">
                                            <option value="4">4T</option> <option value="5">5T</option>
                                            <option value="6" selected>6T</option> <option value="7">7T</option>
                                            <option value="8">8T</option> <option value="9">9T</option>
                                            <option value="10">10T</option> <option value="11">11T</option>
                                            <option value="12">12T</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Nợ lại:</td>
                                <td class="bh-input-td"><div id="out-nolai" class="bh-fake-input">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Góp tháng:</td>
                                <td class="bh-input-td"><div id="out-gopthang" class="bh-fake-input" style="color: #d63031; font-size:16px;">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Đưa trước (Σ):</td>
                                <td class="bh-input-td"><div id="out-tongtratruoc" class="bh-fake-input" style="color: #00b894; font-size:16px;">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Chênh lệch:</td>
                                <td class="bh-input-td"><div id="out-chenhlech" class="bh-fake-input" style="color: #0984e3; font-size:16px;">0</div></td>
                            </tr>
                        </table>
                    </div>

                    <!-- Khối Tùy Chọn Bảo Hiểm (Ép chung 1 dòng) -->
                    <div class="bh-card">
                        <div class="bh-checkbox-group">
                            <label><input type="checkbox" id="cb-bhkv"> Vay</label>
                            <label><input type="checkbox" id="cb-bhrv"> R.Vỡ</label>
                            <label><input type="checkbox" id="cb-bhmr"> M.Rộng</label>
                            <label><input type="checkbox" id="cb-bh11"> 1đổi1</label>
                        </div>
                        <table class="bh-table">
                            <tr class="row-bhkv bh-hide"><td colspan="2" class="bh-group-title bg-kv">Bảo hiểm khoản vay</td></tr>
                            <tr class="row-bhkv bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row" style="justify-content: flex-end;">
                                        <span id="out-kv" style="font-weight:900; color:#d63031; margin-right:10px;">0</span>
                                        <label class="bh-radio-wrap"><input type="radio" checked> Có</label>
                                    </div>
                                </td>
                            </tr>

                            <tr class="row-bhrv bh-hide"><td colspan="2" class="bh-group-title bg-rv">Bảo hiểm rơi vỡ</td></tr>
                            <tr class="row-bhrv bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row">
                                        <div class="bh-flex-row" style="flex:1;">
                                            <label class="bh-radio-wrap"><input id="rad-rv-6t" type="radio" name="rad-bhrv" checked> 6T:</label>
                                            <span id="out-rv-6t" style="font-weight:900; color:#d63031;">0</span>
                                        </div>
                                        <div class="bh-flex-row" style="flex:1; justify-content: flex-end;">
                                            <label class="bh-radio-wrap"><input id="rad-rv-12t" type="radio" name="rad-bhrv"> 12T:</label>
                                            <span id="out-rv-12t" style="font-weight:900; color:#d63031;">0</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr class="row-bhmr bh-hide"><td colspan="2" class="bh-group-title bg-mr">Bảo hiểm mở rộng</td></tr>
                            <tr class="row-bhmr bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row">
                                        <div class="bh-flex-row" style="flex:1;">
                                            <label class="bh-radio-wrap"><input id="rad-mr-12t" type="radio" name="rad-bhmr" checked> 12T:</label>
                                            <span id="out-mr-12t" style="font-weight:900; color:#d63031;">0</span>
                                        </div>
                                        <div class="bh-flex-row" style="flex:1; justify-content: flex-end;">
                                            <label class="bh-radio-wrap"><input id="rad-mr-24t" type="radio" name="rad-bhmr"> 24T:</label>
                                            <span id="out-mr-24t" style="font-weight:900; color:#d63031;">0</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr class="row-bh11 bh-hide"><td colspan="2" class="bh-group-title bg-11">Bảo hiểm 1 đổi 1</td></tr>
                            <tr class="row-bh11 bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row" style="justify-content: flex-end;">
                                        <span id="out-bh11" style="font-weight:900; color:#d63031; margin-right:10px;">0</span>
                                        <label class="bh-radio-wrap"><input type="radio" checked> 12T</label>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        <div id="bh-note-msg" class="bh-note"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            const $ = (id) => app.querySelector('#' + id);
            const $$ = (sel) => app.querySelectorAll(sel);

            $('bh-btn-close').onclick = () => { app.style.display = 'none'; };

            // === TÍNH NĂNG VIP: LẤY DANH SÁCH SẢN PHẨM ===
            // DÁN LINK API MỚI VÀO ĐÂY:
            const VIP_PRODUCT_API_URL = 'https://script.google.com/macros/s/AKfycbwJ4_q31vne_qbgXpKcc0mdSgysqxoVUIvTCpupYf5_XDhBsQRm2oTa_Driq2UIqMAA/exec';

            if (userInfo.isVip) {
                const vipSelect = $('bh-vip-select');
                vipSelect.classList.remove('bh-hide');

                const loadVipDropdown = (data) => {
                    let html = '<option value="">✦ SP Mẫu</option>';
                    data.forEach((p, idx) => {
                        html += `<option value="${idx}">${p.name}</option>`;
                    });
                    vipSelect.innerHTML = html;
                };

                try {
                    const cached = localStorage.getItem('bh_vip_products');
                    if (cached) {
                        vipProducts = JSON.parse(cached);
                        loadVipDropdown(vipProducts);
                    }
                } catch(e){}

                const fetchProducts = () => {
                    const payload = { action: 'get_product_list' };
                    const processRes = (text) => {
                        try {
                            const json = JSON.parse(text);
                            if (json.status === 'success' && json.data) {
                                vipProducts = json.data;
                                localStorage.setItem('bh_vip_products', JSON.stringify(vipProducts));
                                loadVipDropdown(vipProducts);
                            }
                        } catch(e){}
                    };

                    if (context.GM_xmlhttpRequest) {
                        context.GM_xmlhttpRequest({ method: "POST", url: VIP_PRODUCT_API_URL, data: JSON.stringify(payload), onload: (res) => processRes(res.responseText) });
                    } else {
                        fetch(VIP_PRODUCT_API_URL, { method: "POST", body: JSON.stringify(payload) })
                            .then(r => r.text()).then(processRes).catch(()=>{});
                    }
                };
                fetchProducts();

                // Sự kiện khi VIP chọn sản phẩm trong Droplist
                vipSelect.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val !== "") {
                        const p = vipProducts[val];
                        $('bh-tensp').value = p.name;
                        $('bh-giagoc').value = p.priceOriginal ? Number(p.priceOriginal).toLocaleString('vi-VN') : '';
                        $('bh-giaban').value = p.priceSale ? Number(p.priceSale).toLocaleString('vi-VN') : '';
                        $('bh-nhomhang').value = mapGroupToValue(p.group);
                        
                        // Xóa focus khỏi ô drop list để dễ nhìn
                        vipSelect.blur();
                        calculateAll();
                    }
                });
            }

            // Xử lý show/hide thẻ Bảo Hiểm
            const toggleRow = (chkId, rowClass) => {
                $(chkId).addEventListener('change', (e) => {
                    $$(rowClass).forEach(el => el.classList.toggle('bh-hide', !e.target.checked));
                    calculateAll();
                });
            };
            toggleRow('cb-bhkv', '.row-bhkv');
            toggleRow('cb-bhrv', '.row-bhrv');
            toggleRow('cb-bhmr', '.row-bhmr');
            toggleRow('cb-bh11', '.row-bh11');

            // Định dạng input số
            const handleNumInput = (e) => {
                let val = e.target.value.replace(/\D/g, '');
                e.target.value = val ? Number(val).toLocaleString('vi-VN') : '';
                calculateAll();
            };
            $('bh-giagoc').addEventListener('input', handleNumInput);
            $('bh-giaban').addEventListener('input', handleNumInput);
            $('bh-tratruoc').addEventListener('input', handleNumInput);

            const idsToWatch =[ 'bh-nhomhang', 'bh-phidongtien', 'bh-kieutratruoc', 'bh-laisuat', 'bh-kygop', 'rad-rv-6t', 'rad-rv-12t', 'rad-mr-12t', 'rad-mr-24t' ];
            idsToWatch.forEach(id => { $(id).addEventListener('change', calculateAll); });
            $('bh-laisuat').addEventListener('input', calculateAll);

            function calculateAll() {
                let nhomhang = parseInt($('bh-nhomhang').value);
                
                let giagoc = parseInt($('bh-giagoc').value.replace(/\D/g, '')) || 0;
                let giaban = parseInt($('bh-giaban').value.replace(/\D/g, '')) || 0;
                let tratruoc = parseInt($('bh-tratruoc').value.replace(/\D/g, '')) || 0;
                
                let phiDongTien = parseInt($('bh-phidongtien').value) || 0;
                let kieuTraTruoc = parseInt($('bh-kieutratruoc').value);
                let laiSuat = parseFloat($('bh-laisuat').value) / 100 || 0;
                let soKy = parseInt($('bh-kygop').value);
                let tileKvay = checkTiLe(soKy);

                let rv6t = 0, rv12t = 0, mr12t = 0, mr24t = 0, bh11 = 0;

                switch(nhomhang) {
                    case 1: 
                        rv6t = roundCustom((5.96 / 100) * giagoc); rv12t = roundCustom((9.93 / 100) * giagoc);
                        mr12t = giagoc < 1000000 ? 0 : DATA.dienthoai1[getPhiDienThoai(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : DATA.dienthoai2[getPhiDienThoai(giagoc)];
                        bh11 = roundCustom(0.0462 * giagoc); bh11 = bh11 < 200000 ? 200000 : bh11; break;
                    case 2: case 3: 
                        rv6t = roundCustom((5.92 / 100) * giagoc); rv12t = roundCustom((9.87 / 100) * giagoc);
                        let arr1 = nhomhang === 2 ? DATA.dienthoai1 : DATA.laptop1;
                        let arr2 = nhomhang === 2 ? DATA.dienthoai2 : DATA.laptop2;
                        let func = nhomhang === 2 ? getPhiDienThoai : getPhiKhac;
                        mr12t = giagoc < 1000000 ? 0 : arr1[func(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : arr2[func(giagoc)];
                        bh11 = roundCustom(0.06 * giagoc); bh11 = bh11 < 200000 ? 200000 : bh11; break;
                    case 4: 
                        rv6t = roundCustom((5.16 / 100) * giagoc); rv12t = roundCustom((8.6 / 100) * giagoc);
                        mr12t = Math.max(70000, roundCustom(giagoc * 0.05));
                        mr24t = Math.max(70000, roundCustom(giagoc * 0.08)); break;
                    case 5: 
                        mr12t = giagoc < 1000000 ? 0 : DATA.tivi1[getPhiTivi(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : DATA.tivi2[getPhiTivi(giagoc)];
                        bh11 = roundCustom(0.07 * giagoc); break;
                    case 6: case 7: case 8: 
                        mr12t = giagoc < 1000000 ? 0 : DATA.tulanh1[getPhiKhac(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : (nhomhang===8 ? DATA.tulanh1[getPhiKhac(giagoc)] : DATA.tulanh2[getPhiKhac(giagoc)]);
                        bh11 = roundCustom(0.06 * giagoc); break;
                    case 9: case 10: case 11: 
                        mr12t = giagoc < 1000000 ? 0 : DATA.maygiat1[getPhiKhac(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : DATA.maygiat2[getPhiKhac(giagoc)];
                        bh11 = roundCustom(0.06 * giagoc); break;
                    case 12: 
                        mr12t = giagoc < 1000000 ? 0 : DATA.tivi1[getPhiDienThoai(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : DATA.tivi2[getPhiDienThoai(giagoc)];
                        bh11 = Math.max(100000, roundCustom(0.06 * giagoc)); break;
                    case 13: 
                        mr12t = giagoc < 1000000 ? 0 : DATA.maylanh1[getPhiKhac(giagoc)];
                        mr24t = giagoc < 1000000 ? 0 : DATA.maylanh2[getPhiKhac(giagoc)];
                        bh11 = roundCustom(0.06 * giagoc); break;
                    case 14: case 15: 
                        mr12t = Math.max(70000, roundCustom(giagoc * 0.05));
                        mr24t = Math.max(70000, roundCustom(giagoc * 0.08));
                        bh11 = Math.max(100000, roundCustom(0.06 * giagoc)); break;
                }

                let tienTraTruoc = kieuTraTruoc === 2 ? roundCustom(tratruoc) : roundCustom(giaban * (tratruoc / 100));
                let noLaiGoc = roundCustom(giaban - tienTraTruoc);

                let val_bhkv = $('cb-bhkv').checked ? (noLaiGoc <= 5000000 ? roundCustom(5000000 * tileKvay) : roundCustom(noLaiGoc * tileKvay)) : 0;
                let val_bhrv = $('cb-bhrv').checked ? ($('rad-rv-6t').checked ? rv6t : rv12t) : 0;
                let val_bhmr = $('cb-bhmr').checked ? ($('rad-mr-12t').checked ? mr12t : mr24t) : 0;
                let val_bh11 = $('cb-bh11').checked ? bh11 : 0;

                $('out-rv-6t').innerText = rv6t ? formatNum(rv6t) : "N/A";
                $('out-rv-12t').innerText = rv12t ? formatNum(rv12t) : "N/A";
                $('out-mr-12t').innerText = mr12t ? formatNum(mr12t) : "N/A";
                $('out-mr-24t').innerText = mr24t ? formatNum(mr24t) : "N/A";
                $('out-kv').innerText = formatNum(val_bhkv);
                $('out-bh11').innerText = formatNum(bh11);

                let tongGopDau = roundCustom(tienTraTruoc + val_bhkv + val_bhrv + val_bhmr + val_bh11);
                let tienLaiMoiThang = noLaiGoc * laiSuat;
                let gopMoiThang = roundCustom((noLaiGoc / soKy) + tienLaiMoiThang + phiDongTien);
                let tongTienPhaiTra = (gopMoiThang * soKy) + tongGopDau;
                let chenhLech = roundCustom(tongTienPhaiTra - giaban);

                $('out-tongtratruoc').innerText = formatNum(tongGopDau);
                $('out-nolai').innerText = formatNum(noLaiGoc);
                $('out-gopthang').innerText = formatNum(gopMoiThang);
                $('out-chenhlech').innerText = formatNum(chenhLech);

                let msgBox = $('bh-note-msg');
                let arrMsg =[];
                if (val_bhkv) arrMsg.push(`KVay: ${formatNum(val_bhkv)}`);
                if (val_bhrv) arrMsg.push(`RV: ${formatNum(val_bhrv)}`);
                if (val_bhmr) arrMsg.push(`MR: ${formatNum(val_bhmr)}`);
                if (val_bh11) arrMsg.push(`1-1: ${formatNum(val_bh11)}`);
                
                if (arrMsg.length > 0) {
                    msgBox.style.display = 'block';
                    msgBox.innerText = `+ Phí Bảo hiểm: [ ${arrMsg.join(' | ')} ]`;
                } else {
                    msgBox.style.display = 'none';
                }
            }
            calculateAll();
        }
        app.style.display = 'flex';
    };

    return {
        name: "Tính Trả Góp",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v4h10V4H7zm0 6v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2z"/></svg>`,
        bgColor: "#00b894",
        action: runTool
    };
})
