import { api } from "./api";

export const getPendingTriage = () =>
  api.get("/triage/pending");
