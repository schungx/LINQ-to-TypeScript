LINQ-to-TypeScript
==================

This project is a translation of the linq.js project (LINQ implementation for JavaScript), version 2.2.0.0, into TypeScript.

There is also a type definitions file for the new linq.js version 3.0 beta.


Files
-----

- linq.ts     ==> Main implementation
- linq.d.ts   ==> Type definitions file to shorten compile time

- linq3.d.ts  ==> Type definitions file for linq.js version 3.0 beta (https://linqjs.codeplex.com)

- linq.js     ==> Compiled JavaScript
- linq.min.js ==> Compiled JavaScript minified


Usage Example (linq.js version 2.2.0.0)
---------------------------------------

Note: Only TypeScript version 0.9+ (with generics support) can be used.

_In main.html:_

```
<script type="text/javascript" src="lib/linq.min.js"></script>
<script type="text/javascript" src="lib/main.js"></script>
```

_In main.js:_

```
/// <reference path="linq.d.ts" />

var r = LINQ.From(obj).Where(x => ...).OrderBy(x => ...).Select(x => ...).Distinct().ToArray();
```


Usage Example (linq.js version 3.0 beta)
----------------------------------------

Note: Only TypeScript version 0.9+ (with generics support) can be used.

_In main.html:_

```
<script type="text/javascript" src="lib/linq.min.js"></script>     <!-- version 3.0 beta -->
<script type="text/javascript" src="lib/main.js"></script>
```

_In main.js:_

```
/// <reference path="linq3.d.ts" />

import linq = module("linqjs");

var r = linq.from(obj).where(x => ...).orderBy(x => ...).select(x => ...).distinct().toArray();
```


To Compile
----------

```
tsc linq.ts
```


Notes
-----

The current version of TypeScript (0.9) has problems that prevent a generic type referring to or using itself with a type parameter that is a _wrapped_ form of the original type parameter.

As a result, some functions cannot be formulated.  For example:

```
class Enumerable<T>
{
  GroupBy<K>(keySelector: Transform<T, K>): Enumerable<Grouping<K, T>>;
  BufferWithCount(count: number): Enumerable<T[]>
  ToLookup<K, V>(keySelector: Transform<T, K>): Lookup<K, T>;
  ToDictionary<K>(keySelector: Transform<T, K>): Dictionary<K, T>;
}
```

```ToLookup``` and ```ToDictionary``` failed to compile because the ```Lookup``` and ```Dictionary``` types each contain a method called ```ToEnumerable``` returning an ```Enumerable<T>```, so this counts as a _wrapped_ form!

Also, **using** ```Dictionary```inside a method implementation causes it to fail to compile as well.

I've changed some method implementations which originally used ```Dictionary``` as a collection to use a new ```Collection``` class (which does not include a ```ToEnumerable``` method) instead.
