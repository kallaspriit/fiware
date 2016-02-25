import { server as config } from './config';
import express from 'express';
import bodyParser from 'body-parser';
import NotifyCondition from './lib/fiware/NotifyCondition';
import ContextBroker from './lib/fiware/ContextBroker';

// setup context broker
const contextBroker = new ContextBroker({
	url: config.brokerUrl
});

// create APP
const app = express();

// use json body parser
app.use(bodyParser.json());

// provide some helpful information on default route
app.get('/', (req, res) => {
	logRequest(req);

	res.send(`
		<h1>Fiware test server</h1>
		<h2>Supported methods</h2>
		<ul>
			<li>
				<strong>GET /</strong>
				- displays this help information
			</li>
			<li>
				<strong>GET /setup</strong>
				- setups test data for empty context broker
			</li>
			<li>
				<strong>GET /update-temperature/:value</strong>
			- updates lab temperature to given value
			</li>
			<li>
				<strong>GET /info/:id</strong>
				- displays entity info
				</li>
			<li>
				<strong>POST /mirror</strong>
				- renders requested JSON request in response and in console
			</li>
			<li>
				<strong>POST /aggregate/:valueAttributeName/:historyAttributeName/:maxHistoryEntries</strong>
				- aggregates changed values to an array of last values
			</li>
		</ul>
		
		<h2>Examples</h2>
		<ul>
			<li>
				<a href="/update-temperature/20.2"><strong>GET /update-temperature/20.2</strong></a>
				- updates lab temperature to 20.2 degrees
			</li>
			<li>
				<a href="/info/lab"><strong>GET /info/lab</strong></a>
				- display lab information
			</li>
		</ul>
	`);
});

// sets up the test data
app.get('/setup', (req, res) => {
	logRequest(req);

	const id = 'lab';
	const type = 'room';
	const attributes = [{
		name: 'temperature',
		type: 'float',
		value: '0'
	}, {
		name: 'temperature-history',
		type: 'array',
		value: '[]'
	}, {
		name: 'pressure',
		type: 'integer',
		value: '0'
	}, {
		name: 'pressure-history',
		type: 'array',
		value: '[]'
	}];
	
	contextBroker
		.createEntity(id, type, attributes)
		.then(handleQueryResponse('created entity "' + id + '" of type "' + type + '"'))
	
		.then(contextBroker.createSubscription({
			entities: [{
				type: type,
				isPattern: false,
				id: id
			}],
			attributes: [
				'temperature',
				'temperature-history'
			],
			reference: 'http://http://localhost:1028/aggregate/temperature/temperature-history/100',
			duration: 'P1M',
			notifyConditions: [{
				type: NotifyCondition.ONCHANGE,
				condValues: ['temperature']
			}],
			throttling: 'PT5S'
		}))
		.then(handleQueryResponse('setup test data', res));
});

// updates lab temperature
app.get('/update-temperature/:value', (req, res) => {
	logRequest(req);

	const temperature = req.params.value;

	contextBroker.updateEntityAttribute('lab', 'temperature', temperature)
		.then(handleQueryResponse('updated temperature to "' + temperature + '" degrees', res));
});

// provide test method
app.get('/info/:id', (req, res) => {
	logRequest(req);

	const id = req.params.id;

	contextBroker.fetchEntity(id)
		.then(handleQueryResponse('entity "' + id + '"', res));
});

// accept POST request and just mirror the data back
app.post('/mirror', (req, res) => {
	logRequest(req);

	res.send(formatJsonResponse('got request', req.body));
});

// aggregates temperature measurements
app.post('/aggregate/:valueAttributeName/:historyAttributeName/:maxHistoryEntries', (req, res) => {
	logRequest(req);

	const valueAttributeName = req.params.valueAttributeName;
	const historyAttributeName = req.params.historyAttributeName;
	const maxHistoryEntries = Number.parseInt(req.params.maxHistoryEntries, 10);

	const info = req.body;

	info.contextResponses.forEach((contextResponse) => {
		const contextElement = contextResponse.contextElement;
		const attributes = contextElement.attributes;
		const valueAttribute = findAttribute(valueAttributeName, attributes, true);
		const historyAttribute = findAttribute(historyAttributeName, attributes, true);

		// add new value
		historyAttribute.value.push(valueAttribute.value);

		// limit to last maxHistoryEntries values
		while (historyAttribute.value.length > maxHistoryEntries) {
			historyAttribute.value.shift();
		}

		// update the history parameter
		contextBroker.updateEntityAttribute(contextElement.id, historyAttributeName, historyAttribute.value)
			.then(handleQueryResponse(
				'aggregated ' + contextElement.id + ' ' + valueAttributeName + ' to ' + historyAttributeName,
				res
			));
	});
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
function handleQueryResponse(name, res) {
	return (response) => {
		if (res) {
			// res.setHeader('Content-Type', 'text/html');
			// res.send(formatJsonResponse(name, response));
			res.json(response);
		}

		return response;
	};
}

// formats JSON response to HTML
function formatJsonResponse(name, response) {
	const responseText = JSON.stringify(response, null, '\t');

	return `
		<h1>${name}</h1>
		<pre>${responseText}</pre>
	`;
}

// searches for an attribute from an array of attributes by name, returns null if not found
function findAttribute(name, attributes, isRequired = false) {
	const attribute = attributes.find((item) => item.name === name);

	if (!attribute) {
		if (isRequired) {
			throw new Error('Attribute called "' + name + '" could not be found in ' + JSON.stringify(attributes));
		}

		return null;
	}

	return parseAttribute(attribute);
}

// parses attribute value by type
function parseAttribute(attribute) {
	switch (attribute.type) {
		case 'integer':
			attribute.value = Number.parseInt(attribute.value, 10);
			break;

		case 'float':
			attribute.value = Number.parseFloat(attribute.value);
			break;

		case 'array':
			attribute.value = JSON.parse(attribute.value);
			break;

		default:
			// do not change anything
	}

	return attribute;
}