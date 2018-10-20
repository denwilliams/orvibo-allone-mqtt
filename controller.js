const Orvibo = require("node-orvibo");

// NOTE: major flaw in node-orvibo's design is that you can't un-listen or dispose!
// It actually calls socket.bind on a static object shared between all orvibo
// instances, and this socket is shared between all.
// So, we will call listen on an Orvibo instance, then dispose immediately.
// The static socket will still be bound to and listening in the background.
// Note: this will still cause memory leaks as the constructor calls .on
// and there is no way to call removeListener, so every "new Orvibo" will
// stay resident in memory forever!
// NOTE: you also cannot use the same Orvibo instance forever. It stops working
// after a while, calling subscribe again does nothing. Calling listen again throws
// and address in use error. Creating a new Orvibo instance works.
new Orvibo().listen();

class Controller {
  constructor(ip, mac) {
    this.ip = ip;
    this.mac = mac;

    this.device = {
      icon: "00",
      ip: ip,
      macAddress: mac,
      macPadding: "202020202020",
      name: "Allone",
      password: "888888",
      type: "AllOne"
    };

    // Add the device then dispose. We will create a new instance each call.
    new Orvibo().addDevice(this.device);
  }

  emitIR(irCode) {
    if (!irCode) {
      console.log("No IRCode provided");
      return;
    }
    // Note: because of the way node-orvibo works this will cause memory leaks
    var orvibo = new Orvibo();

    const subcribeHandler = _device => {
      if (this.device.macAddress !== _device.macAddress) return;
      orvibo.removeListener("subscribed", subcribeHandler);
      orvibo.emitIR(this.device, irCode);
      orvibo = null;
    };
    orvibo.on("subscribed", subcribeHandler);
    orvibo.subscribe(this.device);
  }
}

exports.create = (host, mac) => {
  return new Controller(host, mac);
};
