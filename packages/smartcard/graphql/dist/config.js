"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORY_ACCESS_TOKEN = exports.ORY_URL = void 0;
require("dotenv");
exports.ORY_URL = process.env.ORY_SDK_URL;
exports.ORY_ACCESS_TOKEN = process.env.ORY_ACCESS_TOKEN;
