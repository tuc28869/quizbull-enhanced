// src/app/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { thunk } from 'redux-thunk';                       // default export
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import sessionStorage from "redux-persist/lib/storage/session";

import authReducer from "./slices/authSlice";
import sessionReducer from "./slices/sessionSlice";

/* ----- persistence configs ----- */
const rootPersistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const sessionPersistConfig = {
  key: "quiz",
  storage: sessionStorage,
  whitelist: ["questions", "answers", "currentIndex"],
};

/* ----- combined reducer ----- */
const rootReducer = combineReducers({
  auth: authReducer,
  session: persistReducer(sessionPersistConfig, sessionReducer),
});

/* ----- store ----- */
export const store = configureStore({
  reducer: persistReducer(rootPersistConfig, rootReducer),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false })   // thunk is included automatically
});

export const persistor = persistStore(store);