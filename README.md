LINQ-to-TypeScript
==================

This project is a translation of the LINQ.js project (LINQ implementation for JavaScript)
into TypeScript.


Files
-----

- linq.ts    ==> Main implementation
- linq.js    ==> Compiled JavaScript
- linq.d.ts  ==> Type definitions file to shorten compile time


Usage Example
-------------

_In main.html:_

```
<script type="text/javascript" src="lib/linq.js"></script>
<script type="text/javascript" src="lib/main.js"></script>
```

_In main.js:_

```
/// <reference path="linq.d.ts" />

var r = LINQ.From(obj).Where(x => ...).OrderBy(x => ...).Select(x => ...).Distinct().ToArray();
```
