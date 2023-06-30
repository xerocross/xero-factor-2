const offset = (inputCodeBlockFunction, subscriber) => {
    return new Promise((resolve, reject) => {
        let id;
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
        subscriber.id = id;
        subscriber.cancel = () => {
            reject("halt");
            clearTimeout(id);
        };
    });
};
export default offset;