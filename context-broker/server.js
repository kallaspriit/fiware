import { server as config } from './config';
import express from 'express';
import bodyParser from 'body-parser';
import serveStatic from 'serve-static';
import cors from 'cors';
import util from './lib/util';
import NotifyCondition from './lib/fiware/NotifyCondition';
import ContextBroker from './lib/fiware/ContextBroker';

// setup context broker
const contextBroker = new ContextBroker({
	url: config.brokerUrl
});

// create APP
const app = express();

// allow cors from all requests
app.use(cors());

// use json body parser
app.use(bodyParser.json({
	limit: '1mb'
}));

// serve static files from apps
app.use(serveStatic('apps', {
	index: 'index.html'
}));

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
				<strong>PUT /update/:entity/:attribute</strong>
			- updates given entity attribute with value defined in body json "value"
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
				<a href="/setup"><strong>GET /setup</strong></a>
				- creates the initial test entity or resets it if already exists
			</li>
			<li>
				<strong>PUT /update/lab/brightness</strong> {"value": 50}
				- updates lab brightness to 50 percent
			</li>
			<li>
				<a href="/info/lab"><strong>GET /info/lab</strong></a>
				- display lab information
			</li>
		</ul>
		
		<h2>Apps</h2>
		<ul>
			<li>
				<a href="/chart"><strong>GET /chart</strong></a>
				- displays live brightness chart from FIWARE, updated by a wireless Arduino YUN device.
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
		name: 'brightness',
		type: 'float',
		value: '0'
	}, {
		name: 'brightness-history',
		type: 'array',
		value: [[util.getIsoDate(), 0]]
	}, {
		name: 'brightness-count',
		type: 'number',
		value: '0'
	}, {
		name: 'last-updated',
		type: 'date',
		value: util.getIsoDate()
	}];
	
	contextBroker
		.createEntity(id, type, attributes)
		.then(handleQueryResponse())
	
		.then(contextBroker.createSubscription({
			entities: [{
				type: type,
				isPattern: false,
				id: id
			}],
			attributes: [
				'brightness',
				'brightness-history',
				'brightness-count',
				'last-updated'
			],
			reference: 'http://localhost:1028/aggregate/brightness',
			duration: 'P1M',
			notifyConditions: [{
				type: NotifyCondition.ONCHANGE,
				condValues: ['brightness', 'last-updated']
			}],
			// throttling: 'PT60S'
			throttling: 'PT1S'
		}))
		.then(handleQueryResponse(req, res))

		.catch(handleQueryError(req, res));
});

// provide test method
app.get('/info/:id', (req, res) => {
	logRequest(req);

	const id = req.params.id;

	contextBroker.fetchEntity(id)
		.then(handleQueryResponse(req, res))
		.catch(handleQueryError(req, res));
});

// update given entity attribute
app.put('/update/:entity/:attribute', (req, res) => {
	logRequest(req);

	const entity = req.params.entity;
	const attribute = req.params.attribute;
	const value = req.body.value;

	// contextBroker.updateEntityAttribute(entity, attribute, value)
	contextBroker.updateEntityAttributes(entity, {
		[attribute]: value,
		['last-updated']: util.getIsoDate()
	})
		.then(handleQueryResponse(req, res))
		.catch(handleQueryError(req, res));
});

// aggregates entity values
app.post('/aggregate/:valueAttributeName', (req, res) => {
	logRequest(req);

	const valueAttributeName = req.params.valueAttributeName;
	const historyAttributeName = valueAttributeName + '-history';
	const countAttributeName = valueAttributeName + '-count';
	const maxHistoryEntries = 1080; // save one every 60 seconds for a 7 day long history

	const info = req.body;

	info.contextResponses.forEach((contextResponse) => {
		const contextElement = contextResponse.contextElement;
		const attributes = contextElement.attributes;
		const valueAttribute = findAttribute(valueAttributeName, attributes, true);
		const historyAttribute = findAttribute(historyAttributeName, attributes, true);
		const countAttribute = findAttribute(countAttributeName, attributes, true);

		// add new value
		historyAttribute.value.push([util.getIsoDate(), valueAttribute.value]);

		// increment counter
		countAttribute.value = Number.parseInt(countAttribute.value, 10) + 1;

		// limit to last maxHistoryEntries values
		while (historyAttribute.value.length > maxHistoryEntries) {
			historyAttribute.value.shift();
		}

		// update entity attributes
		contextBroker.updateEntityAttributes(contextElement.id, {
			[historyAttributeName]: historyAttribute.value,
			[countAttributeName]: countAttribute.value
		})
			.then(handleQueryResponse(req, res))
			.catch(handleQueryError(req, res));
	});
});

// accept POST request and just mirror the data back
app.post('/mirror', (req, res) => {
	logRequest(req);

	res.send(formatJsonResponse('got request', req.body));
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
function handleQueryResponse(req, res) {
	return (response) => {
		if (res) {
			res.json(response);
		}

		return response;
	};
}

// handles query error
function handleQueryError(req, res) {
	return (response) => {
		if (res) {
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

			if (Number.isNaN(attribute.value)) {
				console.error('parsing "' + attribute.value + '" as an integer failed, using zero');

				attribute.value = 0;
			}

			break;

		case 'float':
			attribute.value = Number.parseFloat(attribute.value);

			if (Number.isNaN(attribute.value)) {
				console.error('parsing "' + attribute.value + '" as a float failed, using zero');

				attribute.value = 0;
			}

			break;

		case 'array':
			if (typeof attribute.value === 'string') {
				try {
					attribute.value = JSON.parse(attribute.value);
				} catch (e) {
					console.error('parsing "' + attribute.value + '" as an array failed, using empty array');

					attribute.value = [];
				}
			} else if (Array.isArray(attribute.value)) {
				// don't change anything if already an array
			} else {
				console.error('attribute "' + attribute.value + '" is not a string to parse, using empty array');

				attribute.value = [];
			}
			break;

		default:
			// do not change anything
	}

	return attribute;
}