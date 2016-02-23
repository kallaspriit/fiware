import express from 'express';
import bodyParser from 'body-parser';

// configuration
const config = {
	port: 1028
};

// create APP
const app = express();

// use json body parser
app.use(bodyParser.json());

// provide default
app.get('/', (req, res) => {
	logRequest(req);

	res.send('Hello!');
});

// accept POST request and just mirror the data back
app.post('/mirror', (req, res) => {
	logRequest(req);

	res.send('Got request\n' + JSON.stringify(req.body, null, '  '));
});

// start the server
app.listen(config.port, () => {
	console.log('server started on port ' + config.port);
});

// logs the request info to console
function logRequest(req) {
	console.log(req.method + ' ' + req.url + '\n' + JSON.stringify(req.body, null, '  ') + '\n\n');
}