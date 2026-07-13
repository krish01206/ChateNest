import axiosInstance from "./axiosInstance";

export const registerUser = async (data) => {
  const response = await axiosInstance.post(
    "/auth/register",
    data
  );

  return response.data;
};

export const loginUser = async (data) => {
  const response = await axiosInstance.post(
    "/auth/login",
    data
  );

  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get(
    "/auth/me",
    {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post(
    "/auth/logout",
    {},
    {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  return response.data;
};