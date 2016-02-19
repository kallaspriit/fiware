/* global Promise */
import fs from 'fs';
import request from 'request';
import inquirer from 'inquirer';

const config = {
	api: {
		url: 'https://orion.lab.fiware.org',
		broker: {
			url: 'http://orion.lab.fiware.org',
			port: '1026',
			version: 'v1'
		},
		token: null // this will be populated automatically
	}
};

const Method = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT'
};

function loadCredentialsFromFile() {
	try {
		const info = JSON.parse(fs.readFileSync('credentials.json', 'UTF8'));

		return {
			username: info.username || null,
			password: info.password || null
		};
	} catch (e) {
		return {
			username: null,
			password: null
		};
	}
}

function storeCredentialsToFile(username, password) {
	fs.writeFileSync(
		'credentials.json',
		JSON.stringify({
			username,
			password
		}, null, '\t')
	);
}

function promptCredentials() {
	return new Promise((resolve) => {
		const fileCredentials = loadCredentialsFromFile();

		inquirer.prompt([{
			type: 'input',
			name: 'username',
			message: 'Enter FIWARE username:',
			default: fileCredentials.username
		}, {
			type: 'password',
			name: 'password',
			message: 'Enter FIWARE password:',
			default: fileCredentials.password
		}], (answers) => {
			const { username, password } = answers;

			storeCredentialsToFile(username, password);

			resolve({
				username,
				password
			});
		});
	});
}

function queryApi(method, path, data) {
	return new Promise((resolve) => {
		request({
			url: config.api.url + '/' + path,
			method: method,
			headers: {
				'Content-type': 'application/json'
			},
			json: data
		}, (error, response, body) => {
			if (error !== null) {
				throw error;
			}

			if (response.statusCode !== 200) {
				throw new Error('fetching access token failed (' + response.statusCode + ' - ' + body.message + ')');
			}

			resolve(body);
		});
	});
}

function queryBroker(method, token, path, data = {}) {
	return new Promise((resolve) => {
		const baseUrl = config.api.broker.url + ':' + config.api.broker.port + '/' + config.api.broker.version;
		const url = baseUrl + '/' + path;

		request({
			url: url,
			method: method,
			json: data,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, (error, response, body) => {
			if (error !== null) {
				throw error;
			}

			if (response.statusCode !== 200) {
				throw new Error('querying broker failed (' + response.statusCode + ' - ' + body.message + ')');
			}

			resolve(body);
		});
	});
}

function fetchToken({ username, password }) {
	return queryApi(
		Method.POST,
		'token', {
			username: username,
			password: password
		}
	);
}

function fetchEntity(name) {
	return queryBroker(
		Method.GET,
		config.api.token,
		'contextEntities/' + name
	);
}

function createEntity(id, attributes) {
	return queryBroker(
		Method.POST,
		config.api.token,
		'contextEntities/' + id,
		{
			attributes: attributes
		}
	);
}

function updateEntityAttribute(id, attribute, value) {
	return queryBroker(
		Method.PUT,
		config.api.token,
		'contextEntities/' + id + '/attributes/' + attribute,
		{
			value: value
		}
	);
}

function handleToken(token) {
	config.api.token = token;

	console.log('your access token is "' + token + '"');
}

function handleResponse(name) {
	return (response) => {
		const responseText = JSON.stringify(response, null, '  ') + '\n';

		console.log(name, responseText);
	};
}

function generateUniqueId() {
	return Math.floor(Math.random() * 1000000000);
}

const uniqueEntityId = 'TestEntity-' + generateUniqueId();

// ask for user username/password
promptCredentials()

	// fetch, remember and display the access token
	.then(fetchToken)
	.then(handleToken)

	// fetch and display traffic sensor info
	.then(() => fetchEntity('urn:smartsantander:testbed:357'))
	.then(handleResponse('sound level meter'))

	// fetch and display traffic sensor info
	.then(() => fetchEntity('urn:smartsantander:testbed:3332'))
	.then(handleResponse('traffic sensor'))

	// create a new entity
	.then(() => createEntity(uniqueEntityId, [{
		name: 'city_location',
		type: 'city',
		value: 'Tartu'
	}, {
		name: 'temperature',
		type: 'float',
		value: '3.2'
	}]))
	.then(handleResponse('created entity "' + uniqueEntityId + '"'))

	// fetch created sensor info
	.then(() => fetchEntity(uniqueEntityId))
	.then(handleResponse('created sensor info'))

	// update created entity value
	.then(() => updateEntityAttribute(uniqueEntityId, 'temperature', '-6.2'))
	.then(handleResponse('updated entity "' + uniqueEntityId + '"'))

	// fetch updated sensor info
	.then(() => fetchEntity(uniqueEntityId))
	.then(handleResponse('updated sensor info'))

	// handle any errors
	.catch((error) => {
		console.error(error.stack);
	});