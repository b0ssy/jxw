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
  Separator,
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
  CaretDownIcon,
  GitHubLogoIcon,
  ExitIcon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { tealDark, irisDark } from "@radix-ui/colors";
import moment from "moment";

import ChatBubble from "../../components/ChatBubble";
import { useBackend } from "../../lib/backend";
import { V1ChatsGet200ResponseData } from "../../lib/backend/api";
import { ChatClient } from "../../lib/chat-client";
import { useSelector, useDispatch } from "../../redux/store";
import "./Home.css";

export type Chat = V1ChatsGet200ResponseData["data"][0];

export default function Home() {
  // const themeMode = useSelector((state) => state.app.themeMode);
  const accessToken = useSelector((state) => state.app.accessToken);
  const dispatch = useDispatch();

  const backend = useBackend();

  const [openMobileDrawer, setOpenMobileDrawer] = useState(false);
  const [refreshChats, setRefreshChats] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<V1ChatsGet200ResponseData | null>(null);

  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  const activeChatId = activeChat?._id;

  // Query for chats
  useEffect(() => {
    backend
      .createChatApi()
      .v1ChatsGet()
      .then((res) => {
        // Chats should be already sorted by created date in descending order
        setChats(res.data.data);

        // Set first chat as active if no active chat yet
        if (res.data.data.data.length && !activeChat) {
          setActiveChat(res.data.data.data[0]);

          // Focus on message box
          messageInputRef.current?.focus();
        }
      });
  }, [backend, refreshChats]);

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

            // Refresh all chats at end
            setRefreshChats(Date.now());

            // Focus on message box
            // Set timeout to run after it is enabled
            setTimeout(() => {
              messageInputRef.current?.focus();
            }, 0);
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
  }

  // Send chat message
  async function sendMessage() {
    // Nothing to send
    if (!message) {
      return;
    }

    // Clear message
    setMessage("");

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

  // Open GitHub link in new tab
  function openGitHub() {
    window.open("https://github.com/b0ssy/jxw");
  }

  // Logout account
  function logout() {
    dispatch({ type: "app/LOGOUT" });
  }

  // function toggleTheme() {
  //   dispatch({
  //     type: "app/SET_THEME_MODE",
  //     themeMode: themeMode === "light" ? "dark" : "light",
  //   });
  // }

  return (
    <Flex className="Home-root" direction="row">
      {/* Chat left panel */}
      <Flex className="Home-left-panel" direction="column">
        {/* New chat */}
        <Button variant="soft" size="3" onClick={newChat}>
          <PlusIcon />
          New chat
          <Flex grow="1" />
        </Button>

        {/* Chats */}
        <Flex
          className="Home-chats"
          direction="column"
          align={!chats?.data.length ? "center" : undefined}
          justify={!chats?.data.length ? "center" : undefined}
          grow="1"
          my="2"
        >
          {chats?.data.map((chat) => {
            const firstMessageContent = chat.messages.length
              ? chat.messages[0].content
              : "No message available";
            return (
              <Card
                key={chat._id}
                className="Home-chats-message"
                variant={activeChat?._id === chat._id ? "surface" : "ghost"}
                title={firstMessageContent}
                onClick={() => selectChat(chat)}
              >
                <Flex gap="2" align="center">
                  <Text
                    className="Home-chats-message-text"
                    as="div"
                    size="2"
                    weight={activeChat?._id === chat._id ? "bold" : undefined}
                  >
                    {firstMessageContent}
                  </Text>

                  {/* Delete chat dialog */}
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

                    {/* Dialog content */}
                    <AlertDialog.Content style={{ maxWidth: 450 }}>
                      <AlertDialog.Title>Delete Chat</AlertDialog.Title>
                      <AlertDialog.Description size="2">
                        <Em>{firstMessageContent}</Em>
                        <br />
                        <br />
                        Are you sure you want to delete the chat above?
                      </AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        {/* Cancel deletion */}
                        <AlertDialog.Cancel>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </AlertDialog.Cancel>

                        {/* Delete button */}
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

        {/* Settings panel */}
        <Flex className="Home-settings-panel" gap="2">
          {/* Theme */}
          {/* Disabled for now: don't want to waste time fine-tuning colors */}
          {/* <IconButton variant="surface" size="3" onClick={toggleTheme}>
            {themeMode === "light" && <SunIcon />}
            {themeMode === "dark" && <MoonIcon />}
          </IconButton> */}

          {/* Account menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button
                className="Home-account-button"
                variant="outline"
                size="3"
              >
                <PersonIcon />
                Account
                <Flex grow="1" />
                <CaretUpIcon />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="Home-account-menu">
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
        className="Home-chat-window"
        direction="column"
        align="center"
        justify="center"
        width="100%"
        height="100%"
      >
        <div>
          {/* Messages */}
          {activeChat?.messages.length && (
            <>
              <div className="Home-chat-window-message-container">
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
              <div className="Home-chat-window-message-placeholder" />
            </>
          )}

          {/* Empty message placeholder */}
          {chats && !activeChat?.messages.length && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="4"
              height="100%"
            >
              <Text size="4" color="gray" align='center'>
                Start chatting with our digital marketing advisor!
              </Text>
              <ArrowDownIcon width="72px" height="72px" color="gray" />
            </Flex>
          )}

          {/* Blur effect */}
          <Flex
            className="Home-chat-window-blur-effect"
            position="fixed"
            grow="1"
            width="100%"
            align="center"
          />

          {/* Message box */}
          <Flex
            className="Home-message-box"
            position="fixed"
            grow="1"
            width="100%"
            align="center"
          >
            <TextField.Root>
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
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" && message) {
                    sendMessage();
                  }
                }}
              />
              <TextField.Slot>
                <IconButton disabled={!message} onClick={sendMessage}>
                  <PaperPlaneIcon />
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </Flex>
        </div>
      </Flex>

      {/* Chat header (mobile only) */}
      <Flex direction="column" className="Home-mobile-header">
        <Flex grow="1" align="center">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => setOpenMobileDrawer(!openMobileDrawer)}
          >
            <HamburgerMenuIcon width="20px" height="20px" />
          </IconButton>

          <div style={{ width: "16px" }} />

          {/* New chat */}
          <Button variant="soft" size="2" onClick={newChat}>
            <PlusIcon />
            New chat
            <Flex grow="1" />
          </Button>

          <Flex grow="1" />

          {/* Account menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="outline" size="2">
                <PersonIcon />
                Account
                <CaretDownIcon />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="Home-account-menu">
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
        <Separator size="4" />
      </Flex>

      {/* Chat left drawer (mobile only) */}
      <Flex
        className="Home-mobile-left-drawer"
        style={{ display: !openMobileDrawer ? "none" : undefined }}
      >
        {/* Chats */}
        <Flex
          className="Home-chats"
          direction="column"
          align={!chats?.data.length ? "center" : undefined}
          justify={!chats?.data.length ? "center" : undefined}
          grow="1"
          my="2"
        >
          {chats?.data.map((chat) => {
            const firstMessageContent = chat.messages.length
              ? chat.messages[0].content
              : "No message available";
            return (
              <Card
                key={chat._id}
                className="Home-chats-message"
                variant={activeChat?._id === chat._id ? "surface" : "ghost"}
                title={firstMessageContent}
                onClick={() => {
                  selectChat(chat);
                  setOpenMobileDrawer(false);
                }}
              >
                <Flex gap="2" align="center">
                  <Text
                    className="Home-chats-message-text"
                    as="div"
                    size="2"
                    weight={activeChat?._id === chat._id ? "bold" : undefined}
                  >
                    {firstMessageContent}
                  </Text>

                  {/* Delete chat dialog */}
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

                    {/* Dialog content */}
                    <AlertDialog.Content style={{ maxWidth: 450 }}>
                      <AlertDialog.Title>Delete Chat</AlertDialog.Title>
                      <AlertDialog.Description size="2">
                        <Em>{firstMessageContent}</Em>
                        <br />
                        <br />
                        Are you sure you want to delete the chat above?
                      </AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        {/* Cancel deletion */}
                        <AlertDialog.Cancel>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </AlertDialog.Cancel>

                        {/* Delete button */}
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
      </Flex>
    </Flex>
  );
}
