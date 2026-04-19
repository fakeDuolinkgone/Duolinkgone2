// ==========================================
// 1. KHAI BÁO BIẾN TOÀN CỤC
// ==========================================
let matchPairs = [];
let remainingPairs = 0;
let mode = "typing"; // "typing", "choice", "match"
let currentLevel = 1;

let streak = 0;
let maxStreak = 0; // combo cao nhất

let playingEng = [], playingVn = [];
let currentIndex, so_cau = 0;
let dung = 0, sai = [];
let startTime = 0;

let eng = [], vn = [];
let dataLoaded = false;

let selectedGrade = 10;
let filteredVocab = [];
let selectedUnit = 1;

let selectedEng = null;
let selectedVn = null;

// Khai báo các phần tử DOM thường dùng
let input, box, overlay, popup, settingsOverlay, gradePopup;
let soundCorrect, soundWrong, soundFinish;
let soundEnabled = true;

// ==========================================
// 2. KHỞI TẠO DATA VÀ GẮN SỰ KIỆN (DOM READY)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 2.1 Khởi tạo dữ liệu từ englishVocabularys.js
    if (typeof vocabData !== 'undefined') {
        eng = vocabData.map(x => x.word);
        vn = vocabData.map(x => x.meaning.map(m => m.toLowerCase()));
        dataLoaded = true;
        console.log("Dữ liệu đã sẵn sàng!");
    } else {
        console.error("LỖI: Không tìm thấy biến vocabData từ file englishVocabularys.js");
    }

    // 2.2 Gán DOM Elements
    input = document.getElementById("answer");
    box = document.getElementById("box");
    overlay = document.getElementById("overlay");
    popup = document.getElementById("popup");
    settingsOverlay = document.getElementById("settingsOverlay");
    gradePopup = document.getElementById("gradePopup");

    soundCorrect = document.getElementById("sound-correct");
    soundWrong = document.getElementById("sound-wrong");
    soundFinish = document.getElementById("sound-finish");

    // 2.3 Gán Sự kiện an toàn
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitAnswer();
        });
    }

    // Đóng Settings khi click ra ngoài
    if (settingsOverlay) {
        settingsOverlay.addEventListener("click", (e) => {
            if (e.target === settingsOverlay) closeSettings();
        });
    }

    // Đóng Overlay kết quả khi click ra ngoài
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay && !overlay.classList.contains("result-mode")) {
                overlay.classList.remove("show");
            }
        });
    }

    // Đóng Popup chọn khối khi click ra ngoài
    if (gradePopup) {
        gradePopup.addEventListener("click", (e) => {
            if (e.target === gradePopup) gradePopup.classList.remove("show");
        });
    }
});

// ==========================================
// 3. CÁC HÀM XỬ LÝ GIAO DIỆN & MENU
// ==========================================

function goToGame() {
    if (!dataLoaded) {
        alert("Đang load dữ liệu. Vui lòng đợi hoặc kiểm tra file data!");
        return;
    }
    document.getElementById("gradePopup").classList.add("show");
}

function selectGrade(grade) {
    selectedGrade = grade;
    filteredVocab = [];

    // Lọc random 5 từ mỗi Unit cho khối đã chọn
    for (let u = 1; u <= 10; u++) {
        let unitWords = vocabData
            .filter(v => v.grade === grade && v.unit === u)
            .sort(() => Math.random() - 0.5);

        filteredVocab.push(...unitWords.slice(0, 5));
    }

    filteredVocab.sort(() => Math.random() - 0.5);

    document.getElementById("gradePopup").classList.remove("show");
    document.getElementById("menuBox").style.display = "none";
    box.classList.remove("hidden");
    document.getElementById("levelButtons").style.display = "block";
}

function showLeaderboard() {
    let data = JSON.parse(localStorage.getItem("rank")) || [];
    let html = "<h2>🏆 BẢNG XẾP HẠNG TOP 10</h2>";
    if (data.length === 0) html += "<p>Chưa có dữ liệu. Hãy chơi 1 ván nhé!</p>";
    data.forEach((item, i) => {
        html += `<p>#${i + 1} - Đúng: ${item.score} - Thời gian: ${item.time}s</p>`;
    });
    popup.innerHTML = html;
    overlay.classList.remove("result-mode");
    overlay.classList.add("show");
}

// ==========================================
// 4. LUỒNG GAME CHÍNH (START & LOAD)
// ==========================================

