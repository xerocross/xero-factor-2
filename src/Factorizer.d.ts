import type { ObservableEvent, Observer, Subscriber } from "./Observable.d";
import Decimal from "decimal.js";


export interface FactorRequest {
    integer : Decimal,
    subscriber : Subscriber
}

export interface FactoringEvent extends ObservableEvent {
    status : string,
    id : string,
    payload : { 
        factor ?: string,
        integer ?: string,
        lastFactor ?: string,
        quotient ?: string,
        integerIndex ?: number,
        factorIndex ?: number,
        error ?: unknown
     },
     key : string,
}

export interface FactoringWorkObject {
    primaryInteger : string
    quotient : Decimal,
    lastFactor : Decimal | undefined,
    factorIndex : number
    observer : Observer
}