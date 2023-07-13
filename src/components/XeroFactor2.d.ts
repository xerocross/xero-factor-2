export interface MyWorker {
    onmessage : (arg ?: object) => void
    postMessage : (arg ?: object) => void
}