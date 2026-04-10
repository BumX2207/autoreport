((context) => {
    // ===============================================================
    // 1. DATA USER & CSS
    // ===============================================================
    const getUserContext = () => {
        const userObj = window.GLOBAL_AUTH ? window.GLOBAL_AUTH.currentUserData : null;
        if (!userObj) return { isLogged: false, isVip: false, username: null };
        return { isLogged: true, isVip: userObj.vip && userObj.vip.toString().toUpperCase() === "VIP", username: userObj.user };
    };

    const MY_CSS = `
        @keyframes slideInUp { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes eq-bounce { 0% { height: 4px; } 50% { height: 16px; } 100% { height: 4px; } }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        #mz-app { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background: linear-gradient(-45deg, #0f172a, #1e1b4b, #312e81, #1e1b4b); background-size: 400% 400%; animation: gradientBG 15s ease infinite; z-index:2147483647; font-family: 'Segoe UI', system-ui, sans-serif; flex-direction:column; overflow: hidden; box-sizing: border-box; color: #fff;}
        #mz-app * { box-sizing: border-box; }
        
        .mz-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 20; flex-shrink: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(20px);}
        .mz-logo { font-size: 16px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #00d2ff, #3a7bd5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;}
        .mz-btn-close { background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: 0.3s; }
        .mz-btn-close:hover { background: #ff4757; transform: rotate(90deg); }

        .mz-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        
        .mz-player-area { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 20px; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%); }
        
        .mz-disc-wrap { width: 220px; height: 220px; border-radius: 50%; padding: 5px; background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05)); box-shadow: 0 10px 30px rgba(0,0,0,0.5); position: relative; margin-bottom: 20px;}
        .mz-disc { width: 100%; height: 100%; border-radius: 50%; background: #111; border: 2px solid #333; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; box-shadow: inset 0 0 20px #000; animation: spin 4s linear infinite; animation-play-state: paused; }
        .mz-disc.playing { animation-play-state: running; }
        .mz-disc::before, .mz-disc::after { content: ''; position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
        .mz-disc::before { width: 80%; height: 80%; } .mz-disc::after { width: 60%; height: 60%; }
        .mz-disc-core { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ff9a9e, #fecfef); border: 4px solid #000; position: relative; z-index: 2; display: flex; justify-content: center; align-items: center;}
        .mz-disc-core::after { content:''; width:12px; height:12px; background:#fff; border-radius:50%; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);}

        .mz-info { text-align: center; margin-bottom: 20px; width: 100%; padding: 0 20px; }
        .mz-title { font-size: 22px; font-weight: 900; margin: 0 0 5px 0; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .mz-genre { font-size: 13px; font-weight: 600; color: #00d2ff; margin: 0; text-transform: uppercase; letter-spacing: 2px; }

        .mz-progress-wrap { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 25px; }
        .mz-time-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #94a3b8; }
        .mz-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 5px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; position: relative; overflow: hidden;}
        .mz-slider::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: transparent; }
        .mz-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 6px; width: 6px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: -400px 0 0 400px #00d2ff; }

        .mz-controls { display: flex; justify-content: center; align-items: center; gap: 25px; width: 100%; max-width: 350px;}
        .mz-ctrl-btn { background: transparent; border: none; color: #fff; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; opacity: 0.8;}
        .mz-ctrl-btn:hover { opacity: 1; transform: scale(1.1); color: #00d2ff;}
        .mz-btn-play { width: 64px; height: 64px; background: linear-gradient(135deg, #00d2ff, #3a7bd5); border-radius: 50%; box-shadow: 0 10px 20px rgba(0, 210, 255, 0.4); opacity: 1;}
        .mz-btn-play:hover { transform: scale(1.05); box-shadow: 0 12px 25px rgba(0, 210, 255, 0.6); color:#fff;}
        .mz-ctrl-btn.active { color: #00d2ff; opacity: 1;} 

        /* Danh Sách Bài Hát */
        .mz-playlist-area { flex: 1; background: rgba(0,0,0,0.3); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border-radius: 30px 30px 0 0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 -10px 40px rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);}
        
        .mz-genres-wrap { padding: 15px 20px 10px; display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;}
        .mz-genres-wrap::-webkit-scrollbar { display: none; }
        .mz-genre-pill { padding: 6px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .mz-genre-pill.active { background: #00d2ff; color: #0f172a; border-color: #00d2ff; box-shadow: 0 0 10px rgba(0,210,255,0.3); }
        .mz-genre-pill.vip { background: linear-gradient(135deg, #FFD700, #FDB931); color: #5d4037; border:none; box-shadow: 0 2px 8px rgba(255,215,0,0.4);}
        .mz-genre-pill.vip.active { box-shadow: 0 0 15px rgba(255,215,0,0.8); border: 2px solid #fff;}

        .mz-list { flex: 1; overflow-y: auto; padding: 10px 15px 20px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: none;}
        .mz-list::-webkit-scrollbar { display: none; }
        .mz-track { display: flex; align-items: center; padding: 10px 15px; border-radius: 12px; background: rgba(255,255,255,0.03); cursor: pointer; transition: 0.2s; border: 1px solid transparent;}
        .mz-track:hover { background: rgba(255,255,255,0.08); }
        .mz-track.active { background: rgba(0, 210, 255, 0.1); border-color: rgba(0, 210, 255, 0.3); }
        
        .mz-tk-num { width: 30px; font-size: 13px; color: #64748b; font-weight: 700; }
        .mz-tk-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .mz-tk-name { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mz-tk-genre { font-size: 11px; color: #94a3b8; margin-top: 3px; }
        
        /* Nút Tình Yêu (Thêm vào VIP) */
        .mz-btn-heart { background: transparent; border: none; color: #475569; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;}
        .mz-btn-heart:hover { transform: scale(1.2); }
        .mz-btn-heart.loved { color: #ff4757; filter: drop-shadow(0 0 5px rgba(255,71,87,0.5));}

        .mz-eq { display: none; width: 20px; height: 16px; align-items: flex-end; gap: 2px; margin-right:10px;}
        .mz-eq-bar { width: 4px; background: #00d2ff; border-radius: 2px; animation: eq-bounce 0.5s infinite ease-in-out alternate; }
        .mz-eq-bar:nth-child(2) { animation-delay: 0.2s; }
        .mz-eq-bar:nth-child(3) { animation-delay: 0.4s; }
        .mz-track.active .mz-eq { display: flex; }
        .mz-track.active .mz-tk-num { display: none; } 

        #mz-sync-msg { position:absolute; top: 15px; left:50%; transform:translateX(-50%); background: #00b894; color:#fff; font-size:11px; font-weight:bold; padding:4px 10px; border-radius:20px; z-index:50; display:none; animation: fadeIn 0.2s;}

        @media (max-width: 480px) {
            .mz-disc-wrap { width: 180px; height: 180px; margin-bottom: 15px;}
            .mz-title { font-size: 18px; }
            .mz-btn-play { width: 56px; height: 56px; }
            .mz-ctrl-btn svg { width: 24px; height: 24px; }
            .mz-player-area { padding: 15px 10px; }
        }
    `;

    // ===============================================================
    // 2. SVG ICONS
    // ===============================================================
    const ICONS = {
        play: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
        pause: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
        prev: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>`,
        next: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
        shuffle: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>`,
        repeat: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
        note: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
        heart: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    };

    // ===============================================================
    // 3. LOGIC MUSIC PLAYER CỐT LÕI
    // ===============================================================
    const MUSIC_API_URL = 'https://script.google.com/macros/s/AKfycbwSSR6QxnyhXpXGcyl2SOEJsvf3J1_ysYvRtJCFozCfJAIHBqbda9D4TNZQV0asMQaV/exec';

    let allMusic = [];     
    let displayList = [];  
    let vipAlbumIds = []; // Mảng chứa ID các bài hát yêu thích của VIP (Cột O)

    let currentTrackIndex = 0; 
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;  

    let audio = new Audio();
    audio.crossOrigin = "anonymous"; 

    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min < 10 ? '0'+min : min}:${sec < 10 ? '0'+sec : sec}`;
    };

    const runTool = () => {
        let app = document.getElementById('mz-app');
        const userInfo = getUserContext();

        if (!app) {
            app = document.createElement('div');
            app.id = 'mz-app';
            app.innerHTML = `
                <div id="mz-sync-msg">Đã lưu Album VIP!</div>
                <div class="mz-header">
                    <div class="mz-logo">${ICONS.note} Chill Vibes</div>
                    <button class="mz-btn-close" id="mz-btn-close">✖</button>
                </div>
                
                <div class="mz-body">
                    <!-- Player Khu Vực Đĩa -->
                    <div class="mz-player-area">
                        <div class="mz-disc-wrap">
                            <div class="mz-disc" id="mz-disc">
                                <div class="mz-disc-core"></div>
                            </div>
                        </div>
                        
                        <div class="mz-info">
                            <h2 class="mz-title" id="mz-title">Đang kết nối...</h2>
                            <p class="mz-genre" id="mz-genre">VUI LÒNG CHỜ</p>
                        </div>

                        <div class="mz-progress-wrap">
                            <input type="range" class="mz-slider" id="mz-slider" value="0" min="0" max="100" step="1">
                            <div class="mz-time-row">
                                <span id="mz-time-current">00:00</span>
                                <span id="mz-time-total">00:00</span>
                            </div>
                        </div>

                        <div class="mz-controls">
                            <button class="mz-ctrl-btn" id="btn-shuffle" title="Trộn bài">${ICONS.shuffle}</button>
                            <button class="mz-ctrl-btn" id="btn-prev" title="Bài trước">${ICONS.prev}</button>
                            <button class="mz-ctrl-btn mz-btn-play" id="btn-play">${ICONS.play}</button>
                            <button class="mz-ctrl-btn" id="btn-next" title="Bài tiếp">${ICONS.next}</button>
                            <button class="mz-ctrl-btn" id="btn-repeat" title="Lặp lại">${ICONS.repeat}</button>
                        </div>
                    </div>

                    <!-- Playlist & Thể Loại -->
                    <div class="mz-playlist-area">
                        <div class="mz-genres-wrap" id="mz-genres-wrap">
                            <!-- JS tự sinh các viên thuốc thể loại -->
                        </div>
                        <div class="mz-list" id="mz-list">
                            <div style="text-align:center; padding: 20px; color:#94a3b8; font-size:14px;">Đang kéo dữ liệu nhạc...</div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(app);
            const style = document.createElement('style'); style.innerHTML = MY_CSS; document.head.appendChild(style);

            const $ = (id) => app.querySelector('#' + id);
            $('mz-btn-close').onclick = () => { app.style.display = 'none'; };

            // === HÀM RENDER THỂ LOẠI ===
            const renderGenres = () => {
                const genres = [...new Set(allMusic.map(m => m.genre))];
                let html = `<div class="mz-genre-pill active" data-genre="all">Tất cả</div>`;
                
                // Nếu là VIP thì chèn luôn thẻ Album VIP màu vàng lấp lánh vào đầu tiên
                if (userInfo.isVip) {
                    html += `<div class="mz-genre-pill vip" data-genre="vip">⭐ Album VIP</div>`;
                }

                genres.forEach(g => { html += `<div class="mz-genre-pill" data-genre="${g}">${g}</div>`; });
                $('mz-genres-wrap').innerHTML = html;

                app.querySelectorAll('.mz-genre-pill').forEach(pill => {
                    pill.onclick = (e) => {
                        app.querySelectorAll('.mz-genre-pill').forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                        const selGenre = pill.getAttribute('data-genre');
                        
                        if (selGenre === 'all') {
                            displayList = [...allMusic];
                        } else if (selGenre === 'vip') {
                            displayList = allMusic.filter(m => vipAlbumIds.includes(m.id));
                        } else {
                            displayList = allMusic.filter(m => m.genre === selGenre);
                        }
                        
                        renderPlaylist();
                    };
                });
            };

            // === HÀM RENDER DANH SÁCH BÀI HÁT ===
            const renderPlaylist = () => {
                const listEl = $('mz-list');
                if (displayList.length === 0) {
                    listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8; font-size:13px;">Chưa có bài hát nào trong mục này.</div>`;
                    return;
                }

                let html = '';
                displayList.forEach((track, idx) => {
                    const isActive = (audio.src === track.url) ? 'active' : '';
                    const isLoved = vipAlbumIds.includes(track.id) ? 'loved' : '';
                    const btnHeart = userInfo.isVip ? `<button class="mz-btn-heart ${isLoved}" data-track-id="${track.id}">${ICONS.heart}</button>` : '';

                    html += `
                        <div class="mz-track ${isActive}" data-idx="${idx}">
                            <div class="mz-tk-num">${idx + 1}</div>
                            <div class="mz-eq"><div class="mz-eq-bar"></div><div class="mz-eq-bar"></div><div class="mz-eq-bar"></div></div>
                            
                            <div class="mz-tk-info">
                                <div class="mz-tk-name">${track.title}</div>
                                <div class="mz-tk-genre">${track.genre}</div>
                            </div>
                            ${btnHeart}
                        </div>
                    `;
                });
                listEl.innerHTML = html;

                // Gán sự kiện Play bài & Tim bài
                listEl.querySelectorAll('.mz-track').forEach(tr => {
                    tr.onclick = (e) => {
                        // Nếu bấm trúng nút Tim thì Không Play nhạc
                        if (e.target.closest('.mz-btn-heart')) {
                            const btn = e.target.closest('.mz-btn-heart');
                            const trackId = btn.getAttribute('data-track-id');
                            
                            if (vipAlbumIds.includes(trackId)) {
                                vipAlbumIds = vipAlbumIds.filter(id => id !== trackId);
                                btn.classList.remove('loved');
                            } else {
                                vipAlbumIds.push(trackId);
                                btn.classList.add('loved');
                            }
                            
                            // Lưu Local & Call API ngầm
                            localStorage.setItem('mz_vip_album_' + userInfo.username, JSON.stringify(vipAlbumIds));
                            syncVipAlbum();

                            // Nếu đang đứng ở thẻ VIP mà tim bỏ đi thì phải xóa khỏi UI ngay
                            const activeTab = $('mz-genres-wrap').querySelector('.active').getAttribute('data-genre');
                            if (activeTab === 'vip') {
                                displayList = allMusic.filter(m => vipAlbumIds.includes(m.id));
                                renderPlaylist();
                            }
                            return;
                        }

                        // Nếu không trúng nút Tim thì Play bài nhạc
                        currentTrackIndex = parseInt(tr.getAttribute('data-idx'));
                        loadTrack(currentTrackIndex);
                        audio.play();
                    };
                });
            };

            // Hàm Đồng bộ Album Lên Cloud
            const syncVipAlbum = () => {
                if (!userInfo.isVip) return;
                const payload = { action: 'sync_vip_album', user: userInfo.username, albumIds: JSON.stringify(vipAlbumIds) };
                
                if (context.GM_xmlhttpRequest) {
                    context.GM_xmlhttpRequest({ method: "POST", url: MUSIC_API_URL, data: JSON.stringify(payload), onload: () => {showSyncMsg()} });
                } else {
                    fetch(MUSIC_API_URL, { method: "POST", body: JSON.stringify(payload) }).then(()=>{showSyncMsg()}).catch(()=>{});
                }
            };

            const showSyncMsg = () => {
                const msg = $('mz-sync-msg');
                msg.style.display = 'block';
                setTimeout(() => { msg.style.display = 'none'; }, 1500);
            };

            // 5. Logic Audio Control
            const updatePlayState = () => {
                if (isPlaying) { $('btn-play').innerHTML = ICONS.pause; $('mz-disc').classList.add('playing'); } 
                else { $('btn-play').innerHTML = ICONS.play; $('mz-disc').classList.remove('playing'); }
                
                app.querySelectorAll('.mz-track').forEach((tr, idx) => {
                    if (idx === currentTrackIndex) tr.classList.add('active');
                    else tr.classList.remove('active');
                });
            };

            const loadTrack = (index) => {
                if (displayList.length === 0) return;
                const track = displayList[index];
                audio.src = track.url;
                $('mz-title').innerText = track.title;
                $('mz-genre').innerText = track.genre;
                $('mz-slider').value = 0;
                $('mz-time-current').innerText = "00:00";
                audio.load();
            };

            $('btn-play').onclick = () => {
                if (displayList.length === 0) return;
                if (!audio.src) loadTrack(0);
                if (audio.paused) audio.play();
                else audio.pause();
            };

            const playNext = () => {
                if (displayList.length === 0) return;
                if (isShuffle) currentTrackIndex = Math.floor(Math.random() * displayList.length);
                else currentTrackIndex = (currentTrackIndex + 1) % displayList.length;
                loadTrack(currentTrackIndex);
                audio.play();
            };

            const playPrev = () => {
                if (displayList.length === 0) return;
                currentTrackIndex = (currentTrackIndex - 1 + displayList.length) % displayList.length;
                loadTrack(currentTrackIndex);
                audio.play();
            };

            $('btn-next').onclick = playNext;
            $('btn-prev').onclick = playPrev;

            $('btn-shuffle').onclick = () => { isShuffle = !isShuffle; $('btn-shuffle').classList.toggle('active', isShuffle); };
            $('btn-repeat').onclick = () => { isRepeat = !isRepeat; $('btn-repeat').classList.toggle('active', isRepeat); };

            audio.addEventListener('play', () => { isPlaying = true; updatePlayState(); });
            audio.addEventListener('pause', () => { isPlaying = false; updatePlayState(); });
            
            audio.addEventListener('loadedmetadata', () => {
                $('mz-time-total').innerText = formatTime(audio.duration);
                $('mz-slider').max = audio.duration;
            });

            audio.addEventListener('timeupdate', () => {
                if (!audio.paused) {
                    $('mz-slider').value = audio.currentTime;
                    $('mz-time-current').innerText = formatTime(audio.currentTime);
                }
            });

            $('mz-slider').addEventListener('input', (e) => { $('mz-time-current').innerText = formatTime(e.target.value); });
            $('mz-slider').addEventListener('change', (e) => { audio.currentTime = e.target.value; });

            audio.addEventListener('ended', () => {
                if (isRepeat) { audio.currentTime = 0; audio.play(); } 
                else { playNext(); }
            });

            audio.addEventListener('error', () => {
                $('mz-title').innerText = "❌ Không tải được Link nhạc này";
                setTimeout(playNext, 2000); 
            });

            // 6. Fetch Data (Danh sách Bài hát + Lấy Album VIP)
            const callApi = (payload, callback) => {
                if (context.GM_xmlhttpRequest) {
                    context.GM_xmlhttpRequest({ method: "POST", url: MUSIC_API_URL, data: JSON.stringify(payload), onload: (res) => callback(res.responseText) });
                } else {
                    fetch(MUSIC_API_URL, { method: "POST", body: JSON.stringify(payload) }).then(r => r.text()).then(callback).catch(()=>{});
                }
            };

            const fetchAllData = () => {
                // Thử load Cache trước cho mượt
                try {
                    let cacheMusic = localStorage.getItem('mz_all_music');
                    if (cacheMusic) {
                        allMusic = JSON.parse(cacheMusic);
                        displayList = [...allMusic];
                        
                        if (userInfo.isVip) {
                            let cacheAlbum = localStorage.getItem('mz_vip_album_' + userInfo.username);
                            if (cacheAlbum) vipAlbumIds = JSON.parse(cacheAlbum);
                        }
                        
                        renderGenres();
                        renderPlaylist();
                        loadTrack(0);
                    }
                } catch(e){}

                // Kéo Nhạc Mặc định
                callApi({ action: 'get_music_list' }, (resText) => {
                    try {
                        let j = JSON.parse(resText);
                        if (j.status === 'success') {
                            allMusic = j.data;
                            displayList = [...allMusic];
                            localStorage.setItem('mz_all_music', JSON.stringify(allMusic));
                            renderGenres();
                            renderPlaylist();
                        }
                    } catch(e){}
                });

                // Nếu là VIP, Kéo Album VIP từ Cloud (Cột O)
                if (userInfo.isVip) {
                    callApi({ action: 'get_vip_album', user: userInfo.username }, (resText) => {
                        try {
                            let j = JSON.parse(resText);
                            if (j.status === 'success' && j.data) {
                                vipAlbumIds = JSON.parse(j.data);
                                localStorage.setItem('mz_vip_album_' + userInfo.username, j.data);
                                renderPlaylist(); // Cập nhật lại trái tim màu đỏ
                            }
                        } catch(e){}
                    });
                }
            };

            fetchAllData();
        }
        
        app.style.display = 'flex';
    };

    return {
        name: "Chill Music",
        icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
        bgColor: "#1e1b4b",
        action: runTool
    };
})
