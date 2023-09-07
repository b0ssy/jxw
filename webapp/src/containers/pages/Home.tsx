import { useState } from "react";
import {
  Flex,
  Button,
  IconButton,
  DropdownMenu,
  TextField,
} from "@radix-ui/themes";
import {
  PlusIcon,
  SunIcon,
  MoonIcon,
  PaperPlaneIcon,
  PersonIcon,
  CaretUpIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useSelector, useDispatch } from "../../redux/store";

export default function Home() {
  const themeMode = useSelector((state) => state.app.themeMode);
  const dispatch = useDispatch();

  const [message, setMessage] = useState("");

  // TODO
  function newChat() {
    setMessage("");
  }

  // TODO
  function sendMessage() {
    if (!message) {
      return;
    }

    setMessage("");
  }

  return (
    <Flex direction="row" style={{ height: "100vh" }}>
      {/* Chat panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "250px",
          height: "100%",
          padding: "8px",
        }}
      >
        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Button
            variant="outline"
            size="3"
            onClick={newChat}
            style={{ flexGrow: "1" }}
          >
            <PlusIcon />
            New chat
            <Flex grow="1" />
          </Button>
        </div>

        {/* Messages */}
        <Flex grow="1"></Flex>

        {/* Account */}
        <Flex gap="2" style={{ marginBottom: "8px" }}>
          <IconButton
            variant="surface"
            size="3"
            onClick={() => {
              dispatch({
                type: "app/SET_THEME_MODE",
                themeMode: themeMode === "light" ? "dark" : "light",
              });
            }}
          >
            {themeMode === "light" && <SunIcon />}
            {themeMode === "dark" && <MoonIcon />}
          </IconButton>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="soft" size="3" style={{ flexGrow: "1" }}>
                <PersonIcon />
                Account
                <Flex grow="1" />
                <CaretUpIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content style={{ width: "186px" }}>
              <DropdownMenu.Item
                color="red"
                onClick={() => dispatch({ type: "app/LOGOUT" })}
              >
                Logout
                <ExitIcon />
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </div>

      {/* Chat window */}
      <div style={{ flexGrow: 1, height: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "768px", height: "100%" }}>
            {/* Messages */}
            <div style={{ width: "100%", height: "calc(100% - 100px)" }}></div>

            {/* Message box */}
            <TextField.Root>
              <TextField.Input
                size="3"
                placeholder="Send a message"
                value={message}
                style={{
                  padding: "24px 16px",
                }}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" && message) {
                    sendMessage();
                  }
                }}
              />
              <TextField.Slot style={{ marginRight: "8px" }}>
                <IconButton disabled={!message}>
                  <PaperPlaneIcon />
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </div>
        </div>
      </div>
    </Flex>
  );
}
