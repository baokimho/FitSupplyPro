import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const inventoryProxy = serviceProxy(config.inventoryServiceUrl, "inventory-service");
