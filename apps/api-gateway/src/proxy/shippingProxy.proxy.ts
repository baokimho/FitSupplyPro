import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const shippingProxy = serviceProxy(config.shippingServiceUrl, "shipping-service");
