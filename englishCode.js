document.addEventListener('DOMContentLoaded', function() {
    // --- 1. BIẾN TOÀN CỤC ---
    console.log(vocabData);
    let matchPairs = [];
    let remainingPairs = 0;
    let mode = "typing"; 
    let currentLevel = 1;
    let streak = 0;
    let maxStreak = 0;
    let playingEng = [], playingVn = [];
    let currentIndex, so_cau = 0;
    let dung = 0, sai = [];
    let startTime = 0;
    let eng = [], vn = [];
    let dataLoaded = false;
    let input, box, overlay, popup;
    let selectedEng = null;
    let selectedVn = null;
    let soundCorrect, soundWrong, soundFinish;
    let soundEnabled = true;

    // --- 2. KHỞI TẠO DỮ LIỆU ---
    if (typeof vocabData !== 'undefined') {
        eng = vocabData.map(x => x.word);
        vn = vocabData.map(x => x.meaning.map(m => m.toLowerCase()));
        dataLoaded = true;
        console.log("Dữ liệu đã sẵn sàng!");
    } else {
        console.error("Không tìm thấy biến vocabData");
    }

    // --- 3. GÁN DOM & SỰ KIỆN ---
    input = document.getElementById("answer");
    box = document.getElementById("box");
    overlay = document.getElementById("overlay");
    popup = document.getElementById("popup");
    soundCorrect = document.getElementById("sound-correct");
    soundWrong = document.getElementById("sound-wrong");
    soundFinish = document.getElementById("sound-finish");

   if (input) {
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") submitAnswer();
    });
} else {
    console.warn("Cảnh báo: Không tìm thấy phần tử 'answer' (input) trong HTML!");
}

    // Đóng Settings khi click ngoài
    let settingsOverlay = document.getElementById("settingsOverlay");
    if (settingsOverlay) {
        settingsOverlay.addEventListener("click", (e) => {
            if (e.target === settingsOverlay) closeSettings();
        });
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.classList.remove("show");
        });
    }

    // --- 4. CÁC HÀM LOGIC (Global scope bên trong DOMContentLoaded) ---
    window.goToGame = function() {
        if (!dataLoaded) { alert("Đang load dữ liệu..."); return; }
        document.getElementById("gradePopup").classList.add("show");
    };

    window.selectGrade = function(grade) {
        let selectedGrade = grade;
        filteredVocab = [];
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
    };

    window.startGame = function(level) {
        document.getElementById("settingsBtn").classList.remove("hidden");
        streak = 0; maxStreak = 0; updateStreakUI();
        currentLevel = level;
        playingEng = filteredVocab.map(v => v.word);
        playingVn = filteredVocab.map(v => v.meaning);
        dung = 0; sai = []; startTime = Date.now();

        if (level === 1) mode = "typing";
        else if (level === 2) mode = "choice";
        else mode = "match";

        document.getElementById("levelButtons").style.display = "none";
        let questionEl = document.getElementById("question");
        let choices = document.getElementById("choices");

        questionEl.classList.add("hidden");
        questionEl.classList.remove("question-choice", "question-match");
        choices.className = "hidden";
        input.classList.add("hidden");
        document.getElementById("submitBtn").classList.add("hidden");

        if (mode === "typing") {
            questionEl.classList.remove("hidden");
            input.classList.remove("hidden");
            document.getElementById("submitBtn").classList.remove("hidden");
        } else if (mode === "choice") {
            questionEl.classList.remove("hidden");
            choices.classList.remove("hidden");
            choices.classList.add("choice-mode");
            questionEl.classList.add("question-choice");
        } else if (mode === "match") {
            questionEl.classList.remove("hidden");
            choices.classList.remove("hidden");
            choices.classList.add("match-mode");
            questionEl.classList.add("question-match");
        }
        so_cau = filteredVocab.length;
        loadQuestion();
    };

    window.loadChoices = function() {
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
    };

    window.checkChoice = function(selected) {
        let all = document.querySelectorAll(".choice");
        let correctList = playingVn[currentIndex];
        all.forEach(el => el.style.pointerEvents = "none");
        all.forEach(el => {
            if (correctList.includes(el.innerText)) el.classList.add("correct");
            else if (el.innerText === selected) el.classList.add("wrong");
        });

        if (correctList.includes(selected)) {
            dung++; streak++; if (streak > maxStreak) maxStreak = streak;
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
    };

    window.loadQuestion = function() {
        if (so_cau <= 0) { showResult(); return; }
        let q = document.getElementById("question");
        let choices = document.getElementById("choices");
        if (mode === "match") {
            q.innerText = "Nối từ đúng đi nào 👀";
            loadMatch(); return;
        }
        currentIndex = Math.floor(Math.random() * playingEng.length);
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
    };

    window.selectEng = function(el) {
        let value = el.dataset.value;
        if (selectedEng === value) {
            selectedEng = null; el.classList.remove("selected"); return;
        }
        document.querySelectorAll(".eng.selected").forEach(x => x.classList.remove("selected"));
        selectedEng = value; el.classList.add("selected");
        tryMatch();
    };

    window.selectVn = function(el) {
        let value = el.dataset.value;
        if (selectedVn === value) {
            selectedVn = null; el.classList.remove("selected"); return;
        }
        document.querySelectorAll(".vn.selected").forEach(x => x.classList.remove("selected"));
        selectedVn = value; el.classList.add("selected");
        tryMatch();
    };

    window.loadMatch = function() {
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
        let html = `<div style="display:flex; justify-content:center; gap:40px; width:100%;">`;
        html += `<div style="width:220px; display:flex; flex-direction:column; align-items:center; gap:20px;">`;
        engList.forEach(e => { html += `<div class="choice eng" data-value="${e}" onclick="selectEng(this)">${e}</div>`; });
        html += `</div><div style="width:220px; display:flex; flex-direction:column; align-items:center; gap:20px;">`;
        vnList.forEach(v => { html += `<div class="choice vn" data-value="${v}" onclick="selectVn(this)">${v}</div>`; });
        html += `</div></div>`;
        choicesDiv.innerHTML = html;
    };

    window.tryMatch = function() {
        if (!selectedEng || !selectedVn) return;
        let engEl = document.querySelector(`.eng[data-value="${selectedEng}"]`);
        let vnEl = document.querySelector(`.vn[data-value="${selectedVn}"]`);
        let pair = matchPairs.find(p => p.eng === selectedEng);
        if (pair && pair.vn === selectedVn) {
            dung++; streak++; if (streak > maxStreak) maxStreak = streak;
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
        selectedEng = null; selectedVn = null; updateStreakUI();
        if (remainingPairs === 0) {
            so_cau -= 4; setTimeout(() => loadQuestion(), 500);
        }
    };

    window.submitAnswer = function() {
        let ans = input.value.trim().toLowerCase();
        if (!ans) return;
        let list = playingVn[currentIndex];
        if (list.some(n => ans === n || ans.includes(n))) {
            dung++; streak++; if (streak > maxStreak) maxStreak = streak;
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
    };

    window.showResult = function() {
        let time = Math.floor((Date.now() - startTime) / 1000);
        saveScore(dung, time);
        overlay.classList.add("show", "result-mode");
        popup.innerHTML = `
            <div class="popup-result">
                <div class="result-wrapper">
                    <div class="result-main">
                        <h2>KẾT QUẢ</h2>
                        <p>Đúng: ${dung}</p>
                        <p>Sai: ${sai.length}</p>
                        <p>Streak cao nhất: ${maxStreak}🔥</p>
                        <p>Thời gian: ${time}s</p>
                        <button onclick="restartGame()">🔄 Chơi lại</button>
                        <button onclick="goBack()">🏠 Menu</button>
                    </div>
                    <div class="result-detail">${renderWrongList()}</div>
                </div>
            </div>`;
        playFinish();
    };

    window.renderWrongList = function() {
        if (sai.length === 0) return `<p>🎉 Không sai câu nào!</p>`;
        let html = `<h3>❌ Danh sách sai</h3><div class="wrong-table">`;
        sai.forEach(item => {
            html += `<div class="wrong-row">
                <div class="wrong-word">${item.word}</div>
                <div class="wrong-user">❌ ${item.wrong}</div>
                <div class="wrong-correct">✅ ${item.correct.join(", ")}</div>
            </div>`;
        });
        return html + `</div>`;
    };

    window.restartGame = function() {
        overlay.classList.remove("show");
        document.getElementById("choices").innerHTML = "";
        input.value = "";
        startGame(currentLevel);
    };

    window.saveScore = function(score, time) {
        let data = JSON.parse(localStorage.getItem("rank")) || [];
        data.push({ score, time });
        data.sort((a, b) => b.score - a.score || a.time - b.time);
        localStorage.setItem("rank", JSON.stringify(data.slice(0, 10)));
    };

    window.updateStreakUI = function() {
        let bar = document.getElementById("streakBar");
        let container = document.getElementById("streakBarContainer");
        let total = 50;
        let done = dung + sai.length;
        let percent = (done / total) * 100;
        if (bar) bar.style.width = percent + "%";
        if (done > 0 && container) container.classList.add("show");
        if (bar) {
            if (streak === 0) bar.style.background = "linear-gradient(90deg, #414141, #4a4a4a)";
            else if (streak >= 15) bar.style.background = "linear-gradient(90deg, #ff1744, #d50000)";
            else if (streak >= 5) bar.style.background = "linear-gradient(90deg, #ffd600, #ff9800)";
        }
    };

    window.createStar = function() {
        let star = document.createElement("div");
        star.className = "star"; star.innerText = "⭐";
        box.appendChild(star);
        setTimeout(() => star.remove(), 800);
    };

    window.closePopup = function() {
        overlay.classList.remove("show", "result-mode");
        box.classList.add("hidden");
        document.getElementById("menuBox").style.display = "flex";
        input.classList.add("hidden");
        document.getElementById("question").classList.add("hidden");
        document.getElementById("submitBtn").classList.add("hidden");
        document.getElementById("choices").classList.add("hidden");
    };

    window.playSound = function(sound) {
        if (!soundEnabled || !sound) return;
        sound.currentTime = 0;
        sound.play().catch(() => {});
    };

    window.playCorrect = () => playSound(soundCorrect);
    window.playWrong = () => playSound(soundWrong);
    window.playFinish = () => playSound(soundFinish);

    window.openSettings = function() {
        document.getElementById("settingsOverlay").classList.add("show");
        box.style.pointerEvents = "none";
    };

    window.closeSettings = function() {
        document.getElementById("settingsOverlay").classList.remove("show");
        box.style.pointerEvents = "auto";
    };

    window.goBack = function() {
        playingEng = []; playingVn = []; dung = 0; sai = []; streak = 0;
        document.getElementById("choices").innerHTML = "";
        document.getElementById("streakBarContainer").classList.remove("show");
        document.getElementById("levelButtons").style.display = "block";
        closePopup();
    };
});
