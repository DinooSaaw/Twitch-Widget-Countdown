// Fetch configuration
let config;
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        config = data;
        initializeCountdown();
    })
    .catch(err => console.error('Error loading config.json:', err));

const timeText = document.getElementById("timeText");

let endingTime;
let countdownEnded = false;
let CountdownPaused = false;
let pauseStartTime = null; // To track when the timer is paused
let users = [];
let time;

const initializeCountdown = () => {
    // Use config to initialize variables
    endingTime = new Date(Date.now());
    endingTime = timeFunc.addHours(endingTime, config.initialCounterConfig.initialHours);
    endingTime = timeFunc.addMinutes(endingTime, config.initialCounterConfig.initialMinutes);
    endingTime = timeFunc.addSeconds(endingTime, config.initialCounterConfig.initialSeconds);

    // Start the countdown updater
    countdownUpdater = setInterval(() => {
        if (!CountdownPaused) { // Only update the countdown if it's not paused
            getNextTime();
        }
    }, 1000); // Updating the countdown every second
};

const getNextTime = () => {
    let currentTime = new Date(Date.now());
    let differenceTime = endingTime - currentTime;
    time = `${timeFunc.getHours(differenceTime)}:${timeFunc.getMinutes(differenceTime)}:${timeFunc.getSeconds(differenceTime)}`;
    if (differenceTime <= 0) {
        clearInterval(countdownUpdater);
        countdownEnded = true;
        time = "00:00:00";
        onCountdownEnd();
    }
    timeText.innerText = time;
};

let countdownUpdater;

const addTime = async (time, s) => {
    endingTime = timeFunc.addSeconds(time, s);

    const maxHours = config.maxCounterTime.maxHours;
    const maxMinutes = config.maxCounterTime.maxMinutes;
    const maxSeconds = config.maxCounterTime.maxSeconds;

    if (!(maxHours === 0 && maxMinutes === 0 && maxSeconds === 0)) {
        let maxTime = timeFunc.getMilliseconds(new Date(Date.now()), maxHours, maxMinutes, maxSeconds);
        if (endingTime.getTime() > maxTime.getTime()) endingTime = maxTime;
    }

    let addedTime = document.createElement("p");
    addedTime.classList = "addedTime";
    addedTime.innerText = `+${s}s`;
    document.body.appendChild(addedTime);
    addedTime.style.display = "block";
    await sleep(50);
    addedTime.style.left = `${randomInRange(35, 65)}%`;
    addedTime.style.top = `${randomInRange(15, 40)}%`;
    addedTime.style.opacity = "1";
    await sleep(2500);
    addedTime.style.opacity = "0";
    await sleep(500);
    addedTime.remove();

    // Update the displayed time immediately after adding time
    getNextTime();
};

const removeTime = async (time, s) => {
    endingTime = timeFunc.removeSeconds(time, s);

    const maxHours = config.maxCounterTime.maxHours;
    const maxMinutes = config.maxCounterTime.maxMinutes;
    const maxSeconds = config.maxCounterTime.maxSeconds;

    if (!(maxHours === 0 && maxMinutes === 0 && maxSeconds === 0)) {
        let maxTime = timeFunc.getMilliseconds(new Date(Date.now()), maxHours, maxMinutes, maxSeconds);
        if (endingTime.getTime() > maxTime.getTime()) endingTime = maxTime;
    }

    let removedTime = document.createElement("p");
    removedTime.classList = "removedTime";
    removedTime.innerText = `-${s}s`;
    document.body.appendChild(removedTime);
    removedTime.style.display = "block";
    await sleep(50);
    removedTime.style.left = `${randomInRange(35, 65)}%`;
    removedTime.style.bottom = `${randomInRange(15, 40)}%`;
    removedTime.style.opacity = "1";
    await sleep(2500);
    removedTime.style.opacity = "0";
    await sleep(500);
    removedTime.remove();

    // Update the displayed time immediately after removing time
    getNextTime();
};

const PauseCountdown = async () => {
    if (CountdownPaused) {
        // Resume: Calculate the pause duration and add it to endingTime
        let pauseDuration = Date.now() - pauseStartTime;
        endingTime = new Date(endingTime.getTime() + pauseDuration);
    } else {
        // Pause: Record the time when the countdown was paused
        pauseStartTime = Date.now();
    }
    CountdownPaused = !CountdownPaused;
};

const GetPauseState = async () => {
    return CountdownPaused;
};

// Test Functions
const testAddTime = (times, delay) => {
    let addTimeInterval = setInterval(async () => {
        if (times > 0) {
            await sleep(randomInRange(50, delay - 50));
            addTime(endingTime, 30);
            --times;
        } else {
            clearInterval(addTimeInterval);
        }
    }, delay);
};

const testRemoveTime = (times, delay) => {
    let addTimeInterval = setInterval(async () => {
        if (times > 0) {
            await sleep(randomInRange(50, delay - 50));
            removeTime(endingTime, 30);
            --times;
        } else {
            clearInterval(addTimeInterval);
        }
    }, delay);
};

const onCountdownEnd = () => {
    logMessage('Timer', "Timer has ended");
    timeText.style.color = "green";
    let audio = new Audio("celebration.mp3");
    audio.play();
};
