// Fetch configuration from config.json
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        config = data;
        if (config.streamelements_token) {
            initializeStreamElements(config.streamelements_token);
        } else {
            return
        }
    })
    .catch(err => console.error('Error loading config.json:', err));

const initializeStreamElements = (streamelements_token) => {
    let streamElementsSocket;

    const streamElementsConnect = () => {
        streamElementsSocket = undefined;
        streamElementsSocket = io('https://realtime.streamelements.com', {
            transports: ['websocket']
        });

        streamElementsSocket.on('connect', onConnect);
        streamElementsSocket.on('disconnect', onDisconnect);
        streamElementsSocket.on('authenticated', onAuthenticated);
        streamElementsSocket.on('unauthorized', console.error);
        streamElementsSocket.on('event:test', onEvent);
        streamElementsSocket.on('event', onEvent);
        streamElementsSocket.on('event:update', onEvent);
        streamElementsSocket.on('event:reset', onEvent);
    };

    const onConnect = () => {
        logMessage("StreamElements", "Socket Connected");
        streamElementsSocket.emit('authenticate', { method: 'apikey', token: streamelements_token });
    };

    const onDisconnect = () => {
        logMessage("StreamElements", "Socket Disconnected");
        streamElementsConnect();
    };

    const onAuthenticated = (data) => {
        const { channelId } = data;
        logMessage("StreamElements", `Channel ${channelId} Connected`);
    };

    const onEvent = (data) => {
        logObject("StreamElements", data);

        if (!countdownEnded) {
            switch (data.listener) {
                case "subscriber-latest":
                    handleSubscriberEvent(data.event);
                    break;

                case "cheer-latest":
                    handleCheerEvent(data.event);
                    break;

                case "tip-latest":
                    handleDonationEvent(data.event);
                    break;
            }
        }
    };

    const handleSubscriberEvent = (event) => {
        let amount = event.gifted ? (event.bulkGifted ? event.amount : 1) : 1;
        let timeToAdd = 0;

        if (event.gifted || event.bulkGifted) {
            timeToAdd = getSubscriptionTime(event.tier, config.generalTwitchConfig, "seconds_added_per_giftsub");
        } else if (event.amount != "1") {
            timeToAdd = getSubscriptionTime(event.tier, config.generalTwitchConfig, "seconds_added_per_resub");
        } else {
            timeToAdd = getSubscriptionTime(event.tier, config.generalTwitchConfig, "seconds_added_per_sub");
        }

        if (timeToAdd > 0) {
            addTime(endingTime, timeToAdd * amount);
            logMessage("StreamElements", `Added ${timeToAdd * amount} Seconds Because ${event.name} Subscribed/Gifted ${amount} Subs (${event.tier})`);
        }

        if (!users.includes(event.name)) {
            users.push(event.name);
        }
    };

    const handleCheerEvent = (event) => {
        if (event.amount >= config.generalTwitchConfig.min_amount_of_bits) {
            let times = Math.floor(event.amount / config.generalTwitchConfig.min_amount_of_bits);
            let timeToAdd = config.generalTwitchConfig.seconds_added_per_bits * times;

            addTime(endingTime, timeToAdd);
            logMessage("StreamElements", `Added ${timeToAdd} Seconds Because ${event.name} Donated ${event.amount} Bits`);

            if (!users.includes(event.name)) {
                users.push(event.name);
            }
        }
    };

    const handleDonationEvent = (event) => {
        if (event.amount >= config.generalTwitchConfig.min_donation_amount) {
            let times = Math.floor(event.amount / config.generalTwitchConfig.min_donation_amount);
            let timeToAdd = config.generalTwitchConfig.seconds_added_per_donation * times;

            addTime(endingTime, timeToAdd);
            logMessage("StreamElements", `Added ${timeToAdd} Seconds Because ${event.name} Donated $${event.amount}`);

            if (!users.includes(event.name)) {
                users.push(event.name);
            }
        }
    };

    const getSubscriptionTime = (tier, config, key) => {
        switch (tier) {
            case "prime":
            case "1000":
                return config[`${key}_tier1`];
            case "2000":
                return config[`${key}_tier2`];
            case "3000":
                return config[`${key}_tier3`];
            default:
                return 0;
        }
    };

    streamElementsConnect();
};
