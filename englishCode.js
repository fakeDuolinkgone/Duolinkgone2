
console.log(vocabData);
let matchPairs = [];
let remainingPairs = 0;
let mode = "typing"; // hoặc "choice"
let currentLevel = 1;


let streak = 0;
let maxStreak = 0; // optional (combo cao nhất)


let playingEng = [], playingVn = [];
let currentIndex, so_cau = 0;
let dung = 0, sai = [];
let startTime = 0;


let eng = [], vn = [];
let dataLoaded = false;

//fetch
if (typeof vocabData !== 'undefined') {
    eng = vocabData.map(x => x.word);
    vn = vocabData.map(x => x.meaning.map(m => m.toLowerCase()));
    dataLoaded = true;
    console.log("Dữ liệu đã sẵn sàng!");
} else {
    console.error("Không tìm thấy biến vocabData từ file data.js");
}









  // Khai báo các phần tử DOM thường dùng
let input, box, overlay, popup;


document.addEventListener("DOMContentLoaded", () => {
  input = document.getElementById("answer");
  box = document.getElementById("box");
  overlay = document.getElementById("overlay");
  popup = document.getElementById("popup");

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitAnswer();
  });



  // 🔥 đóng SETTINGS khi click ngoài
  let settingsOverlay = document.getElementById("settingsOverlay");
  if (settingsOverlay) {
    settingsOverlay.addEventListener("click", (e) => {
      if (e.target === settingsOverlay) {
        closeSettings();
      }
    });
  }

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.classList.remove("show");
  }
});




  // 🔥 đóng GRADE POPUP khi click ngoài
  let gradePopup = document.getElementById("gradePopup");
  if (gradePopup) {
    gradePopup.addEventListener("click", (e) => {
      if (e.target === gradePopup) {
        gradePopup.classList.remove("show");
      }
    });
  }
});










//menu - s
function goToGame() {
  if (!dataLoaded) {
    alert("Đang load dữ liệu...");
    return;
  }
  document.getElementById("gradePopup").classList.add("show");


}






let selectedGrade = 10;
let filteredVocab = [];
let selectedUnit = 1;

function selectGrade(grade) {
  selectedGrade = grade;

  filteredVocab = [];

  for (let u = 1; u <= 10; u++) {
    let unitWords = vocabData
      .filter(v => v.grade === grade && v.unit === u)
      .sort(() => Math.random() - 0.5);

    filteredVocab.push(...unitWords.slice(0, 5));
  }

  // 🔥 ĐẶT Ở ĐÂY
  filteredVocab.sort(() => Math.random() - 0.5);

  // ẩn popup
  document.getElementById("gradePopup").classList.remove("show");

  // hiện màn chọn level
  document.getElementById("menuBox").style.display = "none";
  box.classList.remove("hidden");
  document.getElementById("levelButtons").style.display = "block";
}














function showLeaderboard() {
  let data = JSON.parse(localStorage.getItem("rank")) || [];
  let html = "<h2>🏆 BXH TOP 10</h2>";
  if (data.length === 0) html += "<p>Chưa có dữ liệu</p>";
  data.forEach((item, i) => {
    html += `<p>#${i + 1} - ${item.score} điểm - ${item.time}s</p>`;
  });
  popup.innerHTML = html;
  overlay.classList.add("show");
}
//menu - e













//chọn level - s
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

  // 🎯 set mode
  if (level === 1) mode = "typing";
  else if (level === 2) mode = "choice";
  else mode = "match";

  document.getElementById("levelButtons").style.display = "none";

  let questionEl = document.getElementById("question");
  let choices = document.getElementById("choices");

  // 🔥 reset UI sạch sẽ
questionEl.classList.add("hidden");
questionEl.classList.remove("question-choice", "question-match");
  choices.className = "hidden";

  input.classList.add("hidden");
  document.getElementById("submitBtn").classList.add("hidden");

  // 🎯 từng mode hiển thị khác nhau
  if (mode === "typing") {
    questionEl.classList.remove("hidden");
    input.classList.remove("hidden");
    document.getElementById("submitBtn").classList.remove("hidden");
  }

  if (mode === "choice") {
    questionEl.classList.remove("hidden");
    choices.classList.remove("hidden");
    choices.classList.add("choice-mode");

    // 🌟 style riêng cho LV2
    questionEl.classList.add("question-choice");
  }

  if (mode === "match") {
    questionEl.classList.remove("hidden");
    choices.classList.remove("hidden");
    choices.classList.add("match-mode");

    // 🌟 style riêng cho LV3
    questionEl.classList.add("question-match");
  }

  so_cau = filteredVocab.length;
  loadQuestion();
}




