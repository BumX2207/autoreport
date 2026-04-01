((context) => {
    // ===============================================================
    // 1. DATA GAME BẦU CUA
    // ===============================================================
    const SYMBOLS = [
        { id: 'nai', name: 'Nai', emoji: '🦌', color: '#8e44ad' },
        { id: 'bau', name: 'Bầu', emoji: '🍐', color: '#27ae60' },
        { id: 'ga', name: 'Gà', emoji: '🐓', color: '#e67e22' },
        { id: 'ca', name: 'Cá', emoji: '🐟', color: '#2980b9' },
        { id: 'cua', name: 'Cua', emoji: '🦀', color: '#d35400' },
        { id: 'tom', name: 'Tôm', emoji: '🦐', color: '#c0392b' }
    ];

    const CHIPS = [10000, 50000, 100000, 500000];

    // ===============================================================
    // 2. CSS GIAO DIỆN
    // ===============================================================
    const MY_CSS = `
        #bc-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#1e272e; z-index:2147483647; font-family: 'Segoe UI', Tahoma, sans-serif; flex-direction:column; overflow:hidden; box-sizing: border-box; }
        #bc-app * { box-sizing: border-box; user-select: none; }
        
        /* Header */
        .bc-header { background:#c0392b; padding:15px 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display:flex; justify-content:space-between; align-items:center; z-index:20; height:60px; flex-shrink: 0; border-bottom: 2px solid #f1c40f;}
        .bc-logo { font-size:20px; font-weight:900 !important; color:#f1c40f; text-transform:uppercase; display:flex; align-items:center; gap:10px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);}
        .bc-btn-close { background:#f1c40f; color:#c0392b; border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s; font-size:16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);}
        .bc-btn-close:hover { background:#fff; transform:scale(1.1);}

        /* Body Layout */
        .bc-body { flex: 1; display: flex; padding: 20px; gap: 20px; overflow-y: auto; }
        .bc-panel { background: rgba(255,255,255,0.05); border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); padding: 20px; display: flex; flex-direction: column; }
        
        /* CỘT TRÁI: KHU VỰC LẮC */
        .bc-left { flex: 4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; position: relative; }
        .bc-plate-wrapper { position: relative; width: 300px; height: 300px; display:flex; align-items:center; justify-content:center; }
        
        /* Đĩa và Xúc xắc */
        .bc-plate { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, #ecf0f1 40%, #bdc3c7 100%); border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2); border: 8px solid #dcdde1; display:flex; flex-wrap:wrap; justify-content:center; align-content:center; gap: 10px; padding: 40px;}
        .bc-dice { width: 70px; height: 70px; background: #fff; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.3), inset 0 -4px 5px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 45px; transform: scale(0); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .bc-dice.show { transform: scale(1) rotate(calc(var(--rot) * 1deg)); }

        /* Cái Nắp (Bát) */
        .bc-bowl { position: absolute; width: 105%; height: 105%; background: radial-gradient(circle at 30% 30%, #e74c3c 10%, #c0392b 80%); border-radius: 50%; box-shadow: 0 20px 30px rgba(0,0,0,0.6), inset 0 10px 20px rgba(255,255,255,0.2); z-index: 10; transition: transform 0.6s ease-in-out, opacity 0.5s; display:flex; align-items:center; justify-content:center; }
        .bc-bowl::after { content: ''; width: 80px; height: 80px; border-radius: 50%; background: #922b21; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
        
        /* Hiệu ứng rung và mở nắp */
        .bc-bowl.shake { animation: bowlShake 0.4s infinite; }
        .bc-bowl.open { transform: translateY(-350px) scale(0.9); opacity: 0; pointer-events: none; }
        @keyframes bowlShake { 
            0% { transform: translate(0, 0) rotate(0deg); } 
            25% { transform: translate(-8px, 5px) rotate(-3deg); } 
            50% { transform: translate(8px, -5px) rotate(3deg); } 
            75% { transform: translate(-8px, -5px) rotate(-3deg); } 
            100% { transform: translate(0, 0) rotate(0deg); } 
        }

        /* Nút Điều Khiển */
        .bc-controls { display:flex; gap:15px; width:100%; max-width:300px; }
        .bc-btn { flex:1; padding:15px; border:none; border-radius:8px; font-size:16px; font-weight:900; text-transform:uppercase; cursor:pointer; transition:0.2s; color:white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .bc-btn-shake { background:#f39c12; }
        .bc-btn-shake:hover:not(:disabled) { background:#e67e22; transform:translateY(-2px); }
        .bc-btn-open { background:#27ae60; }
        .bc-btn-open:hover:not(:disabled) { background:#2ecc71; transform:translateY(-2px); }
        .bc-btn:disabled { background:#7f8c8d; cursor:not-allowed; transform:none; box-shadow:none;}

        /* CỘT PHẢI: BÀN CƯỢC & TÀI KHOẢN */
        .bc-right { flex: 6; display: flex; flex-direction: column; gap: 15px; }
        
        /* Thanh Tài Khoản */
        .bc-account { background: #2f3640; padding: 15px 20px; border-radius: 10px; display:flex; justify-content:space-between; align-items:center; border: 1px solid #353b48; }
        .bc-acc-label { color:#f5f6fa; font-size:16px; font-weight:bold; }
        .bc-acc-balance { color:#f1c40f; font-size:24px; font-weight:900; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        
        /* Chọn Phỉnh Cược */
        .bc-chips { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; background:#2f3640; padding:10px; border-radius:10px;}
        .bc-chip { padding:8px 15px; border-radius:20px; font-weight:bold; font-size:14px; cursor:pointer; border:2px solid transparent; background:#353b48; color:white; transition:0.2s; }
        .bc-chip.active { background:#f1c40f; color:#2d3436; border-color:#f39c12; box-shadow:0 0 10px rgba(241,196,15,0.5); transform:scale(1.05);}
        
        /* Bàn Cược */
        .bc-board { flex:1; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
        .bc-card { background: #353b48; border-radius: 12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:15px; cursor:pointer; border: 2px solid transparent; transition:0.2s; position:relative; overflow:hidden;}
        .bc-card:hover { background: #404856; }
        .bc-card-emoji { font-size:50px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); margin-bottom:5px; pointer-events:none;}
        .bc-card-name { color:white; font-size:18px; font-weight:bold; text-transform:uppercase; pointer-events:none;}
        
        /* Tiền cược hiển thị trên ô */
        .bc-bet-amt { position:absolute; top:10px; right:10px; background:#e74c3c; color:white; padding:4px 8px; border-radius:8px; font-size:13px; font-weight:bold; opacity:0; transition:0.2s; box-shadow:0 2px 5px rgba(0,0,0,0.5);}
        .bc-card.has-bet { border-color: #f1c40f; background:#2c3e50;}
        .bc-card.has-bet .bc-bet-amt { opacity:1; }

        /* Nút Hủy Cược */
        .bc-btn-clear { background: #c0392b; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-top:5px;}
        .bc-btn-clear:hover { background: #e74c3c; }

        /* Thông báo kết quả nổi lên */
        .bc-notify { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.5); background:rgba(0,0,0,0.85); color:white; padding:20px 40px; border-radius:15px; font-size:24px; font-weight:900; text-align:center; z-index:50; opacity:0; pointer-events:none; transition:0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid #f1c40f; text-shadow: 0 2px 5px rgba(0,0,0,0.5);}
        .bc-notify.show { opacity:1; transform:translate(-50%, -50%) scale(1); }
        .bc-win-text { color: #2ecc71; }
        .bc-lose-text { color: #e74c3c; }

        @media (max-width: 768px) {
            .bc-body { flex-direction: column; }
            .bc-plate-wrapper { width: 250px; height: 250px; }
            .bc-dice { width: 55px; height: 55px; font-size: 35px; }
            .bc-board { grid-template-columns: repeat(2, 1fr); }
        }
    `;

    // ===============================================================
    // 3. LOGIC TIỆN ÍCH CHÍNH
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('bc-app');
        
        if (!app) {
            app = document.createElement('div');
            app.id = 'bc-app';

            // Sinh HTML Bàn cược
            let boardHTML = '';
            SYMBOLS.forEach(sym => {
                boardHTML += `
                    <div class="bc-card" data-id="${sym.id}" id="card-${sym.id}">
                        <div class="bc-bet-amt" id="bet-${sym.id}">0</div>
                        <div class="bc-card-emoji">${sym.emoji}</div>
                        <div class="bc-card-name" style="color:${sym.color}">${sym.name}</div>
                    </div>
                `;
            });

            // Sinh HTML Phỉnh Cược
            let chipsHTML = CHIPS.map((val, idx) => `
                <div class="bc-chip ${idx === 0 ? 'active' : ''}" data-val="${val}">
                    ${(val / 1000)}k
                </div>
            `).join('');

            app.innerHTML = `
                <div class="bc-header">
                    <div class="bc-logo">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        Bầu Cua Tôm Cá
                    </div>
                    <button class="bc-btn-close" id="bc-btn-close" title="Đóng">✖</button>
                </div>
                
                <div class="bc-body">
                    <!-- CỘT TRÁI: ĐĨA & BÁT -->
                    <div class="bc-panel bc-left">
                        <div class="bc-plate-wrapper">
                            <div class="bc-plate" id="bc-plate">
                                <div class="bc-dice" id="dice-1"></div>
                                <div class="bc-dice" id="dice-2"></div>
                                <div class="bc-dice" id="dice-3"></div>
                            </div>
                            <div class="bc-bowl" id="bc-bowl"></div>
                        </div>
                        <div class="bc-controls">
                            <button class="bc-btn bc-btn-shake" id="btn-shake">LẮC</button>
                            <button class="bc-btn bc-btn-open" id="btn-open" disabled>MỞ NẮP</button>
                        </div>
                    </div>

                    <!-- CỘT PHẢI: BÀN CƯỢC -->
                    <div class="bc-panel bc-right">
                        <div class="bc-account">
                            <span class="bc-acc-label">Tài khoản (Xu):</span>
                            <span class="bc-acc-balance" id="bc-balance">500,000</span>
                        </div>
                        
                        <div class="bc-chips" id="bc-chips">
                            <span style="color:#dcdde1; font-weight:bold; display:flex; align-items:center;">Chọn mức cược:</span>
                            ${chipsHTML}
                        </div>

                        <div class="bc-board">
                            ${boardHTML}
                        </div>
                        <button class="bc-btn-clear" id="btn-clear">Hủy toàn bộ cược</button>
                    </div>
                </div>

                <div class="bc-notify" id="bc-notify"></div>
            `;
            document.body.appendChild(app);
            
            // Nhúng CSS
            const style = document.createElement('style'); 
            style.innerHTML = MY_CSS; 
            document.head.appendChild(style);

            // ==========================================
            // BIẾN TRẠNG THÁI GAME
            // ==========================================
            const $ = (id) => app.querySelector('#' + id);
            
            let balance = 500000;
            let currentChip = CHIPS[0];
            let bets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
            let gameState = 'waiting'; // waiting, shaking, ready, opened
            let rollResults = [];

            // Helper Format Tiền
            const formatMoney = (num) => num.toLocaleString('vi-VN');

            // Cập nhật UI Tài khoản & Cược
            const updateUI = () => {
                $('bc-balance').innerText = formatMoney(balance);
                
                let totalBet = 0;
                SYMBOLS.forEach(sym => {
                    const amt = bets[sym.id];
                    totalBet += amt;
                    const card = $(`card-${sym.id}`);
                    const betEl = $(`bet-${sym.id}`);
                    
                    if(amt > 0) {
                        card.classList.add('has-bet');
                        betEl.innerText = (amt >= 1000 ? (amt/1000) + 'k' : amt);
                    } else {
                        card.classList.remove('has-bet');
                    }
                });
            };

            // Chọn Phỉnh Cược
            app.querySelectorAll('.bc-chip').forEach(btn => {
                btn.onclick = () => {
                    app.querySelectorAll('.bc-chip').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentChip = parseInt(btn.dataset.val);
                };
            });

            // Đặt cược
            app.querySelectorAll('.bc-card').forEach(card => {
                card.onclick = () => {
                    if(gameState === 'shaking' || gameState === 'opened') return;
                    
                    const id = card.dataset.id;
                    if(balance >= currentChip) {
                        balance -= currentChip;
                        bets[id] += currentChip;
                        updateUI();
                    } else {
                        alert("Không đủ Xu để cược mức này!");
                    }
                };
            });

            // Xóa cược (Trả lại tiền)
            $('btn-clear').onclick = () => {
                if(gameState === 'shaking' || gameState === 'ready') {
                    alert("Đã khóa cược, không thể hủy!");
                    return;
                }
                if(gameState === 'opened') {
                    // Đang mở mà bấm hủy => Reset ván mới nhanh
                    resetBoard();
                    return;
                }
                
                // Trả tiền
                for(let key in bets) {
                    balance += bets[key];
                    bets[key] = 0;
                }
                updateUI();
            };

            // Hàm Reset ván mới
            const resetBoard = () => {
                for(let key in bets) bets[key] = 0;
                updateUI();
                $('bc-bowl').classList.remove('open');
                $('dice-1').classList.remove('show');
                $('dice-2').classList.remove('show');
                $('dice-3').classList.remove('show');
                $('btn-shake').disabled = false;
                $('btn-open').disabled = true;
                $('bc-notify').classList.remove('show');
                gameState = 'waiting';
            };

            // ==========================================
            // LOGIC GAME CHÍNH: LẮC VÀ MỞ
            // ==========================================
            
            // 1. Nút LẮC
            $('btn-shake').onclick = () => {
                if(gameState === 'opened') resetBoard();
                
                const totalBet = Object.values(bets).reduce((a,b)=>a+b, 0);
                if(totalBet === 0) {
                    alert("Vui lòng đặt cược trước khi Lắc!");
                    return;
                }

                gameState = 'shaking';
                $('btn-shake').disabled = true;
                $('btn-open').disabled = true;
                $('btn-clear').disabled = true;
                
                // Đóng nắp (nếu đang mở) và thêm hiệu ứng rung
                $('bc-bowl').classList.remove('open');
                $('bc-bowl').classList.add('shake');
                
                // Thu Xúc xắc lại
                $('dice-1').classList.remove('show');
                $('dice-2').classList.remove('show');
                $('dice-3').classList.remove('show');

                // Sinh kết quả ngẫu nhiên ngầm bên dưới
                rollResults = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];

                // Gán emoji vào dice và tạo góc xoay ngẫu nhiên
                [1, 2, 3].forEach((num, idx) => {
                    const diceEl = $(`dice-${num}`);
                    diceEl.innerText = rollResults[idx].emoji;
                    // Xoay ngẫu nhiên xúc xắc để nhìn thật hơn
                    const randomRot = Math.floor(Math.random() * 360);
                    diceEl.style.setProperty('--rot', randomRot);
                });

                // Dừng lắc sau 1.5 giây
                setTimeout(() => {
                    $('bc-bowl').classList.remove('shake');
                    gameState = 'ready';
                    $('btn-open').disabled = false;
                }, 1500);
            };

            // 2. Nút MỞ NẮP
            $('btn-open').onclick = () => {
                if(gameState !== 'ready') return;
                gameState = 'opened';
                $('btn-open').disabled = true;
                $('btn-shake').disabled = false;
                $('btn-clear').disabled = false;

                // Mở nắp
                $('bc-bowl').classList.add('open');
                
                // Hiển thị xúc xắc (Có độ trễ cho từng viên)
                setTimeout(() => $('dice-1').classList.add('show'), 100);
                setTimeout(() => $('dice-2').classList.add('show'), 200);
                setTimeout(() => $('dice-3').classList.add('show'), 300);

                // Tính toán tiền trúng sau khi mở xong
                setTimeout(() => {
                    let totalWin = 0;
                    let betRefund = 0;

                    // Đếm số lần xuất hiện của mỗi con trong kết quả
                    let counts = { nai:0, bau:0, ga:0, ca:0, cua:0, tom:0 };
                    rollResults.forEach(res => counts[res.id]++);

                    // Tính tiền trả thưởng
                    for(let key in bets) {
                        const betAmt = bets[key];
                        if(betAmt > 0 && counts[key] > 0) {
                            // Trả lại tiền gốc đã đặt
                            betRefund += betAmt;
                            // Trả thêm tiền trúng (đặt 10k trúng 2 con thì ăn thêm 20k)
                            totalWin += betAmt * counts[key];
                        }
                    }

                    const finalReward = betRefund + totalWin;
                    if(finalReward > 0) {
                        balance += finalReward;
                        showNotify(`CHÚC MỪNG!<br><span class="bc-win-text">+ ${formatMoney(totalWin)} Xu</span>`);
                    } else {
                        showNotify(`RẤT TIẾC!<br><span class="bc-lose-text">Bạn đã thua trắng</span>`);
                    }
                    updateUI();
                }, 1000);
            };

            // Hàm show thông báo nổi
            const showNotify = (htmlContent) => {
                const noti = $('bc-notify');
                noti.innerHTML = htmlContent;
                noti.classList.add('show');
            };

            // Đóng tool
            $('bc-btn-close').onclick = () => { app.style.display = 'none'; };

            // Khởi tạo
            updateUI();
        }
        
        // Hiển thị giao diện
        app.style.display = 'flex';
    };

    return {
        name: "Bầu Cua Tôm Cá",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-4 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
        bgColor: "#c0392b",
        action: runTool
    };
})
