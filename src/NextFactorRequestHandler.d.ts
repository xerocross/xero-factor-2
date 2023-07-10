export interface NextFactorInformationObject {
    status : string,
    payload : {
        [key : string] : string,
        error ?: unknown
    },
    key ?: string
}

export interface FactorRequestResponse {
    status : string,
    key : string,
    payload : {
        factor ?: string,
        integer ?: string
        error ?: Error
    }
}

export interface NextFactorRequestEvent {
    status : string,
    id : string,
    payload : { 
        integer : string,
        lastFactor ?: string,
        quotient ?: string,
        integerIndex : string,
        factorIndex : string
     },
     key : string,
}

export interface PostResponse {
    status : string,
    payload : {
        error ?: string
        message ?: string
    },
    key : string
}

export interface NextFactorResult {
    status : string,
    payload : {
        [key : string] : any
    },
    key : string
}

export interface ComputeSubintervalResponse {
    status : string, 
    payload : {
        factor : string,
        integer : string,
        message : string
    }
}