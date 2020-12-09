"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _walletHelpers = _interopRequireDefault(require("@theqrl/wallet-helpers"));

/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2017-2018 Ledger
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
//     
// import Transport from "@ledgerhq/hw-transport";
// import {
//   splitPath,
//   foreach,
//   encodeEd25519PublicKey,
//   verifyEd25519Signature,
//   checkStellarBip32Path,
//   hash
// } from "./utils";

/* Constants */
var CLA = 0x77; // Instructions

var INS_VERSION = 0x00;
var INS_GETSTATE = 0x01;
var INS_PUBLIC_KEY = 0x03;
var INS_SIGN = 0x04;
var INS_SIGN_NEXT = 0x05;
var INS_SETIDX = 0x06;
var INS_VIEW_ADDRESS = 0x07; // Test instructions

/* These instructions are only enabled in test mode */

var INS_TEST_PK_GEN_1 = 0x80;
var INS_TEST_PK_GEN_2 = 0x81;
var INS_TEST_CALC_PK = 0x82;
var INS_TEST_WRITE_LEAF = 0x83;
var INS_TEST_READ_LEAF = 0x84;
var INS_TEST_KEYGEN = 0x85;
var INS_TEST_DIGEST = 0x86;
var INS_TEST_SETSTATE = 0x87;
var INS_TEST_COMM = 0x88; // APDU ERRORS

var APDU_ERROR_CODE_OK = "9000";
var QRLTX_TX = 0;
var QRLTX_TXTOKEN = 1;
var QRLTX_SLAVE = 2;
var QRLTX_MESSAGE = 3; // Based on https=//github.com/ZondaX/ledger-qrl-app/src/lib/qrl_types.

var P_TX_ADDRESS_SIZE = 39;
var P_TX_MAX_MESSAGE_SIZE = 80;
var P_TX_TYPE = 0;
var P_TX_NUM_DEST = 1;
var P_TX_SRC_ADDR = 2;
var P_TX_SRC_FEE = 41;
var P_TX_DEST = 49;

function concatenateTypedArrays(resultConstructor) {
  var totalLength = 0;

  for (var _len = arguments.length, arrays = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    arrays[_key - 1] = arguments[_key];
  }

  for (var _i = 0, _arrays = arrays; _i < _arrays.length; _i++) {
    var arr = _arrays[_i];
    totalLength += arr.length;
  }

  var result = new resultConstructor(totalLength);
  var offset = 0;

  for (var _i2 = 0, _arrays2 = arrays; _i2 < _arrays2.length; _i2++) {
    var _arr = _arrays2[_i2];
    result.set(_arr, offset);
    offset += _arr.length;
  }

  return result;
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), function (x) {
    return ("00" + x.toString(16)).slice(-2);
  }).join("");
}

function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
  }

  return hex.join("");
}

function errorHandling(response) {
  var e = response; // backwards compatibility

  e.return_code = response.statusCode;
  e.error_message = response.statusText;
  return e;
}
/**
 * Quantum Resistant Ledger API
 *
 * @example
 * import Qrl from "@ledgerhq/hw-app-qrl";
 * const str = new Qrl(transport)
 */


