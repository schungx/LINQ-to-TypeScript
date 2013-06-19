declare module LINQ
{
	// Types

	interface KeyValuePair<K, V>
	{
		Key: K;
		Value: V;
	}

	// Collection

	class Collection<T>
	{
		constructor(compareSelector?: (item: T) => any)
		Count(): number;
		Add(item: T): void;
		AddRange(items: T[]): void
		Remove(item: T): void;
		Contains(item: T): boolean;
		Clear(): void;
	}

	// Dictionary

	class Dictionary<K, V>
	{
		constructor(compareSelector?: (item: K) => any)
		Count(): number;
		Add(key: K, value?: V): void;
		Remove(key: K): void;
		Get(key: K): V;
		Set(key: K, value: V): boolean;
		Contains(key: K): boolean;
		Clear(): void;
		ToEnumerable(): Enumerable<KeyValuePair<K, V>>;
	}

	// Lookup

	class Lookup<K, V>
	{
		constructor(dictionary: Dictionary<K, V[]>);
		Count(): number;
		Get(key: K): Enumerable<V>;
		Contains(key: K): boolean;
		ToEnumerable(): Enumerable<Grouping<K, V>>;
	}

	function Choice<T>(v_args: T[]): Enumerable<T>;
	function Choice<T>(...v_args: T[]): Enumerable<T>;

	function Cycle<T>(v_args: T[]): Enumerable<T>;
	function Cycle<T>(...v_args: T[]): Enumerable<T>;

	function Empty<T>(): Enumerable<T>;

	/*
	function FromNull<T>(): Enumerable<T>;
	function FromEnumerable<T>(obj: Enumerable<T>): Enumerable<T>;
	function FromNumber(obj: number): Enumerable<number>;
	function FromBoolean(obj: boolean): Enumerable<boolean>;
	function FromString(obj: string): Enumerable<string>;
	function FromFunction(obj: Function): Enumerable<KeyValuePair<string, any>>;
	function FromArray<T>(obj: T[]): Enumerable<T>;

	function FromArrayOrEnumerable<T>(obj: T[]): Enumerable<T>;
	function FromArrayOrEnumerable<T>(obj: Enumerable<T>): Enumerable<T>;

	function FromObject<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	function FromObject(obj: Object): Enumerable<KeyValuePair<string, any>>;
	*/

	function From<T>(obj: Enumerable<T>): Enumerable<T>;
	function From(obj: number): Enumerable<number>;
	function From(obj: boolean): Enumerable<boolean>;
	function From(obj: string): Enumerable<string>;
	function From<T>(obj: T[]): Enumerable<T>;
	function From(obj: Function): Enumerable<KeyValuePair<string, any>>;
	function From<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	function From(obj: Object): Enumerable<KeyValuePair<string, any>>;

	function Return<T>(element: T): Enumerable<T>;

	function Matches(input: string, pattern?: RegExp, flags?: string): Enumerable<string>;
	function Matches(input: string, pattern?: string, flags?: string): Enumerable<string>;

	function Range(start: number, count: number, step?: number): Enumerable<number>;
	function RangeDown(start: number, count: number, step?: number): Enumerable<number>;
	function RangeTo(start: number, to: number, step?: number): Enumerable<number>;
	function Repeat<T>(obj: T, num?: number): Enumerable<T>;
	function RepeatWithFinalize<T>(initializer: () => T, finalizer?: (item: T) => void ): Enumerable<T>;
	function Generate<T>(func: () => T, count?: number): Enumerable<T>;
	function ToInfinity(start?: number, step?: number): Enumerable<number>;
	function ToNegativeInfinity(start?: number, step?: number): Enumerable<number>;
	function Unfold<V>(seed: V, func?: (item: V) => V): Enumerable<V>;

	interface Enumerable<T>
	{
		// Type Filtering Methods

		OfType<V extends Function>(type: V): Enumerable<T>;

		// Ordering Methods

		OrderBy(keySelector?: (item: T) => any): Enumerable<T>;
		OrderByDescending(keySelector?: (item: T) => any): Enumerable<T>;

		// Projection and Filtering Methods

		CascadeBreadthFirst(func: (item: any) => any, resultSelector?: (item: any, index: number) => any): Enumerable<any>;
		CascadeDepthFirst(func: (item: any) => any, resultSelector?: (item: any, index: number) => any): Enumerable<any>;
		Flatten(): Enumerable<any>;
		Pairwise<V>(selector: (previousItem: T, currentItem: T) => V): Enumerable<V>;

		Scan<V>(func: (previousItem: T, currentItem: T) => V): Enumerable<V>;
		Scan<U, V>(func: (previousItem: T, currentItem: T) => U, resultSelector: (item: U, index: number) => V): Enumerable<V>;
		Scan<V>(seed: T, func: (previousItem: T, currentItem: T) => V): Enumerable<V>;
		Scan<U, V>(seed: T, func: (previousItem: T, currentItem: T) => U, resultSelector: (item: U, index: number) => V): Enumerable<V>;

		Select<V>(selector: (item: T, index: number) => V): Enumerable<V>;

		SelectMany(): Enumerable<KeyValuePair<string, any>>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => V[]): Enumerable<V>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => Enumerable<V>): Enumerable<V>;
		SelectMany(collectionSelector: (item: T, index: number) => number): Enumerable<number>;
		SelectMany(collectionSelector: (item: T, index: number) => string): Enumerable<string>;
		SelectMany(collectionSelector: (item: T, index: number) => boolean): Enumerable<boolean>;
		SelectMany(collectionSelector: (item: T, index: number) => Object): Enumerable<KeyValuePair<string, any>>;
		SelectMany<U, V>(collectionSelector: (item: T, index: number) => U[], resultSelector: (outer: T, inner: U) => V): Enumerable<V>;
		SelectMany<U, V>(collectionSelector: (item: T, index: number) => Enumerable<U>, resultSelector: (outer: T, inner: U) => V): Enumerable<V>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => number, resultSelector: (outer: T, inner: number) => V): Enumerable<V>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => string, resultSelector: (outer: T, inner: string) => V): Enumerable<V>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => boolean, resultSelector: (outer: T, inner: boolean) => V): Enumerable<V>;
		SelectMany<V>(collectionSelector: (item: T, index: number) => Object, resultSelector: (outer: T, inner: KeyValuePair<string, any>) => V): Enumerable<V>;

		Where(predicate: (item: T, index: number) => boolean): Enumerable<T>;

		Zip<U, V>(second: Enumerable<U>, selector: (outer: T, inner: U, index: number) => V): Enumerable<V>;
		Zip<U, V>(second: U[], selector: (outer: T, inner: U, index: number) => V): Enumerable<V>;

		// Join Methods

		Join<K, U, V>(inner: Enumerable<U>, outerKeySelector: (item: T) => K, innerKeySelector: (item: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (item: K) => any): Enumerable<V>;
		GroupJoin<K, U, V>(inner: Enumerable<U>, outerKeySelector: (item: T) => K, innerKeySelector: (item: U) => K, resultSelector: (outer: T, inner: Enumerable<U>) => V, compareSelector?: (item: K) => any): Enumerable<V>;
		All(predicate: (item: T) => boolean): boolean;
		Any(predicate?: (item: T) => boolean): boolean;

		Concat(second: Enumerable<T>): Enumerable<T>;
		Concat(second: T[]): Enumerable<T>;

		Insert(index: number, second: Enumerable<T>): Enumerable<T>;
		Insert(index: number, second: T[]): Enumerable<T>;

		Alternate(value: T): Enumerable<T>;
		Contains<V>(value: V, compareSelector: (item: T) => V): boolean;
		DefaultIfEmpty(defaultValue: T): Enumerable<T>;
		Distinct(compareSelector?: (item: T) => any): Enumerable<T>;

		Except(second: Enumerable<T>, compareSelector?: (item: T) => any): Enumerable<T>;
		Except(second: T[], compareSelector?: (item: T) => any): Enumerable<T>;

		Intersect(second: Enumerable<T>, compareSelector?: (item: T) => any): Enumerable<T>;
		Intersect(second: T[], compareSelector?: (item: T) => any): Enumerable<T>;

		SequenceEqual(second: Enumerable<T>, compareSelector?: (item: T) => any): boolean;
		SequenceEqual(second: T[], compareSelector?: (item: T) => any): boolean;

		Union(second: Enumerable<T>, compareSelector?: (item: T) => any): Enumerable<T>;
		Union(second: T[], compareSelector?: (item: T) => any): Enumerable<T>;

		Reverse(): Enumerable<T>;
		Shuffle(): Enumerable<T>;

		// Grouping Methods

//BUG*************GroupBy<K>(keySelector: (item: T) => K): Enumerable<Grouping<K, T>>;
		GroupBy<K, U, V>(keySelector: (item: T) => K, elementSelector: (item: T) => V): Enumerable<Grouping<K, V>>;
		GroupBy<K, U, V>(keySelector: (item: T) => K, elementSelector: (item: T) => U, resultSelector: (key: K, group: Grouping<K, U>) => V, compareSelector?: (item: K) => any): Enumerable<V>;

		PartitionBy<K>(keySelector: (item: T) => K): Enumerable<T>;
		PartitionBy<K, V>(keySelector: (item: T) => K, elementSelector: (item: T) => V): Enumerable<V>;
		PartitionBy<K, U, V>(keySelector: (item: T) => K, elementSelector: (item: T) => U, resultSelector: (key: K, group: U[]) => V, compareSelector?: (item: K) => any): Enumerable<V>;

		//BUG*************BufferWithCount(count: number): Enumerable<T[]>;

		// Aggregate Methods

		Aggregate<V>(func: (aggregate: V, item: T) => V): V;
		Aggregate<U, V>(func: (aggregate: U, item: T) => U, resultSelector: (item: U, index: number) => V): V;
		Aggregate<V>(seed: T, func: (aggregate: V, item: T) => V): V;
		Aggregate<U, V>(seed: T, func: (aggregate: U, item: T) => U, resultSelector: (item: U, index: number) => V): V;

		Count(predicate?: (item: T, index: number) => boolean): number;
		Average(selector?: (item: T) => number): number;
		Sum(selector?: (item: T) => number): number;

		Max(selector?: (item: T) => number): number;
		Max(selector?: (item: T) => string): string;

		Min(selector?: (item: T) => number): number;
		Min(selector?: (item: T) => string): string;

		MaxBy(keySelector: (item: T) => number): T;
		MaxBy(keySelector: (item: T) => string): T;

		MinBy(keySelector: (item: T) => number): T;
		MinBy(keySelector: (item: T) => string): T;

		// Paging Methods

		ElementAt(index: number): T;
		ElementAtOrDefault(index: number, defaultValue: T): T;
		First(predicate?: (item: T) => boolean): T;
		FirstOrDefault(defaultValue: T, predicate?: (item: T) => boolean): T;
		Last(predicate?: (item: T) => boolean): T;
		LastOrDefault(defaultValue: T, predicate?: (item: T) => boolean): T;
		Single(predicate?: (item: T) => boolean): T;
		SingleOrDefault(defaultValue: T, predicate?: (item: T) => boolean): T;
		Skip(count: number): Enumerable<T>;
		SkipWhile(predicate: (item: T, index: number) => boolean): Enumerable<T>;
		Take(count: number): Enumerable<T>;
		TakeWhile(predicate: (item: T, index: number) => boolean): Enumerable<T>;
		TakeExceptLast(count?: number): Enumerable<T>;
		TakeFromLast(count: number): Enumerable<T>;
		IndexOf(item: T): number;
		LastIndexOf(item: T): number;

		// Conversion Methods

		ToArray(): T[];


//BUG**************	ToLookup<K, V>(keySelector: (item: T) => K): Lookup<K, T>;
		ToLookup<K, V>(keySelector: (item: T) => K, elementSelector?: (item: T) => V, compareSelector?: (item: K) => any): Lookup<K, V>;

		ToObject(keySelector: (item: T) => string, elementSelector: (item: T) => any): Object;

//BUG*****************	ToDictionary<K>(keySelector: (item: T) => K): Dictionary<K, T>;
		ToDictionary<K, V>(keySelector: (item: T) => K, elementSelector?: (item: T) => V, compareSelector?: (item: K) => any): Dictionary<K, V>;

		ToJSON(replacer: (key: string, value: any) => string, space?: string): string;
		ToJSON(replacer: string[], space?: string): string;
		ToJSON(replacer: (key: string, value: any) => string, space?: number): string;
		ToJSON(replacer: string[], space?: number): string;

		ToString(separator?: string, selector?: (item: T) => any): string;

		// Action Methods

		Do(action: (item: T, index: number) => void ): Enumerable<T>;
		ForEach(action: (item: T, index: number) => any, thisObject?: Object): void;
		Write(separator?: string, selector?: (item: T) => any): void;
		WriteLine(selector?: (item: T) => any): void;
		Force(): void;

		// Functional Methods

		Let<V>(func: (source: Enumerable<T>) => Enumerable<V>): Enumerable<V>;
		Share(): Enumerable<T>;
		MemoizeAll(): Enumerable<T>;

		// Error Handling Methods

		Catch(handler?: (error: any) => void ): Enumerable<T>;
		Finally(finallyAction?: () => void ): Enumerable<T>;

		// Debug Methods

		Trace(message?: string, selector?: (item: T) => any): Enumerable<T>;
	}

	// Grouping

	interface Grouping<K, T> extends Enumerable<T> {}
}
