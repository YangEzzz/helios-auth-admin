import { onScopeDispose } from 'vue'

/** Every response belongs to the context and generation in which it started. */
export function useRequestScope(getContext: () => string) {
  let generation = 0
  let disposed = false
  const controllers = new Set<AbortController>()
  const channels = new Map<string, number>()
  function invalidate() {
    generation++
    controllers.forEach(controller => controller.abort())
    controllers.clear()
  }
  function capture() {
    const context = getContext()
    const version = generation
    return { context, isCurrent: () => !disposed && context === getContext() && version === generation }
  }
  function request() {
    const ticket = capture()
    const controller = new AbortController()
    controllers.add(controller)
    return { ...ticket, signal: controller.signal, release: () => controllers.delete(controller) }
  }
  function captureLatest(channel: string) {
    const ticket = capture()
    const version = (channels.get(channel) || 0) + 1
    channels.set(channel, version)
    return { context: ticket.context, isCurrent: () => ticket.isCurrent() && channels.get(channel) === version }
  }
  onScopeDispose(() => {
    disposed = true
    invalidate()
  })
  return { capture, captureLatest, request, invalidate }
}
