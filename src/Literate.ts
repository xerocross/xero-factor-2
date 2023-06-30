type JavaScriptObj = { [key: string]: any };
type ExecutionDirections = (...args:any) => JavaScriptObj;
const doThis = (statement: string, executionDirections: ExecutionDirections) => {
    console.log(statement);
    return executionDirections();
};
const scheduleAsync = (statement: string, executionDirections: ExecutionDirections) => {
    return setTimeout(() => {
        executionDirections();
    },0);
};
const check = (statement:string, evaluation:boolean) => {
    return evaluation;
};
export { doThis, scheduleAsync, check };