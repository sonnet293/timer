/* =========================================================
   캐릭터 대사 데이터
========================================================= */

// 클릭했을 때 랜덤으로 나오는 평상시 대사
const messages = [
    "소관이 필요한가?",
    "하하, 성가시군!",
    "찌르는 건 선호하지 않네.",
    "마음이 복잡하기라도 한가?",
    "소관에게 무엇을 바라는 겐가!",
    "위로는 소관의 분야가 아니네.\n하지만 귀관이 만족한다면!",
    "뭐가 문제인가?",
    "차라리 쓰다듬게! 찌르는 건 별로라네!",
    "무례하군!",
    "귀관도 결국 하나의 우자일 뿐이지.",
    "정말 그걸로 만족하는가?",
    "이해할 수 없네, 소관은…",
    "아닐세, 그저 넋두리에 가까웠네!",
    "응? 그건 부정적인 감정 아닌가. 병일세!\n소관이 고쳐주지!",
    "평화로운 방법이라. 충분히 평화롭다고 생각하네만?",
    "옛날 옛날에 소멸한 마법사가 살았다네.\n그 마법사는… 기억할 리가 없지 않나!",
    "소관을 「캡틴 르네상스」라 부르게!",
];

// 타이머가 끝났을 때 나오는 전용 대사
const endMessages = [
    "시간이 다 됐군! 수고했네.",
    "됐네, 이제 좀 쉬게나.",
    "훌륭하군. 소관이 인정하지.",
    "끝났네. 다음은 무엇을 할 텐가?",
    "이 정도면 소관도 만족하네.",
    "귀관, 꽤 하는군!",
];

/* =========================================================
   캐릭터 말풍선 표시 (클릭 / 자동 / 종료 공용)
========================================================= */
const wrapper = document.getElementById("character");
const bubble = document.getElementById("bubble");

let hideTimer;
let lastIndex = -1;

function showBubble(text, { pop = true } = {}) {
    bubble.textContent = text;

    if (pop) {
        wrapper.classList.remove("pop-character");
        bubble.classList.remove("pop-bubble");
        void wrapper.offsetWidth; // 리플로우로 애니메이션 재시작
        wrapper.classList.add("pop-character");
        bubble.classList.add("pop-bubble");
    }

    bubble.classList.add("show");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        bubble.classList.remove("show");
    }, 5000);
}

function getRandomMessage(list) {
    let idx;
    do {
        idx = Math.floor(Math.random() * list.length);
    } while (list.length > 1 && idx === lastIndex);
    lastIndex = idx;
    return list[idx];
}

wrapper.addEventListener("click", () => {
    showBubble(getRandomMessage(messages));
});

/* =========================================================
   무음 모드
========================================================= */
const muteBtn = document.getElementById("muteToggle");
let isMuted = localStorage.getItem("app_mute") === "true";

function renderMuteBtn() {
    muteBtn.textContent = isMuted ? "🔇 무음모드 ON" : "🔊 무음모드 OFF";
    muteBtn.classList.toggle("active", isMuted);
}
renderMuteBtn();

muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem("app_mute", isMuted);
    renderMuteBtn();
});

function playAlarmSound() {
    if (isMuted) return;
    const audio = new Audio("bgm/bgm.mp3");
    audio.play().catch(() => {
        /* 파일이 없거나 자동재생이 막힌 경우 조용히 무시 */
    });
}

/* =========================================================
   자동 대사 모드 (3 / 5 / 10 / 30분 간격)
========================================================= */
const autoMsgBtn = document.getElementById("autoMsgToggle");
const intervalSelect = document.getElementById("autoMsgInterval");

let autoMsgOn = localStorage.getItem("app_auto_msg") === "true";
let autoMsgInterval = parseInt(localStorage.getItem("app_auto_msg_min") || "5", 10);
let autoMsgTimer = null;

intervalSelect.value = String(autoMsgInterval);

function renderAutoMsgBtn() {
    autoMsgBtn.textContent = autoMsgOn ? "💬 자동대사 ON" : "💬 자동대사 OFF";
    autoMsgBtn.classList.toggle("active", autoMsgOn);
}

