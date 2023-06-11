# xero-factor-2 (2023)

This is a little Vue widget for computing the prime factors of an integer.  If a web worker is available, computation is offloaded to the worker.

Xero-Factor-2 is a complete rewrite and reimagining of my older widget Xerocross.factor (https://github.com/xerocross/xerocross.factor). Xero-Factor-2 is a Vue 3 app built on modern dependencies as of June 2023.

From a user's perspective, I consider Xero-Factor-2 version 2 of Xerocross.factor because they are almost identical from the user's perspective.

## Technology

This is a Vue 3 project. It's so simple there was no need for any special tools to manage state. I have used decimal.js for handling large numbers.

In Xerocross.factor I used q promises. In Xero-Factor-2 I have replaced them with native Promises.

The novelty of this app is in the method I use to compute the primes. I have gone to great length to write non-blocking code, even in browsers that do not support web workers. I use a system of recursive promises to break up computations of large numbers into smaller chunks of computation which are then scheduled asynchronously.

## Specific Fixes

In the old app, I disovered a bug where if you switched from one large input number to another mid-computation, sometimes the result was a factor from the previous number together with the quotient after dividing the new input number by the previous number's factor, still in state. The result was two incorrect factors, one of which was a non-integer real number. This bug could easily be reproduced by entering `35567588767879` and then mid-computation adding a `2` so the input is `355675887678792`. I discovered the flaw in the state handling of Xerocross.factor that caused that bug and I fixed it here.

## Testing

My automated tests are in a state of disrepair. I have run the tests manually&mdash;that is, as a user interacting with my app in a dev environment&mdash;but my Vue-Jest testing platform does not seem able to work with the promise cascade logic of my app. The tests terminate the component before its internal logic has completed, and all the conventional ways of handling that sort of thing, like flushPromises, have failed.

My plan for now is to completely reimagine my testing. All of the real factoring work has been offloaded to a script called factorizer.js which I wrote. I plan to write a suite of tests for that script and a separate suite for the main Vue component where I mock out its dependency on factorizer.js.  