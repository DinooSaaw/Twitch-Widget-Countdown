// Fetch configuration
let config;
fetch("config.json")
  .then((response) => response.json())
  .then((data) => {
    config = data;
    initializeCountdown();
  })
  .catch((err) => console.error("Error loading config.json:", err));

const timeText = document.getElementById("timeText");

let endingTime;
let countdownEnded = false;
let CountdownPaused = false;
let pauseStartTime = null;
let users = {}
let time;

// Save the ending time to localStorage
const saveTimeToLocalStorage = () => {
  localStorage.setItem("endingTime", endingTime.toISOString());
};

const initializeCountdown = () => {
  setInitialTheme();
  // Check if there's a saved ending time in localStorage
  const savedEndingTime = localStorage.getItem("endingTime");

  if (savedEndingTime) {
    // Parse the stored ending time and use it
    endingTime = new Date(savedEndingTime);
    
    if (endingTime <= new Date()) {
      logMessage(
        "Timer",
        "Saved ending time is in the past. Using default configuration."
      );
      localStorage.removeItem("endingTime"); // Clear invalid ending time
      localStorage.removeItem("userData"); // Clear user data
      endingTime = new Date(Date.now());
      endingTime = timeFunc.addHours(
        endingTime,
        config.initialCounterConfig.initialHours
      );
      endingTime = timeFunc.addMinutes(
        endingTime,
        config.initialCounterConfig.initialMinutes
      );
      endingTime = timeFunc.addSeconds(
        endingTime,
        config.initialCounterConfig.initialSeconds
      );
    }
  } else {
    // If no saved ending time, initialize with the configured time
    endingTime = new Date(Date.now());
    endingTime = timeFunc.addHours(
      endingTime,
      config.initialCounterConfig.initialHours
    );
    endingTime = timeFunc.addMinutes(
      endingTime,
      config.initialCounterConfig.initialMinutes
    );
    endingTime = timeFunc.addSeconds(
      endingTime,
      config.initialCounterConfig.initialSeconds
    );
  }

  // Start the countdown updater
  countdownUpdater = setInterval(() => {
    if (!CountdownPaused) {
      // Only update the countdown if it's not paused
      getNextTime();
    }
  }, 1000); // Updating the countdown every second
};

const getNextTime = () => {
  let currentTime = new Date(Date.now());
  let differenceTime = endingTime - currentTime;
  time = `${timeFunc.getHours(differenceTime)}:${timeFunc.getMinutes(
    differenceTime
  )}:${timeFunc.getSeconds(differenceTime)}`;
  if (differenceTime <= 0) {
    clearInterval(countdownUpdater);
    countdownEnded = true;
    time = "00:00:00";
    onCountdownEnd();
  }
  if(CountdownPaused) return
  timeText.innerText = time;
  return time
};

let countdownUpdater;

