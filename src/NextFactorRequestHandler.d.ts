export interface NextFactorInformationObject {
    status : string,
    payload : {
        [key : string] : string,
        error ?: unknown
    },
    key ?: string
}

// export interface NextFactorRequest {
//     status : string,
//     id : string,
//     payload : { 
//         integer ?: string,
//         lastFactor : string,
//         quotient : string,
//         integerIndex : number,
//         factorIndex : number,
//      },
//      key : string,
// }
// "status" : "factor",
// "payload" : {
//     "quotient" : quotient.toString(),
//     "integer" : integer.toString(),
//     "lastFactor" : lastFactor ? lastFactor.toString() : "",
//     "integerIndex" : this.integerIndex,
//     "factorIndex" : factorIndex
// },
// "key" : key,
// "id" : this.id

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
    payload : { 
        integer : string,
        lastFactor ?: string,
        quotient : string
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