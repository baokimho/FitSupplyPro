import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const cartProxy = serviceProxy(config.cartServiceUrl, "cart-service");
