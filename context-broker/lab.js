import config from './config';
import util from './lib/util';
import Api from './lib/fiware/Api';
import ContextBroker from './lib/fiware/ContextBroker';

// setup APIs
const api = new Api({
	url: config.apiUrl
});
const contextBroker = new ContextBroker({
	url: config.brokerUrl
});

// generate unique entity id
const uniqueEntityId = 'TestEntity-' + generateUniqueId();

// ask for user username/password
promptCredentials()

	// fetch, remember and display the access token
	.then(({ username, password }) => api.fetchToken(username, password))
	.then(handleTokenResponse)

	// fetch and display traffic sensor info
	.then(() => contextBroker.fetchEntity('urn:smartsantander:testbed:357'))
	.then(handleQueryResponse('sound level meter'))

	// fetch and display traffic sensor info
	.then(() => contextBroker.fetchEntity('urn:smartsantander:testbed:3332'))
	.then(handleQueryResponse('traffic sensor'))

	// create a new entity
	.then(() => contextBroker.createEntity(uniqueEntityId, [{
		name: 'city_location',
		type: 'city',
		value: 'Tartu'
	}, {
		name: 'temperature',
		type: 'float',
		value: 3.2
	}]))
	.then(handleQueryResponse('created entity "' + uniqueEntityId + '"'))

	// fetch created sensor info
	.then(() => contextBroker.fetchEntity(uniqueEntityId))
	.then(handleQueryResponse('created sensor info'))

	// update created entity value
	.then(() => contextBroker.updateEntityAttribute(uniqueEntityId, 'temperature', -6.2))
	.then(handleQueryResponse('updated entity "' + uniqueEntityId + '"'))

	// fetch updated sensor info
	.then(() => contextBroker.fetchEntity(uniqueEntityId))
	.then(handleQueryResponse('updated sensor info'))

	// handle any errors
	.catch((error) => {
		console.error(error.stack);
	});


// prompts for user credentials
function promptCredentials() {
	const credentialsFilename = 'credentials.json';
	const credentials = util.loadJSON(credentialsFilename);

	return util.prompt([{
		type: 'input',
		name: 'username',
		message: 'Enter FIWARE username:',
		default: credentials.username
	}, {
		type: 'password',
		name: 'password',
		message: 'Enter FIWARE password:',
		default: credentials.password
	}]).then((answers) => {
		const { username, password } = answers;

		util.storeJSON(credentialsFilename, {
			username,
			password
		});

		return answers;
	});
}

// generates a unique identifier
function generateUniqueId() {
	return Math.floor(Math.random() * 1000000000);
}

// handles token response
function handleTokenResponse(token) {
	config.token = token;

	contextBroker.setAccessToken(token);

	console.log('your access token is "' + token + '"');
}

// handles query response
function handleQueryResponse(name) {
	return (response) => {
		const responseText = JSON.stringify(response, null, '  ') + '\n';

		console.log(name, responseText);
	};
}