"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("babel-polyfill");

var _hwTransportWebhid = _interopRequireDefault(require("@ledgerhq/hw-transport-webhid"));

var _hwTransportWebusb = _interopRequireDefault(require("@ledgerhq/hw-transport-webusb"));

var _Qrl = _interopRequireDefault(require("./Qrl"));

/********************************************************************************
 *   QRL Browserify Generation
 *   (c) 2019 The QRL Foundation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
window.Buffer = require("buffer").Buffer;
var transports = [{
  name: "Webhid transport",
  clazz: _hwTransportWebhid["default"]
}, {
  name: "WebUSB transport",
  clazz: _hwTransportWebusb["default"]
}];
window.TransportWebUSB = _hwTransportWebusb["default"];
window.TransportWebHID = _hwTransportWebhid["default"];
window.Qrl = _Qrl["default"];
window.transports = transports;