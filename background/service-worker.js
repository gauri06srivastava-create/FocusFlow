
const TIMER_ALARM = "focusflow-timer";

// Pomodoro durations
const DURATIONS = {
    focus: 25 * 60 * 1000,
    shortBreak: 5 * 60 * 1000,
    longBreak: 15 * 60 * 1000
};

// Get initial timer state
async function getState() {
    const data = await chrome.storage.local.get("timerState");

    return data.timerState || {
        status: "idle",
        mode: "focus",
        completedSessions: 0,
        durationMs: DURATIONS.focus,
        remainingTime: DURATIONS.focus
    };
}

// Save timer state
async function saveState(state) {
    await chrome.storage.local.set({
        timerState: state
    });
}

// Start a timer for a particular mode
async function startMode(mode, completedSessions) {
    const durationMs = DURATIONS[mode];
    const endTime = Date.now() + durationMs;

    const state = {
        status: "running",
        mode,
        completedSessions,
        durationMs,
        endTime,
        remainingTime: durationMs
    };

    await saveState(state);

    await chrome.alarms.clear(TIMER_ALARM);

    await chrome.alarms.create(TIMER_ALARM, {
        when: endTime
    });

    return state;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    (async () => {
        let state = await getState();

        switch (message.action) {

            case "GET_TIMER":
                sendResponse(state);
                break;

            case "START_TIMER":
                state = await startMode(
                    state.mode || "focus",
                    state.completedSessions || 0
                );

                sendResponse({ success: true, state });
                break;

            case "PAUSE_TIMER":
                if (state.status === "running") {
                    const remainingTime = Math.max(
                        0,
                        state.endTime - Date.now()
                    );

                    await chrome.alarms.clear(TIMER_ALARM);

                    state = {
                        ...state,
                        status: "paused",
                        remainingTime
                    };

                    await saveState(state);

                    sendResponse({ success: true, state });
                } else {
                    sendResponse({ success: false });
                }
                break;

            case "RESUME_TIMER":
                if (state.status === "paused") {
                    const endTime = Date.now() + state.remainingTime;

                    state = {
                        ...state,
                        status: "running",
                        endTime
                    };

                    await saveState(state);

                    await chrome.alarms.create(TIMER_ALARM, {
                        when: endTime
                    });

                    sendResponse({ success: true, state });
                } else {
                    sendResponse({ success: false });
                }
                break;

            case "RESET_TIMER":
                await chrome.alarms.clear(TIMER_ALARM);

                state = {
                    ...state,
                    status: "idle",
                    durationMs: DURATIONS[state.mode],
                    remainingTime: DURATIONS[state.mode],
                    endTime: undefined
                };

                await saveState(state);

                sendResponse({ success: true, state });
                break;

            case "SET_MODE":
                if (!DURATIONS[message.mode]) {
                    sendResponse({ success: false });
                    break;
                }

                await chrome.alarms.clear(TIMER_ALARM);

                state = {
                    ...state,
                    status: "idle",
                    mode: message.mode,
                    durationMs: DURATIONS[message.mode],
                    remainingTime: DURATIONS[message.mode],
                    endTime: undefined
                };

                await saveState(state);

                sendResponse({ success: true, state });
                break;

            default:
                sendResponse({ success: false });
        }

    })();

    return true;
});

// Automatically move to the next session when timer finishes
chrome.alarms.onAlarm.addListener(async (alarm) => {

    if (alarm.name !== TIMER_ALARM) return;

    const state = await getState();

    if (state.status !== "running") return;

    if (state.mode === "focus") {

        const completedSessions = state.completedSessions + 1;

        // Every 4th focus session gets a long break
        const nextMode =
            completedSessions % 4 === 0
                ? "longBreak"
                : "shortBreak";

        await startMode(nextMode, completedSessions);

    } else {

        // After a break, return to focus
        await startMode("focus", state.completedSessions);

    }

});
