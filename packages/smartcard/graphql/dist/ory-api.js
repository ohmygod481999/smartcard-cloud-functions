"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIdentityOry = exports.getUserInfoOry = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const instance = axios_1.default.create({
    baseURL: config_1.ORY_URL,
    timeout: 2000,
    headers: { Authorization: `Bearer ${config_1.ORY_ACCESS_TOKEN}` },
});
const getUserInfoOry = async (userId) => {
    const res = await instance.get(`/admin/identities/${userId}`);
    return res.data;
};
exports.getUserInfoOry = getUserInfoOry;
const deleteIdentityOry = async (userId) => {
    const res = await instance.delete(`/admin/identities/${userId}`);
    return res.data;
};
exports.deleteIdentityOry = deleteIdentityOry;
