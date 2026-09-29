import { setupServer } from "msw/node";
import { mswHandlers } from "./msw-handlers.js";

export const mswServer = setupServer(...mswHandlers);
