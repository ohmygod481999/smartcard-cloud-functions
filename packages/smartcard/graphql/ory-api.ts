import axios from "axios";
import { ORY_ACCESS_TOKEN, ORY_URL } from "./config";

const instance = axios.create({
    baseURL: ORY_URL,
    timeout: 2000,
    headers: { Authorization: `Bearer ${ORY_ACCESS_TOKEN}` },
});

export const getUserInfoOry = async (userId: string) => {
    const res = await instance.get(`/admin/identities/${userId}`);
    return res.data;
};

export const deleteIdentityOry = async (userId: string) => {
    const res = await instance.delete(`/admin/identities/${userId}`);
    return res.data;
};
