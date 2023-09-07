import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ROUTES } from "./routes";
import Home from "./containers/pages/Home";
import Login from "./containers/pages/Login";
import { useSelector } from "./redux/store";

function App() {
  const themeMode = useSelector((state) => state.app.themeMode);
  const isLoggedIn = useSelector((state) => !!state.app.accessToken);
  return (
    <Theme appearance={themeMode} style={{ height: "100vh" }}>
      <BrowserRouter>
        <Routes>
          {isLoggedIn && (
            <>
              <Route path={ROUTES.home} element={<Home />} />
              <Route path="*" element={<Navigate to={ROUTES.home} />} />
            </>
          )}
          {!isLoggedIn && (
            <>
              <Route path={ROUTES.login} element={<Login />} />
              <Route path="*" element={<Navigate to={ROUTES.login} />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}

export default App;
