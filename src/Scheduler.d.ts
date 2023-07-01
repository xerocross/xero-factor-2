export interface Watcher {
    cancel ?: () => void
    id ?: ReturnType<typeof setTimeout> | undefined
}