//chọn level - e












//Trắc nghiệm - s
function loadChoices() {
  let correctList = playingVn[currentIndex];

  // 🎯 chọn 1 nghĩa đúng
  let correct = correctList[Math.floor(Math.random() * correctList.length)];

  let options = [correct];

  while (options.length < 4) {
    let randIndex = Math.floor(Math.random() * vn.length);
    let randList = vn[randIndex];

    // ❌ bỏ nếu là cùng từ
    if (randList === correctList) continue;

    let rand = randList[Math.floor(Math.random() * randList.length)];

    // ❌ bỏ nếu nghĩa này thuộc từ hiện tại (tránh "đúng giả")
    if (correctList.includes(rand)) continue;

    // ❌ tránh trùng text
    if (!options.includes(rand)) {
      options.push(rand);
    }
  }

  // shuffle
  options.sort(() => Math.random() - 0.5);

  let html = "";
  options.forEach(opt => {
    html += `<div class="choice" onclick="checkChoice('${opt}', '${correct}')">${opt}</div>`;
  });

  document.getElementById("choices").innerHTML = html;
}








function checkChoice(selected) {
  let all = document.querySelectorAll(".choice");
  let correctList = playingVn[currentIndex];

  // khóa click
  all.forEach(el => el.style.pointerEvents = "none");

  all.forEach(el => {
    if (correctList.includes(el.innerText)) {
      el.classList.add("correct");
    } else if (el.innerText === selected) {
      el.classList.add("wrong");
    }
  });

  // ✅ đúng nếu nằm trong list nghĩa
  if (correctList.includes(selected)) {
    dung++;
    streak++;
    if (streak > maxStreak) maxStreak = streak;
    playCorrect();
    createStar();
  } else {
    playWrong();
    sai.push({
      word: playingEng[currentIndex],
      wrong: selected,
      correct: correctList
    });

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
//Trắc nghiệm - e










//hiện câu - s
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

  // 🎬 animate OUT
  q.classList.add("slide-out");
  choices.classList.add("choices-out");

  setTimeout(() => {
    // đổi nội dung
    q.innerText = playingEng[currentIndex];

    // reset animation
    q.classList.remove("slide-out");
    q.classList.add("slide-in");

    choices.classList.remove("choices-out");
    choices.classList.add("choices-in");

    // load choices mới nếu có
    if (mode === "choice") {
      loadChoices();
    }

    // 🎬 animate IN
    setTimeout(() => {
      q.classList.add("show");
      choices.classList.add("show");
    }, 10);

    // cleanup class sau khi xong
    setTimeout(() => {
      q.classList.remove("slide-in", "show");
      choices.classList.remove("choices-in", "show");
    }, 300);

  }, 250);

  input.focus();
}


//hiện câu - e








//match - s
function selectEng(el) {
  let value = el.dataset.value;

  // 🔁 bấm lại để bỏ chọn
  if (selectedEng === value) {
    selectedEng = null;
    el.classList.remove("selected");
    return;
  }

  // reset highlight cũ
  document.querySelectorAll(".eng.selected")
    .forEach(x => x.classList.remove("selected"));

  selectedEng = value;
  el.classList.add("selected");

  tryMatch();
}









function selectVn(el) {
  let value = el.dataset.value;

  if (selectedVn === value) {
    selectedVn = null;
    el.classList.remove("selected");
    return;
  }

  document.querySelectorAll(".vn.selected")
    .forEach(x => x.classList.remove("selected"));

  selectedVn = value;
  el.classList.add("selected");

  tryMatch();
}










let selectedEng = null;
let selectedVn = null;







function loadMatch() {
  let choicesDiv = document.getElementById("choices");

  selectedEng = null;
  selectedVn = null;

  let indices = [];
  while (indices.length < 4 && indices.length < playingEng.length) {
    let r = Math.floor(Math.random() * playingEng.length);
    if (!indices.includes(r)) indices.push(r);
  }

  matchPairs = indices.map(i => ({
    eng: playingEng[i],
    vn: playingVn[i][0]
  }));

  remainingPairs = matchPairs.length;

  let engList = matchPairs.map(x => x.eng).sort(() => Math.random() - 0.5);
  let vnList = matchPairs.map(x => x.vn).sort(() => Math.random() - 0.5);

let html = `<div style="
  display:flex;
  justify-content:center; /* 🔥 căn giữa */
  gap:40px;
  width:100%;
">`;

  // 👉 CỘT ENG

html += `<div style="
  width:220px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:20px;
">`;

  engList.forEach(e => {
    html += `<div class="choice eng" data-value="${e}" onclick="selectEng(this)">${e}</div>`;
  });
  html += `</div>`;

  // 👉 CỘT VN

html += `<div style="
  width:220px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:20px;
">`;

  vnList.forEach(v => {
    html += `<div class="choice vn" data-value="${v}" onclick="selectVn(this)">${v}</div>`;
  });
  html += `</div>`;

  html += `</div>`;

  choicesDiv.innerHTML = html;
}













function tryMatch() {
  if (!selectedEng || !selectedVn) return;

  let engEl = document.querySelector(`.eng[data-value="${selectedEng}"]`);
  let vnEl = document.querySelector(`.vn[data-value="${selectedVn}"]`);

  let pair = matchPairs.find(p => p.eng === selectedEng);

  if (pair && pair.vn === selectedVn) {
    dung++;
    streak++;
    if (streak > maxStreak) maxStreak = streak;

    playCorrect();
    createStar();

    engEl.classList.add("correct");
    vnEl.classList.add("correct");

    setTimeout(() => {
engEl.style.opacity = "0";
vnEl.style.opacity = "0";

engEl.style.pointerEvents = "none";
vnEl.style.pointerEvents = "none";
    }, 300);

    let index = playingEng.indexOf(selectedEng);
    playingEng.splice(index, 1);
    playingVn.splice(index, 1);

    remainingPairs--;
  } else {
    streak = 0;
    playWrong();

    engEl.classList.add("wrong");
    vnEl.classList.add("wrong");

    setTimeout(() => {
      engEl.classList.remove("wrong", "selected");
      vnEl.classList.remove("wrong", "selected");
    }, 400);
  }

  selectedEng = null;
  selectedVn = null;

  updateStreakUI();

  if (remainingPairs === 0) {
    so_cau -= 4;
    setTimeout(() => loadQuestion(), 500);
  }
}


// match - e












//nhập đáp án - s
function submitAnswer() {
  let ans = input.value.trim().toLowerCase();
  if (!ans) return;

  let list = playingVn[currentIndex];

  if (list.some(n => ans === n || ans.includes(n))) {
    dung++;
    streak++;
    if (streak > maxStreak) maxStreak = streak;

    playCorrect(); // ✅ THÊM DÒNG NÀY
    createStar();

  } else {
    sai.push({
    word: playingEng[currentIndex],
    wrong: ans,
    correct: playingVn[currentIndex]
    });

    streak = 0;

    playWrong(); // ❌ THÊM DÒNG NÀY

    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 300);
    setTimeout(() => input.classList.remove("wrong"), 300);
  }

  updateStreakUI();

  playingEng.splice(currentIndex, 1);
  playingVn.splice(currentIndex, 1);
  so_cau--;
  input.value = "";

  loadQuestion();
}


