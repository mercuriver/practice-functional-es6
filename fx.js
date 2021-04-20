const log = console.log;

const curry = (f) => (a, ..._) =>
  _.length ? f(a, ..._) : (..._) => f(a, ..._);

const go1 = (a, f) => (a instanceof Promise ? a.then(f) : f(a));

const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }

  return go1(acc, function recur(acc) {
    for (const a of iter) {
      acc = f(acc, a);
      if (acc instanceof Promise) return acc.then(recur);
    }
    return acc;
  });
});

const go = (...args) => reduce((a, f) => f(a), args);
const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);

const nop = Symbol('nop');

const L = {};
L.range = function* (l) {
  let i = -1;
  while (++i < l) {
    yield i;
  }
};

L.map = curry(function* (f, iter) {
  for (const a of iter) yield go1(a, f);
});

L.flatMap = curry(pipe(L.map, L.flatten));

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    const b = go1(a, f);
    if (b instanceof Promise)
      yield b.then((b) => (b ? a : Promise.reject(nop)));
    else if (b) yield a;
  }
});

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  return (function recur() {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      if (a instanceof Promise)
        return a
          .then((a) => ((res.push(a), res).length === l ? res : recur()))
          .catch((e) => (e == nop ? recur() : Promise.reject(e)));
      // {
      //   res.push(a);
      //   return res.length === l ? res : recur();
      // });
      res.push(a);
      if (res.length === l) return res;
    }
    return res;
  })();
});

const isIterable = (a) => a && a[Symbol.iterator];

L.flatten = function* (iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* a;
    else yield a;
  }
};

L.deepFlat = function* f(iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* f(a);
    else yield a;
  }
};

const takeAll = take(Infinity);
const map = curry(pipe(L.map, takeAll));
const filter = curry(pipe(L.filter, takeAll));
const flatten = pipe(L.flatten, takeAll);
const flatMap = pipe(L.flatMap, takeAll);
const find = curry((f, iter) => go(iter, L.filter(f), take(1), ([a]) => a));

const range = (l) => {
  let i = -1;
  let res = [];

  while (++i < l) {
    res.push(i);
  }

  return res;
};
