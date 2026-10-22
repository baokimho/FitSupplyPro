import { config } from "../config/index.js";
import { serviceProxy } from "./serviceProxy.js";

export const notificationProxy = serviceProxy(config.notificationServiceUrl, "notification-service");
