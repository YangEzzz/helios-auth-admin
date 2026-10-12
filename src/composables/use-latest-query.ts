import { onScopeDispose, ref, shallowRef } from 'vue'
import { errorMessage } from '@/lib/errors'

/** Protect data, error and loading together, including repeated refreshes in one context. */
export function useLatestQuery<T>(loader: () => Promise<T>, initial: T) {
  const data = shallowRef(initial)
  const loading = ref(false)
  const error = ref('')
  let version = 0
  let disposed = false
  async function refresh() {
    const ticket = ++version
    loading.value = true
    error.value = ''
    try {
      const result = await loader()
      if (disposed || ticket !== version)
        return false
      data.value = result
      return true
    }
    catch (cause) {
      if (!disposed && ticket === version)
        error.value = errorMessage(cause)
      return false
    }
    finally {
      if (!disposed && ticket === version)
        loading.value = false
    }
  }
  function invalidate() {
    version++
  }
  onScopeDispose(() => {
    disposed = true
    invalidate()
  })
  return { data, loading, error, refresh, invalidate }
}
