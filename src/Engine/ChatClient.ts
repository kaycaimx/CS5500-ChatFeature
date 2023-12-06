/**
 * ChatClient
 * 
 * @export
 * 
 */

import { MessagesContainer, MessageContainer } from "../Engine/GlobalDefinitions";

import { Database } from '../Engine/Database';

import { PortsGlobal, LOCAL_SERVER_URL, RENDER_SERVER_URL } from '../ServerDataDefinitions';

class ChatClient {

    private database: Database;
    private _chatPort: number = PortsGlobal.serverPort;
    private _baseURL: string;
    private socket: WebSocket | null = null;
    earliestMessageID: number = 10000000000;
    previousMessagesFetched: boolean = false;
    messages: MessageContainer[] = [];
    updateDisplay: () => void = () => { };
    // 添加一个用来保存回调函数的属性
    private onMessageUpdate: ((messages: MessageContainer[]) => void) | null = null;

    /**
     * Creates an instance of ChatClient.
     * @memberof ChatClient
     */
    constructor() {
        console.log("ChatClient");

        const isProduction = process.env.NODE_ENV === 'production';
        this._baseURL = isProduction ? RENDER_SERVER_URL : `${LOCAL_SERVER_URL}:${this._chatPort}`;
        this.database = new Database();

        this.getMessages();
        this.getMessagesContinuously();

        // WebSocket
        this.initWebSocket();
    }

    // 添加一个方法来设置回调
    public subscribeToUpdates(callback: (messages: MessageContainer[]) => void): () => void {
        console.log("subscribeToUpdates()");
        this.onMessageUpdate = callback;
        return () => {
            this.onMessageUpdate = null;
        };
    }

    // 确保在消息更新时调用回调
    private notifyUpdate() {
        if (this.onMessageUpdate) {
          this.onMessageUpdate([...this.messages]);
        }
    }

    initWebSocket() {
        console.log("initWebSocket()");
        // 检查 localStorage 中是否已有 WebSocket 连接信息
        const savedWsUrl = localStorage.getItem('websocketUrl');
        const wsUrl = savedWsUrl || 'ws://localhost:3005';

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("initWebSocket WebSocket connection established");
            if (!savedWsUrl) {
              localStorage.setItem('websocketUrl', wsUrl);
            }
        };

        this.socket.onmessage = (event) => {
            console.log("WebSocket message received:", event);
            const data = JSON.parse(event.data);
            if (data.type === 'messageUpdated') {
                this.localEditMessage(data.messageId, data.newMessage);
                localStorage.setItem('messages', JSON.stringify(this.messages));
            } else if (data.type === 'messageDeleted') {
                this.localDeleteMessage(data.messageId);
                localStorage.setItem('messages', JSON.stringify(this.messages));
            }
            console.log("WebSocket message data:", data);
        };

        this.socket.onclose = () => {
            console.log("initWebSocket WebSocket connection closed");
        };

