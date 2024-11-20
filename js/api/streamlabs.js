// Fetch configuration from config.json
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        config = data;
        if (config.loginData.streamlabs_token) {
            initializeStreamlabs(config.loginData.streamlabs_token);
        } else {
            logMessage("Streamlabs", "Not Connected To Streamlabs As No API Token Was Given!");
            return
        }
    })
    .catch(err => console.error('Error loading config.json:', err));

const initializeStreamlabs = (streamlabs_token) => {
    let socket = io(`https://sockets.streamlabs.com?token=${streamlabs_token}`, { transports: ['websocket'] });

    socket.on("connect", () => {
        logMessage("Streamlabs", "Socket Connected");
    });

    socket.on("event", (event) => {
        logObject("Streamlabs", event);
        if (!countdownEnded) {
            switch (event.type) {
                case "subscription":
                    if (!event.message[0].gifter) handleSubscription(event.message[0], "sub");
                    break;

                case "resub":
                    if (!event.message[0].gifter) handleSubscription(event.message[0], "resub");
                    break;

                case "donation":
                    handleDonation(event.message[0]);
                    break;

                case "bits":
                    handleBits(event.message[0]);
                    break;

                default:
                    if (event.message[0].gifter) handleGiftSub(event.message[0]);
                    break;
            }
        }
    });

    socket.on("disconnect", () => {
        logMessage("Streamlabs", "Socket Disconnected");
        socket.connect();
    });

    const handleSubscription = (message, type) => {
        const subPlan = message.sub_plan;
        const secondsKey = type === "sub" ? "seconds_added_per_sub" : "seconds_added_per_resub";

        const timeToAdd = getTimeForSubPlan(subPlan, secondsKey);
        if (timeToAdd > 0) {
            addTime(endingTime, timeToAdd);
            logMessage("Streamlabs", `Added ${timeToAdd} Seconds Because ${message.name} ${type === "sub" ? "Subscribed" : "ReSubscribed"} With Plan ${subPlan}`);
        }

        addUser(message.name);
    };

    const handleGiftSub = (message) => {
        const subPlan = message.sub_plan || "1000"; // Default to Tier 1 if no plan specified
        const timeToAdd = getTimeForSubPlan(subPlan, "seconds_added_per_giftsub");

        if (timeToAdd > 0) {
            addTime(endingTime, timeToAdd);
            logMessage("Streamlabs", `Added ${timeToAdd} Seconds Because ${message.gifter} Gifted A Sub With Plan ${subPlan}`);
        }

        addUser(message.name);
    };

    const handleDonation = (message) => {
        const donationAmount = parseInt(message.amount, 10);
        const currency = message.currency;

        if (donationAmount >= config.generalTwitchConfig.min_donation_amount) {
            const times = Math.floor(donationAmount / config.generalTwitchConfig.min_donation_amount);
            const timeToAdd = config.generalTwitchConfig.seconds_added_per_donation * times;

            addTime(endingTime, timeToAdd);
            logMessage("Streamlabs", `Added ${timeToAdd} Seconds Because ${message.name} Donated ${donationAmount} ${currency}`);
            addUser(message.name);
        }
    };

    const handleBits = (message) => {
        const bits = parseInt(message.amount, 10);

        if (bits >= config.generalTwitchConfig.min_amount_of_bits) {
            const times = Math.floor(bits / config.generalTwitchConfig.min_amount_of_bits);
            const timeToAdd = config.generalTwitchConfig.seconds_added_per_bits * times;

            addTime(endingTime, timeToAdd);
            logMessage("Streamlabs", `Added ${timeToAdd} Seconds Because ${message.name} Donated ${bits} Bits`);
            addUser(message.name);
        }
    };

    const getTimeForSubPlan = (subPlan, keyPrefix) => {
        switch (subPlan) {
            case "1000":
                return config.generalTwitchConfig[`${keyPrefix}_tier1`];
            case "2000":
                return config.generalTwitchConfig[`${keyPrefix}_tier2`];
            case "3000":
                return config.generalTwitchConfig[`${keyPrefix}_tier3`];
            default:
                return config.generalTwitchConfig[`${keyPrefix}_prime`] || 0;
        }
    };

    const addUser = (name) => {
        if (!users.includes(name)) {
            users.push(name);
        }
    };
};
