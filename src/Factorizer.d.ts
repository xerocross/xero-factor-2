import type { ObservableEvent, Observer, Subscriber } from "./Observable.d";
import type { WaitFunction } from "./WaitFunction";
import Decimal from "decimal.js";

export interface FactorizerEvent {
    status : string,
    payload ?: any
}
export interface FactorRequest {
    integer : Decimal,
    subscriber : Subscriber
}
export interface Factorizer {
    factor : (integer : Decimal, workerIn : Worker, waitFunctionIn : WaitFunction, subscriber : Subscriber) => ObservableEvent
    halt : any
}
export interface FactoringEvent {
    status : string,
    id : string,
    payload : { 
        integer : string,
        lastFactor : string,
        quotient : string,
        integerIndex : string,
        factorIndex : string
     },
     key : string,
}
export interface FactoringWorkObject {
    primaryInteger : Decimal
    quotient : Decimal,
    lastFactor : Decimal | undefined,
    factorIndex : number
    observer : Observer
}