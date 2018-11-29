/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayStoreData
 * 
 */

'use strict';

var _extends3 = _interopRequireDefault(require('babel-runtime/helpers/extends'));

var _classCallCheck3 = _interopRequireDefault(require('babel-runtime/helpers/classCallCheck'));

var _keys2 = _interopRequireDefault(require('babel-runtime/core-js/object/keys'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var idField = require('./RelayQuery').Field.build({
  fieldName: require('./RelayNodeInterface').ID,
  type: 'String'
});
var typeField = require('./RelayQuery').Field.build({
  fieldName: require('./RelayNodeInterface').TYPENAME,
  type: 'String'
});

/**
 * @internal
 *
 * Wraps the data caches and associated metadata tracking objects used by
 * GraphQLStore/RelayStore.
 */

var RelayStoreData = function () {
  function RelayStoreData() {
    var cachedRecords = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var cachedRootCallMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var queuedRecords = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var records = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var rootCallMap = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    var nodeRangeMap = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    var rangeData = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : new (require('./GraphQLStoreRangeUtils'))();
    (0, _classCallCheck3['default'])(this, RelayStoreData);

    this._cacheManager = null;
    this._cachedRecords = cachedRecords;
    this._cachedRootCallMap = cachedRootCallMap;
    this._cachedStore = new (require('./RelayRecordStore'))({ cachedRecords: cachedRecords, records: records }, { cachedRootCallMap: cachedRootCallMap, rootCallMap: rootCallMap }, nodeRangeMap);
    this._changeEmitter = new (require('./GraphQLStoreChangeEmitter'))(rangeData);
    this._mutationQueue = new (require('./RelayMutationQueue'))(this);
    this._networkLayer = new (require('./RelayNetworkLayer'))();
    this._nodeRangeMap = nodeRangeMap;
    this._pendingQueryTracker = new (require('./RelayPendingQueryTracker'))(this);
    this._queryRunner = new (require('./GraphQLQueryRunner'))(this);
    this._queryTracker = new (require('./RelayQueryTracker'))();
    this._queuedRecords = queuedRecords;
    this._queuedStore = new (require('./RelayRecordStore'))({ cachedRecords: cachedRecords, queuedRecords: queuedRecords, records: records }, { cachedRootCallMap: cachedRootCallMap, rootCallMap: rootCallMap }, nodeRangeMap);
    this._records = records;
    this._recordStore = new (require('./RelayRecordStore'))({ records: records }, { rootCallMap: rootCallMap }, nodeRangeMap);
    this._rangeData = rangeData;
    this._rootCallMap = rootCallMap;
    this._taskQueue = new (require('./RelayTaskQueue'))();
  }

  /**
   * Creates a garbage collector for this instance. After initialization all
   * newly added DataIDs will be registered in the created garbage collector.
   * This will show a warning if data has already been added to the instance.
   */


  RelayStoreData.prototype.initializeGarbageCollector = function initializeGarbageCollector(scheduler) {
    !!this._garbageCollector ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData: Garbage collector is already initialized.') : require('fbjs/lib/invariant')(false) : void 0;
    var shouldInitialize = this._isStoreDataEmpty();
    process.env.NODE_ENV !== 'production' ? require('fbjs/lib/warning')(shouldInitialize, 'RelayStoreData: Garbage collection can only be initialized when no ' + 'data is present.') : void 0;
    if (shouldInitialize) {
      this._garbageCollector = new (require('./RelayGarbageCollector'))(this, scheduler);
    }
  };

  /**
   * @internal
   *
   * Sets/clears the query tracker.
   *
   * @warning Do not use this unless your application uses only
   * `RelayGraphQLMutation` for mutations.
   */


  RelayStoreData.prototype.injectQueryTracker = function injectQueryTracker(queryTracker) {
    this._queryTracker = queryTracker;
  };

  /**
   * Sets/clears the scheduling function used by the internal task queue to
   * schedule units of work for execution.
   */


  RelayStoreData.prototype.injectTaskScheduler = function injectTaskScheduler(scheduler) {
    this._taskQueue.injectScheduler(scheduler);
  };

  /**
   * Sets/clears the cache manager that is used to cache changes written to
   * the store.
   */


  RelayStoreData.prototype.injectCacheManager = function injectCacheManager(cacheManager) {
    this._cacheManager = cacheManager;
  };

  RelayStoreData.prototype.clearCacheManager = function clearCacheManager() {
    this._cacheManager = null;
  };

  RelayStoreData.prototype.hasCacheManager = function hasCacheManager() {
    return !!this._cacheManager;
  };

  RelayStoreData.prototype.getCacheManager = function getCacheManager() {
    return this._cacheManager;
  };

  /**
   * Returns whether a given record is affected by an optimistic update.
   */


  RelayStoreData.prototype.hasOptimisticUpdate = function hasOptimisticUpdate(dataID) {
    dataID = this.getRangeData().getCanonicalClientID(dataID);
    return this.getQueuedStore().hasOptimisticUpdate(dataID);
  };

  /**
   * Returns a list of client mutation IDs for queued mutations whose optimistic
   * updates are affecting the record corresponding the given dataID. Returns
   * null if the record isn't affected by any optimistic updates.
   */


  RelayStoreData.prototype.getClientMutationIDs = function getClientMutationIDs(dataID) {
    dataID = this.getRangeData().getCanonicalClientID(dataID);
    return this.getQueuedStore().getClientMutationIDs(dataID);
  };

  /**
   * Restores data for queries incrementally from cache.
   * It calls onSuccess when all the data has been loaded into memory.
   * It calls onFailure when some data is unabled to be satisfied from cache.
   */


  RelayStoreData.prototype.restoreQueriesFromCache = function restoreQueriesFromCache(queries, callbacks) {
    var _this = this;

    var cacheManager = this._cacheManager;
    !cacheManager ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData: `restoreQueriesFromCache` should only be called ' + 'when cache manager is available.') : require('fbjs/lib/invariant')(false) : void 0;
    var changeTracker = new (require('./RelayChangeTracker'))();
    var profile = require('./RelayProfiler').profile('RelayStoreData.readFromDiskCache');
    return require('./restoreRelayCacheData').restoreQueriesDataFromCache(queries, this._queuedStore, this._cachedRecords, this._cachedRootCallMap, this._garbageCollector, cacheManager, changeTracker, {
      onSuccess: function onSuccess() {
        _this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
        profile.stop();
        callbacks.onSuccess && callbacks.onSuccess();
      },
      onFailure: function onFailure() {
        _this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
        profile.stop();
        callbacks.onFailure && callbacks.onFailure();
      }
    });
  };

  /**
   * Restores data for a fragment incrementally from cache.
   * It calls onSuccess when all the data has been loaded into memory.
   * It calls onFailure when some data is unabled to be satisfied from cache.
   */


  RelayStoreData.prototype.restoreFragmentFromCache = function restoreFragmentFromCache(dataID, fragment, path, callbacks) {
    var _this2 = this;

    var cacheManager = this._cacheManager;
    !cacheManager ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData: `restoreFragmentFromCache` should only be called when ' + 'cache manager is available.') : require('fbjs/lib/invariant')(false) : void 0;
    var changeTracker = new (require('./RelayChangeTracker'))();
    var profile = require('./RelayProfiler').profile('RelayStoreData.readFragmentFromDiskCache');
    return require('./restoreRelayCacheData').restoreFragmentDataFromCache(dataID, fragment, path, this._queuedStore, this._cachedRecords, this._cachedRootCallMap, this._garbageCollector, cacheManager, changeTracker, {
      onSuccess: function onSuccess() {
        _this2._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
        profile.stop();
        callbacks.onSuccess && callbacks.onSuccess();
      },
      onFailure: function onFailure() {
        _this2._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
        profile.stop();
        callbacks.onFailure && callbacks.onFailure();
      }
    });
  };

  /**
   * Write the results of a query into the base record store.
   */


  RelayStoreData.prototype.handleQueryPayload = function handleQueryPayload(query, payload, forceIndex) {
    var profiler = require('./RelayProfiler').profile('RelayStoreData.handleQueryPayload');
    var changeTracker = new (require('./RelayChangeTracker'))();
    var writer = new (require('./RelayQueryWriter'))(this._queuedStore, this.getRecordWriter(), this._queryTracker, changeTracker, {
      forceIndex: forceIndex,
      updateTrackedQueries: true
    });
    require('./writeRelayQueryPayload')(writer, query, payload);
    this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
    profiler.stop();
  };

  /**
   * Write the result of a fragment into the base record store.
   */


  RelayStoreData.prototype.handleFragmentPayload = function handleFragmentPayload(dataID, fragment, path, payload, forceIndex) {
    var profiler = require('./RelayProfiler').profile('RelayStoreData.handleFragmentPayload');
    var changeTracker = new (require('./RelayChangeTracker'))();
    var writer = new (require('./RelayQueryWriter'))(this._queuedStore, this.getRecordWriter(), this._queryTracker, changeTracker, {
      forceIndex: forceIndex,
      updateTrackedQueries: true
    });
    writer.createRecordIfMissing(fragment, dataID, path, payload);
    writer.writePayload(fragment, dataID, payload, path);
    this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
    profiler.stop();
  };

  /**
   * Write the results of an update into the base record store.
   */


  RelayStoreData.prototype.handleUpdatePayload = function handleUpdatePayload(operation, payload, _ref) {
    var configs = _ref.configs,
        isOptimisticUpdate = _ref.isOptimisticUpdate;

    var profiler = require('./RelayProfiler').profile('RelayStoreData.handleUpdatePayload');
    var changeTracker = new (require('./RelayChangeTracker'))();
    var recordWriter = void 0;
    if (isOptimisticUpdate) {
      var clientMutationID = payload[require('./RelayConnectionInterface').CLIENT_MUTATION_ID];
      !(typeof clientMutationID === 'string') ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData.handleUpdatePayload(): Expected optimistic payload ' + 'to have a valid `%s`.', require('./RelayConnectionInterface').CLIENT_MUTATION_ID) : require('fbjs/lib/invariant')(false) : void 0;
      recordWriter = this.getRecordWriterForOptimisticMutation(clientMutationID);
    } else {
      recordWriter = this._getRecordWriterForMutation();
    }
    var writer = new (require('./RelayQueryWriter'))(this._queuedStore, recordWriter, this._queryTracker, changeTracker, {
      forceIndex: require('./generateForceIndex')(),
      isOptimisticUpdate: isOptimisticUpdate,
      updateTrackedQueries: false
    });
    require('./writeRelayUpdatePayload')(writer, operation, payload, { configs: configs, isOptimisticUpdate: isOptimisticUpdate });
    this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
    profiler.stop();
  };

  /**
   * Given a query fragment and a data ID, returns a root query that applies
   * the fragment to the object specified by the data ID.
   */


  RelayStoreData.prototype.buildFragmentQueryForDataID = function buildFragmentQueryForDataID(fragment, dataID) {
    if (require('./RelayRecord').isClientID(dataID)) {
      var path = this._queuedStore.getPathToRecord(this._rangeData.getCanonicalClientID(dataID));
      !path ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData.buildFragmentQueryForDataID(): Cannot refetch ' + 'record `%s` without a path.', dataID) : require('fbjs/lib/invariant')(false) : void 0;
      return require('./RelayQueryPath').getQuery(this._cachedStore, path, fragment);
    }
    // Fragment fields cannot be spread directly into the root because they
    // may not exist on the `Node` type.
    return require('./RelayQuery').Root.build(fragment.getDebugName() || 'UnknownQuery', require('./RelayNodeInterface').NODE, dataID, [idField, typeField, fragment], {
      identifyingArgName: require('./RelayNodeInterface').ID,
      identifyingArgType: require('./RelayNodeInterface').ID_TYPE,
      isAbstract: true,
      isDeferred: false,
      isPlural: false
    }, require('./RelayNodeInterface').NODE_TYPE);
  };

  RelayStoreData.prototype.getNodeData = function getNodeData() {
    return this._records;
  };

  RelayStoreData.prototype.getQueuedData = function getQueuedData() {
    return this._queuedRecords;
  };

  RelayStoreData.prototype.clearQueuedData = function clearQueuedData() {
    var _this3 = this;

    require('fbjs/lib/forEachObject')(this._queuedRecords, function (_, key) {
      delete _this3._queuedRecords[key];
      _this3._changeEmitter.broadcastChangeForID(key);
    });
  };

  RelayStoreData.prototype.getCachedData = function getCachedData() {
    return this._cachedRecords;
  };

  RelayStoreData.prototype.getGarbageCollector = function getGarbageCollector() {
    return this._garbageCollector;
  };

  RelayStoreData.prototype.getMutationQueue = function getMutationQueue() {
    return this._mutationQueue;
  };

  RelayStoreData.prototype.getNetworkLayer = function getNetworkLayer() {
    return this._networkLayer;
  };

  /**
   * Get the record store with only the cached and base data (no queued data).
   */


  RelayStoreData.prototype.getCachedStore = function getCachedStore() {
    return this._cachedStore;
  };

  /**
   * Get the record store with full data (cached, base, queued).
   */


  RelayStoreData.prototype.getQueuedStore = function getQueuedStore() {
    return this._queuedStore;
  };

  /**
   * Get the record store with only the base data (no queued/cached data).
   */


  RelayStoreData.prototype.getRecordStore = function getRecordStore() {
    return this._recordStore;
  };

  /**
   * Get the record writer for the base data.
   */


  RelayStoreData.prototype.getRecordWriter = function getRecordWriter() {
    return new (require('./RelayRecordWriter'))(this._records, this._rootCallMap, false, // isOptimistic
    this._nodeRangeMap, this._cacheManager ? this._cacheManager.getQueryWriter() : null);
  };

  RelayStoreData.prototype.getQueryTracker = function getQueryTracker() {
    return this._queryTracker;
  };

  RelayStoreData.prototype.getQueryRunner = function getQueryRunner() {
    return this._queryRunner;
  };

  RelayStoreData.prototype.getChangeEmitter = function getChangeEmitter() {
    return this._changeEmitter;
  };

  RelayStoreData.prototype.getRangeData = function getRangeData() {
    return this._rangeData;
  };

  RelayStoreData.prototype.getPendingQueryTracker = function getPendingQueryTracker() {
    return this._pendingQueryTracker;
  };

  RelayStoreData.prototype.getTaskQueue = function getTaskQueue() {
    return this._taskQueue;
  };

  /**
   * @deprecated
   *
   * Used temporarily by GraphQLStore, but all updates to this object are now
   * handled through a `RelayRecordStore` instance.
   */


  RelayStoreData.prototype.getRootCallData = function getRootCallData() {
    return this._rootCallMap;
  };

  RelayStoreData.prototype._isStoreDataEmpty = function _isStoreDataEmpty() {
    return (0, _keys2['default'])(this._records).length === 0 && (0, _keys2['default'])(this._queuedRecords).length === 0 && (0, _keys2['default'])(this._cachedRecords).length === 0;
  };

  /**
   * Given a ChangeSet, broadcasts changes for updated DataIDs
   * and registers new DataIDs with the garbage collector.
   */


  RelayStoreData.prototype._handleChangedAndNewDataIDs = function _handleChangedAndNewDataIDs(changeSet) {
    var _this4 = this;

    var updatedDataIDs = (0, _keys2['default'])(changeSet.updated);
    var createdDataIDs = (0, _keys2['default'])(changeSet.created);
    var gc = this._garbageCollector;
    updatedDataIDs.forEach(function (id) {
      return _this4._changeEmitter.broadcastChangeForID(id);
    });
    // Containers may be subscribed to "new" records in the case where they
    // were previously garbage collected or where the link was incrementally
    // loaded from cache prior to the linked record.
    createdDataIDs.forEach(function (id) {
      gc && gc.register(id);
      _this4._changeEmitter.broadcastChangeForID(id);
    });
  };

  RelayStoreData.prototype._getRecordWriterForMutation = function _getRecordWriterForMutation() {
    return new (require('./RelayRecordWriter'))(this._records, this._rootCallMap, false, // isOptimistic
    this._nodeRangeMap, this._cacheManager ? this._cacheManager.getMutationWriter() : null);
  };

  RelayStoreData.prototype.getRecordWriterForOptimisticMutation = function getRecordWriterForOptimisticMutation(clientMutationID) {
    return new (require('./RelayRecordWriter'))(this._queuedRecords, this._rootCallMap, true, // isOptimistic
    this._nodeRangeMap, null, // don't cache optimistic data
    clientMutationID);
  };

  RelayStoreData.prototype.toJSON = function toJSON() {
    /**
     * A util function which remove the querypath from the record. Used to stringify the RecordMap.
     */
    var getRecordsWithoutPaths = function getRecordsWithoutPaths(recordMap) {
      return require('fbjs/lib/mapObject')(recordMap, function (record) {
        var nextRecord = (0, _extends3['default'])({}, record);
        delete nextRecord[require('./RelayRecord').MetadataKey.PATH];
        return nextRecord;
      });
    };

    return {
      cachedRecords: getRecordsWithoutPaths(this._cachedRecords),
      cachedRootCallMap: this._cachedRootCallMap,
      queuedRecords: getRecordsWithoutPaths(this._queuedRecords),
      records: getRecordsWithoutPaths(this._records),
      rootCallMap: this._rootCallMap,
      nodeRangeMap: this._nodeRangeMap
    };
  };

  RelayStoreData.fromJSON = function fromJSON(obj) {
    !obj ? process.env.NODE_ENV !== 'production' ? require('fbjs/lib/invariant')(false, 'RelayStoreData: JSON object is empty') : require('fbjs/lib/invariant')(false) : void 0;
    var cachedRecords = obj.cachedRecords,
        cachedRootCallMap = obj.cachedRootCallMap,
        queuedRecords = obj.queuedRecords,
        records = obj.records,
        rootCallMap = obj.rootCallMap,
        nodeRangeMap = obj.nodeRangeMap;


    deserializeRecordRanges(cachedRecords);
    deserializeRecordRanges(queuedRecords);
    deserializeRecordRanges(records);

    return new RelayStoreData(cachedRecords, cachedRootCallMap, queuedRecords, records, rootCallMap, nodeRangeMap);
  };

  return RelayStoreData;
}();

/**
 * A helper function which checks for serialized GraphQLRange
 * instances and deserializes them in toJSON()
 */


function deserializeRecordRanges(records) {
  for (var _key in records) {
    var record = records[_key];
    var range = record.__range__;
    if (range) {
      record.__range__ = require('./GraphQLRange').fromJSON(range);
    }
  }
}

require('./RelayProfiler').instrumentMethods(RelayStoreData.prototype, {
  handleQueryPayload: 'RelayStoreData.prototype.handleQueryPayload',
  handleUpdatePayload: 'RelayStoreData.prototype.handleUpdatePayload'
});

module.exports = RelayStoreData;