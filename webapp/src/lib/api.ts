import { z } from "zod";

import { ENV } from "../config";

export const makeResponse = <T extends z.AnyZodObject>(dataSchema: T) =>
  z.object({
    code: z.string(),
    data: dataSchema.nullish(),
    message: z.string().nullable(),
  });

export const zLoginResponse = makeResponse(
  z.object({
    userId: z.string(),
    accessToken: z.string(),
  })
);

export const zCreateChatResponse = makeResponse(
  z.object({
    id: z.string(),
  })
);

export const login = async (email: string, password: string) => {
  const url = buildUrl("v1/login");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  const data = zLoginResponse.safeParse(json);
  return data.success ? data.data : null;
};

export const createChat = async () => {
  const url = buildUrl("v1/chats");
  const res = await fetch(url, { method: "POST" });
  const json = await res.json();
  const data = zCreateChatResponse.safeParse(json);
  return data.success ? data.data : null;
};

// TODO
export const createChatMessage = async (id: string, message: string) => {};

export const deleteChat = async (id: string) => {
  const url = buildUrl(`v1/chats/${id}`);
  await fetch(url, { method: "DELETE" });
};

export const buildUrl = (path: string) => {
  return `${ENV.BASE_URL}${path}`;
};
