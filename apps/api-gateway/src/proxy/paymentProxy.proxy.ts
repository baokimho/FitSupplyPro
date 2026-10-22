import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const paymentProxy = serviceProxy(config.paymentServiceUrl, "payment-service");
