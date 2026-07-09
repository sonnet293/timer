/* =========================================================
   메모 기능 (localStorage, 최대 3개)
========================================================= */
const MAX_MEMOS = 3;
const MEMO_KEY = "app_memos";

const memoListEl = document.getElementById("memoList");
const addMemoBtn = document.getElementById("addMemoBtn");
const memoCountEl = document.getElementById("memoCount");

let memos = loadMemos();

function loadMemos() {
    try {
        const raw = localStorage.getItem(MEMO_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveMemos() {
    localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
}

function renderMemos() {
    memoListEl.innerHTML = "";

    memos.forEach(memo => {
        const item = document.createElement("div");
        item.className = "memo-item";
        item.innerHTML = `
            <textarea data-id="${memo.id}" placeholder="메모를 입력해줘...">${memo.text}</textarea>
            <button class="memo-delete" data-id="${memo.id}">✕</button>
        `;
        memoListEl.appendChild(item);
    });

    memoCountEl.textContent = `${memos.length} / ${MAX_MEMOS}`;
    addMemoBtn.disabled = memos.length >= MAX_MEMOS;
    addMemoBtn.textContent = memos.length >= MAX_MEMOS
        ? "최대 3개까지 작성할 수 있어"
        : "+ 메모 추가";
}

function addMemo() {
    if (memos.length >= MAX_MEMOS) return;
    memos.push({ id: Date.now(), text: "" });
    saveMemos();
    renderMemos();

    // 새로 추가된 textarea에 바로 포커스
    const textareas = memoListEl.querySelectorAll("textarea");
    const last = textareas[textareas.length - 1];
    if (last) last.focus();
}

function deleteMemo(id) {
    memos = memos.filter(m => m.id !== id);
    saveMemos();
    renderMemos();
}

// 입력 중 debounce 저장 (타이핑마다 localStorage 쓰지 않도록)
let saveDebounce;
memoListEl.addEventListener("input", (e) => {
    const id = Number(e.target.dataset.id);
    const memo = memos.find(m => m.id === id);
    if (!memo) return;
    memo.text = e.target.value;

    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(saveMemos, 300);
});

memoListEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("memo-delete")) {
        deleteMemo(Number(e.target.dataset.id));
    }
});

addMemoBtn.addEventListener("click", addMemo);

renderMemos();