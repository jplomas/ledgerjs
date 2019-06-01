import "babel-polyfill";

import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Qrl from "./packages/hw-app-qrl/lib/Qrl";

window.Buffer = require("buffer").Buffer;

const transports = [
  { name: "U2F transport", clazz: TransportU2F },
  { name: "WebUSB transport", clazz: TransportWebUSB },
];

window.TransportWebUSB = TransportWebUSB;

window.Qrl = Qrl;

window.transports = transports;

window.device = device;