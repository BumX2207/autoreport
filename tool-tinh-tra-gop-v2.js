((context) => {
    // ===============================================================
    // 1. DATA & USER CONTEXT
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
        if (!userObj) return { isLogged: false, isVip: false, username: null };
        return { isLogged: true, isVip: userObj.vip && userObj.vip.toString().toUpperCase() === "VIP", username: userObj.user };
    };

    // ===============================================================
    // 2. CSS (GIỮ NGUYÊN FORM GỐC + THÊM PANEL QUẢN LÝ SP)
    // ===============================================================
    const MY_CSS = `
        @keyframes slideInUp { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        #bh-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#f0f2f5; z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow-y:auto; box-sizing: border-box; }
        #bh-app * { box-sizing: border-box; }
        
        .bh-header { background:#fff; padding:15px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display:flex; justify-content:center; align-items:center; position:sticky; top:0; z-index:20; height:60px; }
        .bh-logo { font-size:18px; font-weight:bold; color:#0984e3; text-transform:uppercase; }
        .bh-btn-close { position:absolute; right:20px; background:#ffeaa7; color:#d63031; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; }
        .bh-btn-close:hover { background:#d63031; color:white; }

        .bh-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; max-width: 500px; margin: 0 auto; width: 100%; }
        .bh-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 15px; border: 1px solid #e1e8ed; position: relative;}
        
        .bh-checkbox-group { display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; margin-bottom: 15px; font-size: 14px; font-weight: 600; overflow-x: auto; white-space: nowrap; gap: 8px; scrollbar-width: none; }
        .bh-checkbox-group::-webkit-scrollbar { display: none; }
        .bh-checkbox-group label { display: flex; align-items: center; gap: 5px; cursor: pointer; color:#2d3436; }
        .bh-checkbox-group input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #0984e3; margin:0;}

        .bh-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .bh-table td { padding: 8px 10px; border-bottom: 1px solid #f1f2f6; vertical-align: middle; }
        .bh-table tr:last-child td { border-bottom: none; }
        
        .bh-label { width: 40%; font-weight: 500; color: #636e72; }
        .bh-input-td { width: 60%; position: relative; }
        
        .bh-table input[type="text"], .bh-table input[type="number"], .bh-table select, .bh-fake-input { 
            width: 100%; padding: 6px 10px; border: 1px solid #dfe6e9; border-radius: 6px; font-size: 14px; outline: none; background: #fff; transition: 0.2s; box-sizing: border-box; display: block;
        }
        .bh-fake-input { background: #f8f9fa; border-color: transparent; text-align: right; font-weight: bold; }
        .bh-table input[type="text"]:focus, .bh-table select:focus { border-color: #0984e3; box-shadow: 0 0 5px rgba(9, 132, 227, 0.2); }
        .bh-table input.txt-right { text-align: right; }
        .bh-table input.txt-center { text-align: center; }

        .bh-input-wrapper { display: flex; gap: 5px; width: 100%; align-items: center; }
        .bh-input-wrapper input, .bh-input-wrapper select { flex: 1; min-width: 0; } 

        .bh-group-title { font-weight: bold; text-align: center; padding: 10px !important; color: #2d3436; border-radius: 6px; margin-top: 10px; }
        .bg-kv { background: #ffeaa7; } .bg-rv { background: #fab1a0; } .bg-mr { background: #81ecec; } .bg-11 { background: #a29bfe; color: white !important;}
        
        .bh-note { color: #d63031; font-size: 13px; font-style: italic; margin-top: 10px; text-align: center; line-height: 1.5; display:none; }
        .bh-hide { display: none !important; }
        .bh-flex-row { display: flex; align-items: center; justify-content: space-between; gap: 5px; }
        .bh-radio-wrap { display: flex; align-items: center; gap: 4px; cursor: pointer; }
        .bh-radio-wrap input[type="radio"] { accent-color: #0984e3; cursor:pointer;}

        /* CSS MỚI: Toolbar Cá nhân hóa */
        .bh-personal-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
        .bh-btn-sm { font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; transition: 0.2s; }
        .bh-btn-save { background: #0984e3; color: white; }
        .bh-btn-save:hover { background: #076aba; }
        .bh-btn-manage { background: #dfe6e9; color: #2d3436; }
        .bh-btn-manage:hover { background: #b2bec3; }

        /* CSS MỚI: Panel Quản lý */
        #bh-manage-panel { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 30; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s forwards; }
        .bh-manage-content { background: #fff; width: 100%; max-width: 500px; height: 75%; border-radius: 15px 15px 0 0; display: flex; flex-direction: column; animation: slideInUp 0.3s forwards; }
        .bh-manage-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; border-radius: 15px 15px 0 0; font-weight: bold; }
        .bh-manage-list { padding: 10px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .bh-manage-item { border: 1px solid #dfe6e9; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; background: #fff; }
        .bh-manage-info { display: flex; flex-direction: column; gap: 4px; }
        .bh-manage-name { font-weight: bold; color: #0984e3; font-size: 14px;}
        .bh-manage-price { font-size: 12px; color: #636e72; }
        .bh-btn-del { background: #ff7675; color: white; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        #bh-sync-status { font-size: 11px; color: #00b894; text-align: center; height: 15px; margin-top: -10px; }
    `;

    // ===============================================================
    // 3. LOGIC TÍNH TOÁN
    // ===============================================================
    const formatNum = (x) => x ? Number(x).toLocaleString('vi-VN') : '0';
    const roundCustom = (number, digits = -3) => {
        const factor = Math.pow(10, Math.abs(digits));
        return Math.round(number / factor) * factor; 
    };

    const getPhiDienThoai = (x) => { if (x <= 2000000) return 0; if (x <= 5000000) return 1; if (x <= 10000000) return 2; if (x <= 15000000) return 3; if (x <= 20000000) return 4; if (x <= 25000000) return 5; if (x <= 30000000) return 6; if (x <= 40000000) return 7; return 8; };
    const getPhiTivi = (x) => { if (x <= 5000000) return 0; if (x <= 10000000) return 1; if (x <= 15000000) return 2; if (x <= 20000000) return 3; if (x <= 25000000) return 4; if (x <= 30000000) return 5; if (x <= 40000000) return 6; if (x <= 50000000) return 7; return 8; };
    const getPhiKhac = (x) => { if (x <= 5000000) return 0; if (x <= 10000000) return 1; if (x <= 15000000) return 2; if (x <= 20000000) return 3; if (x <= 25000000) return 4; if (x <= 30000000) return 5; if (x <= 40000000) return 6; if (x <= 50000000) return 7; return 8; };

    const checkTiLe = (a) => {
        a = parseInt(a);
        if (a < 7) return 2.6 / 100;
        if (a >= 7 && a <= 9) return 2.9 / 100;
        return 3.5 / 100;
    };

    const mapGroupToValue = (groupStr) => {
        if(!groupStr) return "1";
        let g = groupStr.toString().trim().toLowerCase();
        if (!isNaN(g) && parseInt(g) >= 1 && parseInt(g) <= 15) return parseInt(g).toString();
        if (g.includes('điện thoại') || g.includes('dtdd')) return "1";
        if (g.includes('tablet') || g.includes('bảng')) return "2";
        if (g.includes('laptop')) return "3";
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
        return "1";
    };

    // ===============================================================
    // 4. TIỆN ÍCH CHÍNH & API CÁ NHÂN HÓA
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('bh-app');
        const userInfo = getUserContext();
        
        let personalModels = []; // Dữ liệu riêng của user
        let defaultModels = [];  // Dữ liệu chung mặc định

        const API_URL = 'https://script.google.com/macros/s/AKfycbwJ4_q31vne_qbgXpKcc0mdSgysqxoVUIvTCpupYf5_XDhBsQRm2oTa_Driq2UIqMAA/exec';

        if (!app) {
            app = document.createElement('div');
            app.id = 'bh-app';
            
            const vipSelectHTML = userInfo.isVip 
                ? `<select id="bh-vip-select" style="flex: 0 0 110px; background: #ffeaa7; color: #d63031; font-weight: bold; cursor: pointer;">
                        <option value="" disabled selected>Model</option>
                   </select>` 
                : `<select id="bh-vip-select" disabled style="flex: 0 0 110px; background: #eee; color: #aaa; cursor: not-allowed;">
                        <option value="">🔒 VIP SP</option>
                   </select>`;

            // Thanh Toolbar hiển thị cho VIP
            const vipToolbarHTML = userInfo.isVip
                ? `<div class="bh-personal-toolbar">
                        <button class="bh-btn-sm bh-btn-save" id="btn-save-sp">💾 Lưu SP</button>
                        <button class="bh-btn-sm bh-btn-manage" id="btn-manage-sp">⚙️ Quản lý</button>
                   </div>` : '';

            app.innerHTML = `
                <div class="bh-header">
                    <div class="bh-logo">Tính Toán Trả Góp & Bảo Hiểm</div>
                    <button class="bh-btn-close" id="bh-btn-close" title="Đóng">✖</button>
                </div>
                
                <div class="bh-body">
                    <!-- Bảng 1: Chọn Bảo Hiểm -->
                    <div class="bh-card">
                        <div class="bh-checkbox-group">
                            <label><input type="checkbox" id="cb-bhkv"> BHKV</label>
                            <label><input type="checkbox" id="cb-bhrv"> BHRV</label>
                            <label><input type="checkbox" id="cb-bhmr"> BHMR</label>
                            <label><input type="checkbox" id="cb-bh11"> BH1-1</label>
                        </div>
                        <table class="bh-table">
                            <tr>
                                <td class="bh-label" style="color:#0984e3; font-weight:bold;">Sản phẩm:</td>
                                <td class="bh-input-td">
                                    <select id="bh-nhomhang" class="txt-center">
                                        <option value="1">Điện thoại</option>
                                        <option value="2">Tablet</option>
                                        <option value="3">Laptop</option>
                                        <option value="4">Smart Watch</option>
                                        <option value="5">Tivi</option>
                                        <option value="6">Tủ lạnh</option>
                                        <option value="7">Tủ đông</option>
                                        <option value="8">Tủ mát</option>
                                        <option value="9">Máy giặt</option>
                                        <option value="10">Máy sấy</option>
                                        <option value="11">Máy rửa chén</option>
                                        <option value="12">Loa thanh/Loa kéo</option>
                                        <option value="13">Máy lạnh</option>
                                        <option value="14">Máy lọc nước</option>
                                        <option value="15">Gia dụng</option>
                                    </select>
                                </td>
                            </tr>
                            
                            <tr class="row-bhkv bh-hide"><td colspan="2" class="bh-group-title bg-kv">Bảo hiểm khoản vay</td></tr>
                            <tr class="row-bhkv bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row" style="justify-content: flex-end;">
                                        <span id="out-kv" style="font-weight:bold; color:#d63031; margin-right:10px;">0</span>
                                        <label class="bh-radio-wrap"><input type="radio" checked> Chọn</label>
                                    </div>
                                </td>
                            </tr>

                            <tr class="row-bhrv bh-hide"><td colspan="2" class="bh-group-title bg-rv">Bảo hiểm rơi vỡ</td></tr>
                            <tr class="row-bhrv bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row">
                                        <div class="bh-flex-row" style="flex:1;">
                                            <label class="bh-radio-wrap"><input id="rad-rv-6t" type="radio" name="rad-bhrv" checked> 6T:</label>
                                            <span id="out-rv-6t" style="font-weight:bold; color:#d63031;">0</span>
                                        </div>
                                        <div class="bh-flex-row" style="flex:1; justify-content: flex-end;">
                                            <label class="bh-radio-wrap"><input id="rad-rv-12t" type="radio" name="rad-bhrv"> 12T:</label>
                                            <span id="out-rv-12t" style="font-weight:bold; color:#d63031;">0</span>
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
                                            <span id="out-mr-12t" style="font-weight:bold; color:#d63031;">0</span>
                                        </div>
                                        <div class="bh-flex-row" style="flex:1; justify-content: flex-end;">
                                            <label class="bh-radio-wrap"><input id="rad-mr-24t" type="radio" name="rad-bhmr"> 24T:</label>
                                            <span id="out-mr-24t" style="font-weight:bold; color:#d63031;">0</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            <tr class="row-bh11 bh-hide"><td colspan="2" class="bh-group-title bg-11">Bảo hiểm 1 đổi 1</td></tr>
                            <tr class="row-bh11 bh-hide">
                                <td colspan="2">
                                    <div class="bh-flex-row" style="justify-content: flex-end;">
                                        <span id="out-bh11" style="font-weight:bold; color:#d63031; margin-right:10px;">0</span>
                                        <label class="bh-radio-wrap"><input type="radio" checked> 12T</label>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Bảng 2: Thông số tài chính -->
                    <div class="bh-card">
                        <div id="bh-sync-status"></div>
                        <table class="bh-table">
                            <tr>
                                <td colspan="2" style="border-bottom:none; padding-bottom:0;">
                                    <div class="bh-input-wrapper">
                                        <input type="text" id="bh-tensp" class="txt-center" placeholder="Tên sản phẩm..." style="background:#f8f9fa;">
                                        ${vipSelectHTML}
                                    </div>
                                    ${vipToolbarHTML}
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Giá gốc:</td>
                                <td class="bh-input-td"><input type="text" id="bh-giagoc" class="txt-right" placeholder="0" inputmode="numeric"></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Giá bán:</td>
                                <td class="bh-input-td"><input type="text" id="bh-giaban" class="txt-right" placeholder="0" inputmode="numeric"></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Ngân hàng:</td>
                                <td class="bh-input-td">
                                    <select id="bh-phidongtien" class="txt-center">
                                        <option value="11000">Home Credit</option>
                                        <option value="12000">FE / MAFC</option>
                                        <option value="10000">ACS / SHINHAN</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Phí thu hộ:</td>
                                <td class="bh-input-td"><div id="out-phithuho" class="bh-fake-input" style="color: #d63031;">11.000</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Trả trước:</td>
                                <td class="bh-input-td">
                                    <div class="bh-input-wrapper">
                                        <input type="text" id="bh-tratruoc" class="txt-right" value="30" inputmode="numeric">
                                        <select id="bh-kieutratruoc" style="flex: 0 0 65px;"><option value="1">%</option><option value="2">VND</option></select>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Tổng trả trước:</td>
                                <td class="bh-input-td"><div id="out-tongtratruoc" class="bh-fake-input" style="color: #d63031;">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Nợ lại:</td>
                                <td class="bh-input-td"><div id="out-nolai" class="bh-fake-input">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Lãi suất phẳng:</td>
                                <td class="bh-input-td">
                                    <div class="bh-input-wrapper">
                                        <input type="number" id="bh-laisuat" class="txt-right" value="0" step="0.1" min="0"> 
                                        <span style="font-weight:bold; width: 25px; text-align:center;">%</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Số kỳ góp:</td>
                                <td class="bh-input-td">
                                    <div class="bh-input-wrapper">
                                        <select id="bh-kygop" class="txt-center">
                                            <option value="4">4</option> <option value="5">5</option>
                                            <option value="6" selected>6</option> <option value="7">7</option>
                                            <option value="8">8</option> <option value="9">9</option>
                                            <option value="10">10</option> <option value="11">11</option>
                                            <option value="12">12</option>
                                        </select>
                                        <span style="font-size:13px; width: 40px; text-align:center;">tháng</span>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td class="bh-label">Góp mỗi tháng:</td>
                                <td class="bh-input-td"><div id="out-gopthang" class="bh-fake-input" style="color: #d63031;">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Tổng phải trả:</td>
                                <td class="bh-input-td"><div id="out-tongtien" class="bh-fake-input" style="color:#0984e3;">0</div></td>
                            </tr>
                            <tr>
                                <td class="bh-label">Chênh lệch:</td>
                                <td class="bh-input-td"><div id="out-chenhlech" class="bh-fake-input" style="color: #d63031;">0</div></td>
                            </tr>
                        </table>
                        <div id="bh-note-msg" class="bh-note"></div>
                    </div>

                    <!-- Panel Quản Lý SP (Chỉ dùng cho VIP) -->
                    <div id="bh-manage-panel">
                        <div class="bh-manage-content">
                            <div class="bh-manage-header">
                                <span>🛒 SP ĐÃ LƯU</span>
                                <button class="bh-btn-close" id="btn-close-manage" style="position:static; width:24px; height:24px;">✖</button>
                            </div>
                            <div class="bh-manage-list" id="bh-manage-list"></div>
                        </div>
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

            // =====================================
            // LOGIC VIP: FETCH DATA & QUẢN LÝ
            // =====================================
            if (userInfo.isVip) {
                const vipSelect = $('bh-vip-select');
                const statusEl = $('bh-sync-status');

                // Hàm nạp data vào Dropdown
                const loadDropdown = () => {
                    let dataToLoad = personalModels.length > 0 ? personalModels : defaultModels;
                    let html = '<option value="" disabled selected>⬇️ Chọn Model</option>';
                    dataToLoad.forEach((p, idx) => {
                        html += `<option value="${idx}">${p.name}</option>`;
                    });
                    vipSelect.innerHTML = html;
                    
                    // Nạp vào List quản lý
                    let listHtml = '';
                    if (personalModels.length === 0) {
                        listHtml = '<div style="text-align:center; color:#999; font-size:13px; margin-top:20px;">Bạn chưa lưu SP nào.</div>';
                    } else {
                        personalModels.forEach((p, idx) => {
                            listHtml += `
                                <div class="bh-manage-item">
                                    <div class="bh-manage-info">
                                        <span class="bh-manage-name">${p.name}</span>
                                        <span class="bh-manage-price">Gốc: ${Number(p.priceOriginal).toLocaleString('vi-VN')} | Bán: ${Number(p.priceSale).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <button class="bh-btn-del" data-idx="${idx}">✖</button>
                                </div>
                            `;
                        });
                    }
                    if($('bh-manage-list')) $('bh-manage-list').innerHTML = listHtml;
                };

                // Hàm API dùng chung
                const callApi = (payload, callback) => {
                    if (context.GM_xmlhttpRequest) {
                        context.GM_xmlhttpRequest({ method: "POST", url: API_URL, data: JSON.stringify(payload), onload: (res) => callback(res.responseText) });
                    } else {
                        fetch(API_URL, { method: "POST", body: JSON.stringify(payload) }).then(r => r.text()).then(callback).catch(()=>{});
                    }
                };

                // 1. Tải SP Cá Nhân (Từ Cột N)
                const fetchPersonal = () => {
                    callApi({ action: 'get_personal_models', user: userInfo.username }, (res) => {
                        try {
                            let j = JSON.parse(res);
                            if(j.status === 'success' && j.data) {
                                personalModels = JSON.parse(j.data);
                                localStorage.setItem('bh_personal_' + userInfo.username, j.data);
                            }
                        } catch(e){}
                        
                        // Nếu cá nhân trống, gọi tiếp SP Mặc định
                        if(personalModels.length === 0) fetchDefault();
                        else loadDropdown();
                    });
                };

                // 2. Tải SP Mặc định (Từ Kho)
                const fetchDefault = () => {
                    callApi({ action: 'get_product_list' }, (res) => {
                        try {
                            let j = JSON.parse(res);
                            if(j.status === 'success' && j.data) {
                                defaultModels = j.data;
                                localStorage.setItem('bh_default', JSON.stringify(defaultModels));
                                loadDropdown();
                            }
                        } catch(e){}
                    });
                };

                // Khởi chạy lấy Cache Local trước, rồi lấy từ Cloud
                try {
                    let cacheP = localStorage.getItem('bh_personal_' + userInfo.username);
                    let cacheD = localStorage.getItem('bh_default');
                    if(cacheP) personalModels = JSON.parse(cacheP);
                    if(cacheD) defaultModels = JSON.parse(cacheD);
                    loadDropdown();
                } catch(e){}
                fetchPersonal();

                // Sự kiện User chọn model trong list
                vipSelect.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val !== "") {
                        const sourceData = personalModels.length > 0 ? personalModels : defaultModels;
                        const p = sourceData[val];
                        $('bh-tensp').value = p.name;
                        $('bh-giagoc').value = p.priceOriginal ? Number(p.priceOriginal).toLocaleString('vi-VN') : '';
                        $('bh-giaban').value = p.priceSale ? Number(p.priceSale).toLocaleString('vi-VN') : '';
                        $('bh-nhomhang').value = p.group || "1";
                        vipSelect.blur();
                        calculateAll();
                    }
                });

                // Xử lý nút LƯU SP
                $('btn-save-sp').onclick = () => {
                    let name = $('bh-tensp').value.trim();
                    let priceOrig = parseInt($('bh-giagoc').value.replace(/\D/g, '')) || 0;
                    let priceSale = parseInt($('bh-giaban').value.replace(/\D/g, '')) || 0;
                    let group = $('bh-nhomhang').value;

                    if(name === "") return alert("Vui lòng nhập tên sản phẩm để lưu!");

                    let existingIdx = personalModels.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
                    if(existingIdx >= 0) {
                        personalModels[existingIdx].priceOriginal = priceOrig;
                        personalModels[existingIdx].priceSale = priceSale;
                        personalModels[existingIdx].group = group;
                        statusEl.innerText = "Đã cập nhật SP hiện có!";
                    } else {
                        personalModels.push({ name: name, priceOriginal: priceOrig, priceSale: priceSale, group: group });
                        statusEl.innerText = "Đã thêm mới SP!";
                    }

                    setTimeout(() => { statusEl.innerText = ""; }, 2000);
                    localStorage.setItem('bh_personal_' + userInfo.username, JSON.stringify(personalModels));
                    loadDropdown();
                    
                    // Đồng bộ lên Cloud
                    callApi({ action: 'sync_personal_models', user: userInfo.username, models: JSON.stringify(personalModels) }, ()=>{});
                };

                // Xử lý Panel Quản lý
                $('btn-manage-sp').onclick = () => { $('bh-manage-panel').style.display = 'flex'; };
                $('btn-close-manage').onclick = () => { $('bh-manage-panel').style.display = 'none'; };

                // Xóa SP trong Panel
                $('bh-manage-list').addEventListener('click', (e) => {
                    if(e.target.classList.contains('bh-btn-del')) {
                        let idx = e.target.getAttribute('data-idx');
                        if(confirm("Xóa sản phẩm này?")) {
                            personalModels.splice(idx, 1);
                            localStorage.setItem('bh_personal_' + userInfo.username, JSON.stringify(personalModels));
                            loadDropdown();
                            callApi({ action: 'sync_personal_models', user: userInfo.username, models: JSON.stringify(personalModels) }, ()=>{});
                            
                            // Nếu xóa hết, tự động load lại SP mặc định
                            if(personalModels.length === 0 && defaultModels.length > 0) loadDropdown();
                        }
                    }
                });
            }

            // =====================================
            // LOGIC CƠ BẢN CỦA TOOL
            // =====================================
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

                $('out-phithuho').innerText = formatNum(phiDongTien);
                $('out-tongtratruoc').innerText = formatNum(tongGopDau);
                $('out-nolai').innerText = formatNum(noLaiGoc);
                $('out-gopthang').innerText = formatNum(gopMoiThang);
                $('out-tongtien').innerText = formatNum(tongTienPhaiTra);
                $('out-chenhlech').innerText = formatNum(chenhLech);

                let msgBox = $('bh-note-msg');
                let arrMsg =[];
                if (val_bhkv) arrMsg.push(`KVay: ${formatNum(val_bhkv)}`);
                if (val_bhrv) arrMsg.push(`RV: ${formatNum(val_bhrv)}`);
                if (val_bhmr) arrMsg.push(`MR: ${formatNum(val_bhmr)}`);
                if (val_bh11) arrMsg.push(`1-1: ${formatNum(val_bh11)}`);
                
                if (arrMsg.length > 0) {
                    msgBox.style.display = 'block';
                    msgBox.innerText = `* Đưa trước bao gồm: [ ${arrMsg.join(' | ')} ]`;
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
