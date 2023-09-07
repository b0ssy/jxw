import { useState } from "react";
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
} from "@radix-ui/themes";

import { login } from "../../lib/api";
import { sleepFn1000ms, isValidEmail } from "../../lib/utils";
import { useSelector, useDispatch } from "../../redux/store";
import { useBackend } from "../../lib/backend";

export default function Login() {
  const initialEmail = useSelector((state) => state.app.email || "");
  const dispatch = useDispatch();

  const backend = useBackend();

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
      backend.createAuthApi().v1LoginPost({
        v1LoginPostRequestBody: {
          email,
          password,
        },
      })
    ).catch(() => null);
    setLoading(false);
    if (!result?.data) {
      setPassword("");
      setErr({ login: "Incorrect email or password" });
      return;
    }

    dispatch({
      type: "app/LOGIN",
      accessToken: result.data.data.accessToken,
    });
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: "100%" }}
    >
      <Card style={{ width: "400px", padding: "36px 24px" }}>
        <Heading>Login to your account</Heading>
        <Box height="6" />

        {/* Email input */}
        <Text size="2">Email</Text>
        <Box height="1" />
        <TextField.Root>
          <TextField.Input
            size="3"
            disabled={loading}
            autoFocus={!email}
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
        <Text size="2">Password</Text>
        <Box height="1" />
        <TextField.Root>
          <TextField.Input
            size="3"
            disabled={loading}
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
        {!!err.login && (
          <Text size="1" color="red">
            {err.login}
          </Text>
        )}

        {/* Login button */}
        <Box height="6" />
        <Button
          disabled={loading}
          size="3"
          style={{ width: "100%" }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Card>
    </Flex>
  );
}
