export type Action =
  | {
      type: "app/SET_THEME_MODE";
      themeMode: "light" | "dark";
    }
  | {
      type: "app/SET_EMAIL";
      email: string;
    }
  | {
      type: "app/LOGIN";
      accessToken: string;
    }
  | { type: "app/LOGOUT" };
