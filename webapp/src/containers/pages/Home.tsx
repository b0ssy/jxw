import { useState } from "react";
import {
  Flex,
  Button,
  IconButton,
  DropdownMenu,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  PlusIcon,
  ChatBubbleIcon,
  // SunIcon,
  // MoonIcon,
  PaperPlaneIcon,
  PersonIcon,
  CaretUpIcon,
  GitHubLogoIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useSelector, useDispatch } from "../../redux/store";
import "./Home.css";

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

  function toggleTheme() {
    dispatch({
      type: "app/SET_THEME_MODE",
      themeMode: themeMode === "light" ? "dark" : "light",
    });
  }

  function openGitHub() {
    window.open("https://github.com/b0ssy/jxw");
  }

  function logout() {
    dispatch({ type: "app/LOGOUT" });
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
            style={{ flexGrow: "1" }}
            onClick={newChat}
          >
            <PlusIcon />
            New chat
            <Flex grow="1" />
          </Button>
        </div>

        {/* Chats */}
        <Flex direction="column" grow="1" my="2" style={{ overflowY: "auto" }}>
          {["testing123", "hello!", "loooooooooooooooooooonggggggtext"].map(
            (item, index) => {
              return (
                <Flex
                  key={index}
                  className="chat-message"
                  p="2"
                  align="center"
                  gap="2"
                >
                  <ChatBubbleIcon width="24px" />
                  <Text
                    style={{
                      width: "calc(100% - 24px)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item}
                  </Text>
                </Flex>
              );
            }
          )}
        </Flex>

        <Flex gap="2" style={{ marginBottom: "8px" }}>
          {/* Theme */}
          {/* <IconButton variant="surface" size="3" onClick={toggleTheme}>
            {themeMode === "light" && <SunIcon />}
            {themeMode === "dark" && <MoonIcon />}
          </IconButton> */}

          {/* Account */}
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
              <DropdownMenu.Item onClick={openGitHub}>
                GitHub
                <GitHubLogoIcon />
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onClick={logout}>
                Logout
                <ExitIcon />
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </div>

      {/* Chat window */}
      <div
        style={{
          flexGrow: 1,
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            paddingTop: "50px",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "768px",
              height: "100%",
            }}
          >
            {/* Messages */}
            {[].map((item, index) => {
              return (
                <Flex
                  key={index}
                  py="2"
                  justify={index % 2 === 0 ? "start" : "end"}
                >
                  <div>{item}</div>
                </Flex>
              );
            })}
            <div style={{ height: "100px" }} />

            {/* Message box */}
            <Flex
              position="fixed"
              grow="1"
              width="100%"
              align="center"
              style={{
                width: "768px",
                height: "150px",
                bottom: "0",
              }}
            >
              <TextField.Root style={{ width: "100%" }}>
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
            </Flex>
          </div>
        </div>
      </div>
    </Flex>
  );
}
