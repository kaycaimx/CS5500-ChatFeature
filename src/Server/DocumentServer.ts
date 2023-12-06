/**
 * the server for the DocumentHolder
 * 
 * this is an express server that provides the following routes:
 * 
 * GET /documents
 * 
 * GET /documents/:name
 * 
 * PUT /document/request/cell/:name/:cell
 * 
 * PUT /document/release/token/:name/:token
 * 
 * PUT /document/add/token/:name/:token
 * 
 * PUT /document/add/cell/:name/:cell
 * 
 * PUT /document/remove/token/:name
 * 
 * PUT /document/clear/formula/:name
 * 
 * GET /document/formula/string/:name
 * 
 * GET /document/result/string/:name
 * 
 * GET /document/editstatus/:name
 */
/** 
 * express server to serve the app.  paths for this are
 * /api/ - api routes
 * 
 * /reset - resets the database
 * 

 * /message/send
 * 
 * /messages/get/
 */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { DocumentHolder } from '../Engine/DocumentHolder';
import { Database } from '../Engine/Database';
import { serverPort } from '../Engine/GlobalDefinitions';

import { Server } from 'http';
import WebSocket from 'ws';
import { MessageContainer, MessagesContainer } from '../Engine/GlobalDefinitions';

// define a debug flag to turn on debugging
let debug = true;

// define a shim for console.log so we can turn off debugging
if (!debug) {
    console.log = () => { };
}


const app = express();

const server = new Server(app);
const wss = new WebSocket.Server({ server });
let messages: MessageContainer[] = [];

wss.on('connection', function connection(ws) {
    console.log("A client connected");
    ws.on('message', function incoming(message) {
        console.log("Received:", message);
        const data = JSON.parse(message.toString());

        switch(data.type) {
            case 'edit_message':
                console.log("Switch edit log", data.content)
                editMessage(data.content.messageId, data.content.newMessage);
                broadcast({ type: 'message_edited', messageId: data.content.messageId, messages: messages });
                break;
            case 'delete_message':
                deleteMessageById(data.content.messageId);
                broadcast({ type: 'message_deleted', messageId: data.content.messageId, messages: messages });
                break;
        }
    });

    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });
});

// 广播函数
function broadcast(data: { type: string; messageId: number; messages: MessageContainer[]; }) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// 编辑消息
async function editMessage(messageId: number, newMessageText: string) {
    try {
        const success = await database.editMessage(messageId, newMessageText);

        if (success) {
            const messagesContainer = await database.getAllMessages();
            broadcast({ type: 'message_edited', messageId, messages: messagesContainer.messages });
        } else {
            console.log("Message not found for editing:", messageId);
        }
    } catch (error) {
        console.error("Error editing message:", error);
    }
}

// 删除消息
async function deleteMessageById(messageId: number) {
    try {
        const success = await database.deleteMessageById(messageId);

        if (success) {
            const messagesContainer = await database.getAllMessages();
            broadcast({ type: 'message_deleted', messageId, messages: messagesContainer.messages });
        } else {
            console.log("Message not found for deletion:", messageId);
        }
    } catch (error) {
        console.error("Error deleting message:", error);
    }
}


server.listen(serverPort, () => {
    console.log(`Server and WebSocket now listening on port ${serverPort}`);
});

app.use(cors());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(bodyParser.json());

// Add a middleware function to log incoming requests
app.use((req, res, next) => {
    if (debug) {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});




const documentHolder = new DocumentHolder();

// GET /documents
app.get('/documents', (req: express.Request, res: express.Response) => {
    const documentNames = documentHolder.getDocumentNames();
    res.send(documentNames);
});

// PUT /documents/:name
// userName is in the document body
app.put('/documents/:name', (req: express.Request, res: express.Response) => {
    console.log('PUT /documents/:name');
    const name = req.params.name;
    // get the userName from the body
    console.log(`PUT /documents/:name ${name}`);
    const userName = req.body.userName;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }


    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();


    if (documentNames.indexOf(name) === -1) {
        console.log(`Document ${name} not found, creating it`);
        documentHolder.createDocument(name, 5, 8, userName);
    }

    // get the document
    const document = documentHolder.getDocumentJSON(name, userName);

    res.status(200).send(document);
});

app.get('/debug', (req: express.Request, res: express.Response) => {
    debug = !debug
    console.log(`debug is ${debug}`);
    res.status(200).send(`debug is ${debug}`);

});

app.post('/documents/reset', (req: express.Request, res: express.Response) => {
    documentHolder.reset();
    res.status(200).send('reset');
});

