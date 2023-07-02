import { Watcher } from "./Scheduler.d";
class Scheduler {
    schedule = (inputCodeBlockFunction : (...args : any[]) => any, watcher : Watcher) => {
        let id : ReturnType<typeof setTimeout>;
        return new Promise((resolve, reject) => {
            let isResolved = false;
            const cancel = () => {
                if (!isResolved) {
                    reject("canceled");
                } else {
                    console.debug("called cancel on a resolved promise: no effect");
                }
                clearTimeout(id);
            };
            
            id = setTimeout(() => {
                try {
                    const resolution = inputCodeBlockFunction();
                    resolve({
                        id, cancel, resolution
                    });
                    isResolved = true;
                } catch (resolution) {
                    reject({
                        id, resolution, cancel
                    });
                }
            }, 0);
            watcher.id = id;
            watcher.cancel = () => {
                reject("halt");
                clearTimeout(id);
            };
        });
    };
}
export default Scheduler;