        this.socket.onerror = (error) => {
            console.error("initWebSocket WebSocket error:", error);
        };
    }

    setCallback(callback: () => void) {
        this.updateDisplay = callback;
    }

    insertMessage(message: MessageContainer) {
        if (!Array.isArray(this.messages)) {
            this.messages = [];
        }
        
        const messageID = message.id;

        if (this.earliestMessageID > messageID) {
            this.earliestMessageID = messageID;

        }

        if (this.messages.length === 0) {
            this.messages.push(message);
            console.log(`inserted message ${messageID} into empty array`)
            return;
        }

        if (messageID > this.messages[0].id) {
            this.messages.unshift(message);
            console.log(`inserted message ${messageID} at the beginning of the array`)

            return;
        }

        if (messageID < this.messages[this.messages.length - 1].id) {
            this.messages.push(message);
            console.log(`inserted message ${messageID} at the end of the array`)
            this.previousMessagesFetched = true;

            return;
        }
        // console.log(`Message is not inserted ${messageID}`)
    }

    insertMessages(messages: MessageContainer[]) {
        if (!messages || messages.length === 0) {
            console.log("No messages to insert");
            return;
        }

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            this.insertMessage(message);

        }
        this.updateDisplay();
    }

    localEditMessage(messageId: number, newContent: string) {
        let messageFound = false;
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].id === messageId) {
                this.messages[i].message = newContent;
                messageFound = true;
                break;
            }
        }
    
        if (messageFound) {
            console.log("Message edited:", messageId);
        } else {
            console.log("ChatClient Message not found for editing:", messageId);
        }
        this.notifyUpdate();
    }

    localDeleteMessage(messageId: number) {
        const initialLength = this.messages.length;
        this.messages = this.messages.filter(message => message.id !== messageId);
    
        if (this.messages.length < initialLength) {
            console.log("Message deleted:", messageId);
        } else {
            console.log("Message not found for deletion:", messageId);
        }
        this.notifyUpdate();
    }

    /** 
     * get the last 10 messages from the server if the paging token is empty
     * get the next 10 messages from the server if the paging token is not empty
     */
    getMessages(pagingToken: string = '') {
        const url = `${this._baseURL}/messages/get/`;

        const fetchURL = `${url}${pagingToken}`;
        fetch(fetchURL)
            .then(response => response.json())
            .then((messagesContainer: MessagesContainer) => {
                let messages = messagesContainer.messages;
                this.insertMessages(messages);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    /**
     * get the messages once a second
     */
    getMessagesContinuously() {
        console.log("getMessagesContinuously()");
        setInterval(() => {
            this.getMessages();
        }, 1000);

    }

    getNextMessages() {
        console.log("getNextMessages()");
        console.log(`this.earliestMessageID: ${this.earliestMessageID - 1}`, this.earliestMessageID, this.messages[this.messages.length - 1].id);
        const nextMessageToFetch = this.earliestMessageID - 1;
        const pagingToken = `__${nextMessageToFetch.toString().padStart(10, '0')}__`;
        this.getMessages(pagingToken);
    }

    sendMessage(user: string, message: string) {
        console.log("sentMessage()", this.messages);
        const url = `${this._baseURL}/message/${user}/${message}`;

        fetch(url)
            .then(response => response.json())
            .then((messagesContainer: MessagesContainer) => {
                let messages = messagesContainer.messages;
                this.insertMessages(messages);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    // async deleteMessage(messageId: number) {
    //     this.localDeleteMessage(messageId);
    
    //     const url = `${this._baseURL}/messages/delete/${messageId}`;
    //     fetch(url, { method: 'DELETE' })
    //         .then(response => response.json())
    //         .then((messagesContainer: MessagesContainer) => {
    //             this.messages = messagesContainer.messages;
    //         })
    //         .catch(error => {
    //             console.error('Error deleting message:', error);
    //             throw error;
    //         });
    // }
    

    // async editMessage(messageId: number, newMessage: string) {
    //     console.log("editMessage()", messageId, newMessage);
    //     this.localEditMessage(messageId, newMessage);

    //     const url = `${this._baseURL}/message/update/${messageId}`;
    //     const requestOptions = {
    //         method: 'PUT',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ newMessage: newMessage })
    //     };

    //     fetch(url, requestOptions)
    //         .then(response => response.json())
    //         .then((messagesContainer: MessagesContainer) => {
    //             console.log("messagesContainer:", messagesContainer);
    //             this.messages = messagesContainer.messages;
    //             // this.notifyUpdate();
    //         })
    //         .catch(error => {
    //             console.error('Error updating message:', error);
    //             throw error;
    //         });
    // }   
    editMessage(messageId: number, newMessage: string) {
        console.log("editMessage()", messageId, newMessage);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("WebSocket is initialized.");
            const messageData = {
                type: 'edit_message',
                content: { messageId, newMessage }
            };
            this.socket.send(JSON.stringify(messageData));
            console.log(JSON.stringify(messageData));
        } else {
            console.error("WebSocket is not initialized.");
        }
    }
    
    deleteMessage(messageId: number) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'delete_message',
                content: { messageId }
            };
            this.socket.send(JSON.stringify(messageData));
        } else {
            console.error("WebSocket is not initialized.");
        }
    }


}

export default ChatClient;