app.post('/documents/create/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;

    // get the userName from the body
    const userName = req.body.userName;

    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        const documentOK = documentHolder.createDocument(name, 5, 8, userName);
    }
    documentHolder.requestViewAccess(name, 'A1', userName);
    const documentJSON = documentHolder.getDocumentJSON(name, userName);

    res.status(200).send(documentJSON);

});

app.put('/document/cell/edit/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;

    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name from the body
    // get the cell from the body
    const userName = req.body.userName;
    const cell = req.body.cell;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // request access to the cell
    const result = documentHolder.requestEditAccess(name, cell, userName);
    const documentJSON = documentHolder.getDocumentJSON(name, userName);

    res.status(200).send(documentJSON);
});

app.put('/document/cell/view/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;

    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name from the body
    const userName = req.body.userName;
    const cell = req.body.cell;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // request access to the cell
    const result = documentHolder.requestViewAccess(name, cell, userName);

    const documentJSON = documentHolder.getDocumentJSON(name, userName);

    res.status(200).send(documentJSON);
});

app.put('/document/addtoken/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;
    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name from the body, and get the token from the body
    const userName = req.body.userName;
    const token = req.body.token;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // add the
    const resultJSON = documentHolder.addToken(name, token, userName);


    res.status(200).send(resultJSON);
});

app.put('/document/addcell/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;


    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name  and the cell from the body
    const userName = req.body.userName;
    const cell = req.body.cell;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // add the token
    const resultJSON = documentHolder.addCell(name, cell, userName);


    res.status(200).send(resultJSON);
});

app.put('/document/removetoken/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;
    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name from the body
    const userName = req.body.userName;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // remove the tokenn
    const resultJSON = documentHolder.removeToken(name, userName);


    res.status(200).send(resultJSON);
});

// PUT /document/clear/formula/:name
app.put('/document/clear/formula/:name', (req: express.Request, res: express.Response) => {
    const name = req.params.name;
    // is this name valid?
    const documentNames = documentHolder.getDocumentNames();
    if (documentNames.indexOf(name) === -1) {
        res.status(404).send(`Document ${name} not found`);
        return;
    }
    // get the user name from the body
    const userName = req.body.userName;
    if (!userName) {
        res.status(400).send('userName is required');
        return;
    }
    // clear the formula
    const resultJSON = documentHolder.clearFormula(name, userName);

    res.status(200).send(resultJSON);
});


const database = new Database();

app.use(express.json());

// // log all requests
// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next();
// });

// // enable CORS
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     next();
// });



app.get('/reset', (req: express.Request, res: express.Response) => {
    console.log('get /reset');
    database.reset();
    return res.json({ message: 'reset' });
});

// this should technically not be a get since it modifies the server
app.get('/message/:user/:message', (req: express.Request, res: express.Response) => {
    const message = req.params.message;
    const user = req.params.user;
    console.log(`get /message/${message}/${user}`);
    database.addMessage(user, message);
    const result = database.getMessages('');
    return res.json(result);
});

app.get('/ping', (req: express.Request, res: express.Response) => {
    console.log('ping');
    return res.json({ message: 'pong' });
});

app.get('/chat/', (req: express.Request, res: express.Response) => {
    const result = database.getMessages('');
    console.log('get /chat/');
    return res.json(result);
});

app.get('/messages/getall', (req: express.Request, res: express.Response) => {
    const result = database.getAllMessages();
    console.log('get /messages/getall');
    return res.json(result);
});


app.get('/messages/get/:pagingToken?', (req: express.Request, res: express.Response) => {
    // if there is no :pagingToken, then it will be an empty string

    let pagingToken = req.params.pagingToken || '';

    const result = database.getMessages(pagingToken);
    console.log(`get /messages/get/${pagingToken}`);
    return res.json(result);
});

// app.delete('/messages/delete/:messageId', (req, res) => {
//     const messageId = parseInt(req.params.messageId);
//     const isDeleted = database.deleteMessageById(messageId);

//     if (isDeleted) {
//         res.status(200).json({ message: "Message deleted successfully." });
//     } else {
//         res.status(404).json({ error: "Message not found." });
//     }
// });

// app.put('/message/update/:messageId', (req, res) => {
//     const messageId = parseInt(req.params.messageId);
//     const newMessage = req.body.newMessage; 

//     if (!newMessage) {
//         return res.status(400).json({ error: "No new message provided." });
//     }

//     const isUpdated = database.editMessage(messageId, newMessage);

//     if (isUpdated) {
//         res.status(200).json({ message: "Message updated successfully." });
//     } else {
//         res.status(404).json({ error: "Message not found or not updated." });
//     }
// });


// start the app and test it
// app.listen(serverPort, () => {
//     console.log(`Server listening on port ${serverPort}!`);
// });

