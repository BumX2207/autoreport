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

    const CHIPS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

    // Helper format tiền (VD: 1000 -> 1k, 1000000 -> 1M)
    const formatChip = (val) => {
        if(val >= 1000000) return (val/1000000) + 'M';
        if(val >= 1000) return (val/1000) + 'k';
        return val;
    };
    const formatMoney = (num) => num.toLocaleString('vi-VN');

    // ===============================================================
    // 2. CSS GIAO DIỆN (Đã đổi Font Tahoma)
    // ===============================================================
    const MY_CSS = `
        #bc-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:#1e272e; z-index:2147483647; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; flex-direction:column; overflow:hidden; box-sizing: border-box; }
        #bc-app * { box-sizing: border-box; user-select: none; }
        
        /* Header */
        .bc-header { background:#c0392b; padding:15px 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display:flex; justify-content:space-between; align-items:center; z-index:20; height:60px; flex-shrink: 0; border-bottom: 2px solid #f1c40f;}
        .bc-logo { font-size:18px; font-weight:900 !important; color:#f1c40f; text-transform:uppercase; display:flex; align-items:center; gap:10px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);}
        .bc-btn-close { background:#f1c40f; color:#c0392b; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition:0.2s;}
        .bc-btn-close:hover { background:#fff; transform:scale(1.1);}

        /* Body Layout */
        .bc-body { flex: 1; display: flex; padding: 15px; gap: 15px; overflow-y: auto; }
        .bc-panel { background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); padding: 15px; display: flex; flex-direction: column; }
        
        /* CỘT TRÁI: KHU VỰC LẮC & QUẢN LÝ NGƯỜI CHƠI */
        .bc-left { flex: 4; display: flex; flex-direction: column; gap: 15px; }
        
        .bc-player-manager { background: #2f3640; border-radius: 10px; padding: 12px; border: 1px solid #353b48; }
        .bc-pm-title { color: #f1c40f; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 8px;}
        .bc-input-group { display: flex; gap: 8px; margin-bottom: 10px; }
        .bc-input-group input { flex:1; padding:8px 12px; border-radius:6px; border:none; outline:none; font-weight:bold; font-family: Tahoma, sans-serif;}
        .bc-btn-add { background:#0984e3; color:white; border:none; border-radius:6px; padding:0 15px; font-weight:bold; cursor:pointer;}
        
        .bc-player-list { display:flex; flex-wrap:wrap; gap:8px; max-height:80px; overflow-y:auto; }
        .bc-player-tag { background: #353b48; color: #dcdde1; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 2px solid transparent; display:flex; gap:5px; align-items:center;}
        .bc-player-tag.active { background: #f1c40f; color: #2d3436; border-color: #f39c12; transform: scale(1.05); animation: pulse 1s infinite; }
        .bc-btn-del-player { background:transparent; border:none; color:inherit; font-size:14px; cursor:pointer; padding:0; line-height:1;}
        
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(241, 196, 15, 0); } 100% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0); } }

        .bc-plate-wrapper { position: relative; width: 100%; max-width: 280px; aspect-ratio: 1; margin: 0 auto; display:flex; align-items:center; justify-content:center; margin-top:10px;}
        .bc-plate { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, #ecf0f1 40%, #bdc3c7 100%); border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2); border: 8px solid #dcdde1; display:flex; flex-wrap:wrap; justify-content:center; align-content:center; gap: 10px; padding: 30px;}
        .bc-dice { width: 60px; height: 60px; background: #fff; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.3), inset 0 -4px 5px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 40px; transform: scale(0); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .bc-dice.show { transform: scale(1) rotate(calc(var(--rot) * 1deg)); }
        .bc-bowl { position: absolute; width: 105%; height: 105%; background: radial-gradient(circle at 30% 30%, #e74c3c 10%, #c0392b 80%); border-radius: 50%; box-shadow: 0 20px 30px rgba(0,0,0,0.6), inset 0 10px 20px rgba(255,255,255,0.2); z-index: 10; transition: transform 0.6s ease-in-out, opacity 0.5s; display:flex; align-items:center; justify-content:center; }
        .bc-bowl::after { content: ''; width: 70px; height: 70px; border-radius: 50%; background: #922b21; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
        
        .bc-bowl.shake { animation: bowlShake 0.4s infinite; }
        .bc-bowl.open { transform: translateY(-300px) scale(0.9); opacity: 0; pointer-events: none; }
        @keyframes bowlShake { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-8px, 5px) rotate(-3deg); } 50% { transform: translate(8px, -5px) rotate(3deg); } 75% { transform: translate(-8px, -5px) rotate(-3deg); } 100% { transform: translate(0, 0) rotate(0deg); } }

        .bc-controls { display:flex; gap:10px; margin-top: auto; }
        .bc-btn { flex:1; padding:12px; border:none; border-radius:8px; font-size:15px; font-weight:900; text-transform:uppercase; cursor:pointer; transition:0.2s; color:white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-family: Tahoma, sans-serif;}
        .bc-btn-shake { background:#f39c12; }
        .bc-btn-shake:hover:not(:disabled) { background:#e67e22; transform:translateY(-2px); }
        .bc-btn-open { background:#27ae60; }
        .bc-btn-open:hover:not(:disabled) { background:#2ecc71; transform:translateY(-2px); }
        .bc-btn:disabled { background:#7f8c8d; cursor:not-allowed; transform:none; box-shadow:none;}

        /* CỘT PHẢI: BÀN CƯỢC */
        .bc-right { flex: 7; display: flex; flex-direction: column; gap: 15px; }
        
        .bc-turn-bar { background: #2f3640; padding: 12px 15px; border-radius: 10px; display:flex; justify-content:space-between; align-items:center; border: 1px solid #353b48; }
        .bc-turn-info { color:#f5f6fa; font-size:15px; font-weight:bold; }
        .bc-btn-next-turn { background:#e84393; color:white; border:none; padding:8px 15px; border-radius:6px; font-weight:bold; cursor:pointer; transition:0.2s; font-family: Tahoma, sans-serif;}
        .bc-btn-next-turn:hover:not(:disabled) { background:#d81b60; }
        .bc-btn-next-turn:disabled { background:#636e72; cursor:not-allowed;}
        
        .bc-chips { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; background:#2f3640; padding:10px; border-radius:10px;}
        .bc-chip { padding:6px 12px; border-radius:20px; font-weight:bold; font-size:13px; cursor:pointer; border:2px solid transparent; background:#353b48; color:white; transition:0.2s; }
        .bc-chip.active { background:#f1c40f; color:#2d3436; border-color:#f39c12; box-shadow:0 0 10px rgba(241,196,15,0.5); transform:scale(1.1);}
        
        .bc-board { flex:1; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
        .bc-card { background: #353b48; border-radius: 12px; display:flex; flex-direction:column; align-items:center; padding:15px 5px; cursor:pointer; border: 2px solid transparent; transition:0.2s; position:relative; overflow:hidden;}
        .bc-card:hover { background: #404856; border-color: rgba(255,255,255,0.2);}
        .bc-card-emoji { font-size:45px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); margin-bottom:2px; pointer-events:none;}
        .bc-card-name { color:white; font-size:16px; font-weight:bold; text-transform:uppercase; pointer-events:none;}
        
        /* Chứa các phỉnh cược của người chơi dán lên ô */
        .bc-card-bets { width:100%; display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin-top:10px; pointer-events:none;}
        .bc-bet-badge { pointer-events:auto; font-size:11px; font-weight:bold; background:rgba(0,0,0,0.7); color:#fff; padding:3px 6px; border-radius:10px; border:1px solid #f1c40f; animation: pop 0.2s; transition:0.2s;}
        .bc-bet-badge:hover { background:#e74c3c; text-decoration:line-through; border-color:#c0392b;}
        @keyframes pop { from{transform:scale(0);} to{transform:scale(1);} }

        /* BẢNG KẾT QUẢ TỔNG KẾT */
        .bc-result-modal { display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:50; flex-direction:column; align-items:center; justify-content:center; backdrop-filter:blur(3px);}
        .bc-result-box { background:#2f3640; width:90%; max-width:400px; border-radius:15px; border:2px solid #f1c40f; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.8); text-align:center;}
        .bc-rb-title { color:#f1c40f; font-size:22px; font-weight:900; margin-bottom:15px; text-transform:uppercase;}
        .bc-rb-list { max-height:200px; overflow-y:auto; text-align:left; background:#1e272e; padding:10px; border-radius:8px; margin-bottom:15px;}
        .bc-rb-item { display:flex; justify-content:space-between; margin-bottom:8px; font-size:15px; font-weight:bold; border-bottom:1px dashed #353b48; padding-bottom:5px; color:white;} /* Fix màu tên người chơi */
        .bc-rb-item:last-child { border-bottom:none; margin-bottom:0; padding-bottom:0;}
        .bc-win-text { color: #2ecc71; }
        .bc-lose-text { color: #e74c3c; }
        
        .bc-rb-dealer { background:#c0392b; color:white; padding:15px; border-radius:10px; margin-bottom:15px; border:2px solid #e74c3c;}
        .bc-rb-dealer-title { font-size:14px; font-weight:bold; text-transform:uppercase; margin-bottom:5px;}
        .bc-rb-dealer-amt { font-size:24px; font-weight:900; text-shadow:0 2px 5px rgba(0,0,0,0.5);}

        .bc-btn-restart { background:#f1c40f; color:#2d3436; border:none; padding:12px 20px; border-radius:8px; font-weight:900; font-size:16px; width:100%; cursor:pointer; text-transform:uppercase; font-family: Tahoma, sans-serif;}

        @media (max-width: 768px) {
            .bc-body { flex-direction: column; }
            .bc-left, .bc-right { flex: none; width:100%; }
            .bc-board { grid-template-columns: repeat(2, 1fr); }
            .bc-plate-wrapper { max-width: 220px; }
            .bc-dice { width: 45px; height: 45px; font-size: 30px; }
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
            let boardHTML = SYMBOLS.map(sym => `
                <div class="bc-card" data-id="${sym.id}" id="card-${sym.id}">
                    <div class="bc-card-emoji">${sym.emoji}</div>
                    <div class="bc-card-name" style="color:${sym.color}">${sym.name}</div>
                    <div class="bc-card-bets" id="bets-${sym.id}"></div>
                </div>
            `).join('');

            // Sinh HTML Phỉnh Cược
            let chipsHTML = CHIPS.map((val, idx) => `
                <div class="bc-chip ${idx === 3 ? 'active' : ''}" data-val="${val}">
                    ${formatChip(val)}
                </div>
            `).join('');

            app.innerHTML = `
                <div class="bc-header">
                    <div class="bc-logo">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        Bầu Cua
                    </div>
                    <button class="bc-btn-close" id="bc-btn-close" title="Đóng">✖</button>
                </div>
                
                <div class="bc-body">
                    <!-- CỘT TRÁI -->
                    <div class="bc-panel bc-left">
                        <div class="bc-player-manager">
                            <div class="bc-pm-title">Danh sách Người chơi</div>
                            <div class="bc-input-group">
                                <input type="text" id="bc-input-player" placeholder="Nhập tên...">
                                <button class="bc-btn-add" id="bc-btn-add">THÊM</button>
                            </div>
                            <div class="bc-player-list" id="bc-player-list"></div>
                        </div>

                        <div class="bc-plate-wrapper">
                            <div class="bc-plate" id="bc-plate">
                                <div class="bc-dice" id="dice-1"></div>
                                <div class="bc-dice" id="dice-2"></div>
                                <div class="bc-dice" id="dice-3"></div>
                            </div>
                            <div class="bc-bowl" id="bc-bowl"></div>
                        </div>
                        
                        <div class="bc-controls">
                            <!-- Sửa tên nút theo yêu cầu -->
                            <button class="bc-btn bc-btn-shake" id="btn-shake" disabled>LẮC BÁT</button>
                            <button class="bc-btn bc-btn-open" id="btn-open" disabled>MỞ BÁT</button>
                        </div>
                    </div>

                    <!-- CỘT PHẢI -->
                    <div class="bc-panel bc-right">
                        <div class="bc-turn-bar">
                            <div class="bc-turn-info" id="bc-turn-text">Vui lòng thêm người chơi...</div>
                            <button class="bc-btn-next-turn" id="btn-next-turn" disabled>Bỏ qua lượt ⏭</button>
                        </div>
                        
                        <div class="bc-chips" id="bc-chips">
                            ${chipsHTML}
                        </div>

                        <div class="bc-board">
                            ${boardHTML}
                        </div>
                    </div>
                </div>

                <!-- POPUP KẾT QUẢ -->
                <div class="bc-result-modal" id="bc-result-modal">
                    <div class="bc-result-box">
                        <div class="bc-rb-title">TỔNG KẾT VÁN</div>
                        
                        <div class="bc-rb-dealer">
                            <div class="bc-rb-dealer-title">Nhà Cái Lời/Lỗ</div>
                            <div class="bc-rb-dealer-amt" id="bc-res-dealer">0</div>
                        </div>

                        <div class="bc-rb-list" id="bc-res-players">
                            <!-- Kết quả từng người -->
                        </div>

                        <button class="bc-btn-restart" id="btn-restart">Bắt đầu Ván Mới</button>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);

            // ==========================================
            // BIẾN TRẠNG THÁI GAME
            // ==========================================
            const $ = (id) => app.querySelector('#' + id);
            
            let players = []; 
            let currentPlayerIndex = -1;
            let currentChip = 10000;
            let placedBets = []; 
            let gameState = 'waiting'; 
            let rollResults = [];

            // ==========================================
            // QUẢN LÝ NGƯỜI CHƠI & LƯỢT
            // ==========================================
            const renderPlayers = () => {
                $('bc-player-list').innerHTML = players.map((p, idx) => `
                    <div class="bc-player-tag ${idx === currentPlayerIndex ? 'active' : ''}">
                        ${p.name}
                        <button class="bc-btn-del-player" onclick="window._bcRemovePlayer(${p.id})">✖</button>
                    </div>
                `).join('');

                if(players.length === 0) {
                    $('bc-turn-text').innerHTML = "Vui lòng thêm người chơi...";
                    $('btn-next-turn').disabled = true;
                    $('btn-shake').disabled = true;
                } else if(gameState === 'waiting') {
                    $('bc-turn-text').innerHTML = "Cái vui lòng <b>LẮC BÁT</b> để bắt đầu cược!";
                    $('btn-next-turn').disabled = true;
                    $('btn-shake').disabled = false;
                }
            };

            const addPlayer = () => {
                if(gameState !== 'waiting' && players.length > 0) {
                    alert("Đang trong ván, không thể thêm người!"); return;
                }
                const name = $('bc-input-player').value.trim();
                if(name) {
                    players.push({ id: Date.now(), name: name });
                    $('bc-input-player').value = '';
                    renderPlayers();
                }
            };
            $('bc-btn-add').onclick = addPlayer;
            $('bc-input-player').onkeypress = (e) => { if(e.key === 'Enter') addPlayer(); };

            window._bcRemovePlayer = (id) => {
                if(gameState !== 'waiting') { alert("Không thể xóa khi đang chơi!"); return; }
                players = players.filter(p => p.id !== id);
                renderPlayers();
            };

            // Hàm tự động đổi tên nút "Chốt cược / Bỏ qua lượt"
            const updateNextTurnButton = () => {
                if(currentPlayerIndex < 0 || currentPlayerIndex >= players.length) return;
                const p = players[currentPlayerIndex];
                const hasBet = placedBets.some(b => b.playerId === p.id);
                const btn = $('btn-next-turn');
                
                if (currentPlayerIndex === players.length - 1) {
                    btn.innerText = "Hoàn tất cược ✔";
                } else {
                    btn.innerText = hasBet ? "Chốt cược ⏭" : "Bỏ qua lượt ⏭";
                }
            };

            const updateTurnUI = () => {
                renderPlayers();
                if(currentPlayerIndex >= 0 && currentPlayerIndex < players.length) {
                    const p = players[currentPlayerIndex];
                    $('bc-turn-text').innerHTML = `Đến lượt: <span style="color:#f1c40f;font-size:18px;">${p.name}</span> đặt cược`;
                    $('btn-next-turn').disabled = false;
                    updateNextTurnButton(); // Cập nhật text của nút
                } else {
                    gameState = 'ready';
                    $('bc-turn-text').innerHTML = `<span style="color:#2ecc71;">Tất cả đã cược xong. Cái chuẩn bị mở bát!</span>`;
                    $('btn-next-turn').disabled = true;
                    $('btn-open').disabled = false;
                    renderPlayers(); 
                }
            };

            $('btn-next-turn').onclick = () => {
                if(gameState !== 'betting') return;
                currentPlayerIndex++;
                updateTurnUI();
            };

            // ==========================================
            // LOGIC ĐẶT CƯỢC
            // ==========================================
            app.querySelectorAll('.bc-chip').forEach(btn => {
                btn.onclick = () => {
                    app.querySelectorAll('.bc-chip').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentChip = parseInt(btn.dataset.val);
                };
            });

            const renderBetsOnBoard = () => {
                SYMBOLS.forEach(sym => {
                    const container = $(`bets-${sym.id}`);
                    const symBets = placedBets.filter(b => b.symbolId === sym.id);
                    container.innerHTML = symBets.map(b => `
                        <div class="bc-bet-badge" onclick="window._bcCancelBet(${b.id})" title="Bấm để hủy">
                            ${b.playerName}: ${formatChip(b.amount)} ✖
                        </div>
                    `).join('');
                });
            };

            window._bcCancelBet = (betId) => {
                if(gameState !== 'betting') return;
                placedBets = placedBets.filter(b => b.id !== betId);
                renderBetsOnBoard();
                updateNextTurnButton(); // Cập nhật lại nút nếu hủy hết cược
            };

            app.querySelectorAll('.bc-card').forEach(card => {
                card.onclick = (e) => {
                    if(e.target.classList.contains('bc-bet-badge')) return;
                    
                    if(gameState !== 'betting') {
                        if(gameState === 'waiting') alert("Cái phải lắc bát trước khi cho khách cược!");
                        return;
                    }
                    if(currentPlayerIndex < 0 || currentPlayerIndex >= players.length) return;
                    
                    const p = players[currentPlayerIndex];
                    const symId = card.dataset.id;
                    
                    placedBets.push({
                        id: Date.now() + Math.random(),
                        playerId: p.id,
                        playerName: p.name,
                        symbolId: symId,
                        amount: currentChip
                    });
                    
                    renderBetsOnBoard();
                    updateNextTurnButton(); // Đổi nút thành "Chốt cược" ngay khi vừa cược
                };
            });

            // ==========================================
            // LOGIC CÁI: LẮC VÀ MỞ BÁT
            // ==========================================
            $('btn-shake').onclick = () => {
                if(players.length === 0) return;
                
                gameState = 'betting'; 
                currentPlayerIndex = 0; 
                placedBets = [];
                renderBetsOnBoard();
                
                $('btn-shake').disabled = true;
                $('bc-bowl').classList.remove('open');
                $('bc-bowl').classList.add('shake');
                
                $('dice-1').classList.remove('show');
                $('dice-2').classList.remove('show');
                $('dice-3').classList.remove('show');

                rollResults = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];

                [1, 2, 3].forEach((num, idx) => {
                    const diceEl = $(`dice-${num}`);
                    diceEl.innerText = rollResults[idx].emoji;
                    diceEl.style.setProperty('--rot', Math.floor(Math.random() * 360));
                });

                setTimeout(() => {
                    $('bc-bowl').classList.remove('shake');
                    updateTurnUI(); 
                }, 1500);
            };

            $('btn-open').onclick = () => {
                if(gameState !== 'ready') return;
                gameState = 'opened';
                $('btn-open').disabled = true;

                $('bc-bowl').classList.add('open');
                setTimeout(() => $('dice-1').classList.add('show'), 100);
                setTimeout(() => $('dice-2').classList.add('show'), 200);
                setTimeout(() => $('dice-3').classList.add('show'), 300);

                setTimeout(() => {
                    let dealerProfit = 0;
                    let playerSummary = {}; 

                    players.forEach(p => {
                        playerSummary[p.id] = { name: p.name, profit: 0 };
                    });

                    let counts = { nai:0, bau:0, ga:0, ca:0, cua:0, tom:0 };
                    rollResults.forEach(res => counts[res.id]++);

                    placedBets.forEach(bet => {
                        const hits = counts[bet.symbolId];
                        if(hits > 0) {
                            const winAmt = bet.amount * hits;
                            dealerProfit -= winAmt;
                            playerSummary[bet.playerId].profit += winAmt;
                        } else {
                            dealerProfit += bet.amount;
                            playerSummary[bet.playerId].profit -= bet.amount;
                        }
                    });

                    const dealerEl = $('bc-res-dealer');
                    if(dealerProfit > 0) {
                        dealerEl.innerHTML = `<span class="bc-win-text">+ ${formatMoney(dealerProfit)}</span>`;
                    } else if(dealerProfit < 0) {
                        dealerEl.innerHTML = `<span class="bc-lose-text">- ${formatMoney(Math.abs(dealerProfit))}</span>`;
                    } else {
                        dealerEl.innerHTML = `<span style="color:#f5f6fa;">Hòa Tiền (0)</span>`;
                    }

                    let pListHtml = '';
                    for(let key in playerSummary) {
                        const p = playerSummary[key];
                        let pStatus = `<span style="color:#bdc3c7;">Không cược</span>`;
                        if(p.profit > 0) pStatus = `<span class="bc-win-text">Thắng: +${formatMoney(p.profit)}</span>`;
                        else if(p.profit < 0) pStatus = `<span class="bc-lose-text">Thua: ${formatMoney(p.profit)}</span>`;
                        else if(placedBets.some(b => b.playerId == key)) pStatus = `<span style="color:#f1c40f;">Hòa vốn</span>`;

                        // Fix hiển thị tên màu trắng sáng
                        pListHtml += `<div class="bc-rb-item"><span>${p.name}</span> ${pStatus}</div>`;
                    }
                    $('bc-res-players').innerHTML = pListHtml || '<div style="text-align:center; color:#7f8c8d;">Không có ai cược</div>';

                    $('bc-result-modal').style.display = 'flex';
                }, 1000);
            };

            $('btn-restart').onclick = () => {
                $('bc-result-modal').style.display = 'none';
                gameState = 'waiting';
                currentPlayerIndex = -1;
                placedBets = [];
                renderBetsOnBoard();
                renderPlayers(); 
            };

            $('bc-btn-close').onclick = () => { app.style.display = 'none'; };

            renderPlayers();
        }
        
        app.style.display = 'flex';
    };

    return {
        name: "Bầu Cua",
        icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-4 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`,
        bgColor: "#c0392b",
        action: runTool
    };
})
