/* 
 * catberry
 *
 * Copyright (c) 2014 Denis Rechkunov and project contributors.
 *
 * catberry's license follows:
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, 
 * publish, distribute, sublicense, and/or sell copies of the Software, 
 * and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * This license applies to all parts of catberry that are not externally
 * maintained libraries.
 */

'use strict';

var assert = require('assert'),
	events = require('events'),
	fs = require('fs'),
	path = require('path'),
	HttpResponse = require('../mocks/HttpResponse'),
	ServiceLocator = require('catberry-locator'),
	CookiesWrapper = require('../../lib/server/CookiesWrapper'),
	ModuleApiProvider = require('../../lib/server/ModuleApiProvider'),
	PageRenderer = require('../../lib/server/PageRenderer'),
	Logger = require('../mocks/Logger'),
	logger = new Logger(),
	eventBus = new events.EventEmitter(),
	locator = new ServiceLocator();

eventBus.on('error', logger.error);

locator.registerInstance('eventBus', eventBus);
locator.registerInstance('logger', logger);
locator.registerInstance('serviceLocator', locator);
locator.register('moduleApiProvider', ModuleApiProvider);
locator.register('cookiesWrapper', CookiesWrapper);
locator.register('moduleLoader', TestModuleLoader);

var currentPlaceholders = {};
var CASES_FOLDER = path.join(__dirname, '..', 'cases', 'server',
	'PageRenderer');

var testModules = [
	// fine module
	{
		$context: createContext('main'),
		render: function (placeholderName, callback) {
			callback(null, {});
		}
	},
	// send empty result
	{
		$context: createContext('main'),
		render: function (placeholderName, callback) {
			callback();
		}
	},
	// sends error
	{
		$context: createContext('main'),
		render: function (placeholderName, callback) {
			callback(new Error('test'));
		}
	},
	// throws error
	{
		$context: createContext('main'),
		render: function () {
			throw new Error('test');
		}
	},
	// async result
	{
		$context: createContext('main'),
		render: function (placeholderName, callback) {
			setTimeout(callback, 200);
		}
	}
];

function TestModuleLoader(index) {
	this._index = index;
}
TestModuleLoader.prototype._index = -1;
TestModuleLoader.prototype.loadModules = function (callback) {callback();};
TestModuleLoader.prototype.getModulesByNames = function () {
	return {
		main: {
			name: 'main',
			implementation: testModules[this._index],
			rootPlaceholder: currentPlaceholders.__index,
			placeholders: currentPlaceholders
		}
	};
};

TestModuleLoader.prototype.getPlaceholdersByIds = function () {
	var placeholdersByIds = {};
	Object.keys(currentPlaceholders)
		.forEach(function (placeholderName) {
			var id = 'main_' + placeholderName;
			placeholdersByIds[id] =
				currentPlaceholders[placeholderName];
		});
	return placeholdersByIds;
};

function compareWithExpected(caseName, stream, callback) {
	var fullPath = path.join(CASES_FOLDER, caseName, 'expected.html'),
		rendered = '',
		expected = '';

	stream.on('data', function (chunk) {
		rendered += chunk.toString();
	});

	stream.on('end', function () {

		var expectedStream = fs.createReadStream(fullPath);
		expectedStream.on('data', function (chunk) {
			expected += chunk.toString();
		});

		expectedStream.on('end', function () {
			callback(rendered === expected);
		});
	});
}

function checkIsEmpty(stream, callback) {
	var rendered = '';

	stream.on('data', function (chunk) {
		rendered += chunk.toString();
	});

	stream.on('end', function () {
		callback(rendered.length === 0);
	});
}

