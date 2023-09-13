import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "react-loading-skeleton/dist/skeleton.css";

import { ENV } from "./config";
import { ROUTES } from "./routes";
import CheckTokenExpiry from "./containers/CheckTokenExpiry";
import Home from "./containers/pages/Home";
import Login from "./containers/pages/Login";
import { Backend } from "./lib/backend";
import { useSelector } from "./redux/store";
import "./App.css";

function App() {
  const themeMode = useSelector((state) => state.app.themeMode);
  const accessToken = useSelector((state) => state.app.accessToken);
  const isLoggedIn = !!accessToken;
  return (
    <>
      {/* UI */}
      <Theme className="App-Theme" appearance={themeMode}>
        <Backend baseUrl={ENV.BASE_URL} accessToken={accessToken}>
          <BrowserRouter>
            <Routes>
              {/* Routes when logged in */}
              {isLoggedIn && (
                <>
                  {/* Show new chat */}
                  <Route path={ROUTES.home} element={<Home />} />

                  {/* Show specific chat */}
                  <Route path={`${ROUTES.home}/chat/:id`} element={<Home />} />

                  {/* Redirect all others to home */}
                  <Route path="*" element={<Navigate to={ROUTES.home} />} />
                </>
              )}

              {/* Routes when logged out */}
              {!isLoggedIn && (
                <>
                  {/* Login page */}
                  <Route path={ROUTES.login} element={<Login />} />

                  {/* Redirect all others to login page */}
                  <Route path="*" element={<Navigate to={ROUTES.login} />} />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </Backend>
      </Theme>

      {/* Background operations */}
      <CheckTokenExpiry />
    </>
  );
}

export default App;
