import { useRef, useState } from "react";
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
} from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";

import Spinner from "../../components/Spinner";
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

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  async function handleLogin() {
    if (!isValidEmail(email)) {
      emailRef.current?.focus();
      setErr({ email: "Please enter a valid email" });
      return;
    }
    if (!password) {
      passwordRef.current?.focus();
      setErr({ password: "Please enter a valid password" });
      return;
    }
    setErr({});

    // Set a fake delay
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
    <Flex direction="column" align="center" justify="center" height="100%">
      <Card
        style={{
          width: "400px",
          padding: "36px 24px 0 24px",
        }}
      >
        {/* Heading */}
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
            ref={emailRef}
            onChange={(e) => {
              setErr({});
              setEmail(e.target.value);
              dispatch({ type: "app/SET_EMAIL", email: e.target.value });
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                if (!isValidEmail(email)) {
                  emailRef.current?.focus();
                  setErr({ email: "Please enter a valid email" });
                  return;
                }
                passwordRef.current?.focus();
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
            ref={passwordRef}
            onChange={(e) => {
              setErr({});
              setPassword(e.target.value);
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

        {/* Login error */}
        {!!err.login && (
          <Text size="1" color="red">
            {err.login}
          </Text>
        )}

        <Box height="4" />

        {/* Login button */}
        <Box height="6" />
        <Button
          disabled={loading}
          size="3"
          style={{ width: "100%" }}
          onClick={handleLogin}
        >
          Login
          <EnterIcon />
        </Button>

        {/* Spinner */}
        <Flex
          align="center"
          justify="center"
          style={{ visibility: !loading ? "hidden" : undefined }}
        >
          <Spinner />
        </Flex>
      </Card>
    </Flex>
  );
}
