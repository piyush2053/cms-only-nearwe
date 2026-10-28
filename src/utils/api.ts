import axios from "axios";
import { getToken, setToken } from "./function";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://192.168.29.140:5010" : "");

axios.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    return Promise.reject(
      new Error("VITE_API_BASE_URL must be configured before using CMS APIs.")
    );
  }

  config.baseURL = API_BASE_URL;
  return config;
});


export const core_services = {
  // Login API
  loginUser: async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const token = response.data.token;
      if (token) {
        setToken(token);
      }

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  // Get Logged-in User (Profile)
  getUser: async () => {
    try {
      const token = getToken();
      const users: any[] = [];
      const limit = 50;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${API_BASE_URL}/user`, {
          params: { page, limit },
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = response.data;
        const pageUsers = Array.isArray(data)
          ? data
          : data?.users ?? data?.data ?? data?.results;

        if (!Array.isArray(pageUsers)) {
          throw new Error("Invalid users response");
        }

        users.push(...pageUsers);

        const pagination = data?.pagination;
        const totalPages = data?.totalPages ?? pagination?.totalPages;
        const total = data?.total ?? pagination?.total;
        const explicitHasMore = typeof data?.hasMore === "boolean"
          ? data.hasMore
          : typeof pagination?.hasMore === "boolean"
            ? pagination.hasMore
            : undefined;

        if (!pageUsers.length) {
          hasMore = false;
        } else if (explicitHasMore !== undefined) {
          hasMore = explicitHasMore;
        } else if (totalPages != null && Number.isFinite(Number(totalPages))) {
          hasMore = page < Number(totalPages);
        } else if (total != null && Number.isFinite(Number(total))) {
          hasMore = page * limit < Number(total);
        } else {
          hasMore = pageUsers.length === limit;
        }
        page += 1;
      }

      return users;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  // Register API
  registerUser: async ({
    username,
    email,
    password,
    location,
  }: {
    username: string;
    email: string;
    password: string;
    location: string;
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          username,
          email,
          password,
          location,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get All Events
  getAllEvents: async () => {
    try {
      const token = getToken();
      const events: any[] = [];
      const limit = 50;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${API_BASE_URL}/events`, {
          params: { page, limit },
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        // The API now returns { events, page, hasMore }; accept the old array
        // response too so the CMS remains compatible during a rolling deploy.
        const data = response.data;
        const pageEvents = Array.isArray(data) ? data : data?.events;
        if (!Array.isArray(pageEvents)) {
          throw new Error("Invalid events response");
        }

        events.push(...pageEvents);
        hasMore = !Array.isArray(data) && data.hasMore === true && pageEvents.length > 0;
        page += 1;
      }

      return events;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create Event
  createEvent: async (eventData: {
    eventTitle: string;
    eventDesc: string;
    categoryId: string;
    location: string;
    userId: string;
    eventTime: string;
  }) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/events`, eventData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update Event by ID
  updateEvent: async (
    eventId: string,
    eventData: {
      eventTitle: string;
      eventDesc: string;
      categoryId: string;
      location: string;
      userId: string;
      eventTime: string;
    }
  ) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE_URL}/events/${eventId}`,
        eventData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get Event by ID
  getEventById: async (eventId: any) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getCategories: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/event-category`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  createMessage: async (messageData: {
    eventId: any;
    userId: any;
    messageText: any;
  }) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/message`,
        messageData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update Message by ID
  updateMessage: async (
    messageId: string,
    messageData: {
      eventId: string;
      userId: string;
      messageText: string;
    }
  ) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE_URL}/message/${messageId}`,
        messageData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get Messages By Event ID
  getMessagesByEvent: async (eventId: any) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/message/${eventId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete Message
  deleteMessage: async (messageId: string, userId: string) => {
    try {
      const token = getToken();
      const response = await axios.delete(
        `${API_BASE_URL}/message/${messageId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          data: { userId }, // DELETE with body
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getEventAttendees: async (eventId: any) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/event-attender/${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  addEventAttender: async ({
    eventId,
    userId,
  }: {
    eventId: any;
    userId: any;
  }) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/event-attender`,
        { eventId, userId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getAlleventsJoinedbyUser: async (userId: string) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/event-attender/user/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getParticipants: async (eventId: string) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/event-attender/${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  deleteEvent: async (eventId: string) => {
    try {
      const token = getToken();

      const response = await axios.delete(
        `${API_BASE_URL}/events/${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getCategoryById: async (categoryId: string) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/event-category/${categoryId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create Category
  createCategory: async (data: {
    categoryName: string;
    categoryDesc: string;
  }) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/event-category`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update Category
  updateCategory: async (
    categoryId: string,
    data: {
      categoryName: string;
      categoryDesc: string;
    }
  ) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE_URL}/event-category/${categoryId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete Category
  deleteCategory: async (categoryId: string) => {
    try {
      const token = getToken();
      const response = await axios.delete(
        `${API_BASE_URL}/event-category/${categoryId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  sendPushNotification: async ({
    userIds,
    title,
    body,
    data,
  }: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/expo/send-push`,
        {
          userIds,
          title,
          body,
          data,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  // ================= BANNERS =================

  // Get all banners (CMS)
  getAllBanners: async () => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_BASE_URL}/banners`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create banner
  createBanner: async (formData: FormData) => {
    try {
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/banners`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
          transformRequest: [(data) => data], // 🔥 IMPORTANT
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update banner
  updateBanner: async (id: string, data: any) => {
    try {
      const token = getToken();

      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "image" && data.image?.file) {
          formData.append(
            "image",
            data.image.file.originFileObj
          );
        } else {
          formData.append(key, data[key]);
        }
      });

      const response = await axios.put(
        `${API_BASE_URL}/banners/${id}`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            // ❌ DON'T manually set Content-Type
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete banner
  deleteBanner: async (id: string) => {
    try {
      const token = getToken();

      const response = await axios.delete(
        `${API_BASE_URL}/banners/${id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle banner
  toggleBanner: async (id: string) => {
    try {
      const token = getToken();

      const response = await axios.patch(
        `${API_BASE_URL}/banners/${id}/toggle`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getReports: async () => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_BASE_URL}/report`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
},

  getWayyoDownloadStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/downloads/wayyo/stats`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  registerWayyoDownloadClick: async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/downloads/wayyo/click`,
        {},
        {
          headers: { "Content-Type": "application/json" },
          timeout: 1500,
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
