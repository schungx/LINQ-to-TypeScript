module LINQ
{
  // Types and interfaces

	export interface Generator<T> { (): T; }
	export interface SimpleAction { (): void; }
	export interface Action<T> { (item: T): void; }
	export interface ActionX<T> { (item: T, index: number): void; }
	export interface Predicate<T> { (item: T): boolean; }
	export interface PredicateX<T> { (item: T, index: number): boolean; }

	export interface Transform<T, U> { (item: T): U; }
	export interface TransformX<T, U> { (item: T, index: number): U; }

	export interface DualTransform<T, U, V> { (item1: T, item2: U): V; }
	export interface DualTransformX<T, U, V> { (item1: T, item2: U, index: number): V; }
	export interface NumericTransform<T> { (item: T): number; }
	export interface PreviousCurrentTransform<T, U, V> { (previousItem: T, currentItem: U): V; }

	// JScript's Enumerator

	declare class Enumerator
	{
		constructor(obj: any);
		moveNext(): void;
		atEnd(): boolean;
		item(): any;
	}

	// Types

	export interface KeyValuePair<K, V>
	{
		Key: K;
		Value: V;
	}

	// Cached functions

	var _Functions =
	{
		Identity: x => x,
		True: () => true,
		False: () => false,
		Blank: () => { },
		Null: () => null
	};

	// Type strings

	var Types =
	{
		Boolean: typeof true,
		Number: typeof 0,
		String: typeof "",
		Object: typeof {},
		Undefined: typeof undefined,
		Function: typeof function () { }
	};

	// Enumerator states

	enum States
	{
		Before = 0,
		Running = 1,
		After = 2
	}

	// for tryGetNext
	export class Yielder<T>
	{
		private current: T = null;

		Current(): T	{ return this.current }

		Yield(value: T): boolean
		{
			this.current = value;
			return true;
		}
	}

	// Name "Enumerator" conflicts with JScript's "Enumerator"

	export class IEnumerator<T>
	{
		private yielder = new Yielder<T>();
		private state: States = States.Before;
		private initialize: SimpleAction;
		private tryGetNext: (yielder?: Yielder<T>) => boolean;
		private dispose: SimpleAction;

		constructor(initialize: SimpleAction, tryGetNext: (yielder?: Yielder<T>) => boolean, dispose: SimpleAction)
		{
			this.initialize = initialize;
			this.tryGetNext = tryGetNext;
			this.dispose = dispose;
		}

		Current(): T
		{
			return this.yielder.Current();
		}

		MoveNext(): boolean
		{
			try {
				switch (this.state) {
					case States.Before:
						this.state = States.Running;
						this.initialize(); // fall through
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
		}

		Dispose(): void
		{
			if (this.state !== States.Running) return;

			try { this.dispose(); } finally { this.state = States.After; }
		}
	}

	// Utility functions

	module Utils
	{
		export function IsIEnumerable(obj: any): boolean
		{
			if (typeof Enumerator !== Types.Undefined) {
				try { new Enumerator(obj); return true; } catch (e) { }
			}
			return false;
		}

		export function Compare(a: any, b: any): number
		{
			return (a === b) ? 0 : ((a > b) ? 1 : -1);
		}

		export function Dispose<T>(obj: IEnumerator<T>): void {
			if (obj) obj.Dispose();
		}

		export function HasOwnProperty(target: any, key: string): boolean
		{
			return Object.prototype.hasOwnProperty.call(target, key);
		}

		export function ComputeHashCode(obj: any): string
		{
			if (obj === null) return "null";
			if (obj === undefined) return "undefined";

			if (typeof obj === "number") {
				var num = Math.floor((<number> obj) % 10000);
				return num.toString();
			}

			if (typeof obj === "string") {
				// Java's hash function
				var str = <string> obj;
				var hash = 0;

				if (str.length == 0) return "0";

				for (var i = 0; i < str.length; i++) {
					var char  = str.charCodeAt(i);
					hash = ((hash << 5) - hash) + char;
					hash |= 0; // Convert to 32bit integer
				}
				return hash.toString();
			}

			return (typeof obj.toString === Types.Function) ? obj.toString() : Object.prototype.toString.call(obj);
		}
	}

	// Linked list

	interface LinkedListItem<V>
	{
		Value: V;
		Prev: LinkedListItem<V>;
		Next: LinkedListItem<V>;
	}

	class LinkedList<V>
	{
		FirstEntry: LinkedListItem<V> = null;
		LastEntry: LinkedListItem<V> = null;

		AddLast(entry: LinkedListItem<V>): void
		{
			if (this.LastEntry !== null) {
				this.LastEntry.Next = entry;
				entry.Prev = this.LastEntry;
				this.LastEntry = entry;
			} else {
				this.FirstEntry = this.LastEntry = entry;
			}
		}

		Replace(entry: LinkedListItem<V>, newEntry: LinkedListItem<V>): void
		{
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
		}

		Remove(entry: LinkedListItem<V>): void
		{
			if (entry.Prev !== null)
				entry.Prev.Next = entry.Next;
			else
				this.FirstEntry = entry.Next;

			if (entry.Next !== null)
				entry.Next.Prev = entry.Prev;
			else
				this.LastEntry = entry.Prev;
		}
	}

	// Collection

	export class Collection<K>
	{
		private count: number = 0;
		private linkedList: LinkedList<K> = new LinkedList<K>();
		private buckets: { [key: string]: LinkedListItem<K>[]; } = {};
		private compareSelector: Transform<K, any>;

		constructor(compareSelector?: Transform<K, any>)
		{
			this.compareSelector = (!compareSelector) ? _Functions.Identity : compareSelector;
		}

		AddRange(keys: K[]): void
		{
			for (var i = 0; i < keys.length; i++) this.Add(keys[i]);
		}

		Add(key: K): void
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			var entry: LinkedListItem<K> = { Value: key, Prev: null, Next: null };

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
		}

		Contains(key: K): boolean
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			if (!Utils.HasOwnProperty(this.buckets, hash)) return false;

			var array = this.buckets[hash];
			for (var i = 0; i < array.length; i++) {
				if (this.compareSelector(array[i].Value) === compareKey) return true;
			}
			return false;
		}

		Clear(): void
		{
			this.count = 0;
			this.buckets = {};
			this.linkedList = new LinkedList<K>();
		}

		Remove(key: K): void
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			if (!Utils.HasOwnProperty(this.buckets, hash)) return;

			var array = this.buckets[hash];
			for (var i = 0; i < array.length; i++) {
				if (this.compareSelector(array[i].Value) === compareKey) {
					this.linkedList.Remove(array[i]);
					array.splice(i, 1);
					if (array.length === 0) delete this.buckets[hash];
					this.count--;
					return;
				}
			}
		}

		Count(): number		{ return this.count; }
	}

	// Dictionary

	export class Dictionary<K, V>
	{
		private count: number = 0;
		private linkedList: LinkedList<KeyValuePair<K, V>> = new LinkedList<KeyValuePair<K, V>>();
		private buckets: { [key: string]: LinkedListItem<KeyValuePair<K, V>>[]; } = {};
		private compareSelector: Transform<K, any>;

		constructor(compareSelector?: Transform<K, any>)
		{
			this.compareSelector = (!compareSelector) ? _Functions.Identity : compareSelector;
		}

		Add(key: K, value?: V): void
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			var entry: LinkedListItem<KeyValuePair<K, V>> = { Value: { Key: key, Value: value }, Prev: null, Next: null };

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
		}

		Get(key: K): V
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			if (!Utils.HasOwnProperty(this.buckets, hash)) return undefined;

			var array = this.buckets[hash];
			for (var i = 0; i < array.length; i++) {
				var entry = array[i];
				if (this.compareSelector(entry.Value.Key) === compareKey) return entry.Value.Value;
			}
			return undefined;
		}

		Set(key: K, value: V): boolean
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);

			if (Utils.HasOwnProperty(this.buckets, hash)) {
				var array = this.buckets[hash];
				for (var i = 0; i < array.length; i++) {
					if (this.compareSelector(array[i].Value.Key) === compareKey) {
						var newEntry: LinkedListItem<KeyValuePair<K, V>> = { Value: { Key: key, Value: value}, Prev: null, Next: null };
						this.linkedList.Replace(array[i], newEntry);
						array[i] = newEntry;
						return true;
					}
				}
			}
			return false;
		}

		Contains(key: K): boolean
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			if (!Utils.HasOwnProperty(this.buckets, hash)) return false;

			var array = this.buckets[hash];
			for (var i = 0; i < array.length; i++) {
				if (this.compareSelector(array[i].Value.Key) === compareKey) return true;
			}
			return false;
		}

		Clear(): void
		{
			this.count = 0;
			this.buckets = {};
			this.linkedList = new LinkedList<KeyValuePair<K, V>>();
		}

		Remove(key: K): void
		{
			var compareKey = this.compareSelector(key);
			var hash = Utils.ComputeHashCode(compareKey);
			if (!Utils.HasOwnProperty(this.buckets, hash)) return;

			var array = this.buckets[hash];
			for (var i = 0; i < array.length; i++) {
				if (this.compareSelector(array[i].Value.Key) === compareKey) {
					this.linkedList.Remove(array[i]);
					array.splice(i, 1);
					if (array.length === 0) delete this.buckets[hash];
					this.count--;
					return;
				}
			}
		}

		Count(): number		{ return this.count; }

		ToEnumerable(): Enumerable<KeyValuePair<K, V>>
		{
			return new Enumerable<KeyValuePair<K, V>>(() => {
				var currentEntry: LinkedListItem<KeyValuePair<K, V>> = null;

				return new IEnumerator<KeyValuePair<K, V>>(
					() => { currentEntry = this.linkedList.FirstEntry } ,
					function ()
					{
						if (currentEntry !== null) {
							var result: KeyValuePair<K, V> = { Key: currentEntry.Value.Key, Value: currentEntry.Value.Value };
							currentEntry = currentEntry.Next;
							return this.Yield(result);
						}
						return false;
					} ,
					_Functions.Blank);
			} );
		}
	}

	// Lookup

	export class Lookup<K, V>
	{
		private dictionary: Dictionary<K, V[]>;

		constructor(dictionary: Dictionary<K, V[]>)
		{
			this.dictionary = dictionary;
		}

		Count(): number		{ return this.dictionary.Count(); }

		Get(key: K): Enumerable<V>
		{
			return FromArray(this.dictionary.Get(key));
		}

		Contains(key: K): boolean		{ return this.dictionary.Contains(key); }

		ToEnumerable(): Enumerable<Grouping<K, V>>
		{
			return this.dictionary.ToEnumerable().Select(kvp => new Grouping(kvp.Key, kvp.Value));
		}
	}
	/*************
	export function Choice<T>(v_args: T[]): Enumerable<T>;
	export function Choice<T>(...v_args: T[]): Enumerable<T>
	{
		var args = (v_args[0] instanceof Array) ? v_args[0] : v_args;

		return new Enumerable<T>(() => new IEnumerator<T>(
			_Functions.Blank,
			function () { return this.Yield(args[Math.floor(Math.random() * args.length)]); } ,
			_Functions.Blank));
	}

	export function Cycle<T>(...v_args: T[]): Enumerable<T>
	{
		var args = (v_args[0] instanceof Array) ? v_args[0] : v_args;

		return new Enumerable<T>(() => {
			var index = 0;
			return new IEnumerator<T>(
				_Functions.Blank,
				function ()
				{
					if (index >= args.length) index = 0;
					return this.Yield(args[index++]);
				} ,
				_Functions.Blank);
		} );
	}
	**************/
	export function Empty<T>(): Enumerable<T>
	{
		return new Enumerable<T>(() => new IEnumerator<T>(
			_Functions.Blank,
			_Functions.False,
			_Functions.Blank));
	}

	function FromNull<T>(): Enumerable<T>
	{
		return Empty<T>();
	}

	function FromEnumerable<T>(obj: Enumerable<T>): Enumerable<T>
	{
		if (!obj) return FromNull<T>();
		return obj;
	}

	function FromNumber(obj: number): Enumerable<number>
	{
		if (obj === undefined || obj === null) return FromNull<number>();
		return Repeat(obj, 1);
	}

	function FromBoolean(obj: boolean): Enumerable<boolean>
	{
		if (obj === undefined || obj === null) return FromNull<boolean>();
		return Repeat(obj, 1);
	}

	function FromString(obj: string): Enumerable<string>
	{
		if (obj === undefined || obj === null) return FromNull<string>();

		return new Enumerable<string>(() => {
			var index = 0;
			return new IEnumerator<string>(
				_Functions.Blank,
				function () { return (index < obj.length) ? this.Yield(obj.charAt(index++)) : false; } ,
				_Functions.Blank);
		} );
	}

	function FromFunction(obj: Function): Enumerable<KeyValuePair<string, any>>
	{
		if (!obj) return FromNull<KeyValuePair<string, any>>();

		return FromObject(obj);
	}

	function FromArray<T>(obj: T[]): Enumerable<T>
	{
		if (!obj) return FromNull<T>();
		return new ArrayEnumerable<T>(obj);
	}

	function FromArrayOrEnumerable<T>(obj: T[]): Enumerable<T>;
	function FromArrayOrEnumerable<T>(obj: Enumerable<T>): Enumerable<T>;
	function FromArrayOrEnumerable<T>(obj: any): Enumerable<T>
	{
		if (!obj) return FromNull<T>();

		if (obj instanceof Array) return FromArray(<T[]> obj);
		return FromEnumerable(<Enumerable<T>> obj);
	}

	function FromObject<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	function FromObject(obj: Object): Enumerable<KeyValuePair<string, any>>
	{
		if (!obj) return FromNull<KeyValuePair<string, any>>();

		return new Enumerable<KeyValuePair<string, any>>(() => {
			var array: KeyValuePair<string, any>[] = [];
			var index = 0;

			return new IEnumerator<KeyValuePair<string, any>>(
				() => {
					for (var key in obj) {
						if (!(obj[key] instanceof Function)) {
							array.push(<KeyValuePair<string, any>> { Key: key, Value: obj[key] });
						}
					}
				} ,
				function ()
				{
					return (index < array.length) ? this.Yield(array[index++]) : false;
				} ,
				_Functions.Blank);
		} );
	}

	export function From<T>(obj: Enumerable<T>): Enumerable<T>;
	export function From(obj: number): Enumerable<number>;
	export function From(obj: boolean): Enumerable<boolean>;
	export function From(obj: string): Enumerable<string>;
	export function From(obj: Function): Enumerable<KeyValuePair<string, any>>;
	export function From<T>(obj: T[]): Enumerable<T>;
	export function From<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	export function From(obj: Object): Enumerable<KeyValuePair<string, any>>;
	export function From(obj: any): Enumerable<any>
	{
		if (obj === undefined || obj === null) return FromNull<any>();
		if (obj instanceof Enumerable) return FromEnumerable<any>(obj);
		if (typeof obj === Types.Number) return FromNumber(<number> obj);
		if (typeof obj === Types.Boolean) return FromBoolean(<boolean> obj);
		if (typeof obj === Types.String) return FromString(<string> obj);
		if (typeof obj !== Types.Function) {
			// array or array like object
			if (typeof obj.length === Types.Number) return FromArray<any>(<any[]> obj);

			// JScript's IEnumerable
			if (!(obj instanceof Object) && Utils.IsIEnumerable(obj)) {
				return new Enumerable<any>(() => {
					var isFirst = true;
					var enumerator: Enumerator;
					return new IEnumerator<any>(
						() => enumerator = new Enumerator(obj),
						function ()
						{
							if (isFirst) isFirst = false; else enumerator.moveNext();
							return (enumerator.atEnd()) ? false : this.Yield(enumerator.item());
						} ,
						_Functions.Blank);
				} );
			}
		}

		// function/object : Create KeyValuePair[]
		return FromObject(obj);
	}

	export function Return<T>(element: T): Enumerable<T>
	{
		return Repeat(element, 1);
	}

	export function Matches(input: string, pattern?: RegExp, flags?: string): Enumerable<string>;
	export function Matches(input: string, pattern?: string, flags?: string): Enumerable<string>;
	export function Matches(input: string, pattern?: any, flags?: string): Enumerable<string>
	{
		if (!flags) flags = "";
		if (pattern instanceof RegExp) {
			flags += (pattern.ignoreCase) ? "i" : "";
			flags += (pattern.multiline) ? "m" : "";
			pattern = pattern.source;
		}
		if (flags.indexOf("g") === -1) flags += "g";

		return new Enumerable<string>(() => {
			var regex: RegExp;
			return new IEnumerator<string>(
				() => regex = new RegExp(pattern, flags),
				function ()
				{
					var match = regex.exec(input);
					return (match) ? this.Yield(match) : false;
				} ,
				_Functions.Blank);
		} );
	}

	export function Range(start: number, count: number, step?: number): Enumerable<number>
	{
		if (step === undefined || step === null) step = 1;
		return ToInfinity(start, step).Take(count);
	}

	export function RangeDown(start: number, count: number, step?: number): Enumerable<number>
	{
		if (step === undefined || step === null) step = 1;
		return ToNegativeInfinity(start, step).Take(count);
	}
		
	export function RangeTo(start: number, to: number, step?: number): Enumerable<number>
	{
		if (step === undefined || step === null) step = 1;
		return (start < to)
			? ToInfinity(start, step).TakeWhile(function (i) { return i <= to; } )
			: ToNegativeInfinity(start, step).TakeWhile(function (i) { return i >= to; } )
	}

	export function Repeat<T>(obj: T, num?: number): Enumerable<T>
	{
		if (num !== undefined && num !== null) return Repeat(obj).Take(num);

		return new Enumerable<T>(() => new IEnumerator<T>(
			_Functions.Blank,
			function () { return this.Yield(obj); } ,
			_Functions.Blank));
	}

	export function RepeatWithFinalize<T>(initializer: Generator<T>, finalizer?: Action<T>): Enumerable<T>
	{
		return new Enumerable<T>(() => {
			var element: T = null;
			return new IEnumerator<T>(
				() => element = initializer(),
				function () { return this.Yield(element); } ,
				() => {
					if (element !== null) {
						finalizer(element);
						element = null;
					}
				} );
		} );
	}

	export function Generate<T>(func: Generator<T>, count?: number): Enumerable<T>
	{
		if (count !== undefined && count !== null) return Generate(func).Take(count);

		return new Enumerable<T>(() => new IEnumerator<T>(
			_Functions.Blank,
			function () { return this.Yield(func()); } ,
			_Functions.Blank));
	}

	export function ToInfinity(start?: number, step?: number): Enumerable<number>
	{
		if (start === undefined || start === null) start = 0;
		if (step === undefined || step === null) step = 1;

		return new Enumerable<number>(() => {
			var value: number;
			return new IEnumerator<number>(
				() => value = start - step,
				function () { return this.Yield(value += step); } ,
				_Functions.Blank);
		} );
	}

	export function ToNegativeInfinity(start?: number, step?: number): Enumerable<number>
	{
		if (start === undefined || start === null) start = 0;
		if (step === undefined || step === null) step = 1;

		return new Enumerable<number>(() => {
			var value: number;
			return new IEnumerator<number>(
				() => value = start + step,
				function () { return this.Yield(value -= step); } ,
				_Functions.Blank);
		} );
	}

	export function Unfold<V>(seed: V, func?: Transform<V, V>): Enumerable<V>
	{
		func = func || _Functions.Identity;

		return new Enumerable<V>(() => {
			var isFirst = true;
			var value : V;
			return new IEnumerator<V>(
				_Functions.Blank,
				function ()
				{
					if (isFirst) {
						isFirst = false;
						value = seed;
						return this.Yield(value);
					}
					value = func(value);
					return this.Yield(value);
				} ,
				_Functions.Blank);
		} );
	}

	export class Enumerable<T>
	{
		GetEnumerator: () => IEnumerator<T>;

		constructor(getEnumerator: () => IEnumerator<T>)
		{
			this.GetEnumerator = getEnumerator;
		}

		// Type Filtering Methods

		OfType<V extends Function>(type: V): Enumerable<T>
		{
			var typeName: string;
			switch (type) {
				case Number: typeName = Types.Number; break;
				case String: typeName = Types.String; break;
				case Boolean: typeName = Types.Boolean; break;
				case Function: typeName = Types.Function; break;
				default: typeName = ""; break;
			}
			return (!typeName)
				? this.Where(x => x instanceof type)
				: this.Where(x => typeof x === typeName);
		}

		// Ordering Methods

		OrderBy<K>(keySelector?: Transform<T, K>): OrderedEnumerable<T, K>
		{
			return new OrderedEnumerable<T, K>(this, keySelector, false);
		}

		OrderByDescending<K>(keySelector?: Transform<T, K>): OrderedEnumerable<T, K>
		{
			return new OrderedEnumerable<T, K>(this, keySelector, true);
		}

		// Projection and Filtering Methods

		CascadeBreadthFirst(func: Transform<any, any>, resultSelector?: TransformX<any, any>): Enumerable<any>
		{
			func = func || _Functions.Identity;
			resultSelector = resultSelector || _Functions.Identity;

			return new Enumerable<any>(() => {
				var enumerator: IEnumerator<any>;
				var nestLevel = 0;
				var buffer: any[] = [];

				return new IEnumerator<any>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
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
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		CascadeDepthFirst(func: Transform<any, any>, resultSelector?: TransformX<any, any>): Enumerable<any>
		{
			func = func || _Functions.Identity;
			resultSelector = resultSelector || _Functions.Identity;

			return new Enumerable<any>(() => {
				var enumeratorStack: IEnumerator<any>[] = [];
				var enumerator: IEnumerator<any>;

				return new IEnumerator<any>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						while (true) {
							if (enumerator.MoveNext()) {
								var value = resultSelector(enumerator.Current(), enumeratorStack.length);
								enumeratorStack.push(enumerator);
								enumerator = From(func(enumerator.Current())).GetEnumerator();
								return this.Yield(value);
							}

							if (enumeratorStack.length <= 0) return false;
							Utils.Dispose(enumerator);
							enumerator = enumeratorStack.pop();
						}
					} ,
					() => { try { Utils.Dispose(enumerator); } finally { FromArray(enumeratorStack).ForEach(s => s.Dispose()); } } );
			} );
		}

		Flatten(): Enumerable<any>
		{
			return new Enumerable<any>(() => {
				var enumerator: IEnumerator<T>;
				var middleEnumerator: IEnumerator<any> = null;

				return new IEnumerator<any>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
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
									middleEnumerator =
									From(enumerator.Current())
										.SelectMany(_Functions.Identity)
										.Flatten()
										.GetEnumerator();
									continue;
								} else {
									return this.Yield(enumerator.Current());
								}
							}

							return false;
						}
					} ,
					() => { try { Utils.Dispose(enumerator); } finally { Utils.Dispose(middleEnumerator); } } );
			} );
		}

		Pairwise<V>(selector: PreviousCurrentTransform<T, T, V>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<T>;

				return new IEnumerator<V>(
					() => {
						enumerator = this.GetEnumerator();
						enumerator.MoveNext();
					} ,
					function ()
					{
						var prev = enumerator.Current();
						return enumerator.MoveNext() ? this.Yield(selector(prev, enumerator.Current())) : false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Scan<V>(func: PreviousCurrentTransform<T, T, V>): Enumerable<V>;
		Scan<U, V>(func: PreviousCurrentTransform<T, T, U>, resultSelector: TransformX<U, V>): Enumerable<V>;
		Scan<V>(seed: T, func: PreviousCurrentTransform<T, T, V>): Enumerable<V>;
		Scan<U, V>(seed: T, func: PreviousCurrentTransform<T, T, U>, resultSelector: TransformX<U, V>): Enumerable<V>;
		Scan<U, V>(seed: any, func?: any, resultSelector?: TransformX<U, V>): any
		{
			if (resultSelector) return this.Scan(seed, func).Select(resultSelector);

			var isUseSeed = !!seed;

			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<T>;
				var isFirst = true;
				var value: T;

				return new IEnumerator<V>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
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
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Select<V>(selector: TransformX<T, V>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<V>(
					() => enumerator = this.GetEnumerator(),
					function () { return enumerator.MoveNext() ? this.Yield(selector(enumerator.Current(), index++)) : false; } ,
					() => Utils.Dispose(enumerator));
			} );
		}

		SelectMany(): Enumerable<KeyValuePair<string, any>>;
		SelectMany<V>(collectionSelector: TransformX<T, V[]>): Enumerable<V>;
		SelectMany<V>(collectionSelector: TransformX<T, Enumerable<V>>): Enumerable<V>;
		SelectMany(collectionSelector: TransformX<T, number>): Enumerable<number>;
		SelectMany(collectionSelector: TransformX<T, string>): Enumerable<string>;
		SelectMany(collectionSelector: TransformX<T, boolean>): Enumerable<boolean>;
		SelectMany(collectionSelector: TransformX<T, Object>): Enumerable<KeyValuePair<string, any>>;
		SelectMany<U, V>(collectionSelector: TransformX<T, U[]>, resultSelector: DualTransform<T, U, V>): Enumerable<V>;
		SelectMany<U, V>(collectionSelector: TransformX<T, Enumerable<U>>, resultSelector: DualTransform<T, U, V>): Enumerable<V>;
		SelectMany<V>(collectionSelector: TransformX<T, number>, resultSelector: DualTransform<T, number, V>): Enumerable<V>;
		SelectMany<V>(collectionSelector: TransformX<T, string>, resultSelector: DualTransform<T, string, V>): Enumerable<V>;
		SelectMany<V>(collectionSelector: TransformX<T, boolean>, resultSelector: DualTransform<T, boolean, V>): Enumerable<V>;
		SelectMany<V>(collectionSelector: TransformX<T, Object>, resultSelector: DualTransform<T, KeyValuePair<string, any>, V>): Enumerable<V>;
		SelectMany<V>(collectionSelector?: TransformX<T, any>, resultSelector?: DualTransform<T, any, V>): Enumerable<V>
		{
			collectionSelector = collectionSelector || _Functions.Identity;
			if (!resultSelector) resultSelector = (a, b) => b;

			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<any>;
				var middleEnumerator: IEnumerator<any>;
				var index = 0;

				return new IEnumerator<V>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						if (!middleEnumerator) {
							if (!enumerator.MoveNext()) return false;
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
						} while (enumerator.MoveNext())
							return false;
					} ,
					() => { try { Utils.Dispose(enumerator); } finally { Utils.Dispose(middleEnumerator); } } );
			} );
		}

		Where(predicate: PredicateX<T>): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<T>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						while (enumerator.MoveNext()) {
							if (predicate(enumerator.Current(), index++)) {
								return this.Yield(enumerator.Current());
							}
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Zip<U, V>(second: Enumerable<U>, selector: DualTransformX<T, U, V>): Enumerable<V>;
		Zip<U, V>(second: U[], selector: DualTransformX<T, U, V>): Enumerable<V>;
		Zip<U, V>(second: any, selector: DualTransformX<T, U, V>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var index = 0;
				var firstEnumerator: IEnumerator<T>;
				var secondEnumerator: IEnumerator<U>;

				return new IEnumerator<V>(
					() => {
						firstEnumerator = this.GetEnumerator();
						secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
					} ,
					function ()
					{
						if (firstEnumerator.MoveNext() && secondEnumerator.MoveNext()) {
							return this.Yield(selector(firstEnumerator.Current(), secondEnumerator.Current(), index++));
						}
						return false;
					} ,
					() => { try { Utils.Dispose(firstEnumerator); } finally { Utils.Dispose(secondEnumerator); } } );
			} );
		}

		// Join Methods

		Join<K, U, V>(inner: Enumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<U, K>, resultSelector: DualTransform<T, U, V>, compareSelector?: Transform<K, any>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var outerEnumerator: IEnumerator<T>;
				var lookup: Lookup<K, U>;
				var innerElements: U[] = null;
				var innerCount = 0;

				return new IEnumerator<V>(
					() => {
						outerEnumerator = this.GetEnumerator();
						lookup = FromEnumerable(inner).ToLookup(innerKeySelector, _Functions.Identity, compareSelector);
					} ,
					function ()
					{
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
								innerElements = <U[]><any> lookup.Get(key).ToArray();	// BUG: Shouldn't need cast, wrongly deduced to be T[]
							} else {
								return false;
							}
						}
					} ,
					() => Utils.Dispose(outerEnumerator));
			} );
		}

		GroupJoin<K, U, V>(inner: Enumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<T, K>, resultSelector: DualTransform<T, Enumerable<U>, V>, compareSelector?: Transform<K, any>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<T>;
				var lookup: Lookup<K, U>;

				return new IEnumerator<V>(
					() => {
						enumerator = this.GetEnumerator();
						lookup = FromEnumerable(inner).ToLookup(innerKeySelector, _Functions.Identity, compareSelector);
					} ,
					function ()
					{
						if (enumerator.MoveNext()) {
							var innerElement = lookup.Get(outerKeySelector(enumerator.Current()));
							return this.Yield(resultSelector(enumerator.Current(), innerElement));
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		All(predicate: Predicate<T>): boolean
		{
			var result = true;
			this.ForEach(x => {
				if (!predicate(x)) {
					result = false;
					return false; // break
				}
			} );
			return result;
		}

		Any(predicate?: Predicate<T>): boolean
		{
			var enumerator = this.GetEnumerator();
			try {
				if (!predicate) return enumerator.MoveNext(); // case: no predicate

				while (enumerator.MoveNext()) {
					if (predicate(enumerator.Current())) return true;
				}
				return false;
			} finally {
				Utils.Dispose(enumerator);
			}
		}

		Concat(second: Enumerable<T>): Enumerable<T>;
		Concat(second: T[]): Enumerable<T>;
		Concat(second: any): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var firstEnumerator: IEnumerator<T>;
				var secondEnumerator: IEnumerator<T>;

				return new IEnumerator<T>(
					() => firstEnumerator = this.GetEnumerator(),
					function ()
					{
						if (!secondEnumerator) {
							if (firstEnumerator.MoveNext()) return this.Yield(firstEnumerator.Current());
							secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
						}
						if (secondEnumerator.MoveNext()) return this.Yield(secondEnumerator.Current());
						return false;
					} ,
					() => { try { Utils.Dispose(firstEnumerator); } finally { Utils.Dispose(secondEnumerator); } } );
			} );
		}

		Insert(index: number, second: Enumerable<T>): Enumerable<T>;
		Insert(index: number, second: T[]): Enumerable<T>;
		Insert(index: number, second: any): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var firstEnumerator: IEnumerator<T>;
				var secondEnumerator: IEnumerator<T>;
				var count = 0;
				var isEnumerated = false;

				return new IEnumerator<T>(
					() => {
						firstEnumerator = this.GetEnumerator();
						secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
					} ,
					function ()
					{
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
					} ,
					() => { try { Utils.Dispose(firstEnumerator); } finally { Utils.Dispose(secondEnumerator); } } );
			} );
		}

		Alternate(value: T): Enumerable<T>
		{
			// NOTE: Rewrite to eliminate call to SelectMany for more detailed type information
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var itemLast = false;

				return new IEnumerator<T>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						if (itemLast) {
							itemLast = false;
							return this.Yield(value);
						} else if (enumerator.MoveNext()) {
							itemLast = true;
							return this.Yield(enumerator.Current());
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} ).TakeExceptLast();
		
			//return this.SelectMany(elem => Return(elem).Concat(Return(value))).TakeExceptLast();
		}

		Contains<V>(value: V, compareSelector: Transform<T, V>): boolean
		{
			compareSelector = compareSelector || _Functions.Identity;
			var enumerator = this.GetEnumerator();
			try {
				while (enumerator.MoveNext()) {
					if (compareSelector(enumerator.Current()) === value) return true;
				}
				return false;
			} finally {
				Utils.Dispose(enumerator)
			}
		}

		DefaultIfEmpty(defaultValue: T): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var isFirst = true;

				return new IEnumerator<T>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						if (enumerator.MoveNext()) {
							isFirst = false;
							return this.Yield(enumerator.Current());
						} else if (isFirst) {
							isFirst = false;
							return this.Yield(defaultValue);
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Distinct(compareSelector?: Transform<T, any>): Enumerable<T>
		{
			return this.Except(Empty<T>(), compareSelector);
		}

		Except(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Except(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;
		Except(second: any, compareSelector?: Transform<T, any>): Enumerable<T>
		{
			compareSelector = compareSelector || _Functions.Identity;

			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var keys: Collection<T>;

				return new IEnumerator<T>(
					() => {
						enumerator = this.GetEnumerator();
						keys = new Collection(compareSelector);
						FromArrayOrEnumerable(second).ForEach(key => keys.Add(key));
					} ,
					function ()
					{
						while (enumerator.MoveNext()) {
							var current = enumerator.Current();
							if (!keys.Contains(current)) {
								keys.Add(current);
								return this.Yield(current);
							}
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Intersect(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Intersect(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;
		Intersect(second: any, compareSelector?: Transform<T, any>): Enumerable<T>
		{
			compareSelector = compareSelector || _Functions.Identity;

			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var keys: Collection<T>;
				var outs: Collection<T>;

				return new IEnumerator<T>(
					() => {
						enumerator = this.GetEnumerator();

						keys = new Collection(compareSelector);
						FromArrayOrEnumerable(second).ForEach(key => keys.Add(key));
						outs = new Collection(compareSelector);
					} ,
					function ()
					{
						while (enumerator.MoveNext()) {
							var current = enumerator.Current();
							if (!outs.Contains(current) && keys.Contains(current)) {
								outs.Add(current);
								return this.Yield(current);
							}
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		SequenceEqual(second: Enumerable<T>, compareSelector?: Transform<T, any>): boolean;
		SequenceEqual(second: T[], compareSelector?: Transform<T, any>): boolean;
		SequenceEqual(second: any, compareSelector?: Transform<T, any>): boolean
		{
			compareSelector = compareSelector || _Functions.Identity;

			var firstEnumerator = this.GetEnumerator();
			try {
				var secondEnumerator = FromArrayOrEnumerable(second).GetEnumerator();
				try {
					while (firstEnumerator.MoveNext()) {
						if (!secondEnumerator.MoveNext() || compareSelector(firstEnumerator.Current()) !== compareSelector(secondEnumerator.Current())) {
							return false;
						}
					}

					if (secondEnumerator.MoveNext()) return false;
					return true;
				} finally {
					Utils.Dispose(secondEnumerator);
				}
			} finally {
				Utils.Dispose(firstEnumerator);
			}
		}

		Union(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Union(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;
		Union(second: any, compareSelector?: Transform<T, any>): Enumerable<T>
		{
			compareSelector = compareSelector || _Functions.Identity;

			return new Enumerable<T>(() => {
				var firstEnumerator: IEnumerator<T>;
				var secondEnumerator: IEnumerator<T>;
				var keys: Collection<T>;

				return new IEnumerator<T>(
					() => {
						firstEnumerator = this.GetEnumerator();
						keys = new Collection(compareSelector);
					} ,
					function ()
					{
						var current: T;
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
					} ,
					() => { try { Utils.Dispose(firstEnumerator); } finally { Utils.Dispose(secondEnumerator); } } );
			} );
		}

		Reverse(): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var buffer: T[];
				var index: number;

				return new IEnumerator<T>(
					() => {
						buffer = this.ToArray();
						index = buffer.length;
					} ,
					function () { return (index > 0) ? this.Yield(buffer[--index]) : false; } ,
					_Functions.Blank);
			} );
		}

		Shuffle(): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var buffer: T[];

				return new IEnumerator<T>(
					() => buffer = this.ToArray(),
					function ()
					{
						if (buffer.length > 0) {
							var i = Math.floor(Math.random() * buffer.length);
							return this.Yield(buffer.splice(i, 1)[0]);
						}
						return false;
					} ,
					_Functions.Blank);
			} );
		}

		// Grouping Methods

	//BUG*************GroupBy<K>(keySelector: Transform<T, K>): Enumerable<Grouping<K, T>>;
		GroupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): Enumerable<Grouping<K, V>>;
		GroupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, U>, resultSelector: (key: K, group: Grouping<K, U>) => V, compareSelector?: Transform<K, any>): Enumerable<V>;
		GroupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, U>, resultSelector?: (key: K, group: Grouping<K, U>) => V, compareSelector?: Transform<K, any>): Enumerable<V>
		{
			elementSelector = elementSelector || _Functions.Identity;
			compareSelector = compareSelector || _Functions.Identity;

			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<Grouping<K, U>>;

				return new IEnumerator<V>(
					() => enumerator = this.ToLookup(keySelector, elementSelector, compareSelector).ToEnumerable().GetEnumerator(),
					function ()
					{
						while (enumerator.MoveNext()) {
							return (!resultSelector) ?
								this.Yield(enumerator.Current()) :
								this.Yield(resultSelector(enumerator.Current().Key(), enumerator.Current()));
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		PartitionBy<K>(keySelector: Transform<T, K>): Enumerable<T>;
		PartitionBy<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): Enumerable<V>;
		PartitionBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, U>, resultSelector: (key: K, group: U[]) => V, compareSelector?: Transform<K, any>): Enumerable<V>;
		PartitionBy<K, U, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, U>, resultSelector?: (key: K, group: U[]) => V, compareSelector?: Transform<K, any>): Enumerable<V>
		{
			elementSelector = elementSelector || _Functions.Identity;
			compareSelector = compareSelector || _Functions.Identity;
			if (!resultSelector) resultSelector = (key: K, group: U[]) => new Grouping(key, group);

			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<T>;
				var key: K;
				var compareKey: any;
				var group: U[] = [];

				return new IEnumerator<V>(
					() => {
						enumerator = this.GetEnumerator();
						if (enumerator.MoveNext()) {
							key = keySelector(enumerator.Current());
							compareKey = compareSelector(key);
							group.push(elementSelector(enumerator.Current()));
						}
					} ,
					function ()
					{
						var hasNext: boolean;
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
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

	/**********
		BufferWithCount(count: number): Enumerable<T[]>
		{
			return new Enumerable<T[]>(() => {
				var enumerator: IEnumerator<T>;

				return new IEnumerator<T[]>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						var array: T[] = [];
						var index = 0;
						while (enumerator.MoveNext()) {
							array.push(enumerator.Current());
							if (++index >= count) return this.Yield(array);
						}
						if (array.length > 0) return this.Yield(array);
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}
	*********/
		// Aggregate Methods

		Aggregate<V>(func: PreviousCurrentTransform<V, T, V>): V;
		Aggregate<U, V>(func: PreviousCurrentTransform<U, T, U>, resultSelector: TransformX<U, V>): V;
		Aggregate<V>(seed: T, func: PreviousCurrentTransform<V, T, V>): V;
		Aggregate<U, V>(seed: T, func: PreviousCurrentTransform<U, T, U>, resultSelector: TransformX<U, V>): V;
		Aggregate<U, V>(seed: T, func?: any, resultSelector?: any): any
		{
			return this.Scan(seed, func, resultSelector).Last();
		}

		Average(selector?: NumericTransform<T>): number
		{
			selector = selector || _Functions.Identity;

			var sum = 0;
			var count = 0;
			this.ForEach(x => {
				sum += selector(x);
				++count;
			});

			return sum / count;
		}

		Count(predicate?: PredicateX<T>): number
		{
			predicate = predicate || _Functions.True;

			var count = 0;
			this.ForEach((x, i) => {
				if (predicate(x, i))++count;
			});
			return count;
		}

		Max(selector?: NumericTransform<T>): number
		{
			selector = selector || _Functions.Identity;
			return this.Select(selector).Aggregate((a: number, b: number) => (a > b) ? a : b);
		}

		Min(selector?: NumericTransform<T>): number
		{
			selector = selector || _Functions.Identity;
			return this.Select(selector).Aggregate((a: number, b: number) => (a < b) ? a : b);
		}

		MaxBy(keySelector: NumericTransform<T>): number
		{
			return this.Aggregate((a, b) => (keySelector(a) > keySelector(b)) ? a : b);
		}

		MinBy(keySelector: NumericTransform<T>): number
		{
			return this.Aggregate((a, b) => (keySelector(a) < keySelector(b)) ? a : b);
		}

		Sum(selector?: NumericTransform<T>): number
		{
			selector = selector || _Functions.Identity;
			return this.Select(selector).Aggregate(0, (a: number, b: number) => a + b);
		}

		// Paging Methods

		ElementAt(index: number): T
		{
			var value: T;
			var found = false;
			this.ForEach((x, i) => {
				if (i === index) {
					value = x;
					found = true;
					return false;
				}
			} );

			if (!found) throw new Error("index is less than 0 or greater than or equal to the number of elements in source.");
			return value;
		}

		ElementAtOrDefault(index: number, defaultValue: T): T
		{
			var value: T;
			var found = false;
			this.ForEach((x, i) => {
				if (i === index) {
					value = x;
					found = true;
					return false;
				}
			} );

			return (!found) ? defaultValue : value;
		}

		First(predicate?: Predicate<T>): T
		{
			var value: T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					value = x;
					found = true;
					return false;
				}
			} );

			if (!found) throw new Error("First:No element satisfies the condition.");
			return value;
		}

		FirstOrDefault(defaultValue: T, predicate?: Predicate<T>): T
		{
			var value:T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					value = x;
					found = true;
					return false;
				}
			});
			return (!found) ? defaultValue : value;
		}

		Last(predicate?: Predicate<T>): T
		{
			var value:T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					found = true;
					value = x;
				}
			});

			if (!found) throw new Error("Last:No element satisfies the condition.");
			return value;
		}

		LastOrDefault(defaultValue: T, predicate?: Predicate<T>): T
		{
			var value:T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					found = true;
					value = x;
				}
			});
			return (!found) ? defaultValue : value;
		}

		Single(predicate?: Predicate<T>): T
		{
			var value:T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					if (!found) {
						found = true;
						value = x;
					} else {
						throw new Error("Single:sequence contains more than one element.");
					}
				}
			});

			if (!found) throw new Error("Single:No element satisfies the condition.");
			return value;
		}

		SingleOrDefault(defaultValue: T, predicate?: Predicate<T>): T
		{
			var value:T;
			var found = false;
			this.ForEach(x => {
				if (!predicate || predicate(x)) {
					if (!found) {
						found = true;
						value = x;
					} else {
						throw new Error("Single:sequence contains more than one element.");
					}
				}
			});

			return (!found) ? defaultValue : value;
		}

		Skip(count: number): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<T>(
						() => {
							enumerator = this.GetEnumerator();
							while (index++ < count && enumerator.MoveNext()) { };
						},
						function () { return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false; },
						() => Utils.Dispose(enumerator));
			});
		}

		SkipWhile(predicate: PredicateX<T>): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;
				var isSkipEnd = false;

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function ()
						{
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
						},
						() => Utils.Dispose(enumerator));
			});
		}

		Take(count: number): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function () { return index++ < count && enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false; },
						() => Utils.Dispose(enumerator));
			});
		}

		TakeWhile(predicate: PredicateX<T>): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function ()
						{
							return enumerator.MoveNext() && predicate(enumerator.Current(), index++)
												? this.Yield(enumerator.Current())
												: false;
						},
						() => Utils.Dispose(enumerator));
			});
		}

		TakeExceptLast(count?: number): Enumerable<T>
		{
			if (count === undefined || count === null) count = 1;

			return new Enumerable<T>(() => {
				if (count <= 0) return this.GetEnumerator(); // do nothing

				var enumerator: IEnumerator<T>;
				var q: T[] = [];

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function ()
						{
							while (enumerator.MoveNext()) {
								if (q.length === count) {
									q.push(enumerator.Current());
									return this.Yield(q.shift());
								}
								q.push(enumerator.Current());
							}
							return false;
						},
						() => Utils.Dispose(enumerator));
			});
		}

		TakeFromLast(count: number): Enumerable<T>
		{
			if (count <= 0 || count === undefined || count === null) return Empty();

			return new Enumerable<T>(() => {
				var sourceEnumerator: IEnumerator<T>;
				var enumerator: IEnumerator<T>;
				var q: T[] = [];

				return new IEnumerator<T>(
						() => sourceEnumerator = this.GetEnumerator(),
						function ()
						{
							while (sourceEnumerator.MoveNext()) {
								if (q.length === count) q.shift()
								q.push(sourceEnumerator.Current());
							}
							if (!enumerator) {
							enumerator = FromArray(q).GetEnumerator();
							}
							return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
						},
						() => Utils.Dispose(enumerator));
			});
		}

		IndexOf(item: T): number
		{
			var found = -1;
			this.ForEach((x, i) => {
				if (x === item) {
					found = i;
					return true;
				}
			});

			return found;
		}

		LastIndexOf(item: T): number
		{
			var result = -1;
			this.ForEach((x, i) => { if (x === item) result = i; });
			return result;
		}

		// Conversion Methods

		ToArray(): T[]
		{
			var array = [];
			this.ForEach(x => array.push(x));
			return array;
		}


	//BUG**************	ToLookup<K, V>(keySelector: Transform<T, K>): Lookup<K, T>;
		ToLookup<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>, compareSelector?: Transform<K, any>): Lookup<K, V>;
		ToLookup<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Lookup<K, any>
		{
			elementSelector = elementSelector || _Functions.Identity;
			compareSelector = compareSelector || _Functions.Identity;

			var dict = new Dictionary<K, V[]>(compareSelector);
			this.ForEach(x => {
				var key = keySelector(x);
				var element = elementSelector(x);

				var array = dict.Get(key);
				if (array) array.push(element);
				else dict.Add(key, [element]);
			} );
			return new Lookup(dict);
		}

		ToObject(keySelector: Transform<T, string>, elementSelector: Transform<T, any>): Object
		{
			var obj = {};
			this.ForEach(x => obj[keySelector(x)] = elementSelector(x));
			return obj;
		}

	//BUG*****************	ToDictionary<K>(keySelector: Transform<T, K>): Dictionary<K, T>;
		ToDictionary<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>, compareSelector?: Transform<K, any>): Dictionary<K, V>;
		ToDictionary<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Dictionary<K, any>
		{
			elementSelector = elementSelector || _Functions.Identity;
			compareSelector = compareSelector || _Functions.Identity;

			var dict = new Dictionary<K, V>(compareSelector);
			this.ForEach(x => dict.Add(keySelector(x), elementSelector(x)));
			return dict;
		}

		ToJSON(replacer: (key: string, value: any) => string, space?: string): string;
		ToJSON(replacer: string[], space?: string): string;
		ToJSON(replacer: (key: string, value: any) => string, space?: number): string;
		ToJSON(replacer: string[], space?: number): string;
		ToJSON(replacer?: any, space?: any): string
		{
			return JSON.stringify(this.ToArray(), replacer, space);
		}

		ToString(separator?: string, selector?: Transform<T, any>): string
		{
			if (!separator) separator = "";
			selector = selector || _Functions.Identity;

			return this.Select(selector).ToArray().join(separator);
		}

		// Action Methods

		Do(action: ActionX<T>): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;
				var index = 0;

				return new IEnumerator<T>(
					() => enumerator = this.GetEnumerator(),
					function ()
					{
						if (enumerator.MoveNext()) {
							action(enumerator.Current(), index++);
							return this.Yield(enumerator.Current());
						}
						return false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		ForEach(action: (item: T, index: number) => any, context?: Object): void
		{
			var index = 0;
			var enumerator = this.GetEnumerator();
			try {
				while (enumerator.MoveNext()) {
					if (context) {
						if (action.call(context, enumerator.Current(), index++) === false) break;
					} else {
						if (action(enumerator.Current(), index++) === false) break;
					}
				}
			} finally {
				Utils.Dispose(enumerator);
			}
		}

		Write(separator?: string, selector?: Transform<T, any>): void
		{
			if (!separator) separator = "";
			selector = selector || _Functions.Identity;

			var isFirst = true;
			this.ForEach(item => {
				if (isFirst) isFirst = false;
				else document.write(separator || "");     // Added conversion to non-null
				document.write(selector(item));
			});
		}

		WriteLine(selector?: Transform<T, any>): void
		{
			selector = selector || _Functions.Identity;

			this.ForEach(item => {
				document.write(selector(item));
				document.write("<br />");
			});
		}

		Force(): void
		{
			var enumerator = this.GetEnumerator();

			try { while (enumerator.MoveNext()) { } } finally { Utils.Dispose(enumerator); }
		}

		// Functional Methods

		Let<V>(func: (source: Enumerable<T>) => Enumerable<V>): Enumerable<V>
		{
			return new Enumerable<V>(() => {
				var enumerator: IEnumerator<V>;

				return new IEnumerator<V>(
					() => enumerator = FromEnumerable(func(this)).GetEnumerator(),
					function ()
					{
						return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
					} ,
					() => Utils.Dispose(enumerator));
			} );
		}

		Share(): Enumerable<T>
		{
			var sharedEnumerator: IEnumerator<T>;

			return new Enumerable<T>(() => new IEnumerator<T>(
						() => {
							if (!sharedEnumerator) sharedEnumerator = this.GetEnumerator();
						},
						function ()
						{
							return sharedEnumerator.MoveNext() ? this.Yield(sharedEnumerator.Current()) : false;
						},
						_Functions.Blank));
		}

		MemoizeAll(): Enumerable<T>
		{
			var cache: T[];
			var enumerator: IEnumerator<T>;

			return new Enumerable<T>(() => {
				var index = -1;

				return new IEnumerator<T>(
						() => {
							if (!enumerator) {
								enumerator = this.GetEnumerator();
								cache = [];
							}
						},
						function ()
						{
							index++;
							if (cache.length <= index) {
								return enumerator.MoveNext() ? this.Yield(cache[index] = enumerator.Current()) : false;
							}
							return this.Yield(cache[index]);
						},
						_Functions.Blank
				);
			});
		}

		// Error Handling Methods

		Catch(handler?: (error: any) => void ): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function ()
						{
							try {
								return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false;
							} catch (e) {
								if (handler) handler(e);
								return false;
							}
						},
						() => Utils.Dispose(enumerator));
			});
		}

		Finally(finallyAction?: SimpleAction): Enumerable<T>
		{
			return new Enumerable<T>(() => {
				var enumerator: IEnumerator<T>;

				return new IEnumerator<T>(
						() => enumerator = this.GetEnumerator(),
						function () { return enumerator.MoveNext() ? this.Yield(enumerator.Current()) : false; },
						() => {
							try {
								Utils.Dispose(enumerator);
							} finally {
								if (finallyAction) finallyAction();
							}
						});
			});
		}

		// Debug Methods

		Trace(message?: string, selector?: Transform<T, any>): Enumerable<T>
		{
			if (message === undefined || message === null) message = "Trace";
			selector = selector || _Functions.Identity;

			return this.Do(item => console.log(message, ":", selector(item)));
		}
	}


	// Sorting Context

	function CreateSortContext<T, K>(orderedEnumerable: OrderedEnumerable<T, K>, currentContext: SortContext<T, any>): SortContext<T, K>
	{
		var context = new SortContext(orderedEnumerable.keySelector, orderedEnumerable.descending, currentContext);
		if (orderedEnumerable.parent) return CreateSortContext(orderedEnumerable.parent, context);
		return context;
	}

	class SortContext<T, K>
	{
		keySelector: Transform<T, K>;
		descending: boolean;
		child: SortContext<T, any>;
		keys: K[] = null;

		constructor(keySelector: Transform<T, K>, descending: boolean, child: SortContext<T, any>)
		{
			this.keySelector = keySelector;
			this.descending = descending;
			this.child = child;
		}

		GenerateKeys(source: T[]): void
		{
			this.keys = FromArray(source).Select(this.keySelector).ToArray();
			if (this.child) this.child.GenerateKeys(source);
		}
		Compare(index1: number, index2: number): number
		{
			var comparison = Utils.Compare(this.keys[index1], this.keys[index2]);

			if (comparison === 0) {
				if (this.child) return this.child.Compare(index1, index2)
				comparison = Utils.Compare(index1, index2);
			}

			return (this.descending) ? -comparison : comparison;
		}
	}

	export class OrderedEnumerable<T, K> extends Enumerable<T>
	{
		source: Enumerable<T>;
		keySelector: Transform<T, K>;
		descending: boolean;
		parent: OrderedEnumerable<T, any>;

		constructor(source: Enumerable<T>, keySelector: Transform<T, K>, descending: boolean, parent?: OrderedEnumerable<T, any>)
		{
			super(null);	// Dummy

			this.source = source;
			this.keySelector = keySelector;
			this.descending = descending;
			this.parent = parent;

			this.GetEnumerator = () => {
				var buffer: T[];
				var indexes: number[];
				var index = 0;

				return new IEnumerator<T>(
					() => {
						buffer = [];
						indexes = [];
						this.source.ForEach((item, index) => {
							buffer.push(item);
							indexes.push(index);
						});
						var sortContext = CreateSortContext(this, null);
						sortContext.GenerateKeys(buffer);

						indexes.sort((a, b) => sortContext.Compare(a, b));
					} ,
					function () { return (index < indexes.length) ? this.Yield(buffer[indexes[index++]]) : false; } ,
					_Functions.Blank
					);
			}
		}
		CreateOrderedEnumerable(keySelector: Transform<T, K>, descending: boolean): OrderedEnumerable<T, K>
		{
			return new OrderedEnumerable(this.source, keySelector, descending, this);
		}
		ThenBy<K2>(keySelector: Transform<T, K2>): OrderedEnumerable<T, K2>
		{
			return this.CreateOrderedEnumerable(keySelector, false);
		}
		ThenByDescending<K2>(keySelector: Transform<T, K2>): OrderedEnumerable<T, K2>
		{
			return this.CreateOrderedEnumerable(keySelector, true);
		}
	}


	// ArrayEnumerable: Enumerable optimized for array or array-like object

	export class ArrayEnumerable<T> extends Enumerable<T>
	{
		source: T[];

		constructor(src: T[])
		{
			super(null);	// Dummy

			this.source = src;
			var source = this.source;

			this.GetEnumerator = () => {
				var index = 0;

				return new IEnumerator<T>(
						_Functions.Blank,
						function ()
						{
							while (index < source.length) {
								return this.Yield(source[index++]);
							}
							return false;
						},
						_Functions.Blank);
			};
		}
		Any(predicate?: Predicate<T>): boolean
		{
			return (!predicate) ? (this.source.length > 0) : super.Any(predicate);
		}
		Count(predicate?: Predicate<T>): number
		{
			return (!predicate) ? this.source.length : super.Count(predicate);
		}
		ElementAt(index: number): T
		{
			return (0 <= index && index < this.source.length) ? this.source[index] : super.ElementAt(index);
		}
		ElementAtOrDefault(index: number, defaultValue: T): T
		{
			return (0 <= index && index < this.source.length) ? this.source[index] : defaultValue;
		}
		First(predicate?: Predicate<T>): T
		{
			return (!predicate && this.source.length > 0) ? this.source[0] : super.First(predicate);
		}
		FirstOrDefault(defaultValue: T, predicate?: Predicate<T>): T
		{
			return !predicate ? (this.source.length > 0 ? this.source[0] : defaultValue) : super.FirstOrDefault(defaultValue, predicate);
		}
		Last(predicate?: Predicate<T>): T
		{
			return (!predicate && this.source.length > 0) ? this.source[this.source.length - 1] : super.Last(predicate);
		}
		LastOrDefault(defaultValue: T, predicate?: Predicate<T>): T
		{
			return !predicate ? (this.source.length > 0 ? this.source[this.source.length - 1] : defaultValue) : super.LastOrDefault(defaultValue, predicate);
		}
		Skip(count: number): Enumerable<T>
		{
			var source = this.source;

			return new Enumerable<T>(() => {
				var index: number;

				return new IEnumerator<T>(
						() => index = (count < 0) ? 0 : count,
						function ()
						{
							while (index < source.length) {
								return this.Yield(source[index++]);
							}
							return false;
						},
						_Functions.Blank);
			});
		}
		TakeExceptLast(count?: number): Enumerable<T>
		{
			if (count === undefined || count === null) count = 1;
			return this.Take(this.source.length - count);
		}
		TakeFromLast(count: number): Enumerable<T>
		{
			return this.Skip(this.source.length - count);
		}
		Reverse(): Enumerable<T>
		{
			var source = this.source;

			return new Enumerable<T>(() => {
				var index: number;

				return new IEnumerator<T>(
						() => index = source.length,
						function () { return (index > 0) ? this.Yield(source[--index]) : false; },
						_Functions.Blank)
			});
		}
		SequenceEqual(second: Enumerable<T>, compareSelector?: Transform<T, any>): boolean;
		SequenceEqual(second: T[], compareSelector?: Transform<T, any>): boolean;
		SequenceEqual(second: any, compareSelector?: Transform<T, any>): boolean
		{
			if ((second instanceof ArrayEnumerable || second instanceof Array)
					&& (!compareSelector) && FromArrayOrEnumerable(second).Count() !== this.Count()) {
				return false;
			}

			return super.SequenceEqual(second, compareSelector);
		}
		ToString(separator?: string, selector?: Transform<T, any>): string
		{
			if (selector) return super.ToString(separator, selector);

			if (!separator) separator = "";
			return this.source.join(separator);
		}
	}

	// Grouping

	export class Grouping<K, T> extends ArrayEnumerable<T>
	{
		private key: K;

		constructor(key: K, elements: T[])
		{
			super(elements);

			this.key = key;
		}

		Key(): K { return this.key; }
	}
}
