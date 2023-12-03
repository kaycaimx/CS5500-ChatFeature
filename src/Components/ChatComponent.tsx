import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "react-modal";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import BarChart from "./BarChart";
import "./ChatStyles.css";
// import e from "express";

import {
  PortsGlobal,
  LOCAL_SERVER_URL,
  RENDER_SERVER_URL,
} from "../ServerDataDefinitions";
import { response } from "express";
import { Bar } from "victory";

const chatClient = new ChatClient();

Modal.setAppElement("#root");

function ChatComponent() {
  const [messages, setMessages] = useState<MessageContainer[]>([]);
  const [mostRecentId, setMostRecentId] = useState<number>(-1);
  const [user, setUser] = useState(
    window.sessionStorage.getItem("userName") || ""
  );
  const [message, setMessage] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(20); // number of messages to display at beginning
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [formattedMessages, setFormattedMessages] = useState<JSX.Element[]>([]); // reload the messages when the display count changes
  const [frequencyData, setFrequencyData] = useState([]); // directly use the data from server
  const [frequencyDataByController, setFrequencyDataByController] = useState<
    [string, number][]
  >([]); // call frequency from controller
  const [modalIsOpen, setModalIsOpen] = useState(false);

  let localUser = user;
  let localMessage = message;

  const updateDisplay = useCallback(() => {
    let updateNeeded = false;
    const newLastId = chatClient.messages[0]?.id;
    if (newLastId !== mostRecentId) {
      updateNeeded = true;
    }
    if (chatClient.previousMessagesFetched) {
      updateNeeded = true;
      chatClient.previousMessagesFetched = false;
      setDisplayCount((currentCount) => currentCount + 10);
    }
    if (!updateNeeded) {
      return;
    }

    let newMessages = [...chatClient.messages];
    setMessages(newMessages);
    setMostRecentId(newLastId);
  }, [mostRecentId, messages]);

  useEffect(() => {
    chatClient.setCallback(updateDisplay);
  }, [updateDisplay]);

  useEffect(() => {
    const messageBox = document.querySelector(".message-box");
    if (messageBox) {
      if (isSendingMessage) {
        // if we are sending a message, scroll to the bottom
        setTimeout(() => {
          messageBox.scrollTop = messageBox.scrollHeight;
        }, 100);
        setIsSendingMessage(false); // reset the flag
      } else if (messages.length > lastMessageCount) {
        // keep the scroll position when loading more messages
        const currentScrollPosition = messageBox.scrollTop;
        messageBox.scrollTop = currentScrollPosition;
      }
    }
    setLastMessageCount(messages.length);
  }, [messages, lastMessageCount, isSendingMessage]);

  function makeFormatedMessages() {
    let formatedMessages = [...messages]
      .slice(0, displayCount)
      .reverse()
      .map((message, index, array) => {
        let isSender = message.user === localUser;
        let messageWrapperClass = isSender
          ? "message-wrapper sender"
          : "message-wrapper receiver";

        const ref = index === 0 ? bottomRef : null;

        return (
          <div key={index} className={messageWrapperClass}>
            {!isSender && <div className="message-user">{message.user}</div>}
            <div className="message-content">{message.message}</div>
            {isSender && <div className="message-user">{message.user}</div>}
          </div>
        );
      });
    return formatedMessages;
  }

  useEffect(() => {
    setFormattedMessages(makeFormatedMessages());
  }, [messages, displayCount]);

  async function handleSendMessage() {
    if (message.trim() !== "") {
      setIsSendingMessage(true); // flag that we are sending a message

      await chatClient.sendMessage(user, message.trim());
      setMessage(""); // clear the message input box
    }
  }

  async function handleLoadMoreMessages() {
    console.log("handleLoadMoreMessages called");
    try {
      await chatClient.getNextMessages();
      setDisplayCount((currentCount) => currentCount + 10);
      console.log("Messages loaded successfully");
    } catch (error) {
      console.error("Error occurs when loading more messages：", error);
    }
  }

  const clearMessage = () => {
    setMessage("");
  };

  async function getFrequencyData() {
    const baseURL = `${LOCAL_SERVER_URL}:${PortsGlobal.serverPort}`;
    fetch(`${baseURL}/messages/frequency`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Frequency data loaded successfully");
        console.log(data);
        setFrequencyData(data);
        if (frequencyData.length > 0) {
          openModal();
        }
      })
      .catch((error) => {
        console.error("Error occurs when getting frequency data：", error);
      });
  }

  // Call from controller bug: need to press button twice to get the correct data, otherwise it will return the previous data
  //   async function getFrequencyDataByController() {
  //     await chatClient.getFrequencyData();
  //     let controllerData = chatClient.frequencyData;
  //     console.log("Frequency data called by server");
  //     console.log(controllerData);
  //     setFrequencyDataByController(controllerData);
  //   }

  function openModal() {
    setModalIsOpen(true);
  }

  function closeModal() {
    setModalIsOpen(false);
  }

  return (
    <div className="chat-container">
      <h1>Chat Window</h1>
      <div className="button-group">
        <button onClick={handleLoadMoreMessages}>Load More Messages</button>
        <button onClick={() => setDisplayCount(20)}>Hide Messages</button>
      </div>
      <div className="message-box">{formattedMessages}</div>
      <div className="input-area">
        <span>{user}</span>
        <div className="input-with-clear">
          <input
            type="text"
            id="message"
            placeholder="Type a message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyUp={(event) => {
              if (event.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          {message && (
            <button className="clear-button" onClick={clearMessage}>
              ×
            </button>
          )}
        </div>
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <button
        style={{ width: "200px", height: "50px" }}
        onClick={getFrequencyData}
      >
        Get Frequency Data
      </button>
      <div>
        {frequencyData.length > 0 &&
          frequencyData.map((data, index) => {
            return (
              <div key={index}>
                <span>
                  {data[0]}: {data[1]} chats
                </span>
              </div>
            );
          })}
      </div>

      {/* <button style={{width:"200px", height:"50px"}} onClick={getFrequencyDataByController}>Get by Controller</button>
                <div>
                {(frequencyDataByController.length > 0) && (frequencyDataByController.map((data, index) => {
                    return (
                        <div key={index}>
                            <span>{data[0]}: {data[1]} chats</span>
                        </div>
                    );
                }))}
                </div> */}

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal}>
        <BarChart data={frequencyData} />
      </Modal>
    </div>
  );
}

export default ChatComponent;
