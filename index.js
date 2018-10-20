const mqttusvc = require("mqtt-usvc");
const queue = require("queue");
const { create: createController } = require("./controller");

const service = mqttusvc.create();
const { devices } = service.config;
const controllers = devices.reduce((obj, d) => {
  obj[d.id] = createController(d.host, d.mac);
  return obj;
}, {});

let q;

service.on("message", (topic, data) => {
  // console.log(topic, data);
  const [_, deviceId] = topic.split("/");
  const controller = controllers[deviceId];
  if (!controller) return;

  if (topic.startsWith("learn/")) {
    addToQueue(learnCommand(controller));
  }
  if (topic.startsWith("send/")) {
    addToQueue(sendCommand(controller, data));
  }
});

service.subscribe("learn/+");
service.subscribe("send/+");

function learnCommand(controller) {
  return async function() {
    console.log("Learning...");
    // const code = await learn();
    // service.send("learned", code);
    // console.log("Learned", code);
  };
}

function sendCommand(controller, code) {
  return async function() {
    console.log("Sending", code);
    controller.emitIR(code);
  };
}

async function addToQueue(fn) {
  if (q) {
    q.push(fn);
    return;
  }

  q = queue({ concurrency: 1 });
  q.push(fn);
  q.start(err => {
    q = undefined;
  });
}

function learn() {
  return new Promise(async (resolve, reject) => {
    resolve(null);
  });
}
