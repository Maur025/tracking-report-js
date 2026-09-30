import { getEventNotificationHandler } from "./event-notification-handler.js";

/**
 * @type {import("msw").HttpHandler[]}
 */
export const mswHandlers = [getEventNotificationHandler()];
