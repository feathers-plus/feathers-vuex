/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import makeServiceGetters from '../../src/service-module/service-module.getters'
import makeServiceMutations from '../../src/service-module/service-module.mutations'
import makeServiceState from '../../src/service-module/service-module.state'
import {
  globalModels,
  clearModels
} from '../../src/service-module/global-models'

import { values as _values } from 'lodash'

const options = {
  idField: '_id',
  tempIdField: '__id',
  autoRemove: false,
  serverAlias: 'service-module-getters',
  Model: null,
  service: null
}

const { find, count, list, get, getCopyById, isCreatePendingById, isUpdatePendingById, isPatchPendingById, isRemovePendingById, isSavePendingById, isPendingById } = makeServiceGetters()
const { addItems, setIdPending, unsetIdPending } = makeServiceMutations()

describe('Service Module - Getters', function () {
  beforeEach(function () {
    const state = makeServiceState(options)
    this.items = [
      {
        _id: 1,
        otherField: true,
        age: 21,
        teethRemaining: 2.501,
        test: true
      },
      {
        _id: 2,
        name: 'Marshall',
        otherField: true,
        age: 24,
        teethRemaining: 2.5,
        test: true,
        movies: [{ actors: ['Jerry the Mouse'] }]
      },
      {
        _id: 3,
        otherField: true,
        age: 27,
        teethRemaining: 12,
        test: false,
        movies: [{ actors: ['Tom Hanks', 'Tom Cruise', 'Tomcat'] }]
      },
      {
        name: 'Mariah',
        age: 19,
        teethRemaining: 24,
        status: 'temp'
      }
    ]
    addItems(state, this.items)
    this.state = state
  })

  it('list', function () {
    const { state, items } = this
    const results = list(state)

    results.forEach((record, index) => {
      const item = items[index]

      assert.deepEqual(record, item, 'item in correct order')
    })
  })

  it('getCopyById with keepCopiesInStore: true', function () {
    const state = {
      keepCopiesInStore: true,
      copiesById: {
        1: { test: true }
      }
    }

    const result = getCopyById(state)(1)

    assert(result.test, 'got the copy')
  })

  it('getCopyById with keepCopiesInStore: false', function () {
    const state = {
      keepCopiesInStore: false,
      servicePath: 'todos',
      serverAlias: 'my-getters-test'
    }
    Object.assign(globalModels, {
      [state.serverAlias]: {
        byServicePath: {
          todos: {
            copiesById: {
              1: { test: true }
            }
          }
        }
      }
    })

    const result = getCopyById(state)(1)

    assert(result.test, 'got the copy')

    clearModels()
  })

  it('get works on keyedById', function () {
    const { state, items } = this

    const result = get(state)(1)

    assert.deepEqual(result, items[0])
  })

  it('get works on tempsById', function () {
    const { state } = this
    const tempId = Object.keys(state.tempsById)[0]

    const result = get(state)(tempId)

    assert(result.__id === tempId)
  })

  it('find - no temps by default', function () {
    const { state, items } = this
    const params = { query: {} }
    const results = find(state)(params)

    assert.deepEqual(
      results.data,
      items.filter(i => i._id),
      'the list was correct'
    )
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with temps', function () {
    const { state, items } = this
    // Set temps: false to skip the temps.
    const params = { query: {}, temps: true }
    const results = find(state)(params)

    assert.deepEqual(results.data, items, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find - no copies by default', function () {
    const state = {
      keepCopiesInStore: false,
      servicePath: 'todos',
      serverAlias: 'my-getters-test',
      keyedById: {
        1: { _id: 1, test: true, __isClone: false },
        2: { _id: 2, test: true, __isClone: false },
        3: { _id: 3, test: true, __isClone: false }
      },
      copiesById: {
        1: { _id: 1, test: true, __isClone: true }
      }
    }
    Object.assign(globalModels, {
      [state.serverAlias]: {
        byServicePath: {
          todos: {
            copiesById: {
              1: { _id: 1, test: true, __isClone: true }
            }
          }
        }
      }
    })

    const params = { query: {} }
    const results = find(state)(params)

    assert.deepEqual(
      results.data,
      _values(state.keyedById).filter(i => !i.__isClone),
      'the list was correct'
    )
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')

    clearModels()
  })

  it('find - with copies with keepCopiesInStore:true', function () {
    const state = {
      keepCopiesInStore: true,
      idField: '_id',
      keyedById: {
        1: { _id: 1, test: true, __isClone: false },
        2: { _id: 2, test: true, __isClone: false },
        3: { _id: 3, test: true, __isClone: false }
      },
      copiesById: {
        1: { _id: 1, test: true, __isClone: true }
      }
    }

    const params = { query: {}, copies: true }
    const results = find(state)(params)

    const expected = [
      { _id: 1, test: true, __isClone: true },
      { _id: 2, test: true, __isClone: false },
      { _id: 3, test: true, __isClone: false }
    ]

    assert.deepEqual(results.data, expected, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find - with copies with keepCopiesInStore:false', function () {
    const state = {
      keepCopiesInStore: false,
      servicePath: 'todos',
      serverAlias: 'my-getters-test',
      idField: '_id',
      keyedById: {
        1: { _id: 1, test: true, __isClone: false },
        2: { _id: 2, test: true, __isClone: false },
        3: { _id: 3, test: true, __isClone: false }
      }
    }
    Object.assign(globalModels, {
      [state.serverAlias]: {
        byServicePath: {
          todos: {
            copiesById: {
              1: { _id: 1, test: true, __isClone: true }
            }
          }
        }
      }
    })

    const params = { query: {}, copies: true }
    const results = find(state)(params)

    const expected = [
      { _id: 1, test: true, __isClone: true },
      { _id: 2, test: true, __isClone: false },
      { _id: 3, test: true, __isClone: false }
    ]

    assert.deepEqual(results.data, expected, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')

    clearModels()
  })

  it('find - with copies and temps', function () {
    const state = {
      keepCopiesInStore: false,
      servicePath: 'todos',
      serverAlias: 'my-getters-test',
      idField: '_id',
      keyedById: {
        1: { _id: 1, test: true, __isClone: false },
        2: { _id: 2, test: true, __isClone: false },
        3: { _id: 3, test: true, __isClone: false }
      },
      tempsById: {
        abc: { __id: 'abc', test: true, __isClone: false, __isTemp: true }
      }
    }
    Object.assign(globalModels, {
      [state.serverAlias]: {
        byServicePath: {
          todos: {
            copiesById: {
              1: { _id: 1, test: true, __isClone: true }
            }
          }
        }
      }
    })

    const params = { query: {}, copies: true, temps: true }
    const results = find(state)(params)

    const expected = [
      { _id: 1, test: true, __isClone: true },
      { _id: 2, test: true, __isClone: false },
      { _id: 3, test: true, __isClone: false },
      { __id: 'abc', test: true, __isClone: false, __isTemp: true }
    ]

    assert.deepEqual(results.data, expected, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')

    clearModels()
  })

  it('find with query', function () {
    const { state } = this
    const params = { query: { test: false } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with custom operator', function () {
    const { state } = this
    const params = { query: { test: false, $populateParams: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option', function () {
    const { state } = this
    state.paramsForServer = ['_$client']
    const params = { query: { test: false, _$client: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option with specific value as string', function () {
    const { state } = this
    state.paramsForServer = [['_$client', '1']]
    const params = { query: { test: false, _$client: '1' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option with specific value as number', function () {
    const { state } = this
    state.paramsForServer = [['_$client', -1]]
    const params = { query: { test: false, _$client: -1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option with specific value as function', function () {
    const { state } = this
    state.paramsForServer = [['_$client', value => value === 1]]
    const params = { query: { test: false, _$client: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with non-whitelisted custom operator fails', function () {
    const { state } = this
    const params = { query: { $client: 'test' } }
    try {
      find(state)(params)
    } catch (error) {
      assert(error)
    }
  })

  it('find with whitelisted custom operators', function () {
    const { state } = this
    state.whitelist = ['$regex', '$options']
    const query = {
      name: { $regex: 'marsh', $options: 'igm' }
    }
    const params = { query }
    let results
    try {
      results = find(state)(params)
    } catch (error) {
      assert(!error, 'should not have failed with whitelisted custom operator')
    }
    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find works with $elemMatch', function () {
    const { state } = this
    const query = {
      movies: {
        $elemMatch: { actors: 'Jerry the Mouse' }
      }
    }
    const params = { query }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with limit', function () {
    const { state } = this
    const params = { query: { $limit: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 1, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with skip', function () {
    const { state } = this
    const params = { query: { $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 2, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.data[1]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with limit and skip', function () {
    const { state } = this
    const params = { query: { $limit: 1, $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with select', function () {
    const { state } = this
    const params = { query: { $select: ['otherField'] } }
    const results = find(state)(params)

    assert(results.data.length === 3, 'the length was correct')
    results.data.forEach(result => {
      assert(Object.keys(result).length <= 1, 'only one field was returned')
    })
    assert.equal(
      results.data.filter(i => i.otherField).length,
      3,
      'three records have the field.'
    )
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with sort ascending on integers', function () {
    const { state } = this
    const params = {
      query: {
        $sort: { age: 1 }
      }
    }
    const results = find(state)(params)

    results.data
      .map(i => i.age)
      .reduce((oldest, current) => {
        assert(current > oldest, 'age should have been older than previous')
        return current
      }, 0)
  })

  it('find with sort descending on integers', function () {
    const { state } = this
    const params = {
      query: {
        $sort: { age: -1 }
      }
    }
    const results = find(state)(params)

    results.data
      .map(i => i.age)
      .reduce((oldest, current) => {
        assert(current < oldest, 'age should have been younger than previous')
        return current
      }, 100)
  })

  it('find with sort ascending on floats', function () {
    const { state } = this
    const params = {
      query: {
        $sort: { teethRemaining: 1 }
      }
    }
    const results = find(state)(params)

    results.data
      .map(i => i.teethRemaining)
      .reduce((oldest, current) => {
        assert(
          current > oldest,
          'teethRemaining should have been older than previous'
        )
        return current
      }, 0)
  })

  it('find with sort descending on floats', function () {
    const { state } = this
    const params = {
      query: {
        $sort: { teethRemaining: -1 }
      }
    }
    const results = find(state)(params)

    results.data
      .map(i => i.teethRemaining)
      .reduce((oldest, current) => {
        assert(
          current < oldest,
          'teethRemaining should have been younger than previous'
        )
        return current
      }, 100)
  })

  it('count without params fails', function () {
    const { state } = this

    try {
      count(state, { find })(null)
    } catch (error) {
      assert(error)
    }
  })

  it('count without query fails', function () {
    const { state } = this

    try {
      count(state, { find: find(state) })({})
    } catch (error) {
      assert(error)
    }
  })

  it('count returns the number of records in the store', function () {
    const { state } = this

    const total = count(state, { find: find(state) })({ query: {} })
    assert(total === 3, 'count is 3')
  })

  it('is*PendingById', function() {
    const { state } = this

    // Set up getters
    const getters: any = {
      isCreatePendingById: isCreatePendingById(state),
      isUpdatePendingById: isUpdatePendingById(state),
      isPatchPendingById: isPatchPendingById(state),
      isRemovePendingById: isRemovePendingById(state),
      isSavePendingById,
      isPendingById
    }
    getters.isSavePendingById = isSavePendingById(state, getters)
    getters.isPendingById = isPendingById(state, getters)

    assert(isCreatePendingById(state)(42) === false, 'creating status is clear')
    assert(isUpdatePendingById(state)(42) === false, 'updating status is clear')
    assert(isPatchPendingById(state)(42) === false, 'patching status is clear')
    assert(isRemovePendingById(state)(42) === false, 'removing status is clear')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear')
    assert(isPendingById(state, getters)(42) === false, 'any method pending status is clear')

    // Create
    setIdPending(state, { method: 'create', id: 42})
    assert(isCreatePendingById(state)(42) === true, 'creating status is set')
    assert(isSavePendingById(state, getters)(42) === true, 'saving status is set')
    assert(isPendingById(state, getters)(42) === true, 'any method pending status is set')

    unsetIdPending(state, { method: 'create', id: 42 })
    assert(isCreatePendingById(state)(42) === false, 'creating status is clear')
    assert(isUpdatePendingById(state)(42) === false, 'updating status is clear')
    assert(isPatchPendingById(state)(42) === false, 'patching status is clear')
    assert(isRemovePendingById(state)(42) === false, 'removing status is clear')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear')
    assert(isPendingById(state, getters)(42) === false, 'any method pending status is clear')

    // Update
    setIdPending(state, { method: 'update', id: 42})
    assert(isUpdatePendingById(state)(42) === true, 'updating status is set')
    assert(isSavePendingById(state, getters)(42) === true, 'saving status is set')
    assert(isPendingById(state, getters)(42) === true, 'any method pending status is set')

    unsetIdPending(state, { method: 'update', id: 42 })
    assert(isCreatePendingById(state)(42) === false, 'creating status is clear')
    assert(isUpdatePendingById(state)(42) === false, 'updating status is clear')
    assert(isPatchPendingById(state)(42) === false, 'patching status is clear')
    assert(isRemovePendingById(state)(42) === false, 'removing status is clear')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear')
    assert(isPendingById(state, getters)(42) === false, 'any method pending status is clear')

    // Patch
    setIdPending(state, { method: 'patch', id: 42})
    assert(isPatchPendingById(state)(42) === true, 'patching status is set')
    assert(isSavePendingById(state, getters)(42) === true, 'saving status is set')
    assert(isPendingById(state, getters)(42) === true, 'any method pending status is set')

    unsetIdPending(state, { method: 'patch', id: 42 })
    assert(isCreatePendingById(state)(42) === false, 'creating status is clear')
    assert(isUpdatePendingById(state)(42) === false, 'updating status is clear')
    assert(isPatchPendingById(state)(42) === false, 'patching status is clear')
    assert(isRemovePendingById(state)(42) === false, 'removing status is clear')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear')
    assert(isPendingById(state, getters)(42) === false, 'any method pending status is clear')

    // Remove
    setIdPending(state, { method: 'remove', id: 42})
    assert(isRemovePendingById(state)(42) === true, 'removing status is set')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear for remove')
    assert(isPendingById(state, getters)(42) === true, 'any method pending status is set')

    unsetIdPending(state, { method: 'remove', id: 42 })
    assert(isCreatePendingById(state)(42) === false, 'creating status is clear')
    assert(isUpdatePendingById(state)(42) === false, 'updating status is clear')
    assert(isPatchPendingById(state)(42) === false, 'patching status is clear')
    assert(isRemovePendingById(state)(42) === false, 'removing status is clear')
    assert(isSavePendingById(state, getters)(42) === false, 'saving status is clear')
    assert(isPendingById(state, getters)(42) === false, 'any method pending status is clear')
  })
})
