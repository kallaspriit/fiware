import request from 'request';
import Method from './Method';
import UpdateAction from './UpdateAction';

export default class ContextBroker {

	constructor({
		url,
		version = 'v1',
		token = null
	} = {}) {
		this._config = {
			url,
			version,
			token
		};
	}
	
	setAccessToken(token) {
		this._config.token = token;
	}

	query(method, token, path, data = {}) {
		return new Promise((resolve, reject) => {
			const baseUrl = this._config.url + '/' + this._config.version;
			const url = baseUrl + '/' + path;
			const headers = {
				'Accept': 'application/json'
			};
			const hasParameters = Object.keys(data).length > 0;

			if (token) {
				headers['X-Auth-Token'] = token;
			}

			const requestInfo = {
				url: url,
				method: method,
				headers: headers
			};

			headers['Content-Type'] = 'application/json';

			if (hasParameters) {

				requestInfo.json = data;
			}

			console.log('making request\n' + JSON.stringify(requestInfo, null, '  '));
	
			request(requestInfo, (error, response, body) => {
				if (error !== null) {
					throw error;
				}
	
				if (response.statusCode !== 200) {
					const message = body && body.message ? body.message : 'n/a';

					reject({
						error: true,
						code: response.statusCode,
						message: 'querying broker failed (' + response.statusCode + ' - ' + message + ')'
					});
				}

				if (typeof body === 'string' && body.substr(0, 1) === '{') {
					try {
						body = JSON.parse(body);
					} catch (e) {
						// ignore
					}
				}

				console.log('got response\n' + JSON.stringify(body, null, '  ') + '\n');

				if (body && body.errorCode) {
					reject(body);
				} else {
					resolve(body);
				}
			});
		});
	}

	fetchEntity(id, asObjectMap = true) {
		return this.query(
			Method.POST,
			this._config.token,
			'queryContext' + (asObjectMap ? '?attributeFormat=object' : ''), {
				entities: [{
					isPattern: false,
					id: id
				}]
			}
		);
	}

	createEntityX(id, type, attributes) {
		return this.query(
			Method.POST,
			this._config.token,
			'contextEntities/type/' + type + '/id/' + id, {
				attributes: attributes
			}
		);
	}
	
	createEntity(id, type, attributes, updateAction = UpdateAction.APPEND) {
		return this.query(
			Method.POST,
			this._config.token,
			'updateContext', {
				contextElements: [{
					type: type,
					id: id,
					attributes: attributes
				}],
				updateAction: updateAction
			}
		);
	}

	createSubscription({
		entities = [],
		attributes = [],
		reference = 'http://example.com',
		duration = 'P1M', // ISO_8601 https://en.wikipedia.org/wiki/ISO_8601
		notifyConditions = [{
			type: 'ONCHANGE',
			condValues: []
		}],
		throttling = 'PT1S'
	}) {
		return this.query(
			Method.POST,
			this._config.token,
			'subscribeContext', {
				entities: entities,
				attributes: attributes,
				reference: reference,
				duration: duration,
				notifyConditions: notifyConditions,
				throttling: throttling
			}
		);
	}

	updateEntityAttribute(id, attribute, value) {
		return this.query(
			Method.PUT,
			this._config.token,
			'contextEntities/' + id + '/attributes/' + attribute, {
				value: this.serializeValue(value)
			}
		);
	}

	updateEntityAttributes(id, attributes) {
		return this.query(
			Method.PUT,
			this._config.token,
			'updateContext', {
				contextElements: [{
					id: id,
					isPattern: false,
					attributes: Object.keys(attributes).map((attributeName) => {
						return {
							name: attributeName,
							value: attributes[attributeName]
						};
					})
				}]
			}
		);
	}

	serializeValue(value) {
		const type = typeof value;
		const normalTypes = ['number', 'string'];

		if (normalTypes.indexOf(type) !== -1) {
			return value;
		}

		return JSON.stringify(value);
	}

}