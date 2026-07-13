import axiosInstance from "./axiosInstance";

const getConfig = () => ({
  headers: {
    Authorization:
      `Bearer ${localStorage.getItem("token")}`
  }
});

export const getUsers = async () => {
  const res = await axiosInstance.get(
    "/users",
    getConfig()
  );

  return res.data;
};

export const createConversation =
  async (receiverId) => {

    const res =
      await axiosInstance.post(
        "/messages/conversation",
        { receiverId },
        getConfig()
      );

    return res.data;
  };

export const getConversations =
  async () => {

    const res =
      await axiosInstance.get(
        "/messages/conversation",
        getConfig()
      );

    return res.data;
  };

export const sendMessageApi =
  async (data) => {

    const isFormData = data instanceof FormData;
    const config = {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`,
        ...(isFormData ? { "Content-Type": "multipart/form-data" } : {})
      }
    };

    const res =
      await axiosInstance.post(
        "/messages",
        data,
        config
      );

    return res.data;
  };

export const getMessages =
  async (id) => {

    const res =
      await axiosInstance.get(
        `/messages/${id}`,
        getConfig()
      );

    return res.data;
  };

export const deleteMessageApi = async (id) => {
  const res = await axiosInstance.delete(`/messages/${id}`, getConfig());
  return res.data;
};

export const updateMessageApi = async (id, text) => {
  const res = await axiosInstance.put(`/messages/${id}`, { text }, getConfig());
  return res.data;
};

export const markSeenApi = async (conversationId) => {
  const res = await axiosInstance.patch(
    `/messages/seen/${conversationId}`,
    {},
    getConfig()
  );
  return res.data;
};