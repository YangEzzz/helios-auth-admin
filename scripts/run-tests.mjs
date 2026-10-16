import assert from 'node:assert/strict'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { effectScope, reactive } from 'vue'
import { checkAPIBoundaries } from './api-contracts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ configFile: false, root, resolve: { alias: { '@': path.join(root, 'src') } }, server: { middlewareMode: true, watch: null } })
let passed = 0
function deferred() {
  let resolve
  let reject
  const promise = new Promise((accept, fail) => {
    resolve = accept
    reject = fail
  })
  return { promise, resolve, reject }
}
async function check(name, test) {
  await test()
  process.stdout.write(`PASS ${name}\n`)
  passed++
}
try {
  const { collectUsers } = await server.ssrLoadModule('/src/lib/paged-users.ts')
  const { useLatestQuery } = await server.ssrLoadModule('/src/composables/use-latest-query.ts')
  const { useRequestScope } = await server.ssrLoadModule('/src/composables/use-request-scope.ts')
  const { isAdminRole, accountStatusAction, roleLabels } = await server.ssrLoadModule('/src/lib/accounts.ts')
  const { csvCell } = await server.ssrLoadModule('/src/lib/csv.ts')
  const { generateVueTable } = await server.ssrLoadModule('/src/components/data-table/use-generate-vue-table.ts')
  await check('all pages are loaded, including pending accounts after the first 100', async () => {
    const calls = []
    const users = await collectUsers(async (page) => {
      calls.push(page)
      return { users: [{ id: String(page), status: page === 3 ? 'pending_approval' : 'active' }], page, total_pages: 3 }
    })
    assert.deepEqual(calls, [1, 2, 3])
    assert.equal(users.find(user => user.id === '3').status, 'pending_approval')
  })
  await check('an incomplete directory is reported as failure, not accepted as a full list', async () => {
    await assert.rejects(collectUsers(async (page) => {
      if (page === 2)
        throw new Error('page failure')
      return { users: [{ id: '1' }], page: 1, total_pages: 2 }
    }), /page failure/)
  })
  await check('old audit responses cannot overwrite the newer page or clear its loading', async () => {
    const scope = effectScope()
    const first = deferred()
    const second = deferred()
    let calls = 0
    const query = scope.run(() => useLatestQuery(() => calls++ ? second.promise : first.promise, 'initial'))
    const a = query.refresh()
    const b = query.refresh()
    first.resolve('page 1')
    await a
    assert.equal(query.loading.value, true)
    assert.equal(query.data.value, 'initial')
    second.resolve('page 2')
    await b
    assert.equal(query.data.value, 'page 2')
    assert.equal(query.loading.value, false)
    scope.stop()
  })
  await check('query failure keeps data and exposes a retryable error', async () => {
    const scope = effectScope()
    let fail = true
    const query = scope.run(() => useLatestQuery(async () => {
      if (fail)
        throw new Error('network failure')
      return ['new data']
    }, ['old data']))
    assert.equal(await query.refresh(), false)
    assert.deepEqual(query.data.value, ['old data'])
    assert.equal(query.error.value, 'network failure')
    fail = false
    assert.equal(await query.refresh(), true)
    assert.equal(query.error.value, '')
    scope.stop()
  })
  await check('project switch, repeated query and disposal invalidate previous ownership', () => {
    const scope = effectScope()
    let project = 'A'
    const owner = scope.run(() => useRequestScope(() => project))
    const a = owner.captureLatest('members')
    const b = owner.captureLatest('members')
    assert.equal(a.isCurrent(), false)
    assert.equal(b.isCurrent(), true)
    project = 'B'
    assert.equal(b.isCurrent(), false)
    owner.invalidate()
    const c = owner.request()
    scope.stop()
    assert.equal(c.isCurrent(), false)
    assert.equal(c.signal.aborted, true)
  })
  await check('unknown and rejected accounts never acquire unlock affordances', () => {
    assert.equal(accountStatusAction('active'), 'lock')
    assert.equal(accountStatusAction('locked'), 'unlock')
    assert.equal(accountStatusAction('rejected'), null)
    assert.equal(accountStatusAction('pending_approval'), null)
    assert.equal(accountStatusAction(undefined), null)
    assert.equal(isAdminRole('super_admin'), true)
    assert.equal(isAdminRole('user'), false)
    assert.equal(isAdminRole('unknown'), false)
    assert.equal(roleLabels.super_admin, '超级管理员')
  })
  await check('server paging reacts to totals and selection survives reordering', () => {
    const scope = effectScope()
    const props = reactive({ data: [{ id: 'A' }, { id: 'B' }], columns: [{ accessorKey: 'id' }], serverPagination: { page: 1, pageSize: 10, total: 21, onPageChange: (page) => {
      props.serverPagination.page = page
    }, onPageSizeChange: (size) => {
      props.serverPagination.pageSize = size
    } } })
    const table = scope.run(() => generateVueTable(props))
    assert.equal(table.getPageCount(), 3)
    props.serverPagination.total = 41
    assert.equal(table.getPageCount(), 5)
    table.nextPage()
    assert.equal(props.serverPagination.page, 2)
    table.setRowSelection({ B: true })
    props.data = [{ id: 'B' }, { id: 'A' }]
    assert.equal(table.getSelectedRowModel().rows[0].original.id, 'B')
    scope.stop()
  })
  await check('client table updates asynchronous rows and computes positive page counts', () => {
    const scope = effectScope()
    const props = reactive({ data: [], columns: [{ accessorKey: 'id' }] })
    const table = scope.run(() => generateVueTable(props))
    assert.equal(table.getRowModel().rows.length, 0)
    props.data = Array.from({ length: 25 }, (_, index) => ({ id: String(index) }))
    assert.equal(table.getPageCount(), Math.ceil(25 / table.getState().pagination.pageSize))
    assert.ok(table.getRowModel().rows.length > 0)
    table.nextPage()
    assert.equal(table.getState().pagination.pageIndex, 1)
    scope.stop()
  })
  await check('CSV treats external formula-like values as text and escapes quotes', () => {
    assert.equal(csvCell('=1+1'), '"\'=1+1"')
    assert.equal(csvCell(' @SUM(A1)'), '"\' @SUM(A1)"')
    assert.equal(csvCell('a"b'), '"a""b"')
    assert.equal(csvCell('正常文本'), '"正常文本"')
  })
  process.stdout.write(`${passed} regression checks passed\n`)
}
finally {
  await server.close()
}

await checkAPIBoundaries(root, [
  ['sso/clients', 'getProjectSSOConfig', ['B'], { method: 'get', url: '/api/v1/sso/projects/B' }],
  ['sso/clients', 'saveProjectSSOConfig', ['B', { enabled: true, redirect_uris: ['https://example.test/callback'] }], { method: 'post', url: '/api/v1/sso/projects/B', data: { enabled: true, redirect_uris: ['https://example.test/callback'] } }],
  ['sso/clients', 'rotateProjectSSOSecret', ['a/b'], { method: 'post', url: '/api/v1/sso/projects/a%2Fb/rotate', data: {} }],
  ['sso/auth', 'getSSORequest', ['a&b'], { path: '/request?id=a%26b' }],
  ['sso/auth', 'continueSSOLogin', ['r'], { path: '/continue', data: { request_id: 'r' } }],
  ['sso/auth', 'cancelSSORequest', ['r'], { path: '/cancel', data: { request_id: 'r' } }],
  ['sso/auth', 'loginSSORequest', [{ request_id: 'r', email: 'user@example.test', password: 'fixture' }], { path: '/login', data: { request_id: 'r', email: 'user@example.test', password: 'fixture' } }],
])
