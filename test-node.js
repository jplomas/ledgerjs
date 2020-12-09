import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
// import "@babel/polyfill";
import Qrl from "./src/qrl";

async function createTransport() {
  const transport = await TransportNodeHid.create(1000);
  console.log("USING NODEHID");
  const qrl = new Qrl(transport);
  return qrl;
}

go().then(() => {
  console.log("ok");
});

async function go() {
  // await TransportNodeHid.create().then((transport) => {
  //   const qrl = new Qrl(transport);
  //   qrl
  //     .get_version()
  //     .then((data) => {
  //       console.log("> Got Ledger App Version from NodeHID");
  //       console.log(data);
  //       //   // callback()
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // });

const qrl = await createTransport();
    await qrl
      .getAddress()
      .then(async (data) => {
        console.log("> Got Ledger QRL address/public key from NodeHID");
        console.log(data);
        //   // callback()
      })
      .catch((error) => {
        console.log(error);
      });
  
    await qrl
      .get_state()
      .then(async (data) => {
        console.log("> Got Ledger QRL address/public key from NodeHID");
        console.log(data);
        //   // callback()
        
      })
      .catch((error) => {
        console.log(error);
      });

}
