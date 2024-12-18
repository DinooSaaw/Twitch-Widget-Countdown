
# Twitch Countdown

This countdown timer was created based on JayexDesigns' template.

## Description

A timer that increases when someone subscribes, gives bits on Twitch, or donates money via StreamLabs or StreamElements.

## Features

- **Subscribes**: Adds time when viewers subscribe on Twitch (supports Prime, Tier 1, Tier 2, and Tier 3 subs).
- **Resubscribes**: Adds time when viewers resubscribe on Twitch.
- **Gift Subscriptions**: Adds time when someone gifts a subscription.
- **Donations**: Adds time when viewers donate money through StreamLabs or StreamElements.
- **Bits**: Adds time when viewers donate bits on Twitch.
- **Persistence**: The timer saves its time, allowing it to resume from where it left off if the timer is closed or reloaded.
- **Dark Theme**: The timer supports dark theme that can be easy be toggle between.
- **Power Hour**: The timer supports power hour increased time added for a hour!

## Add To OBS

To add this countdown timer to OBS follow these steps:

1. Open OBS and add a new **Browser Source**.
2. In the **URL** field, point it to the location of the `index.html` file.

## Customization

You can customize the timer, color scheme, and more by modifying the `config.js` and `style.css` files.

You can customize the celebration sound effect by changing the file or removing the file

## Twitch Chat Commands

Here are some chat commands that can interact with the timer (use the prefix defined in the config, e.g., `!` is used in this example):

- **addtime [amount]**: Adds the specified amount of time to the countdown timer (in seconds).
  - Example: `!addtime 60` (adds 60 seconds).

- **removetime [amount]**: Removes the specified amount of time from the countdown timer (in seconds).
  - Example: `!removetime 30` (removes 30 seconds).

- **reset**: Resets the timer to the defined amount in the config.
  - Example: `!reset` (resets timer to the default 6 hours, or the value specified in the config).

- **pause**: Resets the timer to the defined amount in the config.
  - Example: `!pause` (pause timer once unpaused it will correct with corrected time if desync occurs).

- **toggletheme**: Toggles the theme between Light or Dark.
  - Example: `!toggletheme` (Toggles the theme).

- **powerhour**: Toggles the powerhour.
  - Example: `!powerhour` (Toggles the power hour).
