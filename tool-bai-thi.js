((context) => {
    const { UI, UTILS, CONSTANTS } = context;
    const GM_xmlhttpRequest = typeof context.GM_xmlhttpRequest !== 'undefined' ? context.GM_xmlhttpRequest : window.GM_xmlhttpRequest;

    // ===============================================================
    // 0. UNIVERSAL FETCH (HỖ TRỢ CẢ TAMPERMONKEY VÀ NETLIFY)
    // ===============================================================
    const universalFetch = async (options) => {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: options.method || "GET", url: options.url, data: options.data, headers: options.headers,
                    onload: (res) => { if (res.status >= 200 && res.status < 300) resolve(res.responseText); else reject(new Error(`HTTP Error: ${res.status}`)); },
                    onerror: (err) => reject(err)
                });
            } else {
                const fetchOpts = { method: options.method || "GET", headers: options.headers || {} };
                if (options.data) fetchOpts.body = options.data;
                fetch(options.url, fetchOpts).then(r => { if (!r.ok) throw new Error(`HTTP Error`); return r.text(); }).then(resolve).catch(reject);
            }
        });
    };

    // ===============================================================
    // 1. CẤU HÌNH & BIẾN STATE
    // ===============================================================
    let API_URL = "https://script.google.com/macros/s/AKfycbyilVgP9qgHd66IsNVJahl19G35BVTCCxGnGVYL4NeHoYUV7u2FzYL1VGfM9lCbdo1xZQ/exec";
    let USER_NAME = "---";
    let IS_LOGGED_IN = false;
    
    let QUIZ_LIST =[]; 
    let CURRENT_QUIZ = null; 
    let USER_ANSWERS =[];
    let CURRENT_Q_IDX = 0;
    let QUIZ_HISTORY =[];
    let TIMER_INTERVAL = null;
    let TIME_LEFT = 0;

    // ===============================================================
    // 2. CSS GIAO DIỆN (DARK MODE CHUẨN + HIỆU ỨNG VẼ BÚT)
    // ===============================================================
    const MY_CSS = `
        #qz-app-wrapper { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.9); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); z-index:2147483647; font-family: 'Segoe UI', sans-serif; overflow-y:auto; overflow-x:hidden; box-sizing:border-box; color: #fff; }
        #qz-app-wrapper * { box-sizing:border-box; }
        #qz-app-wrapper::-webkit-scrollbar { width: 6px; }
        #qz-app-wrapper::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

        .qz-top-header { display:flex; justify-content:space-between; align-items:center; padding:15px 25px; background:rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.1); position:sticky; top:0; z-index:100; }
        .qz-logo { font-size:18px; font-weight:900; color:#FFD700; text-transform:uppercase; letter-spacing:1px; }
        .qz-header-right { display:flex; align-items:center; gap:15px; }
        .qz-user-badge { background:rgba(255,255,255,0.1); padding:5px 12px; border-radius:20px; font-size:13px; font-weight:bold; color:#4fc3f7; }
        .qz-btn-close-app { width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.1); color:#fff; border:none; cursor:pointer; font-weight:bold; transition:0.2s; display:flex; justify-content:center; align-items:center; font-size: 16px;}
        .qz-btn-close-app:hover { background:#ef4444; }

        .qz-screen { display:none; padding:30px 20px; max-width:900px; margin:0 auto; width:100%; animation:fadeIn 0.3s; }
        .qz-screen.active { display:block; }

        .qz-auth-box { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:30px; max-width:350px; margin:50px auto; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); }
        .qz-input { width:100%; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.3); color:#fff; margin-bottom:15px; font-size:14px; outline:none; }
        .qz-input:focus { border-color:#FFD700; }
        .qz-btn { width:100%; padding:12px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; transition:0.2s; font-size:14px; color:#fff; }
        .qz-btn-primary { background:linear-gradient(135deg, #0277bd, #01579b); }
        .qz-btn-success { background:linear-gradient(135deg, #2e7d32, #1b5e20); }
        .qz-link { font-size:12px; color:#4fc3f7; cursor:pointer; margin-top:10px; display:inline-block; }
        .qz-link:hover { text-decoration:underline; }

        .qz-page-title { font-size:24px; font-weight:900; margin-bottom:20px; color:#fff; display:flex; justify-content:space-between; align-items:center; }
        .qz-btn-history { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 15px; border-radius:20px; font-size:13px; cursor:pointer; transition:0.2s; }
        .qz-btn-history:hover { background:rgba(255,255,255,0.2); }
        .qz-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:20px; }
        .qz-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:20px; cursor:pointer; transition:0.3s; text-align:center; }
        .qz-card:hover { transform:translateY(-5px); background:rgba(255,255,255,0.1); border-color:#FFD700; box-shadow:0 10px 20px rgba(0,0,0,0.3); }
        .qz-card-icon { font-size:40px; margin-bottom:10px; }
        .qz-card-title { font-size:16px; font-weight:bold; color:#FFD700; margin-bottom:5px; line-height:1.4; }
        .qz-card-desc { font-size:12px; color:#aaa; }

        /* PLAY SCREEN & DARK THEME QUESTION BOX */
        .qz-play-header { display:flex; justify-content:space-between; align-items: center; background:rgba(0,0,0,0.3); padding:10px 20px; border-radius:12px; margin-bottom:20px; font-weight:bold; }
        .qz-timer { color:#ff5252; font-size:18px; font-family:monospace; }
        
        .qz-question-container { background:rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); color:#f8fafc; border-radius:16px; padding:25px; box-shadow:0 10px 30px rgba(0,0,0,0.4); min-height:300px; backdrop-filter: blur(10px); }
        .qz-q-text { font-size:18px; font-weight:700; margin-bottom:20px; line-height:1.5; color:#FFD700; }
        .qz-img { max-width:100%; max-height:250px; border-radius:8px; display:block; margin:0 auto 15px; }
        
        .qz-play-footer { display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); }
        .qz-btn-nav { padding:10px 25px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; color:#fff; transition:0.2s; }
        .qz-btn-prev { background:#64748b; } 
        .qz-btn-prev:disabled { opacity:0.3; cursor:not-allowed; }
        .qz-btn-next { background:linear-gradient(135deg, #0277bd, #01579b); } 
        .qz-btn-next:disabled { background:#475569; opacity:0.5; cursor:not-allowed; }
        
        .qz-btn-quit { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 5px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.2s;}
        .qz-btn-quit:hover { background: #ef4444; color: white;}

        /* QUIZ TYPES - DARK UI */
        .qz-opts { display:flex; gap:15px; flex-wrap:wrap; }
        .qz-opt-label { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:15px; cursor:pointer; display:flex; align-items:center; width:calc(50% - 8px); transition:0.2s; color:#fff; font-weight:600;}
        .qz-opt-label:hover { background:rgba(255,255,255,0.1); border-color:#FFD700; }
        .qz-opt-label.selected { border-color:#FFD700; background:rgba(255,215,0,0.15); color: #FFD700; }
        .qz-opt-label input { margin-right:15px; transform:scale(1.3); }
        @media(max-width:600px){ .qz-opt-label { width:100%; } }

        .qz-inline-input { border:none; border-bottom:2px solid #FFD700; background:rgba(0,0,0,0.3); padding:5px 10px; font-weight:bold; color:#FFD700; width:120px; text-align:center; outline:none; font-size:16px;}
        
        .qz-match-container { display:flex; justify-content:space-between; gap:20px; margin-top:20px; position:relative; }
        .qz-match-col { width:45%; display:flex; flex-direction:column; gap:15px; z-index:2; }
        .qz-match-item { padding:15px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); border-radius:8px; cursor:pointer; text-align:center; font-weight:600; min-height:50px; display:flex; align-items:center; justify-content:center; color: #fff;}
        .qz-match-item.active { border-color:#FFD700; background:rgba(255,215,0,0.15); color:#FFD700; box-shadow:0 0 0 2px rgba(255,215,0,0.3); }
        .qz-match-item.matched { border-color:#10b981; background:rgba(16,185,129,0.2); color:#10b981; }
        .match-svg { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; }
        .match-line { stroke:#FFD700; stroke-width:3px; stroke-linecap:round; }

        /* VẼ VÒNG TRÒN (HAND-DRAWN EFFECT) */
        .qz-circle-container { display:flex; flex-direction:column; gap:15px; }
        .qz-circle-item { display:flex; align-items:center; gap:15px; cursor:pointer; padding:10px 15px; border-radius:12px; transition:0.2s; border:1px solid transparent; }
        .qz-circle-item:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.2); }
        .qz-circle-mark { position:relative; width:45px; height:45px; display:flex; justify-content:center; align-items:center; font-size:20px; font-weight:bold; color:#94a3b8; flex-shrink:0; }
        .qz-circle-item.selected .qz-circle-mark { color:#FFD700; }
        .qz-circle-svg { position:absolute; top:-5px; left:-5px; width:55px; height:55px; pointer-events:none; z-index:1; overflow:visible; }
        .qz-circle-path { fill:none; stroke:#FFD700; stroke-width:3; stroke-linecap:round; stroke-dasharray:200; stroke-dashoffset:200; transition:stroke-dashoffset 0.5s ease-out; opacity:0; }
        .qz-circle-item.selected .qz-circle-path { stroke-dashoffset:0; opacity:1; }
        .qz-circle-text { font-size:16px; font-weight:600; color:#fff; }

        .qz-underline-box { line-height:2.2; font-size:18px; color:#fff; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid rgba(255,255,255,0.2); font-weight:500;}
        .qz-word { display:inline-block; cursor:pointer; padding:0 4px; margin:0 2px; border-bottom:3px solid transparent; transition:0.2s; border-radius:4px; }
        .qz-word:hover { background:rgba(255,255,255,0.1); }
        .qz-word.selected { border-bottom-color:#FFD700; color:#FFD700; background:rgba(255,215,0,0.2); font-weight:bold; }
        .qz-word.r-correct { border-bottom-color:#10b981; color:#10b981; background:rgba(16,185,129,0.2); position:relative; }
        .qz-word.r-wrong { border-bottom-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.2); text-decoration:line-through; }
        .qz-word.r-missed { border-bottom:2px dashed #10b981; color:#94a3b8; }

        /* RESULT & HISTORY */
        .qz-score-box { width:120px; height:120px; background:#FFD700; color:#1e293b; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:36px; font-weight:900; margin:0 auto 20px; box-shadow:0 0 20px rgba(255,215,0,0.5); }
        .qz-history-table { width:100%; border-collapse:collapse; margin-top:20px; background:rgba(255,255,255,0.05); border-radius:12px; overflow:hidden; }
        .qz-history-table th { background:rgba(0,0,0,0.5); padding:12px; text-align:left; color:#FFD700; }
        .qz-history-table td { padding:12px; border-bottom:1px solid rgba(255,255,255,0.1); }
        
        .qz-review-opt { padding:12px 15px; margin-bottom:8px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; display:flex; justify-content:space-between; font-weight:600;}
        .qz-review-opt.correct { border-color:#10b981; background:#ecfdf5; color:#047857; }
        .qz-review-opt.wrong { border-color:#ef4444; background:#fef2f2; color:#b91c1c; }
        .qz-explain { background:#fffbeb; padding:15px; margin-top:15px; border-radius:8px; border-left:4px solid #f59e0b; color:#b45309; font-size:14px; font-weight:600;}

        @keyframes fadeIn { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
    `;

    // ===============================================================
    // 3. PARSE API DATA (GỌI GAS MỚI)
    // ===============================================================
    const fetchAndParseQuizzes = async () => {
        try {
            if(!API_URL) { console.error("Chưa cấu hình API_URL"); return[]; }

            // Gọi API Google Apps Script để lấy dữ liệu thô (Mảng 2D)
            const resText = await universalFetch({ 
                method: "GET", 
                url: `${API_URL}?action=get_quizzes` 
            });
            
            const json = JSON.parse(resText);
            if (json.status !== 'success' || !json.data) return [];

            const rows = json.data; // Đây là mảng 2 chiều [[], [], ...]
            const quizzes =[];
            if(rows.length < 3) return quizzes; // Tối thiểu phải có Name(1) và Config(2)

            const numCols = rows[0].length;
            const cl = (s) => s ? String(s).trim() : "";

            for (let c = 0; c < numCols; c++) {
                let quizName = cl(rows[0][c]);
                if (!quizName) continue; 

                // XỬ LÝ DÒNG 2: Cấu hình "Số_Câu,Thời_Gian"
                let configStr = cl(rows[1][c]);
                let maxQ = 999;
                let timeLimit = 15; // Default 15 mins

                if (configStr && configStr.includes(',')) {
                    let parts = configStr.split(',');
                    let pQ = parseInt(parts[0]);
                    let pT = parseInt(parts[1]);
                    if (!isNaN(pQ) && pQ > 0) maxQ = pQ;
                    if (!isNaN(pT) && pT > 0) timeLimit = pT;
                }

                let questions =[];
                // Bắt đầu quét câu hỏi từ dòng số 3 (index r = 2)
                for (let r = 2; r < rows.length; r += 9) {
                    let type = cl(rows[r]?.[c]); 
                    if (!type) break; 

                    let qT = cl(rows[r+1]?.[c]); 
                    let qI = cl(rows[r+2]?.[c]); 
                    let img = (qI && qI.includes('drive.google')) ? qI.replace(/\/file\/d\/(.+?)\/view.*/, '/uc?export=view&id=$1') : qI;

                    if(type === 'match') {
                        let ps = []; 
                        [cl(rows[r+3]?.[c]), cl(rows[r+4]?.[c]), cl(rows[r+5]?.[c]), cl(rows[r+6]?.[c])].forEach(x => { 
                            if(x && x.includes('|')) { 
                                let p = x.split('|'); 
                                ps.push({left: p[0].trim(), right: p[1].trim()}); 
                            } 
                        });
                        questions.push({ type: 'match', question: qT, image: img, matchPairs: ps, matchRightOrder: ps.map((_,k)=>k).sort(()=>0.5-Math.random()), explain: cl(rows[r+8]?.[c]), correct:[] });
                    } else {
                        let op =[cl(rows[r+3]?.[c]), cl(rows[r+4]?.[c]), cl(rows[r+5]?.[c]), cl(rows[r+6]?.[c])].filter(o=>o!=="");
                        let crRaw = cl(rows[r+7]?.[c]); 
                        let explainTxt = cl(rows[r+8]?.[c]); 
                        let cr = (type === 'text' || type === 'underline') ? crRaw.split(',').map(s=>s.trim()) : crRaw.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
                        questions.push({ type: type, question: qT, image: img, options: op, correct: cr, explain: explainTxt });
                    }
                }

                // RAMDOM & CẮT CÂU HỎI THEO CẤU HÌNH DÒNG 2
                if(questions.length > 0) {
                    // Tráo đổi ngẫu nhiên
                    questions.sort(() => 0.5 - Math.random());
                    // Cắt lấy đúng số lượng khai báo
                    questions = questions.slice(0, maxQ);
                    
                    quizzes.push({ 
                        name: quizName, 
                        timeLimit: timeLimit,
                        questions: questions 
                    });
                }
            }
            return quizzes;
        } catch (e) {
            console.error("Lỗi parse dữ liệu đề thi:", e);
            return[];
        }
    };

    // ===============================================================
    // 4. MODULE LOGIC CÂU HỎI (QUIZ TYPES)
    // ===============================================================
    const QZ_TYPES = {
        'text': {
            render: (q, ans, idx) => { let parts = q.question.split('{input}'); let html = `<div class="qz-q-text">Câu ${idx+1}: `; for(let i=0; i<parts.length; i++) { html += parts[i]; if(i < parts.length - 1) { let val = (ans && ans[i]) ? ans[i] : ''; html += `<input type="text" class="qz-inline-input" oninput="window.QZ_FN.saveAns(${idx}, ${i}, 'text', this.value)" value="${val}" autocomplete="off"/>`; } } return html + `</div>`; },
            check: (q, ans) => { if (!ans || !Array.isArray(ans) || ans.length !== q.correct.length) return false; for(let i=0; i<q.correct.length; i++) { if ((ans[i]||"").toLowerCase().trim() !== q.correct[i].toLowerCase().trim()) return false; } return true; },
            hasAnswer: (ans, q) => ans && ans.length === q.correct.length && ans.every(s => s && s.trim() !== "")
        },
        'radio': {
            render: (q, ans, idx) => { let html = `<div class="qz-opts">`; q.options.forEach((opt, i) => { let isSel = (ans === i); html += `<label class="qz-opt-label ${isSel?'selected':''}" onclick="window.QZ_FN.clickOpt(this, 'radio')"><input type="radio" name="opt-${idx}" value="${i}" ${isSel?'checked':''} onchange="window.QZ_FN.saveAns(${idx}, ${i}, 'radio')"/> ${opt}</label>`; }); return html + `</div>`; },
            check: (q, ans) => ans !== null && ans !== undefined && ans === q.correct[0] - 1,
            hasAnswer: (ans) => ans !== null && ans !== undefined
        },
        'checkbox': {
            render: (q, ans, idx) => { let html = `<div class="qz-opts">`; q.options.forEach((opt, i) => { let isSel = (ans && ans.includes(i)); html += `<label class="qz-opt-label ${isSel?'selected':''}" onclick="window.QZ_FN.clickOpt(this, 'checkbox')"><input type="checkbox" name="opt-${idx}" value="${i}" ${isSel?'checked':''} onchange="window.QZ_FN.saveAns(${idx}, ${i}, 'checkbox')"/> ${opt}</label>`; }); return html + `</div>`; },
            check: (q, ans) => { if (!ans || ans.length === 0) return false; let c = q.correct.map(x => x - 1).sort(); let u = ans.slice().sort(); return JSON.stringify(c) === JSON.stringify(u); },
            hasAnswer: (ans) => ans && ans.length > 0
        },
        'match': {
            render: (q, ans, idx) => { let html = `<div class="qz-match-container"><div class="qz-match-col" id="match-col-left"></div><div class="qz-match-col" id="match-col-right"></div></div>`; setTimeout(() => { window.QZ_FN.renderMatchGame(idx, q, ans); window.QZ_FN.drawMatchLines(idx); }, 50); return html; },
            check: (q, ans) => { if (!ans || Object.keys(ans).length !== q.matchPairs.length) return false; for (let k in ans) { if (parseInt(ans[k]) !== parseInt(k)) return false; } return true; },
            hasAnswer: (ans, q) => ans && Object.keys(ans).length === q.matchPairs.length
        },
        'circle': {
            render: (q, ans, idx) => { 
                let html = `<div class="qz-circle-container">`; 
                q.options.forEach((opt, i) => { 
                    let clean = opt.replace(/^[A-D][\.\)]\s*/, ''), lbl = String.fromCharCode(65 + i), isSel = (ans === i); 
                    // Nét bút vẽ tay không liền mạch nhìn cực ngầu
                    let path = "M 28 8 C 12 10 6 22 10 38 C 14 54 32 58 46 48 C 58 38 56 16 42 8 C 34 4 28 6 24 10"; 
                    html += `<div class="qz-circle-item ${isSel?'selected':''}" onclick="window.QZ_FN.clickOpt(this, 'circle')"><div class="qz-circle-mark">${lbl}<svg class="qz-circle-svg" viewBox="0 0 60 60"><path d="${path}" class="qz-circle-path"/></svg></div><div class="qz-circle-text">${clean}</div><input type="radio" name="opt-${idx}" value="${i}" ${isSel?'checked':''} style="display:none" onchange="window.QZ_FN.saveAns(${idx}, ${i}, 'radio')"/></div>`; 
                }); 
                return html + `</div>`; 
            },
            check: (q, ans) => ans !== null && ans !== undefined && ans === q.correct[0] - 1,
            hasAnswer: (ans) => ans !== null && ans !== undefined
        },
        'underline': {
            render: (q, ans, idx) => { let html = `<div class="qz-underline-box">`; q.options.join(' ').split(/\s+/).forEach((w, i) => { let cw = w.replace(/[.,!?;:"'()]/g, ""), isSel = (ans && ans.includes(cw + '_' + i)); html += `<span class="qz-word ${isSel?'selected':''}" onclick="window.QZ_FN.underlineClick(this, ${idx}, '${cw}', ${i})">${w}</span> `; }); return html + `</div><div style="font-size:12px;color:#94a3b8;margin-top:10px;font-style:italic">👉 Chạm vào từ để gạch chân.</div>`; },
            check: (q, ans) => { if (!ans || ans.length === 0) return false; let s = ans.map(v => v.split('_')[0].toLowerCase().trim()).sort(); let c = q.correct.map(v => v.toLowerCase().trim()).sort(); return JSON.stringify(s) === JSON.stringify(c); },
            hasAnswer: (ans) => ans && ans.length > 0
        }
    };

    window.QZ_FN = {
        saveAns: (qIdx, val, type, extra) => { if(type==='radio') USER_ANSWERS[qIdx] = parseInt(val); else if(type==='checkbox') { if(!USER_ANSWERS[qIdx]) USER_ANSWERS[qIdx]=[]; let arr=[]; document.getElementsByName('opt-'+qIdx).forEach(i=>{if(i.checked) arr.push(parseInt(i.value))}); USER_ANSWERS[qIdx]=arr; } else if(type==='text') { if(!USER_ANSWERS[qIdx]) USER_ANSWERS[qIdx]=[]; USER_ANSWERS[qIdx][val] = extra.trim(); } window.QZ_FN.checkNextBtn(qIdx); },
        clickOpt: (el, type) => { if(type==='radio') { el.parentElement.querySelectorAll('.qz-opt-label').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); } else if(type==='checkbox') { setTimeout(() => { let inp=el.querySelector('input'); el.classList.toggle('selected', inp.checked); }, 50); } else if(type==='circle') { el.parentElement.querySelectorAll('.qz-circle-item').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); let inp=el.querySelector('input'); if(inp){inp.checked=true;inp.onchange();} } },
        underlineClick: (el, idx, txt, wIdx) => { el.classList.toggle('selected'); let val = txt + '_' + wIdx; if(!USER_ANSWERS[idx]) USER_ANSWERS[idx] =[]; if(el.classList.contains('selected')) USER_ANSWERS[idx].push(val); else USER_ANSWERS[idx]=USER_ANSWERS[idx].filter(x=>x!==val); window.QZ_FN.checkNextBtn(idx); },
        checkNextBtn: (idx) => { 
            let h = QZ_TYPES[CURRENT_QUIZ.questions[idx].type]; 
            let ok = h ? h.hasAnswer(USER_ANSWERS[idx], CURRENT_QUIZ.questions[idx]) : false; 
            let b = document.getElementById('qz-btn-next'); 
            if(b) { b.disabled = !ok; } // Sử dụng thuộc tính disabled chuẩn của Button thay vì class
        },
        matchState: {left:null, right:null},
        renderMatchGame: (idx, q, saved) => { saved = saved || {}; const lC = document.getElementById('match-col-left'), rC = document.getElementById('match-col-right'); if(!lC) return; lC.innerHTML = q.matchPairs.map((p,i) => `<div class="qz-match-item ${saved.hasOwnProperty(i)?'matched':''}" onclick="window.QZ_FN.matchClick('left',${i},${idx})" id="m-left-${i}">${p.left}</div>`).join(''); rC.innerHTML = q.matchRightOrder.map(o => `<div class="qz-match-item ${Object.values(saved).includes(o)?'matched':''}" onclick="window.QZ_FN.matchClick('right',${o},${idx})" id="m-right-${o}">${q.matchPairs[o].right}</div>`).join(''); const con = document.querySelector('.qz-match-container'); if(con && !con.querySelector('.match-svg')) { let s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('class','match-svg'); con.appendChild(s); } window.QZ_FN.matchState = {left:null, right:null}; },
        matchClick: (side, id, idx) => { if(!USER_ANSWERS[idx]) USER_ANSWERS[idx] = {}; let state = window.QZ_FN.matchState; if(side==='left' && USER_ANSWERS[idx].hasOwnProperty(id)) { delete USER_ANSWERS[idx][id]; window.QZ_FN.updateMatchUI(idx); return; } if(side==='right') { let f=Object.keys(USER_ANSWERS[idx]).find(k=>USER_ANSWERS[idx][k]===id); if(f){ delete USER_ANSWERS[idx][f]; window.QZ_FN.updateMatchUI(idx); return; } } let col = side==='left'?'match-col-left':'match-col-right'; document.getElementById(col).querySelectorAll('.qz-match-item').forEach(e=>{ if(!e.classList.contains('matched')) e.classList.remove('active'); }); document.getElementById((side==='left'?'m-left-':'m-right-')+id).classList.add('active'); state[side] = id; if(state.left!==null && state.right!==null) { USER_ANSWERS[idx][state.left]=state.right; window.QZ_FN.updateMatchUI(idx); } },
        updateMatchUI: (idx) => { let ans = USER_ANSWERS[idx] || {}; document.querySelectorAll('.qz-match-item').forEach(e=>e.className='qz-match-item'); window.QZ_FN.matchState={left:null, right:null}; for(let l in ans) { document.getElementById('m-left-'+l).className='qz-match-item matched'; document.getElementById('m-right-'+ans[l]).className='qz-match-item matched'; } window.QZ_FN.drawMatchLines(idx); window.QZ_FN.checkNextBtn(idx); },
        drawMatchLines: (idx) => { const con = document.querySelector('.qz-match-container'); if(!con) return; let svg = con.querySelector('.match-svg'); while(svg.firstChild) svg.removeChild(svg.firstChild); let ans = USER_ANSWERS[idx]; if(!ans) return; const cR = con.getBoundingClientRect(); for(let l in ans) { let elL=document.getElementById(`m-left-${l}`), elR=document.getElementById(`m-right-${ans[l]}`); if(elL && elR) { let rL=elL.getBoundingClientRect(), rR=elR.getBoundingClientRect(); let ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('x1', rL.right-cR.left); ln.setAttribute('y1', rL.top+rL.height/2-cR.top); ln.setAttribute('x2', rR.left-cR.left); ln.setAttribute('y2', rR.top+rR.height/2-cR.top); ln.setAttribute('class','match-line'); svg.appendChild(ln); } } }
    };

    // ===============================================================
    // 5. MAIN LOGIC FLOW
    // ===============================================================
    const runTool = () => {
        let app = document.getElementById('qz-app-wrapper');
        
        if (!app) {
            app = document.createElement('div');
            app.id = 'qz-app-wrapper';
            app.innerHTML = `
                <div class="qz-top-header">
                    <div class="qz-logo">✍️ HỌC TẬP & THI CỬ</div>
                    <div class="qz-header-right">
                        <div id="qz-user-display" class="qz-user-badge">---</div>
                        <button class="qz-btn-close-app" id="btn-qz-close" title="Đóng">✕</button>
                    </div>
                </div>

                <!-- SCREEN 1: LOGIN -->
                <div class="qz-screen active" id="sc-login">
                    <div class="qz-auth-box">
                        <h2 style="color:#FFD700; margin-bottom:20px;">ĐĂNG NHẬP</h2>
                        <input type="text" id="inp-qz-user" class="qz-input" placeholder="Tên tài khoản (Ví dụ: 42060)">
                        <input type="password" id="inp-qz-pass" class="qz-input" placeholder="Mật khẩu">
                        <button id="btn-qz-login" class="qz-btn qz-btn-primary">VÀO HỆ THỐNG</button>
                        <div id="btn-qz-goto-reg" class="qz-link">Chưa có tài khoản? Đăng ký ngay</div>
                    </div>
                </div>

                <!-- SCREEN 2: REGISTER -->
                <div class="qz-screen" id="sc-reg">
                    <div class="qz-auth-box">
                        <h2 style="color:#00e676; margin-bottom:20px;">ĐĂNG KÝ</h2>
                        <input type="text" id="inp-qz-reg-user" class="qz-input" placeholder="Tên tài khoản">
                        <input type="password" id="inp-qz-reg-pass" class="qz-input" placeholder="Mật khẩu">
                        <button id="btn-qz-reg" class="qz-btn qz-btn-success">ĐĂNG KÝ</button>
                        <div id="btn-qz-goto-login" class="qz-link" style="color:#aaa;">Quay lại đăng nhập</div>
                    </div>
                </div>

                <!-- SCREEN 3: HOME (QUIZ LIST) -->
                <div class="qz-screen" id="sc-home">
                    <div class="qz-page-title">
                        <span>📚 DANH SÁCH BÀI THI</span>
                        <button class="qz-btn-history" id="btn-qz-history">📜 Lịch sử thi</button>
                    </div>
                    <div id="qz-loading-text" style="text-align:center; color:#94a3b8; padding:30px;">⏳ Đang tải dữ liệu từ Google Sheet...</div>
                    <div class="qz-grid" id="qz-quiz-grid"></div>
                </div>

                <!-- SCREEN 4: PLAYING -->
                <div class="qz-screen" id="sc-play">
                    <div class="qz-play-header">
                        <div>
                            <button id="qz-btn-quit" class="qz-btn-quit">❌ Thoát</button>
                            <span id="qz-progress-text" style="color:#4fc3f7; margin-left: 15px;">Câu 1/10</span>
                        </div>
                        <span class="qz-timer" id="qz-timer-display">15:00</span>
                    </div>
                    <div class="qz-question-container" id="qz-question-render"></div>
                    <div class="qz-play-footer">
                        <button class="qz-btn-nav qz-btn-prev" id="qz-btn-prev">⬅ Quay lại</button>
                        <button class="qz-btn-nav qz-btn-next" id="qz-btn-next" disabled>Tiếp theo ➡</button>
                    </div>
                </div>

                <!-- SCREEN 5: RESULT -->
                <div class="qz-screen" id="sc-result">
                    <div class="qz-auth-box" style="max-width:500px; margin: 20px auto;">
                        <h2 style="color:#FFD700; margin-bottom:20px;">KẾT QUẢ BÀI THI</h2>
                        <div class="qz-score-box" id="qz-final-score">0/10</div>
                        <p style="color:#cbd5e1; margin-bottom:5px;">Người thi: <b style="color:#fff;" id="qz-result-user">---</b></p>
                        <p style="color:#cbd5e1; margin-bottom:20px;">Thời gian: <b style="color:#fff;" id="qz-final-time">0 phút</b></p>
                        <p id="qz-sync-status" style="color:#00e676; font-size:13px; margin-bottom:20px;">⏳ Đang lưu kết quả lên hệ thống...</p>
                        
                        <div style="display:flex; gap:10px;">
                            <button class="qz-btn" style="background:#64748b;" id="btn-qz-review">Xem chi tiết đáp án</button>
                            <button class="qz-btn qz-btn-primary" id="btn-qz-gohome">Về trang chủ</button>
                        </div>
                    </div>
                </div>

                <!-- SCREEN 6: HISTORY -->
                <div class="qz-screen" id="sc-history">
                    <div class="qz-page-title">
                        <span>📜 LỊCH SỬ THI CỦA BẠN</span>
                        <button class="qz-btn-history" id="btn-qz-his-home">⬅ Quay lại</button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="qz-history-table">
                            <thead><tr><th>Thời gian</th><th>Tên bài thi</th><th>Điểm số</th></tr></thead>
                            <tbody id="qz-history-body">
                                <tr><td colspan="3" style="text-align:center; color:#94a3b8;">Chưa có dữ liệu</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- SCREEN 7: REVIEW -->
                <div class="qz-screen" id="sc-review">
                    <div class="qz-page-title">
                        <span>🔍 CHI TIẾT ĐÁP ÁN</span>
                        <button class="qz-btn-history" id="btn-qz-rev-home">⬅ Đóng</button>
                    </div>
                    <div id="qz-review-content" style="background:rgba(255,255,255,0.95); border-radius:16px; padding:20px; color:#333;"></div>
                </div>

            `;
            document.body.appendChild(app);
            
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);
            if(!document.querySelector('link[href*="font-awesome"]')) {
                const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
                document.head.appendChild(fa);
            }

            const $ = (id) => document.getElementById(id);
            const switchScreen = (id) => { document.querySelectorAll('.qz-screen').forEach(s => s.classList.remove('active')); $(id).classList.add('active'); };

            // ==========================================
            // LOGIC AUTH SỬ DỤNG UNIVERSAL FETCH MỚI
            // ==========================================
            const checkAuth = () => {
                let saved = localStorage.getItem('tgdd_guest_account');
                if (saved) {
                    let acc = JSON.parse(saved); USER_NAME = acc.user; IS_LOGGED_IN = true;
                    $('qz-user-display').innerHTML = `👤 ${USER_NAME} <span style="font-size:10px; cursor:pointer; color:#ef4444; margin-left:10px;" id="btn-qz-logout">(Đăng xuất)</span>`;
                    $('btn-qz-logout').onclick = () => { localStorage.removeItem('tgdd_guest_account'); IS_LOGGED_IN = false; checkAuth(); };
                    switchScreen('sc-home');
                    loadHomeData();
                } else {
                    USER_NAME = "---"; IS_LOGGED_IN = false;
                    $('qz-user-display').innerText = "Chưa đăng nhập";
                    switchScreen('sc-login');
                }
            };

            const handleAuthCall = async (action, u, p, btnId) => {
                if(!u || !p) { alert("Vui lòng nhập đủ thông tin!"); return; }
                const btn = $(btnId); const oldText = btn.innerText; btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;
                
                try {
                    const resText = await universalFetch({
                        method: "POST", 
                        url: API_URL, 
                        data: JSON.stringify({ action: action, user: u, password: p }),
                        headers: { "Content-Type": "application/x-www-form-urlencoded" }
                    });
                    
                    btn.innerText = oldText; btn.disabled = false;
                    const json = JSON.parse(resText);
                    
                    if(json.status === 'success') {
                        if(action === 'login_guest') { localStorage.setItem('tgdd_guest_account', JSON.stringify({user: u, pass: p})); checkAuth(); }
                        else { alert("Đăng ký thành công! Hãy đăng nhập."); switchScreen('sc-login'); }
                    } else alert("❌ Lỗi: " + json.message); 
                    
                } catch (e) {
                    alert("❌ Lỗi kết nối mạng hoặc API chưa cấu hình CORS!"); 
                    btn.innerText = oldText; btn.disabled = false;
                }
            };

            $('btn-qz-login').onclick = () => handleAuthCall('login_guest', $('inp-qz-user').value.trim(), $('inp-qz-pass').value.trim(), 'btn-qz-login');
            $('btn-qz-reg').onclick = () => handleAuthCall('register_guest', $('inp-qz-reg-user').value.trim(), $('inp-qz-reg-pass').value.trim(), 'btn-qz-reg');
            $('btn-qz-goto-reg').onclick = () => switchScreen('sc-reg');
            $('btn-qz-goto-login').onclick = () => switchScreen('sc-login');
            $('btn-qz-close').onclick = () => { app.style.display = 'none'; };

            // ==========================================
            // LOGIC LOAD DATA & HOME
            // ==========================================
            const loadHomeData = async () => {
                $('qz-loading-text').style.display = 'block'; $('qz-quiz-grid').innerHTML = '';
                
                // Tải danh sách bài thi (Đã fix gọi qua hàm universalFetch bên trên)
                QUIZ_LIST = await fetchAndParseQuizzes();
                
                // Đồng bộ lịch sử (Gọi qua Universal Fetch)
                if(API_URL) {
                    try {
                        const resText = await universalFetch({ method: "GET", url: `${API_URL}?action=get_config&type=quiz_history&user=${USER_NAME}` });
                        let json = JSON.parse(resText);
                        if (json.data) QUIZ_HISTORY = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;
                    } catch(e) { console.log("Không tải được lịch sử", e); }
                }

                $('qz-loading-text').style.display = 'none';
                if(QUIZ_LIST.length === 0) { $('qz-quiz-grid').innerHTML = '<div style="color:#ef4444;">Không có bài thi nào! Vui lòng kiểm tra lại Google Sheet.</div>'; return; }

                QUIZ_LIST.forEach((quiz, idx) => {
                    $('qz-quiz-grid').innerHTML += `
                        <div class="qz-card" data-idx="${idx}">
                            <div class="qz-card-icon">📝</div>
                            <div class="qz-card-title">${quiz.name}</div>
                            <div class="qz-card-desc">${quiz.questions.length} câu hỏi • ${quiz.timeLimit} phút</div>
                        </div>
                    `;
                });

                document.querySelectorAll('.qz-card').forEach(card => {
                    card.onclick = () => startQuiz(parseInt(card.getAttribute('data-idx')));
                });
            };

            // ==========================================
            // LOGIC PLAY QUIZ (THÊM THOÁT BÀI & FIX NEXT/PREV)
            // ==========================================
            $('qz-btn-quit').onclick = () => {
                if(confirm("Bạn có chắc chắn muốn thoát? Kết quả bài thi sẽ không được lưu!")) {
                    clearInterval(TIMER_INTERVAL);
                    switchScreen('sc-home');
                }
            }

            const startQuiz = (idx) => {
                CURRENT_QUIZ = QUIZ_LIST[idx];
                USER_ANSWERS = new Array(CURRENT_QUIZ.questions.length).fill(null);
                CURRENT_Q_IDX = 0;
                TIME_LEFT = CURRENT_QUIZ.timeLimit * 60; 
                
                switchScreen('sc-play');
                renderQuestion(0);
                
                if(TIMER_INTERVAL) clearInterval(TIMER_INTERVAL);
                TIMER_INTERVAL = setInterval(() => {
                    TIME_LEFT--;
                    if(TIME_LEFT <= 0) { clearInterval(TIMER_INTERVAL); submitQuiz(); }
                    let m = Math.floor(TIME_LEFT/60); let s = TIME_LEFT%60;
                    $('qz-timer-display').innerText = `${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
                }, 1000);
            };

            const renderQuestion = (idx) => {
                const q = CURRENT_QUIZ.questions[idx];
                $('qz-progress-text').innerText = `Câu ${idx+1} / ${CURRENT_QUIZ.questions.length}`;
                
                let imgHtml = q.image ? `<img src="${q.image}" class="qz-img">` : '';
                let content = "";
                let handler = QZ_TYPES[q.type];
                if (handler) {
                    content = (q.type === 'text') ? handler.render(q, USER_ANSWERS[idx], idx) : `<div class="qz-q-text">Câu ${idx+1}: ${q.question}</div>` + handler.render(q, USER_ANSWERS[idx], idx);
                }
                
                $('qz-question-render').innerHTML = imgHtml + content;
                
                $('qz-btn-prev').disabled = (idx === 0);
                $('qz-btn-next').innerText = (idx === CURRENT_QUIZ.questions.length - 1) ? "Nộp Bài" : "Tiếp theo ➡";
                window.QZ_FN.checkNextBtn(idx);
            };

            $('qz-btn-prev').onclick = () => { if(CURRENT_Q_IDX > 0) renderQuestion(--CURRENT_Q_IDX); };
            $('qz-btn-next').onclick = () => { 
                if(CURRENT_Q_IDX < CURRENT_QUIZ.questions.length - 1) renderQuestion(++CURRENT_Q_IDX); 
                else submitQuiz(); 
            };

            // ==========================================
            // LOGIC SUBMIT & HISTORY
            // ==========================================
            const submitQuiz = async () => {
                clearInterval(TIMER_INTERVAL);
                let score = 0;
                CURRENT_QUIZ.questions.forEach((q, i) => {
                    let h = QZ_TYPES[q.type];
                    if (h && h.check(q, USER_ANSWERS[i])) score++;
                });

                $('qz-final-score').innerText = `${score}/${CURRENT_QUIZ.questions.length}`;
                
                let timeSpent = (CURRENT_QUIZ.timeLimit * 60) - TIME_LEFT;
                $('qz-final-time').innerText = `${Math.floor(timeSpent/60)} phút ${timeSpent%60} giây`;
                
                $('qz-result-user').innerText = USER_NAME;
                switchScreen('sc-result');

                let hisRecord = {
                    time: new Date().getTime(),
                    quizName: CURRENT_QUIZ.name,
                    score: `${score}/${CURRENT_QUIZ.questions.length}`
                };
                QUIZ_HISTORY.unshift(hisRecord);
                
                if (API_URL) {
                    $('qz-sync-status').innerText = "⏳ Đang lưu kết quả...";
                    $('qz-sync-status').style.color = "#FFD700";
                    
                    try {
                        await universalFetch({
                            method: "POST", 
                            url: API_URL, 
                            data: JSON.stringify({ action: 'save_config', type: 'quiz_history', user: USER_NAME, config: QUIZ_HISTORY.slice(0, 20) }),
                            headers: { "Content-Type": "application/x-www-form-urlencoded" }
                        });
                        $('qz-sync-status').innerText = "✅ Đã lưu kết quả thành công!"; 
                        $('qz-sync-status').style.color = "#00e676";
                    } catch (e) {
                        $('qz-sync-status').innerText = "⚠️ Lưu lịch sử thất bại do lỗi mạng.";
                        $('qz-sync-status').style.color = "#ef4444";
                    }
                } else {
                    $('qz-sync-status').innerText = "⚠️ Không lưu được lịch sử (Chưa có API).";
                }
            };

            $('btn-qz-gohome').onclick = () => switchScreen('sc-home');
            $('btn-qz-his-home').onclick = () => switchScreen('sc-home');
            $('btn-qz-rev-home').onclick = () => switchScreen('sc-result');

            $('btn-qz-history').onclick = () => {
                let html = '';
                if(QUIZ_HISTORY.length === 0) html = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Chưa có dữ liệu thi</td></tr>';
                else {
                    QUIZ_HISTORY.forEach(h => {
                        let d = new Date(h.time);
                        html += `<tr><td>${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}</td><td>${h.quizName}</td><td style="color:#00e676; font-weight:bold;">${h.score}</td></tr>`;
                    });
                }
                $('qz-history-body').innerHTML = html;
                switchScreen('sc-history');
            };

            $('btn-qz-review').onclick = () => {
                let html = "";
                CURRENT_QUIZ.questions.forEach((q, i) => {
                    let h = QZ_TYPES[q.type]; 
                    let isRight = h ? h.check(q, USER_ANSWERS[i]) : false;
                    let img = q.image ? `<img src="${q.image}" style="max-height:150px; border-radius:8px; display:block; margin: 10px 0;">` : '';
                    let qTxt = (q.type === 'text') ? q.question.replace(/{input}/g, '...') : q.question;
                    html += `<div style="margin-bottom:20px; padding:15px; border:1px solid #ddd; border-radius:12px; background:#fff;"><div style="font-size:16px; font-weight:bold; color:${isRight?'#047857':'#b91c1c'}; margin-bottom:10px;">Câu ${i+1}: ${qTxt} ${isRight?'✅':'❌'}</div>${img}`;

                    if (q.type === 'text') {
                        let uArr = USER_ANSWERS[i]||[], cArr = q.correct;
                        for(let k=0; k<cArr.length; k++) {
                            let uV = uArr[k]||"", cV = cArr[k], ok = (uV.toLowerCase().trim()===cV.toLowerCase().trim());
                            html += `<div class="qz-review-opt ${ok?'correct':'wrong'}"><span>Ô ${k+1}: <b>${uV||"(Trống)"}</b></span>${!ok?` <span>(Đúng: <b>${cV}</b>)</span>`:''}</div>`;
                        }
                    } else if (q.type === 'match') {
                         let uMap = USER_ANSWERS[i]||{};
                         q.matchPairs.forEach((p, idx) => {
                            let uSel = uMap[idx], ok = (uSel === idx), uTxt = (uSel !== undefined) ? q.matchPairs[uSel].right : "(Chưa nối)";
                            html += `<div class="qz-review-opt ${ok?'correct':'wrong'}"><span>${p.left} ➡ ${ok ? p.right : uTxt}</span>${!ok?`<span style="font-size:12px">(Đúng: ${p.right})</span>`:''}</div>`;
                         });
                    } else if (q.type === 'circle') {
                         html += `<div style="display:flex; flex-direction:column; gap:5px;">`;
                         q.options.forEach((opt, oIdx) => {
                             let cl = opt.replace(/^[A-D][\.\)]\s*/, '');
                             let isC = q.correct.includes(oIdx+1), isU = (USER_ANSWERS[i]===oIdx);
                             let cls = isC ? 'correct' : (isU ? 'wrong' : '');
                             if(cls) html += `<div class="qz-review-opt ${cls}">${cl}</div>`;
                         });
                         html += `</div>`;
                    } else if (q.type === 'underline') {
                         let ws = q.options.join(' ').split(/\s+/), uSel = USER_ANSWERS[i]||[]; 
                         html += `<div class="qz-underline-box" style="pointer-events:none">`;
                         ws.forEach((w, wIdx) => {
                             let cw = w.replace(/[.,!?;:"'()]/g, ""), k = cw+'_'+wIdx, isSel = uSel.includes(k), isKey = q.correct.some(c=>c.toLowerCase().trim()===cw.toLowerCase().trim());
                             let cls = (isSel&&isKey)?'r-correct':((isSel&&!isKey)?'r-wrong':((!isSel&&isKey)?'r-missed':''));
                             html += `<span class="qz-word ${cls}">${w}</span> `;
                         });
                         html += `</div><div style="margin-top:10px;color:#047857;font-weight:bold;">Đúng: ${q.correct.join(', ')}</div>`;
                    } else {
                         q.options.forEach((opt, oIdx)=>{
                           let isC = q.correct.includes(oIdx+1), isU = Array.isArray(USER_ANSWERS[i]) ? USER_ANSWERS[i].includes(oIdx) : USER_ANSWERS[i]===oIdx;
                           let cls = isC ? 'correct' : (isU ? 'wrong' : '');
                           if(cls) html += `<div class="qz-review-opt ${cls}">${opt}</div>`;
                        });
                    }
                    if(q.explain) html += `<div class="qz-explain">💡 ${q.explain}</div>`; 
                    html += `</div>`; 
                });
                
                $('qz-review-content').innerHTML = html;
                switchScreen('sc-review');
            };

            // Khởi động
            checkAuth();
        }
        
        app.style.display = 'block';
    };

    return {
        name: "Luyện Thi",
        icon: `<svg viewBox="0 0 24 24"><path fill="white" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2.12-1.15-.31-1.39-1.81.98L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>`,
        bgColor: "#10b981", 
        action: runTool
    };
})