//nhập đáp án - e










//kết quả - s
function showResult() {
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

      <div class="result-detail">
        ${renderWrongList()}
      </div>

    </div>
  </div>
`;

  playFinish();
  overlay.classList.add("show");
}






function renderWrongList() {
  if (sai.length === 0) {
    return `<p style="text-align:center;">🎉 Không sai câu nào!</p>`;
  }

  let html = `
    <h3 style="text-align:center;">❌ Danh sách sai</h3>
    <div class="wrong-table">
  `;

  sai.forEach(item => {
    html += `
      <div class="wrong-row">
        <div class="wrong-word">${item.word}</div>
        <div class="wrong-user">❌ ${item.wrong}</div>
        <div class="wrong-correct">✅ ${item.correct.join(", ")}</div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}







function restartGame() {
  overlay.classList.remove("show");

  // reset UI
let choices = document.getElementById("choices");
choices.innerHTML = "";
choices.classList.add("hidden");
  input.value = "";

  // 🔁 chạy lại đúng level cũ
  startGame(currentLevel);
}











function saveScore(score, time) {
  let data = JSON.parse(localStorage.getItem("rank")) || [];
  data.push({ score, time });
  data.sort((a, b) => b.score - a.score || a.time - b.time);
  localStorage.setItem("rank", JSON.stringify(data.slice(0, 10)));
}
//kết quả - e










