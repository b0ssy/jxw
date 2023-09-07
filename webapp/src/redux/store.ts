import { createStore, Dispatch } from "redux";
import {
  useSelector as useSelectorRedux,
  useDispatch as useDispatchRedux,
} from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import rootReducer from "./reducers";
import { State } from "./reducers";
import { Action } from "./actions";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer);
export const persistor = persistStore(store);

export const useSelector = <TSelected>(
  selector: (state: State) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
) => useSelectorRedux<State, TSelected>(selector, equalityFn);
export const useDispatch = () => useDispatchRedux<Dispatch<Action>>();
