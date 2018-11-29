/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule fromGraphQL
 * 
 */

'use strict';

/**
 * @internal
 *
 * Converts GraphQL nodes to RelayQuery nodes.
 */
var fromGraphQL = {
  Field: function (_Field) {
    function Field(_x) {
      return _Field.apply(this, arguments);
    }

    Field.toString = function () {
      return _Field.toString();
    };

    return Field;
  }(function (query) {
    var node = createNode(query, require('./RelayQuery').Field);
    !(node instanceof require('./RelayQuery').Field) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'fromGraphQL.Field(): Expected a GraphQL field node.') : require('fbjs/lib/invariant')(false) : void 0;
    return node;
  }),
  Fragment: function (_Fragment) {
    function Fragment(_x2) {
      return _Fragment.apply(this, arguments);
    }

    Fragment.toString = function () {
      return _Fragment.toString();
    };

    return Fragment;
  }(function (query) {
    var node = createNode(query, require('./RelayQuery').Fragment);
    !(node instanceof require('./RelayQuery').Fragment) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'fromGraphQL.Fragment(): Expected a GraphQL fragment node.') : require('fbjs/lib/invariant')(false) : void 0;
    return node;
  }),
  Query: function Query(query) {
    var node = createNode(query, require('./RelayQuery').Root);
    !(node instanceof require('./RelayQuery').Root) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'fromGraphQL.Query(): Expected a root node.') : require('fbjs/lib/invariant')(false) : void 0;
    return node;
  },
  Operation: function (_Operation) {
    function Operation(_x3) {
      return _Operation.apply(this, arguments);
    }

    Operation.toString = function () {
      return _Operation.toString();
    };

    return Operation;
  }(function (query) {
    var node = createNode(query, require('./RelayQuery').Operation);
    !(node instanceof require('./RelayQuery').Operation) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'fromGraphQL.Operation(): Expected a mutation/subscription node.') : require('fbjs/lib/invariant')(false) : void 0;
    return node;
  })
};

function createNode(query, desiredType) {
  var variables = {};
  var route = require('./RelayMetaRoute').get('$fromGraphQL');
  return desiredType.create(query, route, variables);
}

module.exports = fromGraphQL;