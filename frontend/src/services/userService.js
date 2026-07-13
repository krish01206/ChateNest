import axiosInstance from "./axiosInstance";

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

export const updateProfile = async (data) => {
  const response = await axiosInstance.put("/users/update", data, getConfig());
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axiosInstance.put("/users/password", data, getConfig());
  return response.data;
};

export const uploadProfilePic = async (formData) => {
  const response = await axiosInstance.put("/users/profile-picture", formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};