var Qrl = /*#__PURE__*/function () {
  function Qrl(transport) {
    var scrambleKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "QRL";
    (0, _classCallCheck2["default"])(this, Qrl);
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["get_version", "get_state", "publickey", "viewAddress", "setIdx", "signSend", "signNext", "retrieveSignature", "createTx", "createMessageTx", "getAddress"], scrambleKey);
  }

  (0, _createClass2["default"])(Qrl, [{
    key: "get_version",
    value: function get_version() {
      return this.transport.send(CLA, INS_VERSION, 0x00, 0x00).then(function (response) {
        var version = "" + response[1] + "." + response[2] + "." + response[3];
        return {
          version: version
        };
      }, // failed to get version
      function (response) {
        return errorHandling(response);
      });
    }
  }, {
    key: "get_state",
    value: function get_state() {
      return this.transport.send(CLA, INS_GETSTATE, 0, 0).then(function (apduResponse) {
        var result = {};
        result["state"] = apduResponse[0]; // 0 - Not ready, 1 - generating keys, 2 = ready

        result["xmss_index"] = apduResponse[2] + apduResponse[1] * 256;
        return result;
      }, // failed to get state
      function (response) {
        return errorHandling(response);
      });
    }
  }, {
    key: "publickey",
    value: function publickey() {
      return this.transport.send(CLA, INS_PUBLIC_KEY).then(function (apduResponse) {
        var result = {};
        result["public_key"] = apduResponse.slice(0, apduResponse.length - 2);
        return result;
      }, function (response) {
        return errorHandling(response);
      });
    }
  }, {
    key: "viewAddress",
    value: function viewAddress() {
      return this.transport.send(CLA, INS_VIEW_ADDRESS, 0, 0).then(function (apduResponse) {
        return apduResponse;
      }, function (response) {
        return errorHandling(response);
      });
    }
  }, {
    key: "setIdx",
    value: function setIdx(idx) {
      if (idx < 0 || idx > 255) {
        var result = {};
        result["return_code"] = 0x6984;
        result["error_message"] = "Data is invalid";
        return result;
      }

      var idxBuffer = Buffer.alloc(1);
      idxBuffer.writeUInt8(idx);
      return this.transport.send(CLA, INS_SETIDX, 0, 0, idxBuffer).then(function (apduResponse) {
        return apduResponse;
      }, function (response) {
        return errorHandling(response);
      });
    }
  }, {
    key: "signSend",
    value: function () {
      var _signSend = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(message) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", this.transport.send(CLA, INS_SIGN, 0, 0, message).then(function (apduResponse) {
                  return apduResponse;
                }, function (response) {
                  return errorHandling(response);
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function signSend(_x) {
        return _signSend.apply(this, arguments);
      }

      return signSend;
    }()
  }, {
    key: "createTx",
    value: function createTx(source_address, fee, dest_addresses, dest_amounts) {
      // https://github.com/theqrl/ledger-qrl-app/src/lib/qrl_types.h
      // Verify that sizes are valid
      if (source_address.length !== P_TX_ADDRESS_SIZE) {
        throw Error("Source address length invalid");
      }

      if (fee.length !== 8) {
        throw Error("fee should be 8 bytes");
      }

      if (dest_addresses.length !== dest_amounts.length) {
        throw Error("dest addresses and amount should have the same number of items");
      }

      if (dest_addresses.length > 3) {
        throw Error("maximum supported number of destinations is 3");
      }

      for (var i = 0; i < dest_addresses.length; i++) {
        if (dest_addresses[i].length !== P_TX_ADDRESS_SIZE) {
          throw Error("Destination address length invalid");
        }

        if (dest_amounts[i].length !== 8) {
          throw Error("each dest_amount should be 8 bytes");
        }
      } // Define buffer size


      var num_dest = dest_addresses.length;
      var tx = Buffer.alloc(2 + 47 * (1 + num_dest));
      tx[P_TX_TYPE] = QRLTX_TX;
      tx[P_TX_NUM_DEST] = num_dest;
      source_address.copy(tx, P_TX_SRC_ADDR);
      fee.copy(tx, P_TX_SRC_FEE);
      var offset = P_TX_DEST;

      for (var _i3 = 0; _i3 < dest_addresses.length; _i3++) {
        dest_addresses[_i3].copy(tx, offset);

        offset += P_TX_ADDRESS_SIZE;

        dest_amounts[_i3].copy(tx, offset);

        offset += 8;
      }

      return tx;
    }
  }, {
    key: "createMessageTx",
    value: function createMessageTx(source_address, fee, message) {
      // https://github.com/ZondaX/ledger-qrl-app/src/lib/qrl_types.h
      // Verify that sizes are valid
      if (source_address.length !== P_TX_ADDRESS_SIZE) {
        throw Error("Source address length invalid");
      }

      if (fee.length !== 8) {
        throw Error("fee should be 8 bytes");
      }

      if (message.length > P_TX_MAX_MESSAGE_SIZE) {
        throw Error("Message length exceed maximum size");
      } // Define buffer size


      var messageLength = message.length;
      var tx = Buffer.alloc(2 + 47 + messageLength);
      tx[P_TX_TYPE] = QRLTX_MESSAGE;
      tx[P_TX_NUM_DEST] = messageLength;
      source_address.copy(tx, P_TX_SRC_ADDR);
      fee.copy(tx, P_TX_SRC_FEE);
      message.copy(tx, 49);
      return tx;
    }
  }, {
    key: "retrieveSignature",
    value: function () {
      var _retrieveSignature = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(transaction) {
        var myqrl;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.transport._appAPIlock = false;
                myqrl = this;
                return _context3.abrupt("return", this.signSend(transaction).then( /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(resultSign) {
                    var response, apduResponse, signature, result, i;
                    return _regenerator["default"].wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (!(resultSign.name === "TransportStatusError")) {
                              _context2.next = 3;
                              break;
                            }

                            // maintain backwards compatibility with error reporting
                            resultSign.return_code = 27014;
                            return _context2.abrupt("return", resultSign);

                          case 3:
                            response = {};
                            apduResponse = Buffer.from(resultSign, "hex");
                            response["return_code"] = apduResponse;
                            response["error_message"] = resultSign.error_message;
                            response["signature"] = null;

                            if (!(buf2hex(response.return_code) === APDU_ERROR_CODE_OK)) {
                              _context2.next = 28;
                              break;
                            }

                            signature = new Uint8Array();
                            result = {};
                            i = 0;

                          case 12:
                            if (!(i < 11)) {
                              _context2.next = 25;
                              break;
                            }

                            _context2.next = 15;
                            return myqrl.signNext();

                          case 15:
                            result = _context2.sent;

                            if (!(buf2hex(result.return_code) !== APDU_ERROR_CODE_OK)) {
                              _context2.next = 20;
                              break;
                            }

                            response["return_code"] = result.return_code;
                            response["error_message"] = result.error_message;
                            return _context2.abrupt("break", 25);

                          case 20:
                            signature = concatenateTypedArrays(Uint8Array, signature, result.signature_chunk);
                            response = result;

                          case 22:
                            i++;
                            _context2.next = 12;
                            break;

                          case 25:
                            response["return_code"] = result.return_code;
                            response["error_message"] = result.error_message;
                            response["signature"] = signature;

                          case 28:
                            delete response["signature_chunk"];
                            return _context2.abrupt("return", response);

                          case 30:
                          case "end":
                            return _context2.stop();
                        }
                      }
                    }, _callee2);
                  }));

                  return function (_x3) {
                    return _ref.apply(this, arguments);
                  };
                }()));

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function retrieveSignature(_x2) {
        return _retrieveSignature.apply(this, arguments);
      }

      return retrieveSignature;
    }()
  }, {
    key: "signNext",
    value: function () {
      var _signNext = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", this.transport.send(CLA, INS_SIGN_NEXT).then(function (apduResponse) {
                  var apduR = Buffer.from(apduResponse, "hex");
                  var error_code_data = apduR.slice(-2);
                  var result = {};
                  result["signature_chunk"] = apduR.slice(0, apduR.length - 2);
                  result["return_code"] = error_code_data;
                  result["error_message"] = 0x77;
                  return result;
                }, function (response) {
                  return errorHandling(response);
                }));

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function signNext() {
        return _signNext.apply(this, arguments);
      }

      return signNext;
    }()
  }, {
    key: "getAddress",
    value: function () {
      var _getAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(verify) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", this.transport.send(CLA, INS_PUBLIC_KEY).then(function (apduResponse) {
                  var result = {};
                  var epk = apduResponse.slice(0, apduResponse.length - 2);
                  result["publicKey"] = bytesToHex(epk);
                  result["address"] = _walletHelpers["default"].QRLAddressFromEPKHex(bytesToHex(epk));
                  result["chainCode"] = undefined;
                  return result;
                }, function (response) {
                  return errorHandling(response);
                }));

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function getAddress(_x4) {
        return _getAddress.apply(this, arguments);
      }

      return getAddress;
    }() // getAddress(path, verify, askChainCode): Promise<{
    //   result: object
    // }> {
    //   return this.transport.send(
    //     CLA, INS_PUBLIC_KEY).then(
    //         apduResponse => {
    //             var result = {};
    //             var epk = apduResponse.slice(0, apduResponse.length - 2);
    //             result.address = helpers.QRLAddressFromEPKHex(epk);
    //             return result;
    //         },
    //         response => errorHandling(response)
    //         );
    // };

  }]);
  return Qrl;
}();

exports["default"] = Qrl;

function newQrlApp(transport) {
  return new Qrl(transport);
}

module.exports = {
  newQrlApp: newQrlApp
};