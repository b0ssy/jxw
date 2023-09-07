import { useState } from "react";
import { Box, Flex, Heading, Text, TextField, Button } from "@radix-ui/themes";

import { login } from "../../lib/api";
import { sleepFn1000ms, isValidEmail } from "../../lib/utils";
import { useSelector, useDispatch } from "../../redux/store";

export default function Login() {
  const initialEmail = useSelector((state) => state.app.email || "");
  const dispatch = useDispatch();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<{
    [k in "email" | "password" | "login"]?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);
  let emailRef: HTMLInputElement | null = null;
  let passwordRef: HTMLInputElement | null = null;

  async function handleLogin() {
    if (!isValidEmail(email)) {
      emailRef?.focus();
      setErr({ email: "Please enter a valid email" });
      return;
    }
    if (!password) {
      passwordRef?.focus();
      setErr({ password: "Please enter a valid password" });
      return;
    }
    setErr({});

    setLoading(true);
    const result = await sleepFn1000ms(
      login(email, password).catch((err: Error) => {
        setErr({ login: err.message ?? "Incorrect email or password" });
        return null;
      })
    );
    setLoading(false);
    if (result) {
      dispatch({ type: "app/LOGIN", accessToken: result.accessToken });
    }
  }

  return (
    <>
      {/* Content */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ height: "100%" }}
      >
        <div style={{ width: "300px" }}>
          <Heading>Login</Heading>
          <Box height="4" />

          {/* Email input */}
          <Text>Email</Text>
          <TextField.Root>
            <TextField.Input
              variant={err.email ? "soft" : undefined}
              color={err.email ? "red" : undefined}
              value={email}
              ref={(ref) => {
                emailRef = ref;
              }}
              onChange={(e) => {
                setErr({});
                setEmail(e.target.value);
                dispatch({ type: "app/SET_EMAIL", email: e.target.value });
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  if (!isValidEmail(email)) {
                    emailRef?.focus();
                    setErr({ email: "Please enter a valid email" });
                    return;
                  }
                  passwordRef?.focus();
                }
              }}
            />
          </TextField.Root>
          {/* Email error */}
          {!!err.email && (
            <Text size="1" color="red">
              {err.email}
            </Text>
          )}
          <Box height="4" />

          {/* Password input */}
          <Text>Password</Text>
          <TextField.Root>
            <TextField.Input
              autoFocus={!!email}
              variant={err.password ? "soft" : undefined}
              color={err.password ? "red" : undefined}
              type="password"
              value={password}
              ref={(ref) => {
                passwordRef = ref;
              }}
              onChange={(event) => {
                setErr({});
                setPassword(event.target.value);
              }}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </TextField.Root>
          {/* Password error */}
          {!!err.password && (
            <Text size="1" color="red">
              {err.password}
            </Text>
          )}
          <Box height="4" />

          {/* Login error */}
          {!!err.login && <p>{err.login}</p>}

          {/* Login button */}
          <Box height="2" />
          <Button style={{ width: "100%" }} onClick={handleLogin}>
            Login
          </Button>
        </div>
      </Flex>

      {/* Spinner */}
      {/* <Overlay open={loading}>
        <Spinner />
      </Overlay> */}
    </>
  );
}
