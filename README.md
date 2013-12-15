LINQ-to-TypeScript
==================

This project is a translation of the linq.js project (LINQ implementation for JavaScript), version 2.2.0.0, into TypeScript.

There is also a type definitions file for the new linq.js version 3.0 beta.


Files
-----

- linq.ts     ==> Main implementation
- linq.d.ts   ==> Type definitions file to shorten compile time

- linq3.amd.d.ts  ==> Type definitions file for linq.js version 3.0 beta (https://linqjs.codeplex.com), AMD-style
- linq3.d.ts  ==> Type definitions file for linq.js version 3.0 beta (https://linqjs.codeplex.com), non-AMD style

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

_In main.js (AMD-style):_

```
/// <reference path="linq3.amd.d.ts" />

import linq = module("linqjs");

var r = linq.from(obj).where(x => ...).orderBy(x => ...).select(x => ...).distinct().toArray();
```

_In main.js (non-AMD):_

```
/// <reference path="linq3.d.ts" />

var r = Enumerable.from(obj).where(x => ...).orderBy(x => ...).select(x => ...).distinct().toArray();
```


To Compile
----------

```
tsc linq.ts
```
