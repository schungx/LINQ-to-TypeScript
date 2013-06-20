declare module "linqjs"
{
  function choice<T>(...params: T[]): Enumerable<T>;
	function choice<T>(params: T[]): Enumerable<T>;
	function choice<T>(params: ArrayLike<T>): Enumerable<T>;

	function cycle<T>(...params: T[]): Enumerable<T>;
	function cycle<T>(params: T[]): Enumerable<T>;
	function cycle<T>(params: ArrayLike<T>): Enumerable<T>;

	function empty<T>(): Enumerable<T>;

	function from<T>(): Enumerable<T>;
	function from<T>(obj: Enumerable<T>): Enumerable<T>;
	function from(obj: string): Enumerable<string>;
	function from(obj: number): Enumerable<number>;
	function from<T>(obj: ArrayLike<T>): Enumerable<T>;
	function from<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	function from(obj: Object): Enumerable<PropertyValue>;
	function from(obj: any): Enumerable<any>;

	function make<T>(element: T): Enumerable<T>;

	function matches(input: string, pattern: RegExp): Enumerable<string>;
	function matches(input: string, pattern: string, flags?: string): Enumerable<string>;

	function range(start: number, count: number, step?: number): Enumerable<number>;
	function rangeDown(start: number, count: number, step?: number): Enumerable<number>;
	function rangeTo(start: number, to: number, step?: number): Enumerable<number>;
	function repeat<T>(element: T, count?: number): Enumerable<T>;
	function repeatWithFinalize<T>(initializer: () => T, finalizer: (element: T) => void ): Enumerable<T>;
	function generate<T>(func: () => T, count?: number): Enumerable<T>;
	function toInfinity(start?: number, step?: number): Enumerable<number>;
	function toNegativeInfinity(start?: number, step?: number): Enumerable<number>;
	function unfold<T>(seed: T, func: (value: T) => T): Enumerable<T>;
	function defer<T>(enumerableFactory: () => Enumerable<T>): Enumerable<T>;

	interface Enumerable<T>
	{
		traverseBreadthFirst(func: (element: any) => Enumerable<any>, resultSelector?: (element: any, nestLevel: number) => any): Enumerable<any>;
		traverseDepthFirst(func: (element: any) => Enumerable<any>, resultSelector?: (element: any, nestLevel: number) => any): Enumerable<any>;
		flatten(): Enumerable<any>;
		pairwise<V>(selector: (prev: T, current: T) => V): Enumerable<V>;

		scan<V>(func: (prev: T, current: T) => V): Enumerable<V>;
		scan<V>(seed: V, func: (prev: T, current: T) => V): Enumerable<V>;

		select<V>(selector: (element: T, index: number) => V): Enumerable<V>;

		selectMany(): Enumerable<PropertyValue>;
		selectMany<V>(collectionSelector: (element: T, index: number) => V[]): Enumerable<V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => ArrayLike<V>): Enumerable<V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => Enumerable<V>): Enumerable<V>;
		selectMany(collectionSelector: (element: T, index: number) => Object): Enumerable<PropertyValue>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => U[], resultSelector: (outer: T, inner: U) => V): Enumerable<V>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => ArrayLike<U>, resultSelector: (outer: T, inner: U) => V): Enumerable<V>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => Enumerable<U>, resultSelector: (outer: T, inner: U) => V): Enumerable<V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => Object, resultSelector: (outer: T, inner: Object) => V): Enumerable<V>;

		where(predicate: (element: T, index: number) => boolean): Enumerable<T>;
		choose<V>(selector: (element: T, index: number) => V): Enumerable<V>;
		ofType<V extends Function>(type: V): Enumerable<V>;

		zip<U, V>(second: U[], resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		zip<U, V>(second: ArrayLike<U>, resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		zip<U, V>(second: Enumerable<U>, resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		zip<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index: number) => V): Enumerable<V>;
		zip(...params: any[]): Enumerable<any>; // last one is selector
		
		merge<U, V>(second: U[], resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		merge<U, V>(second: Enumerable<U>, resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		merge<U, V>(second: ArrayLike<U>, resultSelector: (first: T, second: U, index: number) => V): Enumerable<V>;
		merge<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index: number) => V): Enumerable<V>;
		merge(...params: any[]): Enumerable<any>; // last one is selector

		join<K, U, V>(inner: U[], outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		join<K, U, V>(inner: ArrayLike<U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		join<K, U, V>(inner: Enumerable<U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		join<K, V>(inner: Object, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: (obj: K) => any): Enumerable<V>;

		groupJoin<K, U, V>(inner: U[], outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		groupJoin<K, U, V>(inner: ArrayLike<U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		groupJoin<K, U, V>(inner: Enumerable<U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		groupJoin<K, V>(inner: Object, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: (obj: K) => any): Enumerable<V>;
		
		all(predicate: (element: T) => boolean): boolean;
		any(predicate?: (element: T) => boolean): boolean;
		isEmpty(): boolean;

		concat(...sequences: T[]): Enumerable<T>;
		concat(sequences: T[]): Enumerable<T>;
		concat(sequences: ArrayLike<T>): Enumerable<T>;
		concat(sequences: Enumerable<T>): Enumerable<T>;

		insert(index: number, second: T[]): Enumerable<T>;
		insert(index: number, second: ArrayLike<T>): Enumerable<T>;
		insert(index: number, second: Enumerable<T>): Enumerable<T>;

		alternate(alternateValue: T): Enumerable<T>;
		alternate(alternateSequence: T[]): Enumerable<T>;
		alternate(alternateSequence: ArrayLike<T>): Enumerable<T>;
		alternate(alternateSequence: Enumerable<T>): Enumerable<T>;

		contains(value: T): boolean;
		contains<V>(value: V, compareSelector: (element: T) => V): boolean;

		defaultIfEmpty(defaultValue?: T): Enumerable<T>;
		distinct(compareSelector?: (element: T) => any): Enumerable<T>;
		distinctUntilChanged(compareSelector: (element: T) => any): Enumerable<T>;

		except(second: T[], compareSelector?: (element: T) => any): Enumerable<T>;
		except(second: ArrayLike<T>, compareSelector?: (element: T) => any): Enumerable<T>;
		except(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;

		intersect(second: T[], compareSelector?: (element: T) => any): Enumerable<T>;
		intersect(second: ArrayLike<T>, compareSelector?: (element: T) => any): Enumerable<T>;
		intersect(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;

		sequenceEqual(second: T[], compareSelector?: (element: T) => any): Enumerable<T>;
		sequenceEqual(second: ArrayLike<T>, compareSelector?: (element: T) => any): Enumerable<T>;
		sequenceEqual(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;

		union(second: T[], compareSelector?: (element: T) => any): Enumerable<T>;
		union(second: ArrayLike<T>, compareSelector?: (element: T) => any): Enumerable<T>;
		union(second: Enumerable<T>, compareSelector?: (element: T) => any): Enumerable<T>;

		orderBy(keySelector: (element: T) => any): Enumerable<T>;
		orderByDescending(keySelector: (element: T) => any): Enumerable<T>;
		reverse(): Enumerable<T>;
		shuffle(): Enumerable<T>;
		weightedSample(weightSelector: (element: T) => number): Enumerable<T>;

//***** BUG IN TypeScript ******groupBy<K>(keySelector: (element: T) => K): Enumerable<Grouping<K, T>>;
		groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V): Enumerable<Grouping<K, V>>;
		groupBy<K, U, V>(keySelector: (element: T) => K, elementSelector: (element: T) => U, resultSelector: (key: K, group: Grouping<K, U>) => V, compareSelector?: (element: K) => any): Enumerable<V>;

//***** BUG IN TypeScript ******partitionBy<K>(keySelector: (element: T) => K): Enumerable<Grouping<K, T>>;
		partitionBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V): Enumerable<V>;
		partitionBy<K, U, V>(keySelector: (element: T) => K, elementSelector: (element: T) => U, resultSelector: (key: K, group: Enumerable<U>) => V, compareSelector?: (element: K) => any): Enumerable<V>;

//***** BUG IN TypeScript ******buffer(count: number): Enumerable<T[]>;

		aggregate<V>(func: (prev: V, current: T) => V): V;
		aggregate<U, V>(func: (prev: U, current: T) => U, resultSelector?: (last: U) => V): V;
		aggregate<V>(seed: V, func: (prev: V, current: T) => V): V;
		aggregate<U, V>(seed: U, func: (prev: U, current: T) => U, resultSelector?: (last: U) => V): V;

		average(selector?: (element: T) => number): number;
		sum(selector?: (element: T) => number): number;
		count(predicate?: (element: T, index: number) => boolean): number;

		max(selector?: (element: T) => number): number;
		max(selector?: (element: T) => string): string;

		min(selector?: (element: T) => number): number;
		min(selector?: (element: T) => string): string;

		maxBy(keySelector: (element: T) => number): T;
		maxBy(keySelector: (element: T) => string): T;

		minBy(keySelector: (element: T) => number): T;
		minBy(keySelector: (element: T) => string): T;

		elementAt(index: number): T;
		elementAtOrDefault(index: number, defaultValue?: T): T;
		first(predicate?: (element: T, index: number) => boolean): T;
		firstOrDefault(predicate?: (element: T, index: number) => boolean, defaultValue?: T): T;
		last(predicate?: (element: T, index: number) => boolean): T;
		lastOrDefault(predicate?: (element: T, index: number) => boolean, defaultValue?: T): T;
		single(predicate?: (element: T, index: number) => boolean): T;
		singleOrDefault(predicate?: (element: T, index: number) => boolean, defaultValue?: T): T;
		skip(count: number): Enumerable<T>;
		skipWhile(predicate: (element: T, index: number) => boolean): Enumerable<T>;
		take(count: number): Enumerable<T>;
		takeWhile(predicate: (element: T, index: number) => boolean): Enumerable<T>;
		takeExceptLast(count?: number): Enumerable<T>;
		takeFromLast(count: number): Enumerable<T>;
		indexOf(item: T): number;
		indexOf(predicate: (element: T, index: number) => boolean): number;
		lastIndexOf(item: T): number;
		lastIndexOf(predicate: (element: T, index: number) => boolean): number;
		asEnumerable(): Enumerable<T>;
		toArray(): T[];

//***** BUG IN TypeScript ******toLookup<K>(keySelector: (element: T) => K): Lookup<K, T>;
		toLookup<K, V>(keySelector: (element: T) => K, elementSelector?: (element: T) => V, compareSelector?: (element: K) => any): Lookup<K, V>;

		toObject(keySelector: (element: T) => string, elementSelector?: (element: T) => V): Object;

//***** BUG IN TypeScript ******toDictionary<K>(keySelector: (element: T) => K): Dictionary<K, T>;
		toDictionary<K, V>(keySelector: (element: T) => K, elementSelector?: (element: T) => V, compareSelector?: (element: K) => any): Dictionary<K, V>;

		toJSONString(replacer: (key: string, value: any) => string, space?: string): string;
		toJSONString(replacer: string[], space?: string): string;
		toJSONString(replacer: (key: string, value: any) => string, space?: number): string;
		toJSONString(replacer: string[], space?: number): string;

		toJoinedString(separator?: string, selector?: (element: T, index: number) => any): string;

		doAction(action: (element: T, index: number) => void ): Enumerable<T>;
		doAction(action: (element: T, index: number) => boolean): Enumerable<T>;

		forEach(action: (element: T, index: number) => void ): void;
		forEach(action: (element: T, index: number) => boolean): void;

		write(separator?: string, selector?: (element: T) => any): void;
		writeLine(selector?: (element: T) => any): void;
		force(): void;

		letBind<V>(func: (source: Enumerable<T>) => V[]): Enumerable<V>;
		letBind<V>(func: (source: Enumerable<T>) => ArrayLike<V>): Enumerable<V>;
		letBind<V>(func: (source: Enumerable<T>) => Enumerable<V>): Enumerable<V>;

		share(): Enumerable<T>;
		memoize(): Enumerable<T>;
		catchError(handler: (exception: any) => void ): Enumerable<T>;
		finallyAction(finallyAction: () => void ): Enumerable<T>;
		log(selector?: (element: T) => void ): Enumerable<T>;
		trace(message?: string, selector?: (element: T) => void ): Enumerable<T>;
	}

	interface KeyValuePair<K, V>
	{
		key: K;
		value: V;
	}

	interface PropertyValue extends KeyValuePair<string, any> { }

	interface ArrayLike<V>
	{
		length: number;
		[x: number]: V;
	}

	interface Dictionary<K, T>
	{
		count(): number;
		add(key: K, value: T): void;
		remove(key: K): void;
		contains(key: K): boolean;
		clear(): void;
		get(key: K): T;
		set(key: K, value: T): boolean;
		toEnumerable(): Enumerable<T>;
	}

	interface Lookup<K, T>
	{
		count(): number;
		get(key: K): Enumerable<T>;
		contains(key: K): boolean;
		toEnumerable(): Enumerable<KeyValuePair<K, T>>;
	}

	interface Grouping<K, T> extends Enumerable<T>
	{
		key(): K;
	}
}
