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
        return [...messages].reverse().map((message, index) => {
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

    function handleSendMessage() {
        chatClient.sendMessage(localUser, message);
        setMessage(""); // clear the message box
    }

    return (
        <div className="chat-container">
            <h1>Chat Window</h1>
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
                        localMessage = event.currentTarget.value;
                        setMessage(event.currentTarget.value);
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

