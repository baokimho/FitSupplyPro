import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const catalogProxy = serviceProxy(config.catalogServiceUrl, "catalog-service");
