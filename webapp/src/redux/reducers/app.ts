import deepmerge from "deepmerge";
import { REHYDRATE } from "redux-persist";
import { z } from "zod";
import * as appActions from "../actions/app";

export const zState = z.object({
  themeMode: z.enum(["light", "dark"]),
  email: z.string().optional(),
  accessToken: z.string().optional(),
});
export type State = z.infer<typeof zState>;

export const isSystemDarkMode = () => {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
};

const updateThemeMode = (themeMode: State["themeMode"]) => {
  if (themeMode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

type Action =
  | {
      type: "persist/REHYDRATE";
      key: string;
      payload?: {
        app?: State;
      };
    }
  | appActions.Action;

const initialState: State = {
  themeMode: isSystemDarkMode() ? "dark" : "light",
};

const reducer = (
  state: State = deepmerge(initialState, {}),
  action: Action
): State => {
  switch (action.type) {
    case REHYDRATE:
      if (action.payload && action.payload.app) {
        state = zState.parse(action.payload.app);
      }
      updateThemeMode(state.themeMode);
      return { ...state };
    case "app/SET_THEME_MODE": {
      updateThemeMode(action.themeMode);
      return { ...state, themeMode: action.themeMode };
    }
    case "app/SET_EMAIL": {
      return { ...state, email: action.email };
    }
    case "app/LOGIN": {
      return { ...state, accessToken: action.accessToken };
    }
    case "app/LOGOUT": {
      return { ...state, accessToken: undefined };
    }
    default:
      return state;
  }
};

export default reducer;
