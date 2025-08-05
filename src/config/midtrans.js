import midtransClient from "midtrans-client";
import { config } from "../app/config.js";

const midtransCoreApi = new midtransClient.CoreApi({
  isProduction: false,
  clientKey: config.midtransClientKey,
  serverKey: config.midtransServerKey,
});

export { midtransCoreApi };
