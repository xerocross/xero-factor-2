export interface WebWorkerRequest {
    data : WebWorkerRequestData
}

export interface WebWorkerRequestData {
    status : string,
    payload : {
        integerIndex : number,
        factorIndex : number,
        integer : string,
        lastFactor ?: string,
        quotient : string
    },
    key : string
}