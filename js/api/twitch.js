// Fetch configuration from config.json
fetch("config.json")
  .then((response) => response.json())
  .then((data) => {
    config = data;
    initializeTwitchClient();
  })
  .catch((err) => console.error("Error loading config.json:", err));

const initializeTwitchClient = () => {
  if (config.loginData.twitch_channel_name !== "") {
    const client = new tmi.client({
      connection: {
        reconnect: true,
        secure: true,
      },
      channels: [config.loginData.twitch_channel_name],
    });

    client.connect();
    logMessage(
      "Twitch",
      `Client Connected to ${config.loginData.twitch_channel_name} with prefix ${config.generalConfig["twitch_command_prefix"]}`
    );

    client.on("message", async (channel, tags, message, self) => {
      let displayName = tags["display-name"];
      let isMod = tags["mod"] || (tags["badges"] && tags["badges"].hasOwnProperty("broadcaster"));

      if (!message.startsWith(config.generalConfig["twitch_command_prefix"]))
        return;

      let msg = message.slice(1).trim().toLowerCase();
      let [command, ...args] = msg.trim().split(" ");

      switch (command) {
        case "pause":
          if (countdownEnded) return
          if (isMod) {
            PauseCountdown();
            let pauseState = await GetPauseState();
            if (pauseState) {
              logMessage(
                "Twitch",
                `Timer Has Paused Because ${displayName} Requested It`
              );
            } else {
              logMessage(
                "Twitch",
                `Timer Has Unpaused Because ${displayName} Requested It`
              );
            }
          } else {
            logMessage("Twitch", `Only Moderators Can Pause The Countdown`);
          }
          break;

        case "toggletheme":
          if (isMod) {
            toggleTheme();
            logMessage(
              "Twitch",
              `Theme Has Toggled Because ${displayName} Requested It`
            );
          } else {
            logMessage("Twitch", `Only Moderators Can Pause The Countdown`);
          }
          break;

        case "reset":
          if (isMod) {
            resetTimer();
            logMessage(
              "Twitch",
              `Timer Has Been Reset Because ${displayName} Requested It`
            );
          } else {
            logMessage("Twitch", `Only Moderators Can Pause The Countdown`);
          }
          break;
        case "add":
          if (countdownEnded) return
          if (isMod) {
            if (args[0] && !isNaN(args[0])) {
              addTime(endingTime, parseInt(args[0]));
              logMessage(
                "Twitch",
                `Added ${args[0]} Seconds Because ${displayName} Requested It`
              );
            } else {
              logMessage(
                "Twitch",
                `Invalid or missing argument for 'add' command. Usage: !add <seconds>`
              );
            }
          } else {
            logMessage("Twitch", `Only Moderators Can Add Time`);
          }
          break;
        case "remove":
          if (countdownEnded) return
          if (isMod) {
            if (args[0] && !isNaN(args[0])) {
              removeTime(endingTime, parseInt(args[0]));
              logMessage(
                "Twitch",
                `Removed ${args[0]} Seconds Because ${displayName} Requested It`
              );
            } else {
              logMessage(
                "Twitch",
                `Invalid or missing argument for 'remove' command. Usage: !remove <seconds>`
              );
            }
          } else {
            logMessage("Twitch", `Only Moderators Can Remove Time`);
          }
          break;
      }
    });

    // Handle Subscription (Sub, Resub, and Gifts)
    client.on(
      "subscription",
      (channel, username, methods, message, userstate) => {
        if (!countdownEnded) {
          handleSubscription(
            username,
            methods["plan"],
            "subscription",
            userstate
          );
        }
      }
    );

    // Handle Resubscriptions
    client.on(
      "resub",
      (channel, username, months, message, userstate, methods) => {
        if (!countdownEnded) {
          handleSubscription(username, methods["plan"], "resub", userstate);
        }
      }
    );

    // Handle Sub Gifts
    client.on(
      "subgift",
      (channel, username, months, recipient, methods, userstate) => {
        if (!countdownEnded) {
          handleSubscription(
            username,
            methods["plan"],
            "subgift",
            userstate,
            months
          );
        }
      }
    );

    // Handle Cheer Events (Bits)
    client.on("cheer", (channel, userstate, message) => {
      if (!countdownEnded) {
        if (userstate.bits >= config.generalConfig.min_amount_of_bits) {
          let times = Math.floor(
            userstate.bits / config.generalConfig.min_amount_of_bits
          );
          addTime(
            endingTime,
            config.generalConfig.seconds_added_per_bits * times
          );
          logMessage(
            "Twitch",
            `Added ${
              config.generalConfig.seconds_added_per_bits * times
            } Seconds Because ${userstate["display-name"]} Donated ${
              userstate.bits
            } Bits`
          );

          // Add user to the list if they donated bits
          if (!users[userstate["display-name"]]) {
            users[userstate["display-name"]] = {
              bits: userstate.bits,
              subs: {},
              subgifts: {},
              color: userstate.color ? userstate.color : "#FFFFFF",
            };
          }
        }
      }
    });
  } else {
    logMessage("Twitch", "Not Connected To Twitch As No Channel Was Given!");
    return;
  }
};

// Handle subscription, resub, and subgift logic
const handleSubscription = (username, plan, type, userstate, months = 1) => {
  const subTimeConfig = {
    subscription: {
      Prime: config.generalConfig.seconds_added_per_sub_prime,
      1000: config.generalConfig.seconds_added_per_sub_tier1,
      2000: config.generalConfig.seconds_added_per_sub_tier2,
      3000: config.generalConfig.seconds_added_per_sub_tier3,
    },
    resub: {
      Prime: config.generalConfig.seconds_added_per_resub_prime,
      1000: config.generalConfig.seconds_added_per_resub_tier1,
      2000: config.generalConfig.seconds_added_per_resub_tier2,
      3000: config.generalConfig.seconds_added_per_resub_tier3,
    },
    subgift: {
      1000: config.generalConfig.seconds_added_per_giftsub_tier1,
      2000: config.generalConfig.seconds_added_per_giftsub_tier2,
      3000: config.generalConfig.seconds_added_per_giftsub_tier3,
    },
  };

  // Treat Prime as Tier 1
  if (plan === "Prime") plan = 1000;

  const seconds = subTimeConfig[type][plan] || 0;

  if (seconds > 0) {
    addTime(endingTime, seconds);
    logMessage(
      "Twitch",
      `Added ${seconds} Seconds Because ${username} ${
        type === "subgift" ? "Gifted A Sub" : "Subscribed"
      } At (${plan})`
    );

    // Ensure the user is tracked
    if (!users[username]) {
      users[username] = {
        bits: 0,
        subs: {}, // Unified subs tracking
        color: userstate.color ? userstate.color : "#FFFFFF",
      };
    }

    users[username].color = userstate.color ? userstate.color : "#FFFFFF";

    // Increment subs count (gift or not) for the specific plan
    if (!users[username].subs[plan]) {
      users[username].subs[plan] = { count: 0, gifts: 0 };
    }

    if (type === "subgift") {
      users[username].subs[plan].gifts += 1;
    } else {
      users[username].subs[plan].count += 1;
    }
  }
};
