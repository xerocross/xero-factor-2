import { shallowMount, mount } from "@vue/test-utils";
import XeroFactor2 from "./XeroFactor2.vue";
import flushPromises from "flush-promises";

let Worker = null;
let xeroFactor2;
function getPrimaryNumberInput (xeroFactor2) {
    return xeroFactor2.find(".primary-number-input");
}

function getFactorListOuter (xeroFactor2) {
    return xeroFactor2.find(".factors-list");
}

function getVisibleFactors (xeroFactor2) {
    let outer = getFactorListOuter(xeroFactor2);
    return outer.findAll(".factor-item");
}
function getIsWorkingMessage (xeroFactor2) {
    return xeroFactor2.find(".is-working-message");
}
beforeEach(() => {
    localStorage.clear();
    
    Worker = () => {
        throw new Error("worker not defined");
    };
});

afterEach(() => {
    // Clean up the mounted component after each test
    xeroFactor2.vm.clear();
    xeroFactor2.unmount();
});

test("component will mount", () => {
    expect(() => {
        xeroFactor2 = shallowMount(XeroFactor2, {
            propsData : {
                "worker" : null
            }
        });
    }).not.toThrow();
});

test("primary number input exists", async () => {
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    await xeroFactor2.vm.$nextTick();
    expect(numInput.exists()).toBe(true);
});

test("negative integer invalid", async () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    await xeroFactor2.vm.$nextTick();
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("-2");
    await xeroFactor2.vm.$nextTick();
    jest.advanceTimersByTime(400);
    await xeroFactor2.vm.$nextTick();
    expect(xeroFactor2.vm.invalidInput).toBe(true);
    
});

test("decimal input invalid", async () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    await xeroFactor2.vm.$nextTick();
    let numInput = getPrimaryNumberInput(xeroFactor2);
    await xeroFactor2.vm.$nextTick();
    numInput.setValue("2.3");
    await xeroFactor2.vm.$nextTick();
    jest.advanceTimersByTime(1000);
    await xeroFactor2.vm.$nextTick();
    expect(xeroFactor2.vm.invalidInput).toBe(true);
});

test("non-numeric input invalid", async () => {
    Worker = null;
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("2a");
    await xeroFactor2.vm.$nextTick();
    jest.advanceTimersByTime(1000);
    await xeroFactor2.vm.$nextTick();
    expect(xeroFactor2.vm.invalidInput).toBe(true);
});

test("initial input value is '2'", async () => {
    xeroFactor2 = shallowMount(XeroFactor2);
    let numInput = getPrimaryNumberInput(xeroFactor2);
    await xeroFactor2.vm.$nextTick();
    expect(numInput.element.value).toBe("2");
});


test("during working, shows '(working)' message",  async () => {
    window.Worker = null;
    xeroFactor2 = mount(XeroFactor2);
    let functionRan;
    xeroFactor2.vm.pushFactor = () => {
        console.log("ran pushFactor function");
        functionRan = true;
        xeroFactor2.vm.logState();
        xeroFactor2.vm.clear();
    };
    await xeroFactor2.vm.$nextTick();
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
    await xeroFactor2.vm.$nextTick();
    jest.advanceTimersByTime(1000);
    await xeroFactor2.vm.$nextTick();
    expect(functionRan);
    expect(getIsWorkingMessage(xeroFactor2).exists()).toBe(true);
});

test("input number 3 produces prime factors '(3)', worker disabled", async () => {
    jest.useFakeTimers();
    window.Worker = null;
    let functionRan = false;
    let workComplete = async () => {
        await flushPromises();
        functionRan = true;
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(3)");
        expect(visibleFactors.length).toBe(1);
    };
    xeroFactor2 = mount(XeroFactor2, {
        props : {
            done : workComplete
        }
    });
    await flushPromises();
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("3");
    await flushPromises();
    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(functionRan).toBe(true);
});

test("input number 12 produces prime factors '(2)(2)(3)', worker disabled", async () => {
    jest.useFakeTimers();
    window.Worker = null;
    let doneFunctionRan = false;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(2)");
        expect(visibleFactors.at(2).text()).toBe("(3)");
        expect(visibleFactors.length).toBe(3);
        doneFunctionRan = true;
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    await flushPromises();
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
    await flushPromises();
    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(doneFunctionRan).toBe(true);
});

test("input number 5562 produces prime factors '(2)(3)(3)(3)(103)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(3)");
        expect(visibleFactors.at(2).text()).toBe("(3)");
        expect(visibleFactors.at(3).text()).toBe("(3)");
        expect(visibleFactors.at(4).text()).toBe("(103)");
        expect(visibleFactors.length).toBe(5);
        done();
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("5562");
});

test("input number 2923675 produces prime factors '(5) (5) (83) (1409)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(5)");
        expect(visibleFactors.at(1).text()).toBe("(5)");
        expect(visibleFactors.at(2).text()).toBe("(83)");
        expect(visibleFactors.at(3).text()).toBe("(1409)");
        expect(visibleFactors.length).toBe(4);
        done();
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("2923675");
});

