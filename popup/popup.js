
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionStatus = document.getElementById("sessionStatus");

const modeLabel = document.getElementById("sessionModeLabel");
const completedDisplay = document.getElementById("completedSessions");
const modeButtons = document.querySelectorAll(".mode-btn");

let currentState = {};
let displayInterval = null;

const MODE_NAMES = {
    focus: "FOCUS SESSION",
    shortBreak: "SHORT BREAK",
    longBreak: "LONG BREAK"
};

const MODE_MESSAGES = {
    focus: "Stay focused. You've got this!",
    shortBreak: "Take a little break!",
    longBreak: "Relax. You've earned it!"
};

// Get timer state from background
async function getTimerState() {
    return await chrome.runtime.sendMessage({
        action: "GET_TIMER"
    });
}

// Update timer display
function updateDisplay(state) {
    currentState = state;

    let remainingMs;

    if (state.status === "running") {
        remainingMs = Math.max(0, state.endTime - Date.now());
    } else {
        remainingMs = state.remainingTime ?? state.durationMs;
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Update mode label
    modeLabel.textContent = MODE_NAMES[state.mode] || "FOCUS SESSION";

    // Update completed sessions
    completedDisplay.textContent = state.completedSessions || 0;

    // Update status message
    if (state.status === "running") {
        sessionStatus.textContent = MODE_MESSAGES[state.mode];
        startBtn.textContent = "Pause";
    } else if (state.status === "paused") {
        sessionStatus.textContent = "Paused. Take a breath.";
        startBtn.textContent = "Resume";
    } else {
        sessionStatus.textContent = "Ready when you are!";
        startBtn.textContent =
            state.mode === "focus" ? "Start Focus" : "Start " +
            (state.mode === "shortBreak" ? "Short Break" : "Long Break");
    }

    // Highlight selected mode
    modeButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.mode === state.mode
        );
    });
}

// Refresh timer from background
async function refreshTimer() {
    const state = await getTimerState();

    updateDisplay(state);

    if (state.status === "running") {
        if (!displayInterval) {
            displayInterval = setInterval(refreshTimer, 1000);
        }
    } else {
        clearInterval(displayInterval);
        displayInterval = null;
    }
}

// Start timer
async function startTimer() {
    await chrome.runtime.sendMessage({
        action: "START_TIMER"
    });

    await refreshTimer();
}

// Pause timer
async function pauseTimer() {
    await chrome.runtime.sendMessage({
        action: "PAUSE_TIMER"
    });

    await refreshTimer();
}

// Resume timer
async function resumeTimer() {
    await chrome.runtime.sendMessage({
        action: "RESUME_TIMER"
    });

    await refreshTimer();
}

// Start / pause / resume button
startBtn.addEventListener("click", async () => {

    if (currentState.status === "running") {
        await pauseTimer();

    } else if (currentState.status === "paused") {
        await resumeTimer();

    } else {
        await startTimer();
    }

});

// Reset button
resetBtn.addEventListener("click", async () => {

    await chrome.runtime.sendMessage({
        action: "RESET_TIMER"
    });

    await refreshTimer();

});

// Mode selection buttons
modeButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const selectedMode = button.dataset.mode;

        await chrome.runtime.sendMessage({
            action: "SET_MODE",
            mode: selectedMode
        });

        await refreshTimer();

    });

});

// Initial load
refreshTimer();
