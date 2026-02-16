import axios from "axios";
import { getToken } from "./auth";

export const usersApi = axios.create({
  baseURL: import.meta.env.VITE_USERS_BASE_URL || "/api/users",
});

export const walletApi = axios.create({
  baseURL: import.meta.env.VITE_WALLET_BASE_URL || "/api/wallet",
});

const attachToken = (config: import("axios").InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

usersApi.interceptors.request.use(attachToken);
walletApi.interceptors.request.use(attachToken);
