type JavaScriptObj = { [key : string] : any };
type ExecutionDirections = (...args : any) => any | void;
const doThis = (statement : string, executionDirections : ExecutionDirections) => {
    console.log(`doThis: ${statement}`);
    try {
        return executionDirections();
    } catch (e) {
        console.log(`error occured during: ${statement}`);
        throw e;
    }
};
const letUs = doThis;
const schedule = (statement : string, executionDirections : ExecutionDirections) => {
    return setTimeout(() => {
        executionDirections();
    }, 0);
};
const check = (statement : string, evaluation : boolean) => {
    return evaluation;
};
const since = (statement : string, executionDirections : ExecutionDirections) => { 
    return executionDirections();
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const thenWeKnow = (statement : string) => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const execute = (obj : JavaScriptObj, func : (arg : JavaScriptObj) => any) => {
    console.log("execute");
    func(obj);
};
const logThat = (statement : string, message : string, level : string) => {
    switch(level) {
        case "DEBUG":
            console.debug(message);
            break;
        case "LOG":
            console.log(message);
            break;
        case "TRACE":
            console.trace(message);
            break;
        default:
            console.log(message);
            break;
    }
};
const when = (statement : string, bool : boolean, func : () => any) => {
    if (bool) {
        func();
    }
};
export { doThis, schedule, check, logThat, since, thenWeKnow, execute, when, letUs };