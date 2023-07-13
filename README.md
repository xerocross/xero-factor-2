# Xero-Factor-2 (2023)

This is a little Vue widget for computing the prime factors of an integer greater than 1.  If a web worker is available, computation is offloaded to the worker.

The main novelty of Xero-Factor-2 is the way in which computation is divided into asynchronous chunks to limit frontend blockage as much as possible, though if Web Workers are not avalible, there is no alternative but to have some blockage. The length will depend on the size of the input number.

Xero-Factor-2 is a complete rewrite and reimagining of my older widget Xerocross.factor (https://github.com/xerocross/xerocross.factor). Xero-Factor-2 is a Vue 3 app built on modern dependencies as of June 2023.

From a user's perspective, I consider Xero-Factor-2 version 2 of Xerocross.factor because they are almost identical from the user's perspective.

## Transition to TypeScript

I'm currently trying to refactor this app completely to use TypeScript. I realize nobody is terribly interested in apps for factoring primes, but I am hoping to write some code that represents me, and I want to do it for practice. That is currently in progress. I am having some trouble with combining Vue with TypeScript, so we'll see how it goes. (written July 5, 2023).

### Update (July 13)

Almost everything seems to be working in TypeScript now except for my integration testing, which is currently broken. I'm working on repairing it.

## Technology

This is a Vue 3 project. It's so simple there was no need for any special tools to manage state. I have used decimal.js for handling large numbers.

In Xerocross.factor I used q promises. In Xero-Factor-2 I have replaced them with native Promises.

The novelty of this app is in the method I use to compute the primes. I have gone to great length to write non-blocking code, even in browsers that do not support web workers. I use a system of recursive promises to break up computations of large numbers into smaller chunks of computation which are then scheduled asynchronously.

A major improvement as of Version 2.1.0 is that now if you change the input from a number
that requires a lot of work, such as `58971478991679167` to an easier number like `25` before
the app has finished working on `58971478991679167`, the app will cancel ongoing work on the larger
number in a timely fashion, even if using a web worker.

## Specific Fixes

In the old app, I disovered a bug where if you switched from one large input number to another mid-computation, sometimes the result was a factor from the previous number together with the quotient after dividing the new input number by the previous number's factor, still in state. The result was two incorrect factors, one of which was a non-integer real number. This bug could easily be reproduced by entering `35567588767879` and then mid-computation adding a `2` so the input is `355675887678792`. I discovered the flaw in the state handling of Xerocross.factor that caused that bug and I fixed it here.

## Testing

Some testing has been written, can you can run them using `npm run test:unit` and `npm run test:integration`. Test writing is ongoing.

## Development

The app can be run in a live-updating environment using `npm run dev`. The app can also be fully built using `npm run build`, after which `npm run start` will serve the built app locally.