function startAutoMsg() {
    stopAutoMsg();
    autoMsgTimer = setInterval(() => {
        showBubble(getRandomMessage(messages));
    }, autoMsgInterval * 60 * 1000);
}

function stopAutoMsg() {
    if (autoMsgTimer) {
        clearInterval(autoMsgTimer);
        autoMsgTimer = null;
    }
}

renderAutoMsgBtn();
if (autoMsgOn) startAutoMsg();

autoMsgBtn.addEventListener("click", () => {
    autoMsgOn = !autoMsgOn;
    localStorage.setItem("app_auto_msg", autoMsgOn);
    renderAutoMsgBtn();
    if (autoMsgOn) {
        startAutoMsg();
    } else {
        stopAutoMsg();
    }
});

intervalSelect.addEventListener("change", () => {
    autoMsgInterval = parseInt(intervalSelect.value, 10);
    localStorage.setItem("app_auto_msg_min", autoMsgInterval);
    if (autoMsgOn) startAutoMsg(); // 실행 중이면 새 간격으로 재시작
});

/* =========================================================
   타이머 (최대 3개, 일반 모드 + 뽀모도로 모드)
========================================================= */
const MAX_TIMERS = 3;
const timerListEl = document.getElementById("timerList");
const addTimerBtn = document.getElementById("addTimerBtn");

let timers = []; // { id, mode, remaining, running, intervalId, pomodoroPhase, pomodoroCount, workMin, breakMin }
let timerIdSeq = 1;

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function createTimer() {
    if (timers.length >= MAX_TIMERS) return;

    const timer = {
        id: timerIdSeq++,
        mode: "normal", // 'normal' | 'pomodoro'
        remaining: 25 * 60, // 초 단위
        running: false,
        intervalId: null,
        // 뽀모도로 전용
        pomodoroPhase: "work", // 'work' | 'break'
        pomodoroCount: 0,
        workMin: 25,
        breakMin: 5,
    };

    timers.push(timer);
    renderTimers();
}

function deleteTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (timer && timer.intervalId) clearInterval(timer.intervalId);
    timers = timers.filter(t => t.id !== id);
    renderTimers();
}

function startTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer || timer.running) return;

    timer.running = true;
    timer.intervalId = setInterval(() => {
        timer.remaining -= 1;

        if (timer.remaining <= 0) {
            handleTimerEnd(timer);
        }
        renderTimers();
    }, 1000);

    renderTimers();
}

function pauseTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    timer.running = false;
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    renderTimers();
}

function resetTimer(id) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    pauseTimer(id);

    if (timer.mode === "pomodoro") {
        timer.pomodoroPhase = "work";
        timer.pomodoroCount = 0;
        timer.remaining = timer.workMin * 60;
    } else {
        timer.remaining = (timer.normalMin || 0) * 60 + (timer.normalSec || 0);
    }
    renderTimers();
}

function handleTimerEnd(timer) {
    pauseTimer(timer.id);
    playAlarmSound();
    showBubble(getRandomMessage(endMessages));

    if (timer.mode === "pomodoro") {
        // 작업 <-> 휴식 자동 전환
        if (timer.pomodoroPhase === "work") {
            timer.pomodoroPhase = "break";
            timer.remaining = timer.breakMin * 60;
            timer.pomodoroCount += 1;
        } else {
            timer.pomodoroPhase = "work";
            timer.remaining = timer.workMin * 60;
        }
    } else {
        timer.remaining = 0;
    }
}

function updateTimerSetting(id, field, value) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;

    const num = Math.max(0, parseInt(value, 10) || 0);

    if (field === "workMin") {
        timer.workMin = num;
        if (timer.mode === "pomodoro" && timer.pomodoroPhase === "work" && !timer.running) {
            timer.remaining = num * 60;
        }
    } else if (field === "breakMin") {
        timer.breakMin = num;
        if (timer.mode === "pomodoro" && timer.pomodoroPhase === "break" && !timer.running) {
            timer.remaining = num * 60;
        }
    } else if (field === "normalMin") {
        timer.normalMin = num;
        if (timer.mode === "normal" && !timer.running) {
            timer.remaining = num * 60 + (timer.normalSec || 0);
        }
    } else if (field === "normalSec") {
        timer.normalSec = num;
        if (timer.mode === "normal" && !timer.running) {
            timer.remaining = (timer.normalMin || 0) * 60 + num;
        }
    }
    renderTimers();
}

