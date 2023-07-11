export type ObservableAction = (observer : Observer, isCancelled ?: () => boolean) => void;
export type SubscribeFunction = (event : ObservableEvent) => void
export interface Observer {
    next : (event : ObservableEvent) => void
}
export interface ObservableEvent {
    status : string,
    payload ?: any
}
export interface Subscriber { 
    cancel : () => void, 
    observable : Observable
}