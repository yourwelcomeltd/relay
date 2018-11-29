/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelaySelector
 * 
 */

'use strict';

var _assign2 = _interopRequireDefault(require('babel-runtime/core-js/object/assign'));

var _stringify2 = _interopRequireDefault(require('babel-runtime/core-js/json/stringify'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @public
 *
 * Given the result `item` from a parent that fetched `fragment`, creates a
 * selector that can be used to read the results of that fragment for that item.
 *
 * Example:
 *
 * Given two fragments as follows:
 *
 * ```
 * fragment Parent on User {
 *   id
 *   ...Child
 * }
 * fragment Child on User {
 *   name
 * }
 * ```
 *
 * And given some object `parent` that is the results of `Parent` for id "4",
 * the results of `Child` can be accessed by first getting a selector and then
 * using that selector to `lookup()` the results against the environment:
 *
 * ```
 * const childSelector = getSelector(queryVariables, Child, parent);
 * const childData = environment.lookup(childSelector).data;
 * ```
 */
function getSelector(operationVariables, fragment, item) {
  !(typeof item === 'object' && item !== null && !Array.isArray(item)) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragment.node.name, (0, _stringify2['default'])(item)) : require('fbjs/lib/invariant')(false) : void 0;
  var dataID = require('./RelayRecord').getDataIDForObject(item);
  var fragmentVariables = require('./RelayFragmentPointer').getVariablesForID(item, fragment.node.id);
  if (dataID != null && fragmentVariables != null) {
    return {
      dataID: dataID,
      node: fragment,
      variables: fragmentVariables
    };
  }
  process.env.NODE_ENV !== 'production' ? require('fbjs/lib/warning')(false, 'RelaySelector: Expected object to contain data for fragment `%s`, got ' + '`%s`. Make sure that the parent operation/fragment included fragment ' + '`...%s`.', fragment.node.name, (0, _stringify2['default'])(item), fragment.node.name) : void 0;
  return null;
}

/**
 * @public
 *
 * Given the result `items` from a parent that fetched `fragment`, creates a
 * selector that can be used to read the results of that fragment on those
 * items. This is similar to `getSelector` but for "plural" fragments that
 * expect an array of results and therefore return an array of selectors.
 */
function getSelectorList(operationVariables, fragment, items) {
  var selectors = null;
  items.forEach(function (item) {
    var selector = item != null ? getSelector(operationVariables, fragment, item) : null;
    if (selector != null) {
      selectors = selectors || [];
      selectors.push(selector);
    }
  });
  return selectors;
}

/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts the selectors for those fragments from the results.
 *
 * The canonical use-case for this function are Relay Containers, which
 * use this function to convert (props, fragments) into selectors so that they
 * can read the results to pass to the inner component.
 */
function getSelectorsFromObject(operationVariables, fragments, object) {
  var selectors = {};
  require('fbjs/lib/forEachObject')(fragments, function (fragment, key) {
    var item = object[key];
    if (item == null) {
      selectors[key] = item;
    } else if (fragment.node.metadata && fragment.node.metadata.plural === true) {
      !Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      selectors[key] = getSelectorList(operationVariables, fragment, item);
    } else {
      !!Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      selectors[key] = getSelector(operationVariables, fragment, item);
    }
  });
  return selectors;
}

/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts a mapping of keys -> id(s) of the results.
 *
 * Similar to `getSelectorsFromObject()`, this function can be useful in
 * determining the "identity" of the props passed to a component.
 */
function getDataIDsFromObject(fragments, object) {
  var ids = {};
  require('fbjs/lib/forEachObject')(fragments, function (fragment, key) {
    var item = object[key];
    if (item == null) {
      ids[key] = item;
    } else if (fragment.node.metadata && fragment.node.metadata.plural === true) {
      !Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      ids[key] = getDataIDs(fragment, item);
    } else {
      !!Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      ids[key] = getDataID(fragment, item);
    }
  });
  return ids;
}

/**
 * @internal
 */
function getDataIDs(fragment, items) {
  var ids = void 0;
  items.forEach(function (item) {
    var id = item != null ? getDataID(fragment, item) : null;
    if (id != null) {
      ids = ids || [];
      ids.push(id);
    }
  });
  return ids || null;
}

/**
 * @internal
 */
function getDataID(fragment, item) {
  !(typeof item === 'object' && item !== null && !Array.isArray(item)) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for fragment `%s` to be an object, got ' + '`%s`.', fragment.node.name, (0, _stringify2['default'])(item)) : require('fbjs/lib/invariant')(false) : void 0;
  var dataID = require('./RelayRecord').getDataIDForObject(item);
  if (dataID != null) {
    return dataID;
  }
  process.env.NODE_ENV !== 'production' ? require('fbjs/lib/warning')(false, 'RelaySelector: Expected object to contain data for fragment `%s`, got ' + '`%s`. Make sure that the parent operation/fragment included fragment ' + '`...%s`.', fragment.node.name, (0, _stringify2['default'])(item), fragment.node.name) : void 0;
  return null;
}

/**
 * @public
 *
 * Given a mapping of keys -> results and a mapping of keys -> fragments,
 * extracts the merged variables that would be in scope for those
 * fragments/results.
 *
 * This can be useful in determing what varaibles were used to fetch the data
 * for a Relay container, for example.
 */
function getVariablesFromObject(operationVariables, fragments, object) {
  var variables = {};
  require('fbjs/lib/forEachObject')(fragments, function (fragment, key) {
    var item = object[key];
    if (item == null) {
      return;
    } else if (fragment.node.metadata && fragment.node.metadata.plural === true) {
      !Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an array, got `%s`. ' + 'Remove `@relay(plural: true)` from fragment `%s` to allow the prop to be an object.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      item.forEach(function (value) {
        if (value != null) {
          var itemVariables = getVariables(operationVariables, fragment, value);
          if (itemVariables) {
            (0, _assign2['default'])(variables, itemVariables);
          }
        }
      });
    } else {
      !!Array.isArray(item) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelaySelector: Expected value for key `%s` to be an object, got `%s`. ' + 'Add `@relay(plural: true)` to fragment `%s` to allow the prop to be an array of items.', key, (0, _stringify2['default'])(item), fragment.node.name) : require('fbjs/lib/invariant')(false) : void 0;
      var itemVariables = getVariables(operationVariables, fragment, item);
      if (itemVariables) {
        (0, _assign2['default'])(variables, itemVariables);
      }
    }
  });
  return variables;
}

/**
 * @internal
 */
function getVariables(operationVariables, fragment, item) {
  var selector = getSelector(operationVariables, fragment, item);
  return selector ? selector.variables : null;
}

/**
 * @public
 *
 * Determine if two selectors are equal (represent the same selection). Note
 * that this function returns `false` when the two queries/fragments are
 * different objects, even if they select the same fields.
 */
function areEqualSelectors(thisSelector, thatSelector) {
  return thisSelector.dataID === thatSelector.dataID && thisSelector.node === thatSelector.node && require('fbjs/lib/areEqual')(thisSelector.variables, thatSelector.variables);
}

module.exports = {
  areEqualSelectors: areEqualSelectors,
  getDataIDsFromObject: getDataIDsFromObject,
  getSelector: getSelector,
  getSelectorList: getSelectorList,
  getSelectorsFromObject: getSelectorsFromObject,
  getVariablesFromObject: getVariablesFromObject
};