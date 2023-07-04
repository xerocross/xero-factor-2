export interface Observable {
    subscribe : (arg ?: (observerEvent : ObservableEvent) => void) => void
    cancel : () => void
}
export interface ObservableEvent {
    status : string,
    payload : { [key : string] : any; }
}
export interface Observer {
    next : (event : ObservableEvent) => void
}
export interface Subscriber { 
    cancel : () => void, 
    observable : Observable | null
}