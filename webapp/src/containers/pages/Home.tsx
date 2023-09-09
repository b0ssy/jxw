import { Fragment, useRef, useState, useEffect } from "react";
import {
  Flex,
  Card,
  Button,
  IconButton,
  AlertDialog,
  DropdownMenu,
  Text,
  TextField,
  Em,
} from "@radix-ui/themes";
import {
  PlusIcon,
  // SunIcon,
  // MoonIcon,
  ChatBubbleIcon,
  TrashIcon,
  PaperPlaneIcon,
  ArrowDownIcon,
  PersonIcon,
  CaretUpIcon,
  GitHubLogoIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { grayDark, tealDark, irisDark } from "@radix-ui/colors";
import moment from "moment";
import { z } from "zod";

import ChatBubble from "../../components/ChatBubble";
import { useBackend } from "../../lib/backend";
import { V1ChatsGet200ResponseData } from "../../lib/backend/api";
import { ChatClient } from "../../lib/chat-client";
import { useSelector, useDispatch } from "../../redux/store";
import "./Home.css";

// Websocket server events
export const zChatServerEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chat"),
    data: z.object({
      _id: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      userId: z.string(),
      status: z.enum(["idle", "running"]),
      messages: z
        .object({
          date: z.string(),
          role: z.enum(["user", "assistant", "system", "function"]),
          content: z.string(),
          result: z.any().nullish(),
        })
        .array(),
    }),
  }),
  z.object({
    type: z.literal("chat_content"),
    data: z.string(),
  }),
  z.object({
    type: z.literal("chat_content_end"),
  }),
]);
export type ChatServerEvent = z.infer<typeof zChatServerEvent>;

export type Chat = V1ChatsGet200ResponseData["data"][0];

// export const POLL_ACTIVE_CHAT_MILLISECONDS = 1000;