function switchMode(id, mode) {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    pauseTimer(id);
    timer.mode = mode;

    if (mode === "pomodoro") {
        timer.pomodoroPhase = "work";
        timer.pomodoroCount = 0;
        timer.remaining = (timer.workMin || 25) * 60;
    } else {
        timer.remaining = (timer.normalMin || 25) * 60 + (timer.normalSec || 0);
    }
    renderTimers();
}

function renderTimers() {
    timerListEl.innerHTML = "";

    timers.forEach(timer => {
        const item = document.createElement("div");
        item.className = "timer-item";

        const isPomodoro = timer.mode === "pomodoro";

        item.innerHTML = `
            <div class="timer-top-row">
                <select class="timer-mode-select" data-id="${timer.id}" data-role="mode">
                    <option value="normal" ${!isPomodoro ? "selected" : ""}>일반 타이머</option>
                    <option value="pomodoro" ${isPomodoro ? "selected" : ""}>뽀모도로</option>
                </select>
                <button class="timer-delete" data-id="${timer.id}" data-role="delete">✕</button>
            </div>

            ${isPomodoro
                ? `<div class="timer-pomodoro-label">${timer.pomodoroPhase === "work" ? "🍅 집중 시간" : "☕ 휴식 시간"} · ${timer.pomodoroCount}회 완료</div>`
                : ""
            }

            <div class="timer-display">${formatTime(timer.remaining)}</div>

            <div class="timer-inputs">
                ${isPomodoro
                    ? `
                        <label style="font-size:12px;color:#999;">집중
                            <input type="number" min="1" value="${timer.workMin}" data-id="${timer.id}" data-role="workMin" ${timer.running ? "disabled" : ""}>분
                        </label>
                        <label style="font-size:12px;color:#999;">휴식
                            <input type="number" min="1" value="${timer.breakMin}" data-id="${timer.id}" data-role="breakMin" ${timer.running ? "disabled" : ""}>분
                        </label>
                    `
                    : `
                        <input type="number" min="0" value="${timer.normalMin ?? Math.floor(timer.remaining / 60)}" data-id="${timer.id}" data-role="normalMin" ${timer.running ? "disabled" : ""}>분
                        <input type="number" min="0" max="59" value="${timer.normalSec ?? (timer.remaining % 60)}" data-id="${timer.id}" data-role="normalSec" ${timer.running ? "disabled" : ""}>초
                    `
                }
            </div>

            <div class="timer-buttons">
                <button data-id="${timer.id}" data-role="start" ${timer.running ? "disabled" : ""}>시작</button>
                <button class="secondary" data-id="${timer.id}" data-role="pause" ${!timer.running ? "disabled" : ""}>일시정지</button>
                <button class="secondary" data-id="${timer.id}" data-role="reset">초기화</button>
            </div>
        `;

        timerListEl.appendChild(item);
    });

    addTimerBtn.disabled = timers.length >= MAX_TIMERS;
    addTimerBtn.textContent = timers.length >= MAX_TIMERS
        ? "최대 3개까지 등록할 수 있어"
        : "+ 타이머 추가";
}

// 이벤트 위임으로 타이머 리스트 안의 모든 조작 처리
timerListEl.addEventListener("click", (e) => {
    const role = e.target.dataset.role;
    const id = Number(e.target.dataset.id);
    if (!role || !id) return;

    if (role === "delete") deleteTimer(id);
    if (role === "start") startTimer(id);
    if (role === "pause") pauseTimer(id);
    if (role === "reset") resetTimer(id);
});

timerListEl.addEventListener("change", (e) => {
    const role = e.target.dataset.role;
    const id = Number(e.target.dataset.id);
    if (!role || !id) return;

    if (role === "mode") switchMode(id, e.target.value);
    if (["workMin", "breakMin", "normalMin", "normalSec"].includes(role)) {
        updateTimerSetting(id, role, e.target.value);
    }
});

addTimerBtn.addEventListener("click", createTimer);

// 시작할 때 타이머 1개는 기본으로 만들어두기
createTimer();