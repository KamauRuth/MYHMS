import { api } from "./api";

/**
 * Fetch all hospital departments
 */
export const getDepartments = async () => {
  const response = await api.get("/departments");
  return response;
};