// Add time to the countdown
const addTime = async (time, s) => {
  endingTime = timeFunc.addSeconds(time, s);

  const maxHours = config.maxCounterTime.maxHours;
  const maxMinutes = config.maxCounterTime.maxMinutes;
  const maxSeconds = config.maxCounterTime.maxSeconds;

  if (!(maxHours === 0 && maxMinutes === 0 && maxSeconds === 0)) {
    let maxTime = timeFunc.getMilliseconds(
      new Date(Date.now()),
      maxHours,
      maxMinutes,
      maxSeconds
    );
    if (endingTime.getTime() > maxTime.getTime()) endingTime = maxTime;
  }

  saveTimeToLocalStorage(); // Save the time to localStorage

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

// Remove time from the countdown
const removeTime = async (time, s) => {
  endingTime = timeFunc.removeSeconds(time, s);

  const maxHours = config.maxCounterTime.maxHours;
  const maxMinutes = config.maxCounterTime.maxMinutes;
  const maxSeconds = config.maxCounterTime.maxSeconds;

  if (!(maxHours === 0 && maxMinutes === 0 && maxSeconds === 0)) {
    let maxTime = timeFunc.getMilliseconds(
      new Date(Date.now()),
      maxHours,
      maxMinutes,
      maxSeconds
    );
    if (endingTime.getTime() > maxTime.getTime()) endingTime = maxTime;
  }

  saveTimeToLocalStorage(); // Save the time to localStorage

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

// Pause the countdown
const PauseCountdown = async () => {
  if (CountdownPaused) {
    // Resume: Calculate the pause duration and add it to endingTime
    let pauseDuration = Date.now() - pauseStartTime;
    endingTime = new Date(endingTime.getTime() + pauseDuration);

    timeText.classList.remove("paused");
    timeText.classList.add("resumed");

  } else {
    // Pause: Record the time when the countdown was paused
    pauseStartTime = Date.now();

    timeText.classList.remove("resumed");
    timeText.classList.add("paused")
  }
  CountdownPaused = !CountdownPaused;
  return CountdownPaused
};

// Reset the timer
const resetTimer = () => {
  localStorage.removeItem("endingTime"); // Remove saved time from localStorage
  initializeCountdown(); // Reinitialize the timer
  return "Timer has been reset"
};

// Handle when the countdown ends
const onCountdownEnd = () => {
  if(countdownEnded) return;
  logMessage("Timer", "Timer has ended");
  timeText.style.color = "green";

  // Check if celebration.mp3 exists
  const audioFile = "celebration.mp3";
  fetch(audioFile)
    .then((response) => {
      if (response.ok) {
        // File exists, play the audio
        let audio = new Audio(audioFile);
        audio.play();
      } else {
        // File doesn't exist, log an error or handle it
        logMessage(
          "Timer",
          "Celebration audio file not found. No audio playing."
        );
      }
    })
    .catch((error) => {
      // Handle errors in fetching the file (e.g., network issues)
      logMessage(
        "Timer",
        "Error checking for celebration audio: " + error.message
      );
    });
};

// Test functions (optional)
const testAddTime = (times, delay) => {
  let addTimeInterval = setInterval(async () => {
    if (times > 0) {
      await sleep(randomInRange(50, delay - 50)); // Random delay before adding time
      addTime(endingTime, 30); // Add 30 seconds
      --times; // Decrease the times left
    } else {
      clearInterval(addTimeInterval); // Stop the interval when times reach 0
    }
  }, delay); // Delay between each time addition
};

const testRemoveTime = (times, delay) => {
  let removeTimeInterval = setInterval(async () => {
    if (times > 0) {
      await sleep(randomInRange(50, delay - 50)); // Random delay before removing time
      removeTime(endingTime, 30); // Remove 30 seconds
      --times; // Decrease the times left
    } else {
      clearInterval(removeTimeInterval); // Stop the interval when times reach 0
    }
  }, delay); // Delay between each time removal
};

// Theme toggle functionality
const themeToggleButton = document.getElementById("themeToggle");

const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
};

themeToggleButton.addEventListener("click", toggleTheme);

const setInitialTheme = () => {
  const prefersDark = config.theme.prefersDark;
  if (prefersDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
};

const GenerateLeaderboardTable = () => {
  if (Object.keys(users).length === 0) return console.log("No users"); // Check if there are no users
  console.log(users);

  const leaderboard = Object.entries(users).map(([username, data]) => {
    // Sum all subs
    const totalSubsCount = Object.values(data.subs || {}).reduce(
      (acc, sub) => acc + sub.count + sub.gifts, // Add both count and gifts
      0
    );

    // Sum all gifted subs
    const totalGiftsCount = Object.values(data.subgifts || {}).reduce(
      (acc, gifts) => acc + gifts,
      0
    );

    const totalSubs = totalSubsCount + totalGiftsCount; // Total subs includes both subs and gifts

    return {
      username,
      bits: data.bits || 0,
      totalSubs,
      color: data.color || "#FFFFFF", // Default to white if undefined
    };
  });

  // Sort the leaderboard by total subscriptions (subs + gifts) in descending order
  leaderboard.sort((a, b) => b.totalSubs - a.totalSubs);

  // Display the leaderboard in the console
  console.table(
    leaderboard.map((user) => ({
      Username: user.username,
      Bits: Number(user.bits),
      "Total Subs": user.totalSubs,
    }))
  );

  return leaderboard;
};
