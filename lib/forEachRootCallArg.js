/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule forEachRootCallArg
 * 
 */

'use strict';

/**
 * @internal
 *
 * Iterates over the identifying arguments in the supplied root call.
 * If the identifying value is null or undefined, the supplied callback will be
 * invoked once.
 */
function forEachRootCallArg(query, callback) {
  !!query.getBatchCall() ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'forEachRootCallArg(): Cannot iterate over batch call variables.') : require('fbjs/lib/invariant')(false) : void 0;
  function each(identifyingArgValue, fn) {
    if (Array.isArray(identifyingArgValue)) {
      identifyingArgValue.forEach(function (value) {
        return each(value, fn);
      });
    } else {
      fn({
        identifyingArgValue: identifyingArgValue,
        identifyingArgKey: identifyingArgValue == null ? null : typeof identifyingArgValue === 'string' ? identifyingArgValue : require('./stableStringify')(identifyingArgValue)
      });
    }
  }
  var identifyingArg = query.getIdentifyingArg();
  var identifyingArgValue = identifyingArg && identifyingArg.value || null;
  each(identifyingArgValue, callback);
}

module.exports = forEachRootCallArg;