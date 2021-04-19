const log = console.log;

const curry = (f) => (a, ..._) =>
  _.length ? f(a, ..._) : (..._) => f(a, ..._);

const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  }

  for (const a of iter) {
    acc = f(acc, a);
  }
  return acc;
});

const take = curry((l, iter) => {
  let res = [];
  for (const a of iter) {
    res.push(a);
    if (res.length === l) return res;
  }
  return res;
});

const go = (...args) => reduce((a, f) => f(a), args);
const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);

const L = {};
L.range = function* (l) {
  let i = -1;
  while (++i < l) {
    yield i;
  }
};

L.map = curry(function* (f, iter) {
  for (const a of iter) yield f(a);
});

L.filter = curry(function* (f, iter) {
  for (const a of iter) if (f(a)) yield a;
});

const takeAll = take(Infinity);
const map = curry(pipe(L.map, takeAll));
const filter = curry(pipe(L.filter, takeAll));

const range = (l) => {
  let i = -1;
  let res = [];

  while (++i < l) {
    res.push(i);
  }

  return res;
};
