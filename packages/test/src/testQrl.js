import Qrl from "@ledgerhq/hw-app-qrl";

export default async transport => {
  const qrl = new Qrl(transport);
  const result = await qrl.getAppConfiguration();
  return result;
};
