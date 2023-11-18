import React, { useState, useEffect, useCallback, useRef } from "react";

import { MessageContainer } from "../Engine/GlobalDefinitions";

import ChatClient from "../Engine/ChatClient";
import './ChatStyles.css'
import e from "express";





const chatClient = new ChatClient();


function ChatComponent() {
    const [messages, setMessages] = useState<MessageContainer[]>([]);
    const [mostRecentId, setMostRecentId] = useState<number>(0);
    const [user, setUser] = useState(window.sessionStorage.getItem('userName') || "");
    const [message, setMessage] = useState<string>("Hello World");
    const bottomRef = useRef(null);


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


    function makeFormatedMessages() {
        return [...messages].reverse().map((message, index) => {
            let isSender = message.user === localUser;
            let messageWrapperClass = isSender ? "message-wrapper sender" : "message-wrapper receiver";
    
            return (
                <div key={index} className={messageWrapperClass}>
                    {!isSender && <div className="message-user">{message.user}</div>}
                    <div className="message-content">{message.message}</div>
                    {isSender && <div className="message-user">{message.user}</div>}
                </div>
            );
        });
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
                    onKeyUp={(event) => {
                        localMessage = event.currentTarget.value;
                        setMessage(event.currentTarget.value);
                        if (event.key === "Enter") {
                            chatClient.sendMessage(localUser, localMessage);
                            event.currentTarget.value = "";
                            setMessage("");
                        }
                    }}
                />
                <button onClick={() => chatClient.sendMessage(localUser, localMessage)}>Send</button>
            </div>
        </div>
    );
    
}

export default ChatComponent;

