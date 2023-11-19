import axios from "axios";
import fs from "fs";
import path from "path";
import { MessagesContainer, MessageContainer, serverPort } from "../../Engine/GlobalDefinitions";
import { get } from "http";
import { start } from "repl";
import { send } from "process";

// get the command line arguments

let baseURL = `http://localhost:${serverPort}`;

const args = process.argv.slice(2);

if (args.length === 1) {
  baseURL = args[0];
}
if (args.length !== 1) {
  console.error("Usage: node ServerTester serverURL[http://localhost:3005]");
  console.log(`using default serverURL: ${baseURL}`);
}

async function pingServer() {
  const url = `${baseURL}/ping`;
  const result = await axios.get(url);
  if (result.status !== 200) {
    return false;
  }
  return true;
}

async function resetTestData() {
  const url = `${baseURL}/reset`;
  return await axios.get(url);
}

async function sendTestMessage(message: string, user: string) {
  const url = `${baseURL}/message/${user}/${message}`;
  return await axios.get(url);
}

async function getMessages(pagingToken: string) {
  const url = `${baseURL}/messages/get/${pagingToken}`;
  const result = await axios.get(url);
  if (result.status !== 200) {
    return null;
  }
  return result.data as MessagesContainer;
}

async function testSendMessages(numberOfMessages: number) {
  const messages = [
    "Hello World",
    "This is a test",
    "This is a test of the emergency broadcast system",
    "This is only a test",
    "Had this been an actual emergency",
    "You would have been instructed",
    "Where to tune in your area",
    "This concludes this test of the emergency broadcast system",
  ];
  const users = ["Jose", "Bob", "Sally", "Jane", "Joe", "John", "Mary", "Sue"];

  const promises: Promise<any>[] = [];
  for (let i = 0; i < numberOfMessages; i++) {
    const message = messages[Math.floor(Math.random() * messages.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    promises.push(sendTestMessage(message, user));
  }

  return Promise.all(promises);
}

async function testGetMessages(
  testName: string,
  startToken: number | undefined = undefined
): Promise<MessagesContainer | undefined> {
  let paginationToken = "";

  let messagesFound: MessageContainer[] = [];
  let messagesPackage: MessagesContainer | null = null;

  messagesPackage = await getMessages(paginationToken);

  if (!messagesPackage) {
    console.error("Error getting messages");
    return;
  }

  return messagesPackage;
}

if (!pingServer()) {
  console.error(`Server not running at ${baseURL}`);
  process.exit(1);
} else {         
  console.log(`Server running at ${baseURL}`);
}

async function fetchAllMessages() {
    let fetchRounds = 0;
    let totalFetched = 0;
    let fetchedToken = "";
    let fetchResult = { totalFetched: 0, fetchRounds: 0 };
  
    do {
      let messagesPackage = await getMessages(fetchedToken);
      if (messagesPackage && messagesPackage.messages.length > 0) {
        fetchedToken = messagesPackage.paginationToken;
        totalFetched += messagesPackage.messages.length;
        fetchRounds++;
      } else {
        fetchedToken = "__END__";
      }
    } while (fetchedToken !== "__END__");
  
    fetchResult.totalFetched = totalFetched;
    fetchResult.fetchRounds = fetchRounds;
    console.log(`Test for ${fetchResult.totalFetched} messages: ${fetchResult.totalFetched} messages fetched in ${fetchResult.fetchRounds} steps.`);
    return fetchResult;
  }

describe("Server Functionality Tests", () => {
  beforeAll(async () => {
    const serverRunning = await pingServer();
    if (!serverRunning) {
      throw new Error("Server is not running at " + baseURL);
    }
    console.log(`Server running at ${baseURL}`);
  });

  beforeEach(async () => {
    await resetTestData();
  });

  it("should successfully send and fetch a single message", async () => {
    await testSendMessages(1);
    const messages = await getMessages("");
    expect(messages).not.toBeNull();
    expect(messages?.messages.length).toBe(1);
  });

  it("should successfully send and fetch 10 messages", async () => {
    await testSendMessages(10);
    const messages = await getMessages("");
    expect(messages).not.toBeNull();
    expect(messages?.messages.length).toBe(10);
  });

  it("should successfully send and fetch 11 messages", async () => {
    await testSendMessages(11);
    const fetchResult = await fetchAllMessages();
    expect(fetchResult.totalFetched).toBe(11);
  });

  it("should successfully send and fetch 201 messages", async () => {
    await testSendMessages(201);
    const fetchResult = await fetchAllMessages();
    expect(fetchResult.totalFetched).toBe(201);
  });
});




