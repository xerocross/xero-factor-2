export interface FactorRequestResponse {
    status : string,
    key : string,
    payload : {
        factor ?: string,
        integer ?: string
        error ?: Error
    }
}
