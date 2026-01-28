import { api } from "./api";

export const getVisits = () => api.get("/visits");