function startGame(level) {
    document.getElementById("settingsBtn").classList.remove("hidden");

    streak = 0;
    maxStreak = 0;
    updateStreakUI();

    currentLevel = level;
    playingEng = filteredVocab.map(v => v.word);
    playingVn = filteredVocab.map(v => v.meaning);
    
    dung = 0;
    sai = [];
    startTime = Date.now();

    // Set mode
    if (level === 1) mode = "typing";
    else if (level === 2) mode = "choice";
    else mode = "match";

    document.getElementById("levelButtons").style.display = "none";

    let questionEl = document.getElementById("question");
    let choices = document.getElementById("choices");

    // Reset UI sạch sẽ
    questionEl.classList.add("hidden");
    questionEl.classList.remove("question-choice", "question-match");
    choices.className = "hidden";
    input.classList.add("hidden");
    document.getElementById("submitBtn").classList.add("hidden");

    // Hiển thị tuỳ theo Mode
    if (mode === "typing") {
        questionEl.classList.remove("hidden");
        input.classList.remove("hidden");
        document.getElementById("submitBtn").classList.remove("hidden");
    }

    if (mode === "choice") {
        questionEl.classList.remove("hidden");
        choices.classList.remove("hidden");
        choices.classList.add("choice-mode");
        questionEl.classList.add("question-choice");
    }

    if (mode === "match") {
        questionEl.classList.remove("hidden");
        choices.classList.remove("hidden");
        choices.classList.add("match-mode");
        questionEl.classList.add("question-match");
    }

    so_cau = filteredVocab.length;
    loadQuestion();
}

function loadQuestion() {
    if (so_cau <= 0) {
        showResult();
        return;
    }

    let q = document.getElementById("question");
    let choices = document.getElementById("choices");

    if (mode === "match") {
        q.innerText = "Nối từ đúng đi nào 👀";
        loadMatch();
        return;
    }

    currentIndex = Math.floor(Math.random() * playingEng.length);

    // Hiệu ứng đổi câu
    q.classList.add("slide-out");
    choices.classList.add("choices-out");

    setTimeout(() => {
        q.innerText = playingEng[currentIndex];

        q.classList.remove("slide-out");
        q.classList.add("slide-in");
        choices.classList.remove("choices-out");
        choices.classList.add("choices-in");

        if (mode === "choice") loadChoices();

        setTimeout(() => {
            q.classList.add("show");
            choices.classList.add("show");
        }, 10);

        setTimeout(() => {
            q.classList.remove("slide-in", "show");
            choices.classList.remove("choices-in", "show");
        }, 300);
    }, 250);

    input.focus();
}

// ==========================================
// 5. LOGIC TRẮC NGHIỆM (CHOICE)
// ==========================================

function loadChoices() {
    let correctList = playingVn[currentIndex];
    let correct = correctList[Math.floor(Math.random() * correctList.length)];
    let options = [correct];

    while (options.length < 4) {
        let randIndex = Math.floor(Math.random() * vn.length);
        let randList = vn[randIndex];

        if (randList === correctList) continue;
        let rand = randList[Math.floor(Math.random() * randList.length)];
        if (correctList.includes(rand)) continue;
        if (!options.includes(rand)) options.push(rand);
    }

    options.sort(() => Math.random() - 0.5);

    let html = "";
    options.forEach(opt => {
        html += `<div class="choice" onclick="checkChoice('${opt}')">${opt}</div>`;
    });

    document.getElementById("choices").innerHTML = html;
}

function checkChoice(selected) {
    let all = document.querySelectorAll(".choice");
    let correctList = playingVn[currentIndex];

    all.forEach(el => el.style.pointerEvents = "none");

    all.forEach(el => {
        if (correctList.includes(el.innerText)) {
            el.classList.add("correct");
        } else if (el.innerText === selected) {
            el.classList.add("wrong");
        }
    });

    if (correctList.includes(selected)) {
        dung++; streak++;
        if (streak > maxStreak) maxStreak = streak;
        playCorrect(); createStar();
    } else {
        playWrong();
        sai.push({ word: playingEng[currentIndex], wrong: selected, correct: correctList });
        streak = 0;
    }

    updateStreakUI();

    setTimeout(() => {
        playingEng.splice(currentIndex, 1);
        playingVn.splice(currentIndex, 1);
        so_cau--;
        loadQuestion();
    }, 700);
}

// ==========================================
// 6. LOGIC NỐI TỪ (MATCH)
// ==========================================

