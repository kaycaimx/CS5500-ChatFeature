import ChatClient from '../../Engine/ChatClient';
import {MessagesContainer, MessageContainer } from '../../Engine/GlobalDefinitions';




describe("ChatClient", () => {

//   beforeEach(() => {
//    const chatClient = new ChatClient();
//   });

  describe("constructor", () => {
      it("should initialize with default values", () => {
        const chatClient = new ChatClient();
        expect(chatClient.earliestMessageID).toEqual(10000000000);
        expect(chatClient.previousMessagesFetched).toBe(false);
        expect(chatClient.messages).toEqual([]);
        expect(typeof chatClient.updateDisplay).toBe('function');
    });
  });

  describe("setCallback", () => {
      it("should set a callback function", () => {
        const chatClient = new ChatClient();
        const mockCallback = jest.fn();
        chatClient.setCallback(mockCallback);
        expect(chatClient.updateDisplay).toBe(mockCallback);
    });
  });

  describe("insertMessage", () => {
      it("should insert a message into an empty messages array", () => {
        const chatClient = new ChatClient();
         const message = {
        user: "user1",
        message: "Hello",
        timestamp: new Date(),
        id: 1
      };
      chatClient.insertMessage(message);
      expect(chatClient.messages).toContain(message);
    });

    // Additional tests for different scenarios of insertMessage
  });

    describe("insertMessages", () => {
      it("should insert multiple messages", () => {
        const chatClient = new ChatClient();
       const messages = [
        { user: "user1", message: "Hello", timestamp: new Date(), id: 1 },
        { user: "user2", message: "Hi there", timestamp: new Date(), id: 2 }
      ];
      chatClient.insertMessages(messages);
      expect(chatClient.messages).toEqual(expect.arrayContaining(messages));
      });
  });
    
    describe("insertMessage", () => {

    it("should insert a message at the end of the array if its ID is less than the last message's ID", () => {
        const chatClient = new ChatClient();
        const firstMessage = {
            user: "user1",
            message: "First message",
            timestamp: new Date(),
            id: 3 
        };
        const secondMessage = {
            user: "user2",
            message: "Second message",
            timestamp: new Date(),
            id: 2 // Lower ID
        };

        chatClient.insertMessage(firstMessage);
        chatClient.insertMessage(secondMessage);

        expect(chatClient.messages).toHaveLength(2);
        expect(chatClient.messages[1]).toBe(secondMessage); // secondMessage should be at the end
        expect(chatClient.previousMessagesFetched).toBe(true);
    });
});
    describe("getMessagesContinuously", () => {
    it("should call getMessages at regular intervals", () => {
        jest.useFakeTimers();
        const chatClient = new ChatClient();
        const getMessagesSpy = jest.spyOn(chatClient, 'getMessages');

        chatClient.getMessagesContinuously();

        jest.advanceTimersByTime(3000); // Fast-forward time

        expect(getMessagesSpy).toHaveBeenCalledTimes(6);

        jest.clearAllTimers();

        jest.useRealTimers();
        getMessagesSpy.mockRestore();
    });
    });
    
    describe("getNextMessages", () => {
    it("should call getMessages with the correct paging token", () => {
        const chatClient = new ChatClient();
        const getMessagesSpy = jest.spyOn(chatClient, 'getMessages');

        chatClient.messages = [{ user: "user1", message: "Hello", timestamp: new Date(), id: 10 }];
        chatClient.earliestMessageID = 10;

        chatClient.getNextMessages();

        expect(getMessagesSpy).toHaveBeenCalledWith("__0000000009__");
        getMessagesSpy.mockRestore();
    });
    });

    describe("sendMessage", () => {
        it("should send a message and process the response", async () => {
            // Set up the mock response
            const mockResponse: MessagesContainer = {
                messages: [{ user: "user2", message: "Reply", timestamp: new Date(), id: 2 }],
                paginationToken: ""
            };

            // Mock the global fetch function
            global.fetch = jest.fn(() => 
                Promise.resolve({
                    json: () => Promise.resolve(mockResponse)
                })
            ) as jest.Mock;

            const chatClient = new ChatClient();

            // Call the sendMessage method
            await chatClient.sendMessage("user1", "Hello");

            // Assertions
            expect(global.fetch).toHaveBeenCalled();

            // Cleanup
            jest.clearAllMocks();
        });
    });
    







    
    



 

  // Remember to clean up any mocks or spies
  afterEach(() => {
    jest.restoreAllMocks();
  });
});
