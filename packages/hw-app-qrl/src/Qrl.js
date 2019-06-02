/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2017-2018 Ledger
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
//@flow

import type Transport from "@ledgerhq/hw-transport";
// import {
//   splitPath,
//   foreach,
//   encodeEd25519PublicKey,
//   verifyEd25519Signature,
//   checkStellarBip32Path,
//   hash
// } from "./utils";

/* Constants */
const CLA = 0x77;

// Instructions
const INS_VERSION = 0x00;
const INS_GETSTATE = 0x01;
const INS_PUBLIC_KEY = 0x03;
const INS_SIGN = 0x04;
const INS_SIGN_NEXT = 0x05;
const INS_SETIDX = 0x06;
const INS_VIEW_ADDRESS = 0x07;

// Test instructions
/* These instructions are only enabled in test mode */
const INS_TEST_PK_GEN_1 = 0x80;
const INS_TEST_PK_GEN_2 = 0x81;
const INS_TEST_CALC_PK = 0x82;
const INS_TEST_WRITE_LEAF = 0x83;
const INS_TEST_READ_LEAF = 0x84;
const INS_TEST_KEYGEN = 0x85;
const INS_TEST_DIGEST = 0x86;
const INS_TEST_SETSTATE = 0x87;
const INS_TEST_COMM = 0x88;

// APDU ERRORS
const APDU_ERROR_CODE_OK = 0x9000;

const QRLTX_TX = 0;
const QRLTX_TXTOKEN = 1;
const QRLTX_SLAVE = 2;
const QRLTX_MESSAGE = 3;

// Based on https=//github.com/ZondaX/ledger-qrl-app/src/lib/qrl_types.
const P_TX_ADDRESS_SIZE = 39;
const P_TX_MAX_MESSAGE_SIZE = 80;

const P_TX_TYPE = 0;
const P_TX_NUM_DEST = 1;
const P_TX_SRC_ADDR = 2;
const P_TX_SRC_FEE = 41;
const P_TX_DEST = 49;

function serialize(CLA, INS, p1 = 0, p2 = 0, data = null) {
    var size = 5;
    if (data != null) {
        if (data.length > 255) {
            throw new Error('maximum data size = 255');
        }
        size += data.length
    }

    var buffer = Buffer.alloc(size);
    buffer[0] = CLA;
    buffer[1] = INS;
    buffer[2] = p1;
    buffer[3] = p2;
    buffer[4] = 0;

    if (data != null) {
        buffer[4] = data.length;
        buffer.set(data, 5);
    }

    return buffer;
}

function concatenateTypedArrays (resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
      totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
}

function errorHandling(response) {
  let e = response;
  // backwards compatibility
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
export default class Qrl {
  transport: Transport<*>;

  constructor(transport: Transport<*>, scrambleKey: string = "QRL") {
    this.transport = transport;
    transport.decorateAppAPIMethods(
      this,
      ["get_version", "get_state"],
      scrambleKey
    );
  }

  get_version(): Promise<{
    version: string
  }> {
    return this.transport.send(
      CLA, INS_VERSION, 0x00, 0x00
      ).then(function (response) {
      let version = "" + response[1] + "." + response[2] + "." + response[3];
      return {
        version: version
      };
    },
    // failed to get version
    response => errorHandling(response)
    );
  }

  get_state(): Promise<{
    result: object
  }> {
    return this.transport.send(
      CLA, INS_GETSTATE, 0, 0
        ).then(
          apduResponse => {
            // console.log(apduResponse);
            var result = {};
            result["state"] = apduResponse[0]; // 0 - Not ready, 1 - generating keys, 2 = ready
            result["xmss_index"] = apduResponse[2] + apduResponse[1] * 256;
            return result;
           },
           // failed to get state
           response => errorHandling(response)
        );
  }

  publickey(): Promise<{
    result: object
  }> {
    return this.transport.send(
      CLA, INS_PUBLIC_KEY).then(
          apduResponse => {
              var result = {};
              result["public_key"] = apduResponse.slice(0, apduResponse.length - 2);
              return result;
          },
          response => errorHandling(response)
          );
  };

}
