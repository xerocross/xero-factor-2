import type { ObservableEvent } from "./Observable.d";
import Decimal from "decimal.js";

export type WaitFunction = (func : ((...args : any) => void)) => (() => void);

export interface FactorizerEvent {
    status : string,
    payload ?: any
}
export interface Factorizer {
    factor : (integer : Decimal, workerIn : Worker, waitFunctionIn : WaitFunction, subscriber : Subscriber) => ObservableEvent
    halt : any
}
export interface FactoringEvent {
    status : string,
    id : string,
    payload : { 
        integer ?: string,
        lastFactor ?: string,
        quotient ?: string
     },
     key : string
}
export interface FactoringWorkObject {
    id : string;
    primaryInteger : Decimal
    factors : Decimal[],
    currentQuotient : Decimal
}