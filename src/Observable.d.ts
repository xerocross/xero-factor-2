export interface Observable {
    subscribe : (arg: Function) => void
    cancel : () => void
}
export interface ObservableEvent {
    status : string,
    payload ?: any
}
export interface Observer {
    next : (event : ObservableEvent) => void
}
export interface Subscriber { 
    cancel : () => void, 
    observable : Observable | null
}