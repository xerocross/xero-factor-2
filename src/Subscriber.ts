import { Observable } from "./Observable";
type Subscriber = { 
    cancel : () => void, 
    observable : Observable | null
};
export default Subscriber;