export default function Home() {
  // const themeMode = useSelector((state) => state.app.themeMode);
  const accessToken = useSelector((state) => state.app.accessToken);
  const dispatch = useDispatch();

  const backend = useBackend();

  const [refreshChats, setRefreshChats] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<V1ChatsGet200ResponseData | null>(null);

  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  const activeChatId = activeChat?._id;
  // const activeChatStatus = activeChat?.status;

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

          // Focus on message box
          messageInputRef.current?.focus();

          // Chat window might be scrolled to bottom previously
          // So scroll it back to top here
          if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = 0;
          }
        }
      });
  }, [backend, refreshChats]);

  // Disabled polling approach, now uses websockets
  //
  // Check for updates to active chat
  //
  // Use stupid polling method for now
  // I know this is ugly, but bear with me for a moment
  // If needed, will migrate to use of websockets for push updates
  // useEffect(() => {
  //   if (!activeChatId || activeChatStatus !== "running") {
  //     return;
  //   }

  //   async function getLatestChat(id: string) {
  //     const res = await backend
  //       .createChatApi()
  //       .v1ChatsIdGet({ id })
  //       .catch(() => null);
  //     if (!res) {
  //       return;
  //     }

  //     // Update active chat
  //     setActiveChat((chat) =>
  //       chat?._id === res.data.data._id ? res.data.data : chat
  //     );

  //     // Update chats
  //     setChats((chats) => {
  //       if (chats) {
  //         for (let i = 0; i < chats.data.length; i++) {
  //           if (chats.data[i]._id === res.data.data._id) {
  //             chats.data[i] = res.data.data;
  //           }
  //         }
  //       }
  //       return chats;
  //     });

  //     // Scroll to bottom once completed
  //     // Trigger a while later to ensure message is rendered
  //     setTimeout(() => {
  //       if (res.data.data.status === "idle" && chatWindowRef.current) {
  //         chatWindowRef.current.scrollBy({
  //           top: chatWindowRef.current.scrollHeight,
  //           behavior: "smooth",
  //         });
  //       }

  //       // Focus on message box
  //       messageInputRef.current?.focus();
  //     }, 100);
  //   }

  //   const timer = setInterval(() => {
  //     getLatestChat(activeChatId);
  //   }, POLL_ACTIVE_CHAT_MILLISECONDS);

  //   getLatestChat(activeChatId);

  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, [backend, activeChatId, activeChatStatus]);

  // Load active chat messages
  useEffect(() => {
    if (!activeChatId || !accessToken) {
      return;
    }

    const client = new ChatClient({
      accessToken,
      chatId: activeChatId,
      onReceive: (event) => {
        switch (event.type) {
          // Full chat document
          case "chat": {
            const updatedChat = event.data;
            setActiveChat((chat) =>
              chat?._id === activeChatId ? updatedChat : null
            );
            break;
          }
          // Latest chat response from ChatGPT
          case "chat_content": {
            const content = event.data;
            setActiveChat((chat) => {
              if (chat && chat?._id === activeChatId) {
                if (
                  !chat.messages.length ||
                  chat.messages[chat.messages.length - 1].role !== "assistant"
                ) {
                  chat.messages.push({
                    date: new Date().toISOString(),
                    role: "assistant",
                    content: "",
                  });
                }
                chat.messages[chat.messages.length - 1].content = content;
              }
              return chat ? { ...chat } : null;
            });
            break;
          }
          // Indicates that chat content has ended
          case "chat_content_end": {
            setActiveChat((chat) => {
              if (chat && chat?._id === activeChatId) {
                chat.status = "idle";
              }
              return chat ? { ...chat } : null;
            });
            break;
          }
          default: {
            break;
          }
        }
      },
    });
    client.connect();

    return () => {
      client.close();
    };
  }, [accessToken, backend, activeChatId]);

  // Create new chat
  function newChat() {
    setMessage("");
    setActiveChat(null);

    // Focus on message box
    messageInputRef.current?.focus();
  }

  // Select chat
  function selectChat(chat: Chat) {
    setActiveChat(chat);

    // Focus on message box
    messageInputRef.current?.focus();

    // Chat window might be scrolled to bottom previously
    // So scroll it back to top here
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = 0;
    }

    // Scroll to bottom
    // Trigger a while later to ensure message is rendered
    // setTimeout(() => {
    //   if (chatWindowRef.current) {
    //     chatWindowRef.current.scrollBy({
    //       top: chatWindowRef.current.scrollHeight,
    //       behavior: "smooth",
    //     });
    //   }
    // }, 100);
  }

  // Send chat message
  async function sendMessage() {
    if (!message) {
      return;
    }

    setMessage("");

    // Scroll to bottom
    // Trigger a while later to ensure message is rendered
    setTimeout(() => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollBy({
          top: chatWindowRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);

    // Create new chat
    if (!activeChat) {
      // Get chat message and set as active chat
      const res = await backend
        .createChatApi()
        .v1ChatsPost({ v1ChatsPostRequestBody: { message } });
      setActiveChat(res.data.data);
      setRefreshChats(Date.now());
      return;
    }

    // Update new chat message
    await backend.createChatApi().v1ChatsIdMessagePost({
      id: activeChat._id,
      v1ChatsIdMessagePostRequestBody: { message },
    });

    // Chat will be automatically updated via websocket
    // setActiveChat(res.data.data);
  }

  // Delete chat
  async function deleteChat(id: string) {
    await backend.createChatApi().v1ChatsIdDelete({ id });
    setRefreshChats(Date.now());

    // Clear active chat
    if (activeChat?._id === id) {
      setActiveChat(null);
    }
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
      {/* Chat left panel */}
      <Flex
        direction="column"
        style={{
          width: "250px",
          height: "100%",
          padding: "8px",
          backgroundColor: grayDark.gray2,
        }}
      >
        {/* Actions */}
        <Button variant="soft" size="3" onClick={newChat}>
          <PlusIcon />
          New chat
          <Flex grow="1" />
        </Button>

        {/* Chats */}
        <Flex
          direction="column"
          align={!chats?.data.length ? "center" : undefined}
          justify={!chats?.data.length ? "center" : undefined}
          grow="1"
          my="2"
          style={{ overflowY: "auto" }}
        >
          {chats?.data.map((chat) => {
            const firstMessageContent = chat.messages.length
              ? chat.messages[0].content
              : "No message available";
            return (
              <Card
                key={chat._id}
                variant={activeChat?._id === chat._id ? "surface" : "ghost"}
                title={firstMessageContent}
                style={{
                  margin: "2px 0",
                  cursor: "pointer",
                }}
                onClick={() => selectChat(chat)}
              >
                <Flex gap="2" align="center">
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
                    {firstMessageContent}
                  </Text>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger>
                      <IconButton
                        variant="soft"
                        color="red"
                        size="1"
                        style={{
                          visibility:
                            activeChat?._id !== chat._id ? "hidden" : undefined,
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                    </AlertDialog.Trigger>
                    <AlertDialog.Content style={{ maxWidth: 450 }}>
                      <AlertDialog.Title>Delete Chat</AlertDialog.Title>
                      <AlertDialog.Description size="2">
                        <Em>{firstMessageContent}</Em>
                        <br />
                        <br />
                        Are you sure you want to delete the chat above?
                      </AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                          <Button
                            variant="solid"
                            color="red"
                            onClick={() => {
                              deleteChat(chat._id);
                            }}
                          >
                            Delete
                          </Button>
                        </AlertDialog.Action>
                      </Flex>
                    </AlertDialog.Content>
                  </AlertDialog.Root>
                </Flex>
              </Card>
            );
          })}
          {chats && !chats.data.length && (
            <>
              <ChatBubbleIcon width="72px" height="72px" color="gray" />
              <div style={{ height: "16px" }} />
              <Text color="gray">You have no chats yet</Text>
            </>
          )}
        </Flex>

        {/* Bottom panel */}
        <Flex gap="2" style={{ marginBottom: "8px" }}>
          {/* Theme */}
          {/* Disabled for now: don't want to waste time fine-tuning colors */}
          {/* <IconButton variant="surface" size="3" onClick={toggleTheme}>
            {themeMode === "light" && <SunIcon />}
            {themeMode === "dark" && <MoonIcon />}
          </IconButton> */}

          {/* Account menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="outline" size="3" style={{ flexGrow: "1" }}>
                <PersonIcon />
                Account
                <Flex grow="1" />
                <CaretUpIcon />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content style={{ width: "232px" }}>
              {/* Open GitHub tab */}
              <DropdownMenu.Item onClick={openGitHub}>
                GitHub
                <GitHubLogoIcon />
              </DropdownMenu.Item>

              <DropdownMenu.Separator />

              {/* Logout */}
              <DropdownMenu.Item color="red" onClick={logout}>
                Logout
                <ExitIcon />
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>

      {/* Chat window */}
      <Flex
        ref={chatWindowRef}
        direction="column"
        grow="1"
        align="center"
        justify="center"
        width="100%"
        height="100%"
        style={{
          paddingTop: "50px",
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
          {activeChat?.messages.length && (
            <>
              <div style={{ padding: "0 16px" }}>
                {activeChat?.messages.map((message, index) => {
                  if (message.role !== "assistant" && message.role !== "user") {
                    return null;
                  }
                  const now = moment();
                  const date = moment(message.date);
                  const dateStr =
                    activeChat.status === "idle" ||
                    message.role === "user" ||
                    index < activeChat.messages.length - 1
                      ? `${
                          // today
                          +now.clone().startOf("day") ===
                          +date.clone().startOf("day")
                            ? " "
                            : // yesterday
                            +now.clone().subtract(1, "day").startOf("day") ===
                              +date.clone().startOf("day")
                            ? "yesterday, "
                            : `${date.format("D MMM YY")}, `
                        }${date.format("h:mm a")}`
                      : "";
                  return (
                    <Flex
                      key={index}
                      justify={message.role === "assistant" ? "start" : "end"}
                    >
                      <Card
                        my="2"
                        style={{
                          backgroundColor:
                            message.role === "assistant"
                              ? tealDark.teal4
                              : irisDark.iris4,
                        }}
                      >
                        <Flex
                          direction="column"
                          align={message.role === "assistant" ? "start" : "end"}
                        >
                          {message.content
                            .split("\n")
                            .map((sentence, index) => (
                              <Fragment key={index}>
                                {sentence && <div>{sentence}</div>}
                                {!sentence && <br />}
                              </Fragment>
                            ))}
                        </Flex>
                        <div style={{ height: "4px" }} />
                        <Flex
                          direction="column"
                          align={message.role === "assistant" ? "start" : "end"}
                        >
                          <Text size="1" color="gray">
                            {dateStr}
                          </Text>
                        </Flex>
                      </Card>
                    </Flex>
                  );
                })}
              </div>
              {activeChat?.status === "running" && <ChatBubble />}

              {/* Empty bottom placeholder */}
              <div style={{ height: "200px" }} />
            </>
          )}

          {/* Empty message placeholder */}
          {chats && !activeChat?.messages.length && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="4"
              style={{
                height: "100%",
              }}
            >
              <Text size="4" color="gray">
                Start chatting with our digital marketing advisor!
              </Text>
              <ArrowDownIcon width="72px" height="72px" color="gray" />
            </Flex>
          )}

          {/* Blur effect */}
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

          {/* Message box */}
          <Flex
            position="fixed"
            grow="1"
            width="100%"
            align="center"
            style={{
              bottom: "0",
              width: "768px",
              height: "100px",
              paddingBottom: "50px",
              backgroundColor: grayDark.gray1,
            }}
          >
            <TextField.Root style={{ width: "100%" }}>
              <TextField.Input
                ref={messageInputRef}
                size="3"
                autoFocus
                disabled={activeChat?.status === "running"}
                placeholder={
                  activeChat?.status === "running"
                    ? "Waiting for reply..."
                    : "Send a message"
                }
                value={message}
                style={{ padding: "24px 16px" }}
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
      </Flex>
    </Flex>
  );
}
