"use strict";

require("babel-polyfill");

var _hwTransportU2f = require("@ledgerhq/hw-transport-u2f");

var _hwTransportU2f2 = _interopRequireDefault(_hwTransportU2f);

var _hwTransportWebusb = require("@ledgerhq/hw-transport-webusb");

var _hwTransportWebusb2 = _interopRequireDefault(_hwTransportWebusb);

var _Qrl = require("./Qrl");

var _Qrl2 = _interopRequireDefault(_Qrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var transports = [{ name: "U2F transport", clazz: _hwTransportU2f2.default }, { name: "WebUSB transport", clazz: _hwTransportWebusb2.default }];

window.TransportWebUSB = _hwTransportWebusb2.default;

window.Qrl = _Qrl2.default;

window.transports = transports;
//# sourceMappingURL=qrl-web.js.map