function loadMatch() {
    let choicesDiv = document.getElementById("choices");
    selectedEng = null; selectedVn = null;

    let indices = [];
    while (indices.length < 4 && indices.length < playingEng.length) {
        let r = Math.floor(Math.random() * playingEng.length);
        if (!indices.includes(r)) indices.push(r);
    }

    matchPairs = indices.map(i => ({ eng: playingEng[i], vn: playingVn[i][0] }));
    remainingPairs = matchPairs.length;

    let engList = matchPairs.map(x => x.eng).sort(() => Math.random() - 0.5);
    let vnList = matchPairs.map(x => x.vn).sort(() => Math.random() - 0.5);

    let html = `<div style="display:flex; justify-content:center; gap:20px; width:100%;">`;
    html += `<div style="width:50%; display:flex; flex-direction:column; gap:15px;">`;
    engList.forEach(e => { html += `<div class="choice eng" data-value="${e}" onclick="selectEng(this)">${e}</div>`; });
    html += `</div><div style="width:50%; display:flex; flex-direction:column; gap:15px;">`;
    vnList.forEach(v => { html += `<div class="choice vn" data-value="${v}" onclick="selectVn(this)">${v}</div>`; });
    html += `</div></div>`;

    choicesDiv.innerHTML = html;
}

function selectEng(el) {
    let value = el.dataset.value;
    if (selectedEng === value) {
        selectedEng = null; el.classList.remove("selected"); return;
    }
    document.querySelectorAll(".eng.selected").forEach(x => x.classList.remove("selected"));
    selectedEng = value; el.classList.add("selected");
    tryMatch();
}

function selectVn(el) {
    let value = el.dataset.value;
    if (selectedVn === value) {
        selectedVn = null; el.classList.remove("selected"); return;
    }
    document.querySelectorAll(".vn.selected").forEach(x => x.classList.remove("selected"));
    selectedVn = value; el.classList.add("selected");
    tryMatch();
}

function tryMatch() {
    if (!selectedEng || !selectedVn) return;

    let engEl = document.querySelector(`.eng[data-value="${selectedEng}"]`);
    let vnEl = document.querySelector(`.vn[data-value="${selectedVn}"]`);
    let pair = matchPairs.find(p => p.eng === selectedEng);

    if (pair && pair.vn === selectedVn) {
        dung++; streak++;
        if (streak > maxStreak) maxStreak = streak;
        playCorrect(); createStar();

        engEl.classList.add("correct"); vnEl.classList.add("correct");

        setTimeout(() => {
            engEl.style.opacity = "0"; vnEl.style.opacity = "0";
            engEl.style.pointerEvents = "none"; vnEl.style.pointerEvents = "none";
        }, 300);

        let index = playingEng.indexOf(selectedEng);
        playingEng.splice(index, 1); playingVn.splice(index, 1);
        remainingPairs--;
    } else {
        streak = 0; playWrong();
        engEl.classList.add("wrong"); vnEl.classList.add("wrong");

        setTimeout(() => {
            engEl.classList.remove("wrong", "selected");
            vnEl.classList.remove("wrong", "selected");
        }, 400);
    }

    selectedEng = null; selectedVn = null;
    updateStreakUI();

    if (remainingPairs === 0) {
        so_cau -= 4;
        setTimeout(() => loadQuestion(), 500);
    }
}

// ==========================================
// 7. LOGIC NHẬP TỪ (TYPING)
// ==========================================

function submitAnswer() {
    let ans = input.value.trim().toLowerCase();
    if (!ans) return;

    let list = playingVn[currentIndex];

    if (list.some(n => ans === n || ans.includes(n))) {
        dung++; streak++;
        if (streak > maxStreak) maxStreak = streak;
        playCorrect(); createStar();
    } else {
        sai.push({ word: playingEng[currentIndex], wrong: ans, correct: playingVn[currentIndex] });
        streak = 0; playWrong();

        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 300);
    }

    updateStreakUI();
    playingEng.splice(currentIndex, 1);
    playingVn.splice(currentIndex, 1);
    so_cau--; input.value = "";
    loadQuestion();
}

// ==========================================
// 8. XỬ LÝ KẾT QUẢ & CÀI ĐẶT UI
// ==========================================

