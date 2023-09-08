import { useState, useEffect } from "react";
import {
  Flex,
  Card,
  Button,
  IconButton,
  DropdownMenu,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  PlusIcon,
  // SunIcon,
  // MoonIcon,
  PaperPlaneIcon,
  PersonIcon,
  CaretUpIcon,
  GitHubLogoIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { grayDark } from "@radix-ui/colors";

import { /**useSelector, */ useDispatch } from "../../redux/store";
import "./Home.css";
import { V1ChatsGet200ResponseData } from "../../lib/backend/api";
import { useBackend } from "../../lib/backend";

export default function Home() {
  // const themeMode = useSelector((state) => state.app.themeMode);
  const dispatch = useDispatch();

  const backend = useBackend();

  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<
    V1ChatsGet200ResponseData["data"][0] | null
  >(null);
  const [chats, setChats] = useState<V1ChatsGet200ResponseData | null>(null);

  // Query for chats
  useEffect(() => {
    backend
      .createChatApi()
      .v1ChatsGet()
      .then((res) => {
        // Chats should be already sorted by created date in descending order
        setChats(res.data.data);
        if (res.data.data.data.length) {
          setActiveChat(res.data.data.data[0]);
        }
      });
  }, []);

  function newChat() {
    setMessage("");
    setActiveChat(null);
  }

  async function sendMessage() {
    if (!message) {
      return;
    }

    setMessage("");

    // Create new chat
    if (!activeChat) {
      // Get chat message and set active chat
      const res = await backend
        .createChatApi()
        .v1ChatsPost({ v1ChatsPostRequestBody: { message } });
      setActiveChat(res.data.data);
      return;
    }

    // Update new chat message
    const res = await backend.createChatApi().v1ChatsIdMessagePost({
      id: activeChat._id,
      v1ChatsIdMessagePostRequestBody: { message },
    });
    setActiveChat(res.data.data);
  }

  // function toggleTheme() {
  //   dispatch({
  //     type: "app/SET_THEME_MODE",
  //     themeMode: themeMode === "light" ? "dark" : "light",
  //   });
  // }

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
          backgroundColor: grayDark.gray2,
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
            variant="soft"
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
          {chats?.data.map((chat) => {
            return (
              <Card
                key={chat._id}
                variant={activeChat?._id === chat._id ? "surface" : "ghost"}
                title={
                  chat.messages.length
                    ? chat.messages[0].content
                    : "No message available"
                }
                style={{
                  margin: "4px 0",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setActiveChat(chat);
                }}
              >
                <Text
                  as="div"
                  size="2"
                  weight={activeChat?._id === chat._id ? "bold" : undefined}
                  style={{
                    width: "calc(100% - 24px)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {chat.messages.length
                    ? chat.messages[0].content
                    : "No message available"}
                </Text>
              </Card>
            );
          })}
          {!chats?.data.length && <Text>No chat history</Text>}
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
              <Button variant="outline" size="3" style={{ flexGrow: "1" }}>
                <PersonIcon />
                Account
                <Flex grow="1" />
                <CaretUpIcon />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              style={{
                // width: "186px",
                width: "234px",
              }}
            >
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
            <div
              style={{
                padding: "0 16px",
              }}
            >
              {activeChat?.messages.map((message, index) => {
                return (
                  <Flex
                    key={index}
                    py="2"
                    justify={message.role === "assistant" ? "start" : "end"}
                  >
                    <Flex direction="column">
                      {message.content.split("\n").map((sentence, index) => (
                        <div key={index}>{sentence}</div>
                      ))}
                    </Flex>
                  </Flex>
                );
              })}
            </div>
            <div style={{ height: "200px" }} />

            {/* Message box */}
            <Flex
              position="fixed"
              grow="1"
              width="100%"
              align="center"
              style={{
                width: "calc(768px + 32px)",
                height: "150px",
                marginLeft: "-16px",
                marginRight: "-16px",
                bottom: "0",
                backgroundColor: grayDark.gray1,
                filter: "blur(12px)",
              }}
            />
            <Flex
              position="fixed"
              grow="1"
              width="100%"
              align="center"
              style={{
                width: "768px",
                height: "100px",
                paddingBottom: "50px",
                bottom: "0",
                backgroundColor: grayDark.gray1,
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
