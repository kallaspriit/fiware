import { server as config } from './config';
import express from 'express';
import bodyParser from 'body-parser';
import ContextBroker from './lib/fiware/ContextBroker';

// setup context broker
const contextBroker = new ContextBroker({
	url: config.brokerUrl
});

// create APP
const app = express();

// use json body parser
app.use(bodyParser.json());

// provide default
app.get('/', (req, res) => {
	logRequest(req);

	res.send('Hello!');
});

// provide test method
app.get('/test', (req, res) => {
	logRequest(req);

	const randomTemp = Math.round(Math.random() * 20 * 10) / 10;

	contextBroker.updateEntityAttribute('lab', 'temperature', randomTemp)
		.then(handleQueryResponse('updated temperature'))
		.then((response) => {
			const output = 'updated temperature to "' + randomTemp + '"\n' + JSON.stringify(response, null, '  ');

			console.log(output);

			res.send(output);
		});
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

// handles query response
function handleQueryResponse(name) {
	return (response) => {
		const responseText = JSON.stringify(response, null, '  ') + '\n';

		console.log(name, responseText);

		return response;
	};
}