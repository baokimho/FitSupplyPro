import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const orderProxy = serviceProxy(config.orderServiceUrl, "order-service");
