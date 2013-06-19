/*--------------------------------------------------------------------------
* linq.ts - LINQ for JavaScript in TypeScript
*   Based on linq.js ver 2.2.0.0 (Jun. 28th, 2010)
*   created and maintained by neuecc <ils@neue.cc>
*   licensed under Microsoft Public License(Ms-PL)
*   http://neue.cc/
*   http://linqjs.codeplex.com/
*
* Converted by Stephen Chung (Stephen.Chung@intexact.com) to TyepScript
* June 2013
*--------------------------------------------------------------------------*/
var __extends = this.__extends || function (d, b)
{
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LINQ;
(function (LINQ) {
    // Cached functions
    var Functions = {
        Identity: function (x) {
            return x;
        },
        True: function () {
            return true;
        },
        False: function () {
            return false;
        },
        Blank: function () {
        },
        Null: function () {
            return null;
        }
    };

    // Type strings
    var Types = {
        Boolean: typeof true,
        Number: typeof 0,
        String: typeof "",
        Object: typeof {},
        Undefined: typeof undefined,
        Function: typeof function () {
        }
    };

    // Enumerator states
    var States;
    (function (States) {
        States[States["Before"] = 0] = "Before";
        States[States["Running"] = 1] = "Running";

        States[States["After"] = 2] = "After";
    })(States || (States = {}));

    // for tryGetNext
    var Yielder = (function () {
        function Yielder() {
            this.current = null;
        }
        Yielder.prototype.Current = function () {
            return this.current;
        };

        Yielder.prototype.Yield = function (value) {
            this.current = value;
            return true;
        };
        return Yielder;
    })();
    LINQ.Yielder = Yielder;

    // Name "Enumerator" conflicts with JScript's "Enumerator"
    var IEnumerator = (function () {
        function IEnumerator(initialize, tryGetNext, dispose) {
            this.yielder = new Yielder();
            this.state = States.Before;
            this.initialize = initialize;
            this.tryGetNext = tryGetNext;
            this.dispose = dispose;
        }
        IEnumerator.prototype.Current = function () {
            return this.yielder.Current();
        };

        IEnumerator.prototype.MoveNext = function () {
            try  {
                switch (this.state) {
                    case States.Before:
                        this.state = States.Running;
                        this.initialize();
                    case States.Running:
                        if (this.tryGetNext.apply(this.yielder)) {
                            return true;
                        } else {
                            this.Dispose();
                            return false;
                        }
                    case States.After:
                        return false;
                }
            } catch (e) {
                this.Dispose();
                throw e;
            }
        };

        IEnumerator.prototype.Dispose = function () {
            if (this.state !== States.Running)
                return;

            try  {
                this.dispose();
            } finally {
                this.state = States.After;
            }
        };
        return IEnumerator;
    })();
    LINQ.IEnumerator = IEnumerator;

    // Utility functions
    var Utils;
    (function (Utils) {
        function IsIEnumerable(obj) {
            if (typeof Enumerator !== Types.Undefined) {
                try  {
                    new Enumerator(obj);
                    return true;
                } catch (e) {
                }
            }
            return false;
        }
        Utils.IsIEnumerable = IsIEnumerable;

        function Compare(a, b) {
            return (a === b) ? 0 : ((a > b) ? 1 : -1);
        }
        Utils.Compare = Compare;

        function Dispose(obj) {
            if (obj)
                obj.Dispose();
        }
        Utils.Dispose = Dispose;

        function HasOwnProperty(target, key) {
            return Object.prototype.hasOwnProperty.call(target, key);
        }
        Utils.HasOwnProperty = HasOwnProperty;

        function ComputeHashCode(obj) {
            if (obj === null)
                return "null";
            if (obj === undefined)
                return "undefined";

            if (typeof obj === Types.Number) {
                var num = Math.floor((obj) % 10000);
                return num.toString();
            }

            if (typeof obj === Types.String) {
                // Java's hash function
                var str = obj;
                var hash = 0;

                if (str.length == 0)
                    return "0";

                for (var i = 0; i < str.length; i++) {
                    var char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash |= 0;
                }
                return hash.toString();
            }

            return (typeof obj.toString === Types.Function) ? obj.toString() : Object.prototype.toString.call(obj);
        }
        Utils.ComputeHashCode = ComputeHashCode;
    })(Utils || (Utils = {}));

    var LinkedList = (function () {
        function LinkedList() {
            this.FirstEntry = null;
            this.LastEntry = null;
        }
        LinkedList.prototype.AddLast = function (entry) {
            if (this.LastEntry !== null) {
                this.LastEntry.Next = entry;
                entry.Prev = this.LastEntry;
                this.LastEntry = entry;
            } else {
                this.FirstEntry = this.LastEntry = entry;
            }
        };

        LinkedList.prototype.Replace = function (entry, newEntry) {
            if (entry.Prev !== null) {
                entry.Prev.Next = newEntry;
                newEntry.Prev = entry.Prev;
            } else {
                this.FirstEntry = newEntry;
            }

            if (entry.Next !== null) {
                entry.Next.Prev = newEntry;
                newEntry.Next = entry.Next;
            } else {
                this.LastEntry = newEntry;
            }
        };

        LinkedList.prototype.Remove = function (entry) {
            if (entry.Prev !== null)
                entry.Prev.Next = entry.Next; else
                this.FirstEntry = entry.Next;

            if (entry.Next !== null)
                entry.Next.Prev = entry.Prev; else
                this.LastEntry = entry.Prev;
        };
        return LinkedList;
    })();

    // Collection
    var Collection = (function () {
        function Collection(compareSelector) {
            this.count = 0;
            this.linkedList = new LinkedList();
            this.buckets = {};
            this.compareSelector = (!compareSelector) ? Functions.Identity : compareSelector;
        }
        Collection.prototype.AddRange = function (keys) {
            for (var i = 0; i < keys.length; i++)
                this.Add(keys[i]);
        };

        Collection.prototype.Add = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            var entry = { Value: key, Prev: null, Next: null };

            if (Utils.HasOwnProperty(this.buckets, hash)) {
                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    if (this.compareSelector(array[i].Value) === compareKey) {
                        this.linkedList.Replace(array[i], entry);
                        array[i] = entry;
                        return;
                    }
                }
                array.push(entry);
            } else {
                this.buckets[hash] = [entry];
            }
            this.count++;
            this.linkedList.AddLast(entry);
        };

        Collection.prototype.Contains = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            if (!Utils.HasOwnProperty(this.buckets, hash))
                return false;

            var array = this.buckets[hash];
            for (var i = 0; i < array.length; i++) {
                if (this.compareSelector(array[i].Value) === compareKey)
                    return true;
            }
            return false;
        };

        Collection.prototype.Clear = function () {
            this.count = 0;
            this.buckets = {};
            this.linkedList = new LinkedList();
        };

        Collection.prototype.Remove = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            if (!Utils.HasOwnProperty(this.buckets, hash))
                return;

            var array = this.buckets[hash];
            for (var i = 0; i < array.length; i++) {
                if (this.compareSelector(array[i].Value) === compareKey) {
                    this.linkedList.Remove(array[i]);
                    array.splice(i, 1);
                    if (array.length === 0)
                        delete this.buckets[hash];
                    this.count--;
                    return;
                }
            }
        };

        Collection.prototype.Count = function () {
            return this.count;
        };
        return Collection;
    })();
    LINQ.Collection = Collection;

    // Dictionary
    var Dictionary = (function () {
        function Dictionary(compareSelector) {
            this.count = 0;
            this.linkedList = new LinkedList();
            this.buckets = {};
            this.compareSelector = (!compareSelector) ? Functions.Identity : compareSelector;
        }
        Dictionary.prototype.Add = function (key, value) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            var entry = { Value: { Key: key, Value: value }, Prev: null, Next: null };

            if (Utils.HasOwnProperty(this.buckets, hash)) {
                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    if (this.compareSelector(array[i].Value.Key) === compareKey) {
                        this.linkedList.Replace(array[i], entry);
                        array[i] = entry;
                        return;
                    }
                }
                array.push(entry);
            } else {
                this.buckets[hash] = [entry];
            }
            this.count++;
            this.linkedList.AddLast(entry);
        };

        Dictionary.prototype.Get = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            if (!Utils.HasOwnProperty(this.buckets, hash))
                return undefined;

            var array = this.buckets[hash];
            for (var i = 0; i < array.length; i++) {
                var entry = array[i];
                if (this.compareSelector(entry.Value.Key) === compareKey)
                    return entry.Value.Value;
            }
            return undefined;
        };

        Dictionary.prototype.Set = function (key, value) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);

            if (Utils.HasOwnProperty(this.buckets, hash)) {
                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    if (this.compareSelector(array[i].Value.Key) === compareKey) {
                        var newEntry = { Value: { Key: key, Value: value }, Prev: null, Next: null };
                        this.linkedList.Replace(array[i], newEntry);
                        array[i] = newEntry;
                        return true;
                    }
                }
            }
            return false;
        };

        Dictionary.prototype.Contains = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            if (!Utils.HasOwnProperty(this.buckets, hash))
                return false;

            var array = this.buckets[hash];
            for (var i = 0; i < array.length; i++) {
                if (this.compareSelector(array[i].Value.Key) === compareKey)
                    return true;
            }
            return false;
        };

        Dictionary.prototype.Clear = function () {
            this.count = 0;
            this.buckets = {};
            this.linkedList = new LinkedList();
        };

        Dictionary.prototype.Remove = function (key) {
            var compareKey = this.compareSelector(key);
            var hash = Utils.ComputeHashCode(compareKey);
            if (!Utils.HasOwnProperty(this.buckets, hash))
                return;

            var array = this.buckets[hash];
            for (var i = 0; i < array.length; i++) {
                if (this.compareSelector(array[i].Value.Key) === compareKey) {
                    this.linkedList.Remove(array[i]);
                    array.splice(i, 1);
                    if (array.length === 0)
                        delete this.buckets[hash];
                    this.count--;
                    return;
                }
            }
        };

        Dictionary.prototype.Count = function () {
            return this.count;
        };

        Dictionary.prototype.ToEnumerable = function () {
            var _this = this;
            return new Enumerable(function () {
                var currentEntry = null;

                return new IEnumerator(function () {
                    currentEntry = _this.linkedList.FirstEntry;
                }, function () {
                    if (currentEntry !== null) {
                        var result = { Key: currentEntry.Value.Key, Value: currentEntry.Value.Value };
                        currentEntry = currentEntry.Next;
                        return this.Yield(result);
                    }
                    return false;
                }, Functions.Blank);
            });
        };
        return Dictionary;
    })();
    LINQ.Dictionary = Dictionary;

    // Lookup
    var Lookup = (function () {
        function Lookup(dictionary) {
            this.dictionary = dictionary;
        }
        Lookup.prototype.Count = function () {
            return this.dictionary.Count();
        };

        Lookup.prototype.Get = function (key) {
            return FromArray(this.dictionary.Get(key));
        };

        Lookup.prototype.Contains = function (key) {
            return this.dictionary.Contains(key);
        };

        Lookup.prototype.ToEnumerable = function () {
            return this.dictionary.ToEnumerable().Select(function (kvp) {
                return new Grouping(kvp.Key, kvp.Value);
            });
        };
        return Lookup;
    })();
    LINQ.Lookup = Lookup;

    function Choice() {
        var v_args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            v_args[_i] = arguments[_i + 0];
        }
        var _this = this;
        var args = (v_args[0] instanceof Array) ? (v_args[0]) : (v_args);

        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () {
                return this.Yield(args[Math.floor(Math.random() * args.length)]);
            }, Functions.Blank);
        });
    }
    LINQ.Choice = Choice;

    function Cycle() {
        var v_args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            v_args[_i] = arguments[_i + 0];
        }
        var _this = this;
        var args = (v_args[0] instanceof Array) ? (v_args[0]) : (v_args);

        return new Enumerable(function () {
            var index = 0;
            return new IEnumerator(Functions.Blank, function () {
                if (index >= args.length)
                    index = 0;
                return this.Yield(args[index++]);
            }, Functions.Blank);
        });
    }
    LINQ.Cycle = Cycle;

    function Empty() {
        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, Functions.False, Functions.Blank);
        });
    }
    LINQ.Empty = Empty;

    function FromNull() {
        return Empty();
    }

    function FromEnumerable(obj) {
        if (!obj)
            return FromNull();
        return obj;
    }

    function FromNumber(obj) {
        if (obj === undefined || obj === null)
            return FromNull();
        return Repeat(obj, 1);
    }

    function FromBoolean(obj) {
        if (obj === undefined || obj === null)
            return FromNull();
        return Repeat(obj, 1);
    }

    function FromString(obj) {
        var _this = this;
        if (obj === undefined || obj === null)
            return FromNull();

        return new Enumerable(function () {
            var index = 0;
            return new IEnumerator(Functions.Blank, function () {
                return (index < obj.length) ? this.Yield(obj.charAt(index++)) : false;
            }, Functions.Blank);
        });
    }

    function FromFunction(obj) {
        if (!obj)
            return FromNull();

        return FromObject(obj);
    }

    function FromArray(obj) {
        if (!obj)
            return FromNull();
        return new ArrayEnumerable(obj);
    }

    function FromArrayOrEnumerable(obj) {
        if (!obj)
            return FromNull();

        if (obj instanceof Array)
            return FromArray(obj);
        return FromEnumerable(obj);
    }

    function FromObject(obj) {
        var _this = this;
        if (!obj)
            return FromNull();

        return new Enumerable(function () {
            var array = [];
            var index = 0;

            return new IEnumerator(function () {
                for (var key in obj) {
                    if (!(obj[key] instanceof Function)) {
                        array.push({ Key: key, Value: obj[key] });
                    }
                }
            }, function () {
                return (index < array.length) ? this.Yield(array[index++]) : false;
            }, Functions.Blank);
        });
    }

    function From(obj) {
        var _this = this;
        if (obj === undefined || obj === null)
            return FromNull();
        if (obj instanceof Enumerable)
            return FromEnumerable(obj);
        if (typeof obj === Types.Number)
            return FromNumber(obj);
        if (typeof obj === Types.Boolean)
            return FromBoolean(obj);
        if (typeof obj === Types.String)
            return FromString(obj);
        if (typeof obj !== Types.Function) {
            if (typeof obj.length === Types.Number)
                return FromArray(obj);

            if (!(obj instanceof Object) && Utils.IsIEnumerable(obj)) {
                return new Enumerable(function () {
                    var isFirst = true;
                    var enumerator;
                    return new IEnumerator(function () {
                        return enumerator = new Enumerator(obj);
                    }, function () {
                        if (isFirst)
                            isFirst = false; else
                            enumerator.moveNext();
                        return (enumerator.atEnd()) ? false : this.Yield(enumerator.item());
                    }, Functions.Blank);
                });
            }
        }

        // function/object : Create KeyValuePair[]
        return FromObject(obj);
    }
    LINQ.From = From;

    function Return(element) {
        return Repeat(element, 1);
    }
    LINQ.Return = Return;

    function Matches(input, pattern, flags) {
        var _this = this;
        if (!flags)
            flags = "";
        if (pattern instanceof RegExp) {
            flags += (pattern.ignoreCase) ? "i" : "";
            flags += (pattern.multiline) ? "m" : "";
            pattern = pattern.source;
        }
        if (flags.indexOf("g") === -1)
            flags += "g";

        return new Enumerable(function () {
            var regex;
            return new IEnumerator(function () {
                return regex = new RegExp(pattern, flags);
            }, function () {
                var match = regex.exec(input);
                return (match) ? this.Yield(match) : false;
            }, Functions.Blank);
        });
    }
    LINQ.Matches = Matches;

    function Range(start, count, step) {
        if (step === undefined || step === null)
            step = 1;
        return ToInfinity(start, step).Take(count);
    }
    LINQ.Range = Range;

    function RangeDown(start, count, step) {
        if (step === undefined || step === null)
            step = 1;
        return ToNegativeInfinity(start, step).Take(count);
    }
    LINQ.RangeDown = RangeDown;

    function RangeTo(start, to, step) {
        if (step === undefined || step === null)
            step = 1;
        return (start < to) ? ToInfinity(start, step).TakeWhile(function (i) {
            return i <= to;
        }) : ToNegativeInfinity(start, step).TakeWhile(function (i) {
            return i >= to;
        });
    }
    LINQ.RangeTo = RangeTo;

    function Repeat(obj, num) {
        var _this = this;
        if (num !== undefined && num !== null)
            return Repeat(obj).Take(num);

        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () {
                return this.Yield(obj);
            }, Functions.Blank);
        });
    }
    LINQ.Repeat = Repeat;

    function RepeatWithFinalize(initializer, finalizer) {
        var _this = this;
        return new Enumerable(function () {
            var element = null;
            return new IEnumerator(function () {
                return element = initializer();
            }, function () {
                return this.Yield(element);
            }, function () {
                if (element !== null) {
                    finalizer(element);
                    element = null;
                }
            });
        });
    }
    LINQ.RepeatWithFinalize = RepeatWithFinalize;

    function Generate(func, count) {
        var _this = this;
        if (count !== undefined && count !== null)
            return Generate(func).Take(count);

        return new Enumerable(function () {
            return new IEnumerator(Functions.Blank, function () {
                return this.Yield(func());
            }, Functions.Blank);
        });
    }
    LINQ.Generate = Generate;

    function ToInfinity(start, step) {
        var _this = this;
        if (start === undefined || start === null)
            start = 0;
        if (step === undefined || step === null)
            step = 1;

        return new Enumerable(function () {
            var value;
            return new IEnumerator(function () {
                return value = start - step;
            }, function () {
                return this.Yield(value += step);
            }, Functions.Blank);
        });
    }
    LINQ.ToInfinity = ToInfinity;

    function ToNegativeInfinity(start, step) {
        var _this = this;
        if (start === undefined || start === null)
            start = 0;
        if (step === undefined || step === null)
            step = 1;

        return new Enumerable(function () {
            var value;
            return new IEnumerator(function () {
                return value = start + step;
            }, function () {
                return this.Yield(value -= step);
            }, Functions.Blank);
        });
    }
    LINQ.ToNegativeInfinity = ToNegativeInfinity;

    function Unfold(seed, func) {
        var _this = this;
        func = func || Functions.Identity;

        return new Enumerable(function () {
            var isFirst = true;
            var value;
            return new IEnumerator(Functions.Blank, function () {
                if (isFirst) {
                    isFirst = false;
                    value = seed;
                    return this.Yield(value);
                }
                value = func(value);
                return this.Yield(value);
            }, Functions.Blank);
        });
    }
    LINQ.Unfold = Unfold;

    var Enumerable = (function () {
        function Enumerable(getEnumerator) {
            this.GetEnumerator = getEnumerator;
        }
        // Type Filtering Methods
        Enumerable.prototype.OfType = function (type) {
            var typeName;
            switch (type) {
                case Number:
                    typeName = Types.Number;
                    break;
                case String:
                    typeName = Types.String;
                    break;
                case Boolean:
                    typeName = Types.Boolean;
                    break;
                case Function:
                    typeName = Types.Function;
                    break;
                default:
                    typeName = "";
                    break;
            }
            return (!typeName) ? this.Where(function (x) {
                return x instanceof type;
            }) : this.Where(function (x) {
                return typeof x === typeName;
            });
        };

        // Ordering Methods
        Enumerable.prototype.OrderBy = function (keySelector) {
            return new OrderedEnumerable(this, keySelector, false);
        };

        Enumerable.prototype.OrderByDescending = function (keySelector) {
            return new OrderedEnumerable(this, keySelector, true);
        };

        // Projection and Filtering Methods
        Enumerable.prototype.CascadeBreadthFirst = function (func, resultSelector) {
            var _this = this;
            func = func || Functions.Identity;
            resultSelector = resultSelector || Functions.Identity;

            return new Enumerable(function () {
                var enumerator;
                var nestLevel = 0;
                var buffer = [];

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (true) {
                        if (enumerator.MoveNext()) {
                            buffer.push(enumerator.Current());
                            return this.Yield(resultSelector(enumerator.Current(), nestLevel));
                        }

                        var next = FromArray(buffer).SelectMany(func);
                        if (!next.Any()) {
                            return false;
                        } else {
                            nestLevel++;
                            buffer = [];
                            Utils.Dispose(enumerator);
                            enumerator = next.GetEnumerator();
                        }
                    }
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.CascadeDepthFirst = function (func, resultSelector) {
            var _this = this;
            func = func || Functions.Identity;
            resultSelector = resultSelector || Functions.Identity;

            return new Enumerable(function () {
                var enumeratorStack = [];
                var enumerator;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (true) {
                        if (enumerator.MoveNext()) {
                            var value = resultSelector(enumerator.Current(), enumeratorStack.length);
                            enumeratorStack.push(enumerator);
                            enumerator = From(func(enumerator.Current())).GetEnumerator();
                            return this.Yield(value);
                        }

                        if (enumeratorStack.length <= 0)
                            return false;
                        Utils.Dispose(enumerator);
                        enumerator = enumeratorStack.pop();
                    }
                }, function () {
                    try  {
                        Utils.Dispose(enumerator);
                    } finally {
                        FromArray(enumeratorStack).ForEach(function (s) {
                            return s.Dispose();
                        });
                    }
                });
            });
        };

        Enumerable.prototype.Flatten = function () {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var middleEnumerator = null;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (true) {
                        if (middleEnumerator) {
                            if (middleEnumerator.MoveNext()) {
                                return this.Yield(middleEnumerator.Current());
                            } else {
                                middleEnumerator = null;
                            }
                        }

                        if (enumerator.MoveNext()) {
                            if (enumerator.Current() instanceof Array) {
                                Utils.Dispose(middleEnumerator);
                                middleEnumerator = From(enumerator.Current()).SelectMany(Functions.Identity).Flatten().GetEnumerator();
                                continue;
                            } else {
                                return this.Yield(enumerator.Current());
                            }
                        }

                        return false;
                    }
                }, function () {
                    try  {
                        Utils.Dispose(enumerator);
                    } finally {
                        Utils.Dispose(middleEnumerator);
                    }
                });
            });
        };

        Enumerable.prototype.Pairwise = function (selector) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();
                    enumerator.MoveNext();
                }, function () {
                    var prev = enumerator.Current();
                    return enumerator.MoveNext() ? this.Yield(selector(prev, enumerator.Current())) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Scan = function (seed, func, resultSelector) {
            var _this = this;
            if (resultSelector)
                return this.Scan(seed, func).Select(resultSelector);

            var isUseSeed = !!seed;

            return new Enumerable(function () {
                var enumerator;
                var isFirst = true;
                var value;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    if (isFirst) {
                        isFirst = false;
                        if (!isUseSeed) {
                            if (enumerator.MoveNext()) {
                                return this.Yield(value = enumerator.Current());
                            }
                        } else {
                            return this.Yield(value = seed);
                        }
                    }

                    return enumerator.MoveNext() ? this.Yield(value = func(value, enumerator.Current())) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Select = function (selector) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    return enumerator.MoveNext() ? this.Yield(selector(enumerator.Current(), index++)) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.SelectMany = function (collectionSelector, resultSelector) {
            var _this = this;
            collectionSelector = collectionSelector || Functions.Identity;
            if (!resultSelector)
                resultSelector = function (a, b) {
                    return b;
                };

            return new Enumerable(function () {
                var enumerator;
                var middleEnumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    if (!middleEnumerator) {
                        if (!enumerator.MoveNext())
                            return false;
                    }
                    do {
                        if (!middleEnumerator) {
                            var middleSeq = collectionSelector(enumerator.Current(), index++);
                            middleEnumerator = From(middleSeq).GetEnumerator();
                        }
                        if (middleEnumerator.MoveNext()) {
                            return this.Yield(resultSelector(enumerator.Current(), middleEnumerator.Current()));
                        }
                        Utils.Dispose(middleEnumerator);
                        middleEnumerator = null;
                    } while(enumerator.MoveNext());
                    return false;
                }, function () {
                    try  {
                        Utils.Dispose(enumerator);
                    } finally {
                        Utils.Dispose(middleEnumerator);
                    }
                });
            });
        };

        Enumerable.prototype.Where = function (predicate) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (enumerator.MoveNext()) {
                        if (predicate(enumerator.Current(), index++)) {
                            return this.Yield(enumerator.Current());
                        }
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Zip = function (second, selector) {
            var _this = this;
            return new Enumerable(function () {
                var index = 0;
                var firstEnumerator;
                var secondEnumerator;

                return new IEnumerator(function () {
                    firstEnumerator = _this.GetEnumerator();
                    secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
                }, function () {
                    if (firstEnumerator.MoveNext() && secondEnumerator.MoveNext()) {
                        return this.Yield(selector(firstEnumerator.Current(), secondEnumerator.Current(), index++));
                    }
                    return false;
                }, function () {
                    try  {
                        Utils.Dispose(firstEnumerator);
                    } finally {
                        Utils.Dispose(secondEnumerator);
                    }
                });
            });
        };

        // Join Methods
        Enumerable.prototype.Join = function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
            var _this = this;
            return new Enumerable(function () {
                var outerEnumerator;
                var lookup;
                var innerElements = null;
                var innerCount = 0;

                return new IEnumerator(function () {
                    outerEnumerator = _this.GetEnumerator();
                    lookup = FromEnumerable(inner).ToLookup(innerKeySelector, Functions.Identity, compareSelector);
                }, function () {
                    while (true) {
                        if (innerElements) {
                            var innerElement = innerElements[innerCount++];
                            if (innerElement !== undefined) {
                                return this.Yield(resultSelector(outerEnumerator.Current(), innerElement));
                            }

                            innerElement = null;
                            innerCount = 0;
                        }

                        if (outerEnumerator.MoveNext()) {
                            var key = outerKeySelector(outerEnumerator.Current());
                            innerElements = lookup.Get(key).ToArray();
                        } else {
                            return false;
                        }
                    }
                }, function () {
                    return Utils.Dispose(outerEnumerator);
                });
            });
        };

        Enumerable.prototype.GroupJoin = function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var lookup;

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();
                    lookup = FromEnumerable(inner).ToLookup(innerKeySelector, Functions.Identity, compareSelector);
                }, function () {
                    if (enumerator.MoveNext()) {
                        var innerElement = lookup.Get(outerKeySelector(enumerator.Current()));
                        return this.Yield(resultSelector(enumerator.Current(), innerElement));
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.All = function (predicate) {
            var result = true;
            this.ForEach(function (x) {
                if (!predicate(x)) {
                    result = false;
                    return false;
                }
            });
            return result;
        };

        Enumerable.prototype.Any = function (predicate) {
            var enumerator = this.GetEnumerator();
            try  {
                if (!predicate)
                    return enumerator.MoveNext();

                while (enumerator.MoveNext()) {
                    if (predicate(enumerator.Current()))
                        return true;
                }
                return false;
            } finally {
                Utils.Dispose(enumerator);
            }
        };

        Enumerable.prototype.Concat = function (second) {
            var _this = this;
            return new Enumerable(function () {
                var firstEnumerator;
                var secondEnumerator;

                return new IEnumerator(function () {
                    return firstEnumerator = _this.GetEnumerator();
                }, function () {
                    if (!secondEnumerator) {
                        if (firstEnumerator.MoveNext())
                            return this.Yield(firstEnumerator.Current());
                        secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
                    }
                    if (secondEnumerator.MoveNext())
                        return this.Yield(secondEnumerator.Current());
                    return false;
                }, function () {
                    try  {
                        Utils.Dispose(firstEnumerator);
                    } finally {
                        Utils.Dispose(secondEnumerator);
                    }
                });
            });
        };

        Enumerable.prototype.Insert = function (index, second) {
            var _this = this;
            return new Enumerable(function () {
                var firstEnumerator;
                var secondEnumerator;
                var count = 0;
                var isEnumerated = false;

                return new IEnumerator(function () {
                    firstEnumerator = _this.GetEnumerator();
                    secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
                }, function () {
                    if (count === index && secondEnumerator.MoveNext()) {
                        isEnumerated = true;
                        return this.Yield(secondEnumerator.Current());
                    }
                    if (firstEnumerator.MoveNext()) {
                        count++;
                        return this.Yield(firstEnumerator.Current());
                    }
                    if (!isEnumerated && secondEnumerator.MoveNext()) {
                        return this.Yield(secondEnumerator.Current());
                    }
                    return false;
                }, function () {
                    try  {
                        Utils.Dispose(firstEnumerator);
                    } finally {
                        Utils.Dispose(secondEnumerator);
                    }
                });
            });
        };

        Enumerable.prototype.Alternate = function (value) {
            var _this = this;
            // NOTE: Rewrite to eliminate call to SelectMany for more detailed type information
            return new Enumerable(function () {
                var enumerator;
                var itemLast = false;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    if (itemLast) {
                        itemLast = false;
                        return this.Yield(value);
                    } else if (enumerator.MoveNext()) {
                        itemLast = true;
                        return this.Yield(enumerator.Current());
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            }).TakeExceptLast();
        };

        Enumerable.prototype.Contains = function (value, compareSelector) {
            compareSelector = compareSelector || Functions.Identity;
            var enumerator = this.GetEnumerator();
            try  {
                while (enumerator.MoveNext()) {
                    if (compareSelector(enumerator.Current()) === value)
                        return true;
                }
                return false;
            } finally {
                Utils.Dispose(enumerator);
            }
        };

        Enumerable.prototype.DefaultIfEmpty = function (defaultValue) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var isFirst = true;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    if (enumerator.MoveNext()) {
                        isFirst = false;
                        return this.Yield(enumerator.Current());
                    } else if (isFirst) {
                        isFirst = false;
                        return this.Yield(defaultValue);
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Distinct = function (compareSelector) {
            return this.Except(Empty(), compareSelector);
        };

        Enumerable.prototype.Except = function (second, compareSelector) {
            var _this = this;
            compareSelector = compareSelector || Functions.Identity;

            return new Enumerable(function () {
                var enumerator;
                var keys;

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();
                    keys = new Collection(compareSelector);
                    FromArrayOrEnumerable(second).ForEach(function (key) {
                        return keys.Add(key);
                    });
                }, function () {
                    while (enumerator.MoveNext()) {
                        var current = enumerator.Current();
                        if (!keys.Contains(current)) {
                            keys.Add(current);
                            return this.Yield(current);
                        }
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Intersect = function (second, compareSelector) {
            var _this = this;
            compareSelector = compareSelector || Functions.Identity;

            return new Enumerable(function () {
                var enumerator;
                var keys;
                var outs;

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();

                    keys = new Collection(compareSelector);
                    FromArrayOrEnumerable(second).ForEach(function (key) {
                        return keys.Add(key);
                    });
                    outs = new Collection(compareSelector);
                }, function () {
                    while (enumerator.MoveNext()) {
                        var current = enumerator.Current();
                        if (!outs.Contains(current) && keys.Contains(current)) {
                            outs.Add(current);
                            return this.Yield(current);
                        }
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.SequenceEqual = function (second, compareSelector) {
            compareSelector = compareSelector || Functions.Identity;

            var firstEnumerator = this.GetEnumerator();
            try  {
                var secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
                try  {
                    while (firstEnumerator.MoveNext()) {
                        if (!secondEnumerator.MoveNext() || compareSelector(firstEnumerator.Current()) !== compareSelector(secondEnumerator.Current())) {
                            return false;
                        }
                    }

                    if (secondEnumerator.MoveNext())
                        return false;
                    return true;
                } finally {
                    Utils.Dispose(secondEnumerator);
                }
            } finally {
                Utils.Dispose(firstEnumerator);
            }
        };

        Enumerable.prototype.Union = function (second, compareSelector) {
            var _this = this;
            compareSelector = compareSelector || Functions.Identity;

            return new Enumerable(function () {
                var firstEnumerator;
                var secondEnumerator;
                var keys;

                return new IEnumerator(function () {
                    firstEnumerator = _this.GetEnumerator();
                    keys = new Collection(compareSelector);
                }, function () {
                    var current;
                    if (!secondEnumerator) {
                        while (firstEnumerator.MoveNext()) {
                            current = firstEnumerator.Current();
                            if (!keys.Contains(current)) {
                                keys.Add(current);
                                return this.Yield(current);
                            }
                        }
                        secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
                    }
                    while (secondEnumerator.MoveNext()) {
                        current = secondEnumerator.Current();
                        if (!keys.Contains(current)) {
                            keys.Add(current);
                            return this.Yield(current);
                        }
                    }
                    return false;
                }, function () {
                    try  {
                        Utils.Dispose(firstEnumerator);
                    } finally {
                        Utils.Dispose(secondEnumerator);
                    }
                });
            });
        };

        Enumerable.prototype.Reverse = function () {
            var _this = this;
            return new Enumerable(function () {
                var buffer;
                var index;

                return new IEnumerator(function () {
                    buffer = _this.ToArray();
                    index = buffer.length;
                }, function () {
                    return (index > 0) ? this.Yield(buffer[--index]) : false;
                }, Functions.Blank);
            });
        };

        Enumerable.prototype.Shuffle = function () {
            var _this = this;
            return new Enumerable(function () {
                var buffer;

                return new IEnumerator(function () {
                    return buffer = _this.ToArray();
                }, function () {
                    if (buffer.length > 0) {
                        var i = Math.floor(Math.random() * buffer.length);
                        return this.Yield(buffer.splice(i, 1)[0]);
                    }
                    return false;
                }, Functions.Blank);
            });
        };

        Enumerable.prototype.GroupBy = function (keySelector, elementSelector, resultSelector, compareSelector) {
            var _this = this;
            elementSelector = elementSelector || Functions.Identity;
            compareSelector = compareSelector || Functions.Identity;

            return new Enumerable(function () {
                var enumerator;

                return new IEnumerator(function () {
                    return enumerator = _this.ToLookup(keySelector, elementSelector, compareSelector).ToEnumerable().GetEnumerator();
                }, function () {
                    while (enumerator.MoveNext()) {
                        return (!resultSelector) ? this.Yield(enumerator.Current()) : this.Yield(resultSelector(enumerator.Current().Key(), enumerator.Current()));
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.PartitionBy = function (keySelector, elementSelector, resultSelector, compareSelector) {
            var _this = this;
            elementSelector = elementSelector || Functions.Identity;
            compareSelector = compareSelector || Functions.Identity;
            if (!resultSelector)
                resultSelector = function (key, group) {
                    return new Grouping(key, group);
                };

            return new Enumerable(function () {
                var enumerator;
                var key;
                var compareKey;
                var group = [];

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();
                    if (enumerator.MoveNext()) {
                        key = keySelector(enumerator.Current());
                        compareKey = compareSelector(key);
                        group.push(elementSelector(enumerator.Current()));
                    }
                }, function () {
                    var hasNext;
                    while (hasNext = enumerator.MoveNext()) {
                        if (compareKey === compareSelector(keySelector(enumerator.Current()))) {
                            group.push(elementSelector(enumerator.Current()));
                        } else {
                            break;
                        }
                    }

                    if (group.length > 0) {
                        var result = resultSelector(key, group);
                        if (hasNext) {
                            key = keySelector(enumerator.Current());
                            compareKey = compareSelector(key);
                            group = [elementSelector(enumerator.Current())];
                        } else {
                            group = [];
                        }

                        return this.Yield(result);
                    }

                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Aggregate = function (seed, func, resultSelector) {
            return this.Scan(seed, func, resultSelector).Last();
        };

        Enumerable.prototype.Average = function (selector) {
            selector = selector || Functions.Identity;

            var sum = 0;
            var count = 0;
            this.ForEach(function (x) {
                sum += selector(x);
                ++count;
            });

            return sum / count;
        };

        Enumerable.prototype.Count = function (predicate) {
            predicate = predicate || Functions.True;

            var count = 0;
            this.ForEach(function (x, i) {
                if (predicate(x, i))
                    ++count;
            });
            return count;
        };

        Enumerable.prototype.Max = function (selector) {
            selector = selector || Functions.Identity;
            return this.Select(selector).Aggregate(function (a, b) {
                return (a > b) ? a : b;
            });
        };

        Enumerable.prototype.Min = function (selector) {
            selector = selector || Functions.Identity;
            return this.Select(selector).Aggregate(function (a, b) {
                return (a < b) ? a : b;
            });
        };

        Enumerable.prototype.MaxBy = function (keySelector) {
            return this.Aggregate(function (a, b) {
                return (keySelector(a) > keySelector(b)) ? a : b;
            });
        };

        Enumerable.prototype.MinBy = function (keySelector) {
            return this.Aggregate(function (a, b) {
                return (keySelector(a) < keySelector(b)) ? a : b;
            });
        };

        Enumerable.prototype.Sum = function (selector) {
            selector = selector || Functions.Identity;
            return this.Select(selector).Aggregate(0, function (a, b) {
                return a + b;
            });
        };

        // Paging Methods
        Enumerable.prototype.ElementAt = function (index) {
            var value;
            var found = false;
            this.ForEach(function (x, i) {
                if (i === index) {
                    value = x;
                    found = true;
                    return false;
                }
            });

            if (!found)
                throw new Error("ElementAt: Index is less than 0 or greater than or equal to the number of elements in the sequence.");
            return value;
        };

        Enumerable.prototype.ElementAtOrDefault = function (index, defaultValue) {
            var value;
            var found = false;
            this.ForEach(function (x, i) {
                if (i === index) {
                    value = x;
                    found = true;
                    return false;
                }
            });

            return (!found) ? defaultValue : value;
        };

        Enumerable.prototype.First = function (predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    value = x;
                    found = true;
                    return false;
                }
            });

            if (!found)
                throw new Error("First: No element satisfies the condition.");
            return value;
        };

        Enumerable.prototype.FirstOrDefault = function (defaultValue, predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    value = x;
                    found = true;
                    return false;
                }
            });
            return (!found) ? defaultValue : value;
        };

        Enumerable.prototype.Last = function (predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    found = true;
                    value = x;
                }
            });

            if (!found)
                throw new Error("Last: No element satisfies the condition.");
            return value;
        };

        Enumerable.prototype.LastOrDefault = function (defaultValue, predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    found = true;
                    value = x;
                }
            });
            return (!found) ? defaultValue : value;
        };

        Enumerable.prototype.Single = function (predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    if (!found) {
                        found = true;
                        value = x;
                    } else {
                        throw new Error("Single: Sequence contains more than one element satisfying the condition.");
                    }
                }
            });

            if (!found)
                throw new Error("Single: No element in the sequence satisfies the condition.");
            return value;
        };

        Enumerable.prototype.SingleOrDefault = function (defaultValue, predicate) {
            var value;
            var found = false;
            this.ForEach(function (x) {
                if (!predicate || predicate(x)) {
                    if (!found) {
                        found = true;
                        value = x;
                    } else {
                        throw new Error("Single: Sequence contains more than one element satisfying the condition.");
                    }
                }
            });

            return (!found) ? defaultValue : value;
        };

        Enumerable.prototype.Skip = function (count) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    enumerator = _this.GetEnumerator();
                    while (index++ < count && enumerator.MoveNext()) {
                    }
                    ;
                }, function () {
                    return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.SkipWhile = function (predicate) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;
                var isSkipEnd = false;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (!isSkipEnd) {
                        if (enumerator.MoveNext()) {
                            if (!predicate(enumerator.Current(), index++)) {
                                isSkipEnd = true;
                                return this.Yield(enumerator.Current());
                            }
                            continue;
                        } else {
                            return false;
                        }
                    }

                    return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Take = function (count) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    return index++ < count && enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.TakeWhile = function (predicate) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    return enumerator.MoveNext() && predicate(enumerator.Current(), index++) ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.TakeExceptLast = function (count) {
            var _this = this;
            if (count === undefined || count === null)
                count = 1;

            return new Enumerable(function () {
                if (count <= 0)
                    return _this.GetEnumerator();

                var enumerator;
                var q = [];

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    while (enumerator.MoveNext()) {
                        if (q.length === count) {
                            q.push(enumerator.Current());
                            return this.Yield(q.shift());
                        }
                        q.push(enumerator.Current());
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.TakeFromLast = function (count) {
            var _this = this;
            if (count <= 0 || count === undefined || count === null)
                return Empty();

            return new Enumerable(function () {
                var sourceEnumerator;
                var enumerator;
                var q = [];

                return new IEnumerator(function () {
                    return sourceEnumerator = _this.GetEnumerator();
                }, function () {
                    while (sourceEnumerator.MoveNext()) {
                        if (q.length === count)
                            q.shift();
                        q.push(sourceEnumerator.Current());
                    }
                    if (!enumerator) {
                        enumerator = FromArray(q).GetEnumerator();
                    }
                    return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.IndexOf = function (item) {
            var found = -1;
            this.ForEach(function (x, i) {
                if (x === item) {
                    found = i;
                    return true;
                }
            });

            return found;
        };

        Enumerable.prototype.LastIndexOf = function (item) {
            var result = -1;
            this.ForEach(function (x, i) {
                if (x === item)
                    result = i;
            });
            return result;
        };

        // Conversion Methods
        Enumerable.prototype.ToArray = function () {
            var array = [];
            this.ForEach(function (x) {
                return array.push(x);
            });
            return array;
        };

        Enumerable.prototype.ToLookup = function (keySelector, elementSelector, compareSelector) {
            elementSelector = elementSelector || Functions.Identity;
            compareSelector = compareSelector || Functions.Identity;

            var dict = new Dictionary(compareSelector);
            this.ForEach(function (x) {
                var key = keySelector(x);
                var element = elementSelector(x);

                var array = dict.Get(key);
                if (array)
                    array.push(element); else
                    dict.Add(key, [element]);
            });
            return new Lookup(dict);
        };

        Enumerable.prototype.ToObject = function (keySelector, elementSelector) {
            var obj = {};
            this.ForEach(function (x) {
                return obj[keySelector(x)] = elementSelector(x);
            });
            return obj;
        };

        Enumerable.prototype.ToDictionary = function (keySelector, elementSelector, compareSelector) {
            elementSelector = elementSelector || Functions.Identity;
            compareSelector = compareSelector || Functions.Identity;

            var dict = new Dictionary(compareSelector);
            this.ForEach(function (x) {
                return dict.Add(keySelector(x), elementSelector(x));
            });
            return dict;
        };

        Enumerable.prototype.ToJSON = function (replacer, space) {
            return JSON.stringify(this.ToArray(), replacer, space);
        };

        Enumerable.prototype.ToString = function (separator, selector) {
            if (!separator)
                separator = "";
            selector = selector || Functions.Identity;

            return this.Select(selector).ToArray().join(separator);
        };

        // Action Methods
        Enumerable.prototype.Do = function (action) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    if (enumerator.MoveNext()) {
                        action(enumerator.Current(), index++);
                        return this.Yield(enumerator.Current());
                    }
                    return false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.ForEach = function (action, context) {
            var index = 0;
            var enumerator = this.GetEnumerator();
            try  {
                while (enumerator.MoveNext()) {
                    if (context) {
                        if (action.call(context, enumerator.Current(), index++) === false)
                            break;
                    } else {
                        if (action(enumerator.Current(), index++) === false)
                            break;
                    }
                }
            } finally {
                Utils.Dispose(enumerator);
            }
        };

        Enumerable.prototype.Write = function (separator, selector) {
            if (!separator)
                separator = "";
            selector = selector || Functions.Identity;

            var isFirst = true;
            this.ForEach(function (item) {
                if (isFirst)
                    isFirst = false; else
                    document.write(separator || "");
                document.write(selector(item));
            });
        };

        Enumerable.prototype.WriteLine = function (selector) {
            selector = selector || Functions.Identity;

            this.ForEach(function (item) {
                document.write(selector(item));
                document.write("<br />");
            });
        };

        Enumerable.prototype.Force = function () {
            var enumerator = this.GetEnumerator();

            try  {
                while (enumerator.MoveNext()) {
                }
            } finally {
                Utils.Dispose(enumerator);
            }
        };

        // Functional Methods
        Enumerable.prototype.Let = function (func) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;

                return new IEnumerator(function () {
                    return enumerator = FromEnumerable(func(_this)).GetEnumerator();
                }, function () {
                    return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Share = function () {
            var _this = this;
            var sharedEnumerator;

            return new Enumerable(function () {
                return new IEnumerator(function () {
                    if (!sharedEnumerator)
                        sharedEnumerator = _this.GetEnumerator();
                }, function () {
                    return sharedEnumerator.MoveNext() ? this.Yield(sharedEnumerator.Current()) : false;
                }, Functions.Blank);
            });
        };

        Enumerable.prototype.MemoizeAll = function () {
            var _this = this;
            var cache;
            var enumerator;

            return new Enumerable(function () {
                var index = -1;

                return new IEnumerator(function () {
                    if (!enumerator) {
                        enumerator = _this.GetEnumerator();
                        cache = [];
                    }
                }, function () {
                    index++;
                    if (cache.length <= index) {
                        return enumerator.MoveNext() ? this.Yield(cache[index] = enumerator.Current()) : false;
                    }
                    return this.Yield(cache[index]);
                }, Functions.Blank);
            });
        };

        // Error Handling Methods
        Enumerable.prototype.Catch = function (handler) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    try  {
                        return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                    } catch (e) {
                        if (handler)
                            handler(e);
                        return false;
                    }
                }, function () {
                    return Utils.Dispose(enumerator);
                });
            });
        };

        Enumerable.prototype.Finally = function (finallyAction) {
            var _this = this;
            return new Enumerable(function () {
                var enumerator;

                return new IEnumerator(function () {
                    return enumerator = _this.GetEnumerator();
                }, function () {
                    return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
                }, function () {
                    try  {
                        Utils.Dispose(enumerator);
                    } finally {
                        if (finallyAction)
                            finallyAction();
                    }
                });
            });
        };

        // Debug Methods
        Enumerable.prototype.Trace = function (message, selector) {
            if (message === undefined || message === null)
                message = "Trace";
            selector = selector || Functions.Identity;

            return this.Do(function (item) {
                return console.log(message, ":", selector(item));
            });
        };
        return Enumerable;
    })();
    LINQ.Enumerable = Enumerable;

    // Sorting Context
    function CreateSortContext(orderedEnumerable, currentContext) {
        var context = new SortContext(orderedEnumerable.keySelector, orderedEnumerable.descending, currentContext);
        if (orderedEnumerable.parent)
            return CreateSortContext(orderedEnumerable.parent, context);
        return context;
    }

    var SortContext = (function () {
        function SortContext(keySelector, descending, child) {
            this.keys = null;
            this.keySelector = keySelector;
            this.descending = descending;
            this.child = child;
        }
        SortContext.prototype.GenerateKeys = function (source) {
            this.keys = FromArray(source).Select(this.keySelector).ToArray();
            if (this.child)
                this.child.GenerateKeys(source);
        };
        SortContext.prototype.Compare = function (index1, index2) {
            var comparison = Utils.Compare(this.keys[index1], this.keys[index2]);

            if (comparison === 0) {
                if (this.child)
                    return this.child.Compare(index1, index2);
                comparison = Utils.Compare(index1, index2);
            }

            return (this.descending) ? -comparison : comparison;
        };
        return SortContext;
    })();

    var OrderedEnumerable = (function (_super) {
        __extends(OrderedEnumerable, _super);
        function OrderedEnumerable(source, keySelector, descending, parent) {
            var _this = this;
            _super.call(this, null);

            this.source = source;
            this.keySelector = keySelector;
            this.descending = descending;
            this.parent = parent;

            this.GetEnumerator = function () {
                var buffer;
                var indexes;
                var index = 0;

                return new IEnumerator(function () {
                    buffer = [];
                    indexes = [];
                    _this.source.ForEach(function (item, index) {
                        buffer.push(item);
                        indexes.push(index);
                    });
                    var sortContext = CreateSortContext(_this, null);
                    sortContext.GenerateKeys(buffer);

                    indexes.sort(function (a, b) {
                        return sortContext.Compare(a, b);
                    });
                }, function () {
                    return (index < indexes.length) ? this.Yield(buffer[indexes[index++]]) : false;
                }, Functions.Blank);
            };
        }
        OrderedEnumerable.prototype.CreateOrderedEnumerable = function (keySelector, descending) {
            return new OrderedEnumerable(this.source, keySelector, descending, this);
        };
        OrderedEnumerable.prototype.ThenBy = function (keySelector) {
            return this.CreateOrderedEnumerable(keySelector, false);
        };
        OrderedEnumerable.prototype.ThenByDescending = function (keySelector) {
            return this.CreateOrderedEnumerable(keySelector, true);
        };
        return OrderedEnumerable;
    })(Enumerable);
    LINQ.OrderedEnumerable = OrderedEnumerable;

    // ArrayEnumerable: Enumerable optimized for array or array-like object
    var ArrayEnumerable = (function (_super) {
        __extends(ArrayEnumerable, _super);
        function ArrayEnumerable(src) {
            var _this = this;
            _super.call(this, null);

            this.source = src;
            var source = this.source;

            this.GetEnumerator = function () {
                var index = 0;

                return new IEnumerator(Functions.Blank, function () {
                    while (index < source.length) {
                        return this.Yield(source[index++]);
                    }
                    return false;
                }, Functions.Blank);
            };
        }
        ArrayEnumerable.prototype.Any = function (predicate) {
            return (!predicate) ? (this.source.length > 0) : _super.prototype.Any.call(this, predicate);
        };
        ArrayEnumerable.prototype.Count = function (predicate) {
            return (!predicate) ? this.source.length : _super.prototype.Count.call(this, predicate);
        };
        ArrayEnumerable.prototype.ElementAt = function (index) {
            return (0 <= index && index < this.source.length) ? this.source[index] : _super.prototype.ElementAt.call(this, index);
        };
        ArrayEnumerable.prototype.ElementAtOrDefault = function (index, defaultValue) {
            return (0 <= index && index < this.source.length) ? this.source[index] : defaultValue;
        };
        ArrayEnumerable.prototype.First = function (predicate) {
            return (!predicate && this.source.length > 0) ? this.source[0] : _super.prototype.First.call(this, predicate);
        };
        ArrayEnumerable.prototype.FirstOrDefault = function (defaultValue, predicate) {
            return !predicate ? (this.source.length > 0 ? this.source[0] : defaultValue) : _super.prototype.FirstOrDefault.call(this, defaultValue, predicate);
        };
        ArrayEnumerable.prototype.Last = function (predicate) {
            return (!predicate && this.source.length > 0) ? this.source[this.source.length - 1] : _super.prototype.Last.call(this, predicate);
        };
        ArrayEnumerable.prototype.LastOrDefault = function (defaultValue, predicate) {
            return !predicate ? (this.source.length > 0 ? this.source[this.source.length - 1] : defaultValue) : _super.prototype.LastOrDefault.call(this, defaultValue, predicate);
        };
        ArrayEnumerable.prototype.Skip = function (count) {
            var _this = this;
            var source = this.source;

            return new Enumerable(function () {
                var index;

                return new IEnumerator(function () {
                    return index = (count < 0) ? 0 : count;
                }, function () {
                    while (index < source.length) {
                        return this.Yield(source[index++]);
                    }
                    return false;
                }, Functions.Blank);
            });
        };
        ArrayEnumerable.prototype.TakeExceptLast = function (count) {
            if (count === undefined || count === null)
                count = 1;
            return this.Take(this.source.length - count);
        };
        ArrayEnumerable.prototype.TakeFromLast = function (count) {
            return this.Skip(this.source.length - count);
        };
        ArrayEnumerable.prototype.Reverse = function () {
            var _this = this;
            var source = this.source;

            return new Enumerable(function () {
                var index;

                return new IEnumerator(function () {
                    return index = source.length;
                }, function () {
                    return (index > 0) ? this.Yield(source[--index]) : false;
                }, Functions.Blank);
            });
        };

        ArrayEnumerable.prototype.SequenceEqual = function (second, compareSelector) {
            if ((second instanceof ArrayEnumerable || second instanceof Array) && (!compareSelector) && FromArrayOrEnumerable(second).Count() !== this.Count()) {
                return false;
            }

            return _super.prototype.SequenceEqual.call(this, second, compareSelector);
        };
        ArrayEnumerable.prototype.ToString = function (separator, selector) {
            if (selector)
                return _super.prototype.ToString.call(this, separator, selector);

            if (!separator)
                separator = "";
            return this.source.join(separator);
        };
        return ArrayEnumerable;
    })(Enumerable);
    LINQ.ArrayEnumerable = ArrayEnumerable;

    // Grouping
    var Grouping = (function (_super) {
        __extends(Grouping, _super);
        function Grouping(key, elements) {
            _super.call(this, elements);

            this.key = key;
        }
        Grouping.prototype.Key = function () {
            return this.key;
        };
        return Grouping;
    })(ArrayEnumerable);
    LINQ.Grouping = Grouping;
})(LINQ || (LINQ = {}));
