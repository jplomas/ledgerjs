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
const APDU_ERROR_CODE_OK = "9000";

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

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ("00" + x.toString(16)).slice(-2)).join("");
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
      ["get_version", "get_state", "publickey", "viewAddress", "setIdx"],
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
  }

  viewAddress(): Promise<{
    result: object
  }> {
    return this.transport.send(
      CLA, INS_VIEW_ADDRESS, 0, 0
    ).then(
      apduResponse => {
        return apduResponse;
      },
      response => errorHandling(response)
    );
  }

  setIdx(idx: number): Promise<{
    result: object
  }> {
    if (idx < 0 || idx > 255) {
      let result = {};
      result["return_code"] = 0x6984;
      result["error_message"] = "Data is invalid";
      return result;
    }
    const idxBuffer = Buffer.alloc(1);
    idxBuffer.writeUInt8(idx);
    return this.transport.send(
      CLA, INS_SETIDX, 0, 0, idxBuffer
    ).then(
      apduResponse => {
        return apduResponse;
      },
      response => errorHandling(response)
    );
  }

  signSend(message): Promise<{
    result: object
  }> {
    return this.transport.send(
      CLA, INS_SIGN, 0, 0, message).then(
      apduResponse => {
        return apduResponse;
      },
      response => errorHandling(response)
    );
  };

  createTx(source_address, fee, dest_addresses, dest_amounts): Promise<{
    result: object
  }> {
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

      for (let i = 0; i < dest_addresses.length; i++) {
          if (dest_addresses[i].length !== P_TX_ADDRESS_SIZE) {
              throw Error("Destination address length invalid");
          }
          if (dest_amounts[i].length !== 8) {
              throw Error("each dest_amount should be 8 bytes");
          }
      }

      // Define buffer size
      var num_dest = dest_addresses.length;
      let tx = Buffer.alloc(2 + 47 * (1 + num_dest));

      tx[P_TX_TYPE] = QRLTX_TX;
      tx[P_TX_NUM_DEST] = num_dest;

      source_address.copy(tx, P_TX_SRC_ADDR);
      fee.copy(tx, P_TX_SRC_FEE);

      let offset = P_TX_DEST;
      for (let i = 0; i < dest_addresses.length; i++) {
          dest_addresses[i].copy(tx, offset);
          offset += P_TX_ADDRESS_SIZE;
          dest_amounts[i].copy(tx, offset);
          offset += 8;
      }

      return tx;
  };

  createMessageTx(source_address, fee, message): Promise<{
    result: object
  }> {
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
      }

      // Define buffer size
      let messageLength = message.length;
      let tx = Buffer.alloc(2 + 47 + (messageLength));

      tx[P_TX_TYPE] = QRLTX_MESSAGE;
      tx[P_TX_NUM_DEST] = messageLength;

      source_address.copy(tx, P_TX_SRC_ADDR);
      fee.copy(tx, P_TX_SRC_FEE);
      message.copy(tx, 49);

      return tx;
  };

  retrieveSignature(transaction): Promise<{
    result: object
  }> {
      let myqrl = this;
      return myqrl.signSend(transaction).then(async function (resultSign) {
          if (resultSign.name === "TransportStatusError") {
            // maintain backwards compatibility with error reporting
            resultSign.return_code = 27014;
            return resultSign;
          }
          let response = {};
          const apduResponse = Buffer.from(resultSign, "hex");
          response["return_code"] = apduResponse;
          response["error_message"] = resultSign.error_message; // FIXME
          response["signature"] = null;

          if (buf2hex(response.return_code) === APDU_ERROR_CODE_OK) {
              let signature = new Uint8Array();
              let result = {};
              for (let i = 0; i < 11; i++) {
                  result = await myqrl.signNext();
                  if (buf2hex(result.return_code) !== APDU_ERROR_CODE_OK) {
                      response["return_code"] = result.return_code;
                      response["error_message"] = result.error_message;
                      break;
                  }

                  signature = concatenateTypedArrays(
                      Uint8Array,
                          signature,
                          result.signature_chunk
                  );
                  response = result;
              }
              response["return_code"] = result.return_code;
              response["error_message"] = result.error_message;
              response["signature"] = signature;
          }
          delete response["signature_chunk"];
          return response;
      });
  };

  signNext(): Promise<{
    result: object
  }> {
      return this.transport.send(
        CLA, INS_SIGN_NEXT).then(
        apduResponse => {
          const apduR = Buffer.from(apduResponse, "hex");
          let error_code_data = apduR.slice(-2);
          let result = {};
          result["signature_chunk"] = apduR.slice(0, apduR.length - 2);
          result["return_code"] = error_code_data;
          result["error_message"] = 0x00; // FIXME
          return result;
        },
        response => errorHandling(response)
      );
  };

}