function createPlaceholdersForCase(caseName) {
	var fullPath = path.join(CASES_FOLDER, caseName, 'placeholders'),
		placeholderPaths = fs.readdirSync(fullPath),
		placeholders = {};

	placeholderPaths.forEach(function (placeholderPath) {
		if (/^\..+/.test(placeholderPath)) {
			return;
		}

		var basename = path.basename(placeholderPath, '.html'),
			streamGetter = function () {
				return fs.createReadStream(path.join(fullPath,
					placeholderPath));
			};

		if (basename === '__index') {
			placeholders.__index = {
				name: '__index',
				moduleName: 'main',
				getTemplateStream: streamGetter
			};
		} else {
			placeholders[basename] = {
				name: basename,
				moduleName: 'main',
				getTemplateStream: streamGetter
			};
		}
	});

	return placeholders;
}

function getRendererForModule(index) {
	locator.unregister('moduleLoader');
	locator.register('moduleLoader', TestModuleLoader, {index: index});
	return locator.resolveInstance(PageRenderer);
}

function checkCase(caseName, callback) {
	currentPlaceholders = createPlaceholdersForCase(caseName);
	var checkCounter = 0,
		pageRenderer1 = getRendererForModule(0),
		pageRenderer2 = getRendererForModule(1),
		pageRenderer3 = getRendererForModule(2),
		pageRenderer4 = getRendererForModule(3),
		pageRenderer5 = getRendererForModule(4),
		response1 = new HttpResponse(),
		response2 = new HttpResponse(),
		response3 = new HttpResponse(),
		response4 = new HttpResponse(),
		response5 = new HttpResponse();

	var callbackInvoker = function () {
		if (checkCounter === 5) {
			callback();
		}
	};

	var parameters = Object.create(locator.resolve('moduleApiProvider'));
	parameters.state = {};
	parameters.renderedData = {};
	parameters.cookies = locator.resolve('cookiesWrapper');

	pageRenderer1.render(response1, parameters,
		function () {
			assert.fail('Unexpected next middleware call');
		});

	pageRenderer2.render(response2, parameters,
		function () {
			assert.fail('Unexpected next middleware call');
		});

	pageRenderer3.render(response3, parameters,
		function () {
			assert.fail('Unexpected next middleware call');
		});

	pageRenderer4.render(response4, parameters,
		function () {
			assert.fail('Unexpected next middleware call');
		});

	pageRenderer5.render(response5, parameters,
		function () {
			assert.fail('Unexpected next middleware call');
		});

	compareWithExpected(caseName, response1, function (isValid) {
		assert.strictEqual(isValid, true);
		checkCounter++;
		callbackInvoker();
	});

	checkIsEmpty(response2, function (isEmpty) {
		assert.strictEqual(isEmpty, false);
		checkCounter++;
		callbackInvoker();
	});

	// must be error description and stack trace
	checkIsEmpty(response3, function (isEmpty) {
		assert.strictEqual(isEmpty, false);
		checkCounter++;
		callbackInvoker();
	});

	// must be error description and stack trace
	checkIsEmpty(response4, function (isEmpty) {
		assert.strictEqual(isEmpty, false);
		checkCounter++;
		callbackInvoker();
	});

	checkIsEmpty(response5, function (isEmpty) {
		assert.strictEqual(isEmpty, false);
		checkCounter++;
		callbackInvoker();
	});
}

describe('server/PageRenderer', function () {
	describe('#render', function () {
		it('should properly render nested placeholders', function (done) {
			checkCase('case1', function () {
				done();
			});
		});

		it('should properly render sequence of placeholders', function (done) {
			checkCase('case2', function () {
				done();
			});
		});

		it('should properly render huge content in placeholder',
			function (done) {
				checkCase('case3', function () {
					done();
				});
			});
	});
});

function createContext(moduleName) {
	var locator = new ServiceLocator();
	locator.register('moduleApiProvider', ModuleApiProvider);
	locator.register('cookiesWrapper', CookiesWrapper);
	locator.registerInstance('serviceLocator', locator);
	locator.registerInstance('eventBus', new events.EventEmitter());
	var context = Object.create(locator.resolve('moduleApiProvider'));
	context.name = moduleName;
	context.state = {};
	context.renderedData = {};
	context.cookies = locator.resolve('cookiesWrapper');
	return context;
}