const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const logMessage = (module, message) => {
    console.log(`{${getTimestamp()}}: [${module}]: ${message}`);
};

const logObject = (module, object) => {
    console.log(`{${getTimestamp()}}: [${module}]: `, object);
};

const getTimestamp = () => {
    try {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("Error occurred while getting timestamp:", error);
      return "!00:00:00";
    }
  };