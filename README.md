LINQ-to-TypeScript
==================

This project provides type definitions files linq.js version 3.0 beta.


Files
-----

- linq3.amd.d.ts  ==> Type definitions file for linq.js version 3.0 beta (https://linqjs.codeplex.com), AMD-style
- linq3.d.ts  ==> Type definitions file for linq.js version 3.0 beta (https://linqjs.codeplex.com), non-AMD style


Usage Example
-------------

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
