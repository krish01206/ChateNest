import {
  createContext,
  useEffect,
  useState
} from "react";

import { getMe } from "../services/authService";

export const AuthContext =
  createContext();

export const AuthProvider = ({
  children
}) => {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const fetchUser =
      async () => {

        try {

          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            setLoading(false);
            return;
          }

          const data =
            await getMe();

          setUser(data.user);

        }

        catch {

          localStorage.removeItem(
            "token"
          );

        }

        setLoading(false);

      };

    fetchUser();

  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};