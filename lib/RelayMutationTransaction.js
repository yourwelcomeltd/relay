/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayMutationTransaction
 * 
 */

'use strict';

var _classCallCheck3 = _interopRequireDefault(require('babel-runtime/helpers/classCallCheck'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * @internal
 */
var RelayMutationTransaction = function () {
  function RelayMutationTransaction(mutationQueue, id) {
    (0, _classCallCheck3['default'])(this, RelayMutationTransaction);
    this._rolledBack = false;

    this._id = id;
    this._mutationQueue = mutationQueue;
  }

  /**
   * Applies the transaction to the local store (ie. as an optimistic update).
   *
   * Returns itself so as to provide a "fluent interface".
   */


  RelayMutationTransaction.prototype.applyOptimistic = function applyOptimistic() {
    var status = this.getStatus();
    !(status === require('./RelayMutationTransactionStatus').CREATED) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayMutationTransaction: Only transactions with status `CREATED` ' + 'can be applied.') : require('fbjs/lib/invariant')(false) : void 0;

    this._mutationQueue.applyOptimistic(this._id);
    return this;
  };

  /**
   * Commits the transaction (ie. performs a server update).
   *
   * Returns itself so as to provide a "fluent interface".
   */


  RelayMutationTransaction.prototype.commit = function commit() {
    var status = this.getStatus();
    !(status === require('./RelayMutationTransactionStatus').CREATED || status === require('./RelayMutationTransactionStatus').UNCOMMITTED) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayMutationTransaction: Only transactions with status `CREATED` or ' + '`UNCOMMITTED` can be committed.') : require('fbjs/lib/invariant')(false) : void 0;

    this._mutationQueue.commit(this._id);
    return this;
  };

  RelayMutationTransaction.prototype.recommit = function recommit() {
    var status = this.getStatus();
    !(status === require('./RelayMutationTransactionStatus').COLLISION_COMMIT_FAILED || status === require('./RelayMutationTransactionStatus').COMMIT_FAILED || status === require('./RelayMutationTransactionStatus').CREATED) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayMutationTransaction: Only transaction with status ' + '`CREATED`, `COMMIT_FAILED`, or `COLLISION_COMMIT_FAILED` can be ' + 'recomitted.') : require('fbjs/lib/invariant')(false) : void 0;

    this._mutationQueue.commit(this._id);
  };

  RelayMutationTransaction.prototype.rollback = function rollback() {
    var status = this.getStatus();
    !(status === require('./RelayMutationTransactionStatus').COLLISION_COMMIT_FAILED || status === require('./RelayMutationTransactionStatus').COMMIT_FAILED || status === require('./RelayMutationTransactionStatus').COMMIT_QUEUED || status === require('./RelayMutationTransactionStatus').CREATED || status === require('./RelayMutationTransactionStatus').UNCOMMITTED) ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayMutationTransaction: Only transactions with status `CREATED`, ' + '`UNCOMMITTED`, `COMMIT_FAILED`, `COLLISION_COMMIT_FAILED`, or ' + '`COMMIT_QUEUED` can be rolled back.') : require('fbjs/lib/invariant')(false) : void 0;

    this._rolledBack = true;
    this._mutationQueue.rollback(this._id);
  };

  RelayMutationTransaction.prototype.getError = function getError() {
    return this._mutationQueue.getError(this._id);
  };

  RelayMutationTransaction.prototype.getStatus = function getStatus() {
    return this._rolledBack ? require('./RelayMutationTransactionStatus').ROLLED_BACK : this._mutationQueue.getStatus(this._id);
  };

  RelayMutationTransaction.prototype.getHash = function getHash() {
    return this._id + ':' + this.getStatus();
  };

  RelayMutationTransaction.prototype.getID = function getID() {
    return this._id;
  };

  return RelayMutationTransaction;
}();

module.exports = RelayMutationTransaction;