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
export { };
import express from 'express';
import { Database } from '../Components/Database';
import { serverPort } from '../Components/Globals';



const database = new Database();




const app = express();
app.use(express.json());

// log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});



app.get('/reset', (req, res) => {
    console.log('get /reset');
    database.reset();
    return res.json({ message: 'reset' });
});

// this should technically not be a get since it modifies the server
app.get('/message/:user/:message', (req, res) => {
    const message = req.params.message;
    const user = req.params.user;
    console.log(`get /message/${message}/${user}`);
    database.addMessage(user, message);
    const result = database.getMessages('');
    return res.json(result);
});

app.get('/ping', (req, res) => {
    console.log('ping');
    return res.json({ message: 'pong' });
});

app.get('/', (req, res) => {
    const result = database.getMessages('');
    console.log('get /');
    return res.json(result);
});

app.get('/messages/getall', (req, res) => {
    const result = database.getAllMessages();
    console.log('get /messages/getall');
    return res.json(result);
});


app.get('/messages/get/:pagingToken?', (req, res) => {
    // if there is no :pagingToken, then it will be an empty string

    let pagingToken = req.params.pagingToken || '';

    const result = database.getMessages(pagingToken);
    console.log(`get /messages/get/${pagingToken}`);
    return res.json(result);
});


app.listen(serverPort, () => {
    console.log(`Server listening on port ${serverPort}!`);
});