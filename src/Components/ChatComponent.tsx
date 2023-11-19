import React, { useState, useEffect, useCallback, useRef } from "react";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import './ChatStyles.css'
import e from "express";

const chatClient = new ChatClient();

function ChatComponent() {
    const [messages, setMessages] = useState<MessageContainer[]>([]);
    const [mostRecentId, setMostRecentId] = useState<number>(-1);
    const [user, setUser] = useState(window.sessionStorage.getItem('userName') || "");
    const [message, setMessage] = useState<string>("");
    const bottomRef = useRef<HTMLDivElement>(null);;
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [displayCount, setDisplayCount] = useState(20); // number of messages to display at beginning

    let localUser = user;
    let localMessage = message;

    const updateDisplay = useCallback(() => {
        let updateNeeded = false;
        const newLastId = chatClient.messages[0].id;
        if (newLastId !== mostRecentId) {
            updateNeeded = true;
        }
        if (chatClient.previousMessagesFetched) {
            updateNeeded = true;
            chatClient.previousMessagesFetched = false;
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
        const messageBox = document.querySelector('.message-box');
        if (messageBox && messages.length > lastMessageCount) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }
        setLastMessageCount(messages.length);
    }, [messages, lastMessageCount]);
    
    
    function makeFormatedMessages() {
        let displayedMessages = messages.slice(0, displayCount).reverse(); // get the lastest 10 messages
        return displayedMessages.map((message, index) => {
            let isSender = message.user === localUser;
            let messageWrapperClass = isSender ? "message-wrapper sender" : "message-wrapper receiver";
    
            const ref = index === 0 ? bottomRef : null;

            return (
                <div key={index} className={messageWrapperClass}>
                    {!isSender && <div className="message-user">{message.user}</div>}
                    <div className="message-content">{message.message}</div>
                    {isSender && <div className="message-user">{message.user}</div>}
                </div>
            );
        });
    }

    function handleLoadMore() {
        setDisplayCount(prevCount => prevCount + 10); // click to load 10 more messages
    }

    async function handleSendMessage() {
        if (message.trim() !== "") {
            await chatClient.sendMessage(user, message.trim());
            setMessage(""); // clear the message box
        }
    }

    return (
        <div className="chat-container">
            <h1>Chat Window</h1>
            <div className="loadMore">
                <button onClick={handleLoadMore}>Load More Messages</button>
            </div>
            <div className="message-box">
                {makeFormatedMessages()}
            </div>
            <div className="input-area">
                <span>{user}</span>
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
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
    
}

export default ChatComponent;