test("input number 29236752 produces prime factors '(2) (2) (2) (2) (3) (3) (191) (1063)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(2)");
        expect(visibleFactors.at(1).text()).toBe("(2)");
        expect(visibleFactors.at(2).text()).toBe("(2)");
        expect(visibleFactors.at(3).text()).toBe("(2)");
        expect(visibleFactors.at(4).text()).toBe("(3)");
        expect(visibleFactors.at(5).text()).toBe("(3)");
        expect(visibleFactors.at(6).text()).toBe("(191)");
        expect(visibleFactors.at(7).text()).toBe("(1063)");
        expect(visibleFactors.length).toBe(8);
        done();
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("29236752");
});

test("input number 35567588767879 produces prime factors '(7) (5081084109697)', worker disabled", (done) => {
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(7)");
        expect(visibleFactors.at(1).text()).toBe("(5081084109697)");
        expect(visibleFactors.length).toBe(2);
        done();
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("35567588767879");
}, 10000);

test("input number 287789543 produces prime factors '(287789543)', worker disabled", (done) => {
    jest.setTimeout(10000);
    window.Worker = null;
    let workComplete = () => {
        let visibleFactors = getVisibleFactors(xeroFactor2);
        expect(visibleFactors.at(0).text()).toBe("(287789543)");
        expect(visibleFactors.length).toBe(1);
        done();
    };
    xeroFactor2 = mount(XeroFactor2,{
        props : {
            done : workComplete
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("287789543");
});

test("mount with worker calls workerFound(true)", (done) => {
    Worker = function () {
        this.onmessage = () => {};
        this.postMessage = () => {
        };
    };
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : new Worker(),
            workerFound : (val) => {
                if (val) {
                    done();
                } else {
                    expect(false);
                    done();
                }
            }
        }
    });
    // input is required to set the component in motion
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("mount without worker calls workerFound(false)", (done) => {
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            workerFound : (val) => {
                if (val) {
                    expect(false);
                    done();
                } else {
                    done();
                }
            }
        }
    });
    // input is required to set the component in motion
    let numInput = getPrimaryNumberInput(xeroFactor2);
    numInput.setValue("12");
});

test("response from worker gets added to view (12)", (done) => {
    let index = 0;

    Worker = function () {
        let key;
        this.onmessage = () => {};
        this.postMessage = () => {
            switch (index) {
                case 0:
                    key = "" + 12 + 0;
                    this.onmessage({
                        data : { 
                            "key" : key,
                            "result" : "2"
                        }
                    });
                    break;
                case 1:
                    key = "" + 6 + 1;
                    this.onmessage({
                        data : { 
                            "key" : key,
                            "result" : "2"
                        }
                    });
                    break;
                case 2:
                    key = "" + 3 + 2;
                    this.onmessage({
                        data : { 
                            "key" : key,
                            "result" : "3"
                        }
                    });
                    break;
                default:
                    expect(false);
                    done();
            }
            index++;
        };
    };
    let myWorker = new Worker();
    let doneCalls = 0;
    let myWorkDoneFunction = () => {
        if (doneCalls == 0) {
            let visibleFactors = getVisibleFactors(xeroFactor2);
            expect(visibleFactors.at(0).text()).toBe("(2)");
            expect(visibleFactors.at(1).text()).toBe("(2)");
            expect(visibleFactors.at(2).text()).toBe("(3)");
            expect(visibleFactors.length).toBe(3);
            done();
        }
        doneCalls++;
    };
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : myWorker,
            "done" : myWorkDoneFunction
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    xeroFactor2.vm.$nextTick(() => {
        numInput.setValue("12");
    });
});

test("response from worker gets added to view (14)", (done) => {
    
    let doneCalls = 0;
    let myWorkDoneFunction = () => {
        if (doneCalls == 0) {
            let visibleFactors = getVisibleFactors(xeroFactor2);
            expect(visibleFactors.at(0).text()).toBe("(2)");
            expect(visibleFactors.at(1).text()).toBe("(7)");
            expect(visibleFactors.length).toBe(2);
            done();
        }
        doneCalls++;
    };

    let index = 0;
    let key;
    Worker = function () {
        this.onmessage = () => {};
        this.postMessage = () => {
            switch (index) {
                case 0:
                    key = "" + 14 + 0;
                    this.onmessage({
                        data : { 
                            "key" : key,
                            "result" : "2"
                        }
                    });
                    break;
                case 1:
                    key = "" + 7 + 1;
                    this.onmessage({
                        data : { 
                            "key" : key,
                            "result" : "7"
                        }
                    });
                    break;
            }
            index++;
        };
        
    };
    
    let myWorker = new Worker();
    xeroFactor2 = mount(XeroFactor2, {
        propsData : {
            worker : myWorker,
            done : myWorkDoneFunction
        }
    });
    let numInput = getPrimaryNumberInput(xeroFactor2);
    xeroFactor2.vm.$nextTick(() => {
        numInput.setValue("14");
    });
    
});