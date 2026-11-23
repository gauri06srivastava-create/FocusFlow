
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const sessionStatus = document.getElementById("sessionStatus");

let timeLeft = 25 * 60;
let timerInterval = null;
let isRunning = false;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startBtn.textContent = "Pause Focus";
    sessionStatus.textContent = "Stay focused. You've got this!";

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;

            startBtn.textContent = "Start Focus";
            sessionStatus.textContent = "Session completed! Great job!";
            alert("Focus session completed! 🎉");
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    startBtn.textContent = "Resume Focus";
    sessionStatus.textContent = "Paused. Take a breath.";
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    timeLeft = 25 * 60;

    updateTimerDisplay();
    startBtn.textContent = "Start Focus";
    sessionStatus.textContent = "Ready to focus?";
}

startBtn.addEventListener("click", () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener("click", resetTimer);

updateTimerDisplay();
