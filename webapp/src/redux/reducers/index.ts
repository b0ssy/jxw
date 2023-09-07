import { combineReducers } from "redux";
import app from "./app";
import { State as AppState } from "./app";

export type State = {
  app: AppState;
};

export default combineReducers({
  app,
});
