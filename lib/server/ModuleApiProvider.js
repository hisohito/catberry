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

module.exports = ModuleApiProvider;

var util = require('util'),
	ModuleApiProviderBase = require('../ModuleApiProviderBase');

util.inherits(ModuleApiProvider, ModuleApiProviderBase);

/**
 * Creates new instance of module API provider.
 * @param {ServiceLocator} $serviceLocator Service locator
 * to resolve dependencies.
 * @constructor
 * @extends ModuleApiProviderBase
 */
function ModuleApiProvider($serviceLocator) {
	ModuleApiProviderBase.call(this, $serviceLocator);

	Object.defineProperty(this, 'isBrowser', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: false
	});
	Object.defineProperty(this, 'isServer', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: true
	});
}

/**
 * Current list of redirects which were called of this context.
 * @type {string}
 */
ModuleApiProvider.prototype.redirectedTo = null;

/**
 * Determines if clearHash method was called of this context.
 * @type {Boolean}
 */
ModuleApiProvider.prototype.isHashCleared = false;

/**
 * Redirects current page to specified URL.
 * @param {string} locationUrl URL to direct.
 */
ModuleApiProvider.prototype.redirect = function (locationUrl) {
	this.redirectedTo = locationUrl;
};

/**
 * Clears current location's hash.
 */
ModuleApiProvider.prototype.clearHash = function () {
	this.isHashCleared = true;
};

/**
 * Does nothing because on server it is impossible.
 * @param {string} moduleName Name of module to render.
 * @param {string} placeholderName Name of placeholder to refresh.
 * @param {Function} callback Callback on finish.
 */
ModuleApiProvider.prototype.requestRefresh =
	function (moduleName, placeholderName, callback) {
		if (callback instanceof Function) {
			callback();
		}
	};

/**
 * Does nothing because on server it is impossible.
 * @param {string} moduleName Name of module to render.
 * @param {string} placeholderName Name of placeholder to refresh.
 * @param {Function} callback Callback on finish.
 */
ModuleApiProvider.prototype.requestRender =
	function (moduleName, placeholderName, callback) {
		if (callback instanceof Function) {
			callback();
		}
	};