function updateStreakUI() {
    let bar = document.getElementById("streakBar");
    let container = document.getElementById("streakBarContainer");
    let total = 50; // Nếu muốn linh hoạt, đổi thành filteredVocab.length
    let done = dung + sai.length;
    let percent = (done / total) * 100;

    if (bar) bar.style.width = percent + "%";
    if (done > 0 && container) container.classList.add("show");

    if (bar) {
        if (streak === 0) bar.style.background = "linear-gradient(90deg, #414141, #4a4a4a)";
        else if (streak >= 15) bar.style.background = "linear-gradient(90deg, #ff1744, #d50000)";
        else if (streak >= 5) bar.style.background = "linear-gradient(90deg, #ffd600, #ff9800)";
        else bar.style.background = "linear-gradient(90deg, #4caf50, #8bc34a)"; // Màu mặc định khi đúng < 5
    }
}

function showResult() {
    let time = Math.floor((Date.now() - startTime) / 1000);
    saveScore(dung, time);

    overlay.classList.add("show", "result-mode");
    popup.innerHTML = `
        <div class="popup-result">
            <h2>KẾT QUẢ</h2>
            <p>✅ Đúng: <strong>${dung}</strong></p>
            <p>❌ Sai: <strong>${sai.length}</strong></p>
            <p>🔥 Streak cao nhất: <strong>${maxStreak}</strong></p>
            <p>⏱️ Thời gian: <strong>${time}s</strong></p>
            
            <button onclick="restartGame()">🔄 Chơi lại</button>
            <button onclick="goBack()" style="background: #666;">🏠 Menu</button>
            <hr style="margin: 20px 0;">
            ${renderWrongList()}
        </div>
    `;
    playFinish();
}

function renderWrongList() {
    if (sai.length === 0) return `<p style="color: #4caf50; font-weight: bold;">🎉 Xuất sắc! Bạn không sai câu nào!</p>`;
    
    let html = `<h3>Danh sách cần ôn tập</h3><div style="text-align: left;">`;
    sai.forEach(item => {
        html += `<div style="background: #fff; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 10px;">
            <strong>${item.word}</strong><br>
            <span style="color: red;">❌ Bạn chọn: ${item.wrong}</span><br>
            <span style="color: green;">✅ Đáp án: ${item.correct.join(", ")}</span>
        </div>`;
    });
    return html + `</div>`;
}

function restartGame() {
    overlay.classList.remove("show", "result-mode");
    document.getElementById("choices").innerHTML = "";
    document.getElementById("choices").classList.add("hidden");
    input.value = "";
    startGame(currentLevel);
}

function saveScore(score, time) {
    let data = JSON.parse(localStorage.getItem("rank")) || [];
    data.push({ score, time });
    data.sort((a, b) => b.score - a.score || a.time - b.time);
    localStorage.setItem("rank", JSON.stringify(data.slice(0, 10)));
}

function createStar() {
    let star = document.createElement("div");
    star.className = "star";
    star.innerText = "⭐";
    // Canh ngôi sao hiện ở khoảng ngẫu nhiên giữa box
    star.style.left = Math.random() * 80 + 10 + "%"; 
    star.style.top = Math.random() * 80 + 10 + "%";
    box.appendChild(star);
    setTimeout(() => star.remove(), 800);
}

// ==========================================
// 9. ÂM THANH & ĐIỀU HƯỚNG CƠ BẢN
// ==========================================

function playSound(sound) {
    if (!soundEnabled || !sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}
function playCorrect() { playSound(soundCorrect); }
function playWrong() { playSound(soundWrong); }
function playFinish() { playSound(soundFinish); }

function openSettings() {
    settingsOverlay.classList.add("show");
    box.style.pointerEvents = "none";
}

function closeSettings() {
    settingsOverlay.classList.remove("show");
    box.style.pointerEvents = "auto";
}

function closePopup() {
    overlay.classList.remove("show", "result-mode");
    box.classList.add("hidden");
    document.getElementById("menuBox").style.display = "block";
    input.classList.add("hidden");
    document.getElementById("question").classList.add("hidden");
    document.getElementById("submitBtn").classList.add("hidden");
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("choices").innerHTML = "";
    document.getElementById("settingsBtn").classList.add("hidden");
}

function goBack() {
    playingEng = []; playingVn = []; dung = 0; sai = []; streak = 0; maxStreak = 0;
    
    document.getElementById("choices").innerHTML = "";
    document.getElementById("choices").classList.add("hidden");
    document.getElementById("question").classList.add("hidden");
    input.classList.add("hidden");
    document.getElementById("submitBtn").classList.add("hidden");
    document.getElementById("streakBarContainer").classList.remove("show");
    document.getElementById("levelButtons").style.display = "block";
    document.getElementById("settingsBtn").classList.add("hidden");
    
    closePopup();
}

function exitGame() {
    closeSettings();
    goBack();
}
