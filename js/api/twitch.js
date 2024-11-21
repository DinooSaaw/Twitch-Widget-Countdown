
// Fetch configuration from config.json
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        config = data;
        initializeTwitchClient();
    })
    .catch(err => console.error('Error loading config.json:', err));

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
        logMessage("Twitch", `Client Connected to ${config.loginData.twitch_channel_name} with prefix ${config.generalConfig["twitch_command_prefix"]}`);

        client.on('message', async (channel, tags, message, self) => {
            let displayName = tags["display-name"];
            let isMod = tags["mod"] || tags.badges.hasOwnProperty("broadcaster");

            if (countdownEnded) return logMessage("Twitch", `Stopping Handling Chat Messages Because Countdown Ended`);

            if (!message.startsWith(config.generalConfig["twitch_command_prefix"])) return logMessage("Twitch", `Ignoring Message As It's Not A Valid Command`);

            let msg = message.slice(1).trim().toLowerCase();
            let [command, ...args] = msg.trim().split(" ");

            switch (command) {
                case "pause":
                    if (isMod) {
                        PauseCountdown();
                        let pauseState = await GetPauseState();
                        if (pauseState) {
                            logMessage("Twitch", `Timer Has Paused Because ${displayName} Requested It`);
                        } else {
                            logMessage("Twitch", `Timer Has Unpaused Because ${displayName} Requested It`);
                        }
                    } else {
                        logMessage("Twitch", `Only Moderators Can Pause The Countdown`);
                    }
                    break;
                    case "reset":
                        if (isMod) {
                            resetTimer();
                            logMessage("Twitch", `Timer Has Been Reset Because ${displayName} Requested It`);
                        } else {
                            logMessage("Twitch", `Only Moderators Can Pause The Countdown`);
                        }
                        break;
                case "add":
                    if (isMod) {
                        if (args[0] && !isNaN(args[0])) {
                            addTime(endingTime, parseInt(args[0]));
                            logMessage("Twitch", `Added ${args[0]} Seconds Because ${displayName} Requested It`);
                        } else {
                            logMessage("Twitch", `Invalid or missing argument for 'add' command. Usage: !add <seconds>`);
                        }
                    } else {
                        logMessage("Twitch", `Only Moderators Can Add Time`);
                    }
                    break;
                case "remove":
                    if (isMod) {
                        if (args[0] && !isNaN(args[0])) {
                            removeTime(endingTime, parseInt(args[0]));
                            logMessage("Twitch", `Removed ${args[0]} Seconds Because ${displayName} Requested It`);
                        } else {
                            logMessage("Twitch", `Invalid or missing argument for 'remove' command. Usage: !remove <seconds>`);
                        }
                    } else {
                        logMessage("Twitch", `Only Moderators Can Remove Time`);
                    }
                    break;
            }
        });

        client.on('subscription', (channel, username, methods, message, userstate) => {
            if (!countdownEnded) {
                handleSubscription(username, methods['plan'], 'subscription');
            }
        });

        client.on('resub', (channel, username, months, message, userstate, methods) => {
            if (!countdownEnded) {
                handleSubscription(username, methods['plan'], 'resub');
            }
        });

        client.on('subgift', (channel, username, months, recipient, methods, userstate) => {
            if (!countdownEnded) {
                handleSubscription(username, methods['plan'], 'subgift');
            }
        });

        client.on('cheer', (channel, userstate, message) => {
            if (!countdownEnded) {
                if (userstate.bits >= config.generalTwitchConfig.min_amount_of_bits) {
                    let times = Math.floor(userstate.bits / config.generalTwitchConfig.min_amount_of_bits);
                    addTime(endingTime, config.generalTwitchConfig.seconds_added_per_bits * times);
                    logMessage("Twitch", `Added ${config.generalTwitchConfig.seconds_added_per_bits * times} Seconds Because ${userstate['display-name']} Donated ${userstate.bits} Bits`);
                    if (!users.includes(userstate['display-name'])) {
                        users.push(userstate['display-name']);
                    }
                }
            }
        });
    } else {
        logMessage("Twitch", "Not Connected To Twitch As No Channel Was Given!");
        return
    }
};

const handleSubscription = (username, plan, type) => {
    const subTimeConfig = {
        subscription: {
            Prime: config.generalTwitchConfig.seconds_added_per_sub_prime,
            "1000": config.generalTwitchConfig.seconds_added_per_sub_tier1,
            "2000": config.generalTwitchConfig.seconds_added_per_sub_tier2,
            "3000": config.generalTwitchConfig.seconds_added_per_sub_tier3,
        },
        resub: {
            Prime: config.generalTwitchConfig.seconds_added_per_resub_prime,
            "1000": config.generalTwitchConfig.seconds_added_per_resub_tier1,
            "2000": config.generalTwitchConfig.seconds_added_per_resub_tier2,
            "3000": config.generalTwitchConfig.seconds_added_per_resub_tier3,
        },
        subgift: {
            Prime: config.generalTwitchConfig.seconds_added_per_giftsub_tier1,
            "1000": config.generalTwitchConfig.seconds_added_per_giftsub_tier1,
            "2000": config.generalTwitchConfig.seconds_added_per_giftsub_tier2,
            "3000": config.generalTwitchConfig.seconds_added_per_giftsub_tier3,
        }
    };

    const seconds = subTimeConfig[type][plan] || 0;

    if (seconds > 0) {
        addTime(endingTime, seconds);
        logMessage("Twitch", `Added ${seconds} Seconds Because ${username} ${type === 'subgift' ? 'Gifted A' : ''} Sub (${plan})`);
        if (!users.includes(username)) {
            users.push(username);
        }
    }
};
