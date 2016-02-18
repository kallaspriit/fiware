import request from 'request';
import inquirer from 'inquirer';

function promptCredentials() {
	return new Promise((resolve) => {
		inquirer.prompt([{
			type: 'input',
			name: 'username',
			message: 'Enter FIWARE username:'
		}, {
			type: 'password',
			name: 'password',
			message: 'Enter FIWARE password:'
		}], (answers) => {
		    const { username, password } = answers;

			resolve({
				username,
				password
			});
		});
	});
}

function fetchToken({ username, password }) {
	return new Promise((resolve) => {
		request({
			url: 'https://orion.lab.fiware.org/token',
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			json: {
				username: username,
				password: password
			}
		}, (error, response, body) => resolve({
			error,
			response,
			body
		}));
	});
}

function handleResponse({ error, response, body }) {
	if (error !== null) {
		throw new error;
	}

	if (response.statusCode === 200) {
		console.log('your access token is "' + body + '"');
	} else {
		console.warn('fetching access token failed (' + response.statusCode + ' - ' + body.message + ')');
	}
}

promptCredentials()
	.then(fetchToken)
	.then(handleResponse);