//chuỗi - s
function updateStreakUI() {
  let bar = document.getElementById("streakBar");
  let container = document.getElementById("streakBarContainer");

  let total = 50       // tổng câu (50)
  let done = dung + sai.length;    // đã làm

  let percent = (done / total) * 100;
  bar.style.width = percent + "%";

  if (done > 0) container.classList.add("show");

  // 🎯 TÍNH PROGRESS %
  let progress = done / total;

  // 🎨 LOGIC MÀU (ưu tiên từ trên xuống)
  if (streak === 0) {
    // ❌ vừa sai → xám
    bar.style.background = "linear-gradient(90deg, #414141, #4a4a4a)";
  } 
  else if (streak >= 15) {
    bar.style.background = "linear-gradient(90deg, #ff1744, #d50000)";
  } 
  else if (streak >= 5) {
    bar.style.background = "linear-gradient(90deg, #ffd600, #ff9800)";
  } 
}


//chuỗi - e












//hiệu ứng - s
function createStar() {
  let star = document.createElement("div");
  star.className = "star";
  star.innerText = "⭐";
  box.appendChild(star);
  setTimeout(() => star.remove(), 800);
}










function closePopup() {
  
  overlay.classList.remove("show", "result-mode");

  box.classList.add("hidden");
  document.getElementById("menuBox").style.display = "flex";

  const btns = document.querySelectorAll("#levelButtons button");
  btns.forEach(b => b.style.display = "inline-block");


  input.classList.add("hidden");
  document.getElementById("question").classList.add("hidden");
  document.getElementById("submitBtn").classList.add("hidden");
  document.getElementById("streak").classList.add("hidden");
  document.getElementById("choices").classList.add("hidden");
  document.getElementById("choices").innerHTML = "";
  document.getElementById("settingsBtn").classList.add("hidden");
}


// audio - s












let soundCorrect, soundWrong, soundClick, soundFinish;

document.addEventListener("DOMContentLoaded", () => {
  soundCorrect = document.getElementById("sound-correct");
  soundWrong = document.getElementById("sound-wrong");
  soundFinish = document.getElementById("sound-finish");
});

let soundEnabled = true; // có thể tắt bật sau

function playSound(sound) {
  if (!soundEnabled) return;

  sound.currentTime = 0; // reset để spam không bị delay
  sound.play().catch(() => {}); // tránh lỗi trình duyệt
}

function playCorrect() {
  playSound(soundCorrect);
}

function playWrong() {
  playSound(soundWrong);
}

function playFinish() {
  playSound(soundFinish);
}
//audio -e












function openSettings() {
  let overlay = document.getElementById("settingsOverlay");
  overlay.classList.add("show");

  document.getElementById("box").style.pointerEvents = "none";
}









function closeSettings() {
  let overlay = document.getElementById("settingsOverlay");
  overlay.classList.remove("show");

  document.getElementById("box").style.pointerEvents = "auto";
}









function goBack() {
  playingEng = [];
  playingVn = [];
  dung = 0;
  sai = [];
  streak = 0;
  maxStreak = 0;

  document.getElementById("choices").innerHTML = "";
  document.getElementById("choices").classList.add("hidden");

  document.getElementById("question").classList.add("hidden");
  input.classList.add("hidden");
  document.getElementById("submitBtn").classList.add("hidden");

  document.getElementById("streakBarContainer").classList.remove("show");

  document.getElementById("levelButtons").style.display = "block";

  // ❗ sửa lại
  document.getElementById("settingsBtn").classList.add("hidden");
  closePopup()

}










function exitGame() {
  closeSettings();
  goBack();
}









