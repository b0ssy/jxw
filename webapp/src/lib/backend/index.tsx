import React, { createContext, useContext, useCallback, useMemo } from "react";
import axios, { AxiosError, AxiosInstance } from "axios";

import { Configuration, AuthApi, ChatApi } from "./api";
import { isJsonMime } from "../utils";

export type ResponseError = AxiosError<{ code: string; message: string }>;

export interface BackendProps {
  baseUrl?: string;
  accessToken?: string;
  children: React.ReactNode;
}

// Holds the core backend context
export function Backend(props: BackendProps) {
  // Create axios instance
  const createAxiosInstance = useCallback(
    (options?: { ignoreAccessToken?: boolean }) => {
      const axiosInstance = axios.create();
      const accessToken = props.accessToken;

      // Intercept request
      axiosInstance.interceptors.request.use((config) => {
        // Remove url double slash prefix
        // This is to fix the bug where base url === "/" causing redirect to localhost
        if (config.url?.startsWith("//")) {
          config.url = config.url.slice(1);
        }

        // Inject access token
        if (!options?.ignoreAccessToken && accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      });

      return axiosInstance;
    },
    [props.accessToken]
  );

  // Create API configuration
  const createApiConfiguration = useCallback(
    (options?: { ignoreAccessToken?: boolean }) => {
      const config: Configuration = {
        isJsonMime,
        basePath: props.baseUrl || undefined,
        accessToken: !options?.ignoreAccessToken
          ? props.accessToken || undefined
          : undefined,
      };
      return config;
    },
    [props.baseUrl, props.accessToken]
  );

  return (
    <BackendContext.Provider
      value={{
        baseUrl: props.baseUrl,
        createAxiosInstance,
        createApiConfiguration,
      }}
    >
      {props.children}
    </BackendContext.Provider>
  );
}

// Hook to access backend related data
export function useBackend() {
  const { createAxiosInstance, createApiConfiguration } =
    useContext(BackendContext);

  // Create auth api
  const createAuthApi = useCallback(() => {
    return new AuthApi(
      createApiConfiguration(),
      undefined,
      createAxiosInstance()
    );
  }, [createApiConfiguration, createAxiosInstance]);

  // Create chat api
  const createChatApi = useCallback(() => {
    return new ChatApi(
      createApiConfiguration(),
      undefined,
      createAxiosInstance()
    );
  }, [createApiConfiguration, createAxiosInstance]);

  return useMemo(
    () => ({
      createAuthApi,
      createChatApi,
    }),
    [createAuthApi, createChatApi]
  );
}

const BackendContext = createContext<{
  baseUrl?: string;
  createAxiosInstance: () => AxiosInstance;
  createApiConfiguration: () => Configuration;
}>({
  createAxiosInstance: () => axios,
  createApiConfiguration: () => ({ isJsonMime }),
});
