import q from "q";

const offset = (inputCodeBlockFunction) => {
    let defer = q.defer();
    let id;
    id = setTimeout(() => {
        try {
            const res = inputCodeBlockFunction();
            defer.resolve(res);
        } catch (e) {
            defer.fail(e);
        }
    },0);

    const cancel = () => {
        if (!defer.promise.isFulfilled()) {
            defer.fail();
        }
        clearTimeout(id);
    }

    return {
        promise : defer.promise,
        id : id,
        cancel : cancel
    };
}

export default offset;