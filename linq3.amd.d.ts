declare module "linqjs"
{
	function choice<T>(...params: T[]): IEnumerable<T>;
	function choice<T>(params: T[] | ArrayLike<T>): IEnumerable<T>;

	function cycle<T>(...params: T[]): IEnumerable<T>;
	function cycle<T>(params: T[] | ArrayLike<T>): IEnumerable<T>;

	function empty<T>(): IEnumerable<T>;

	function from<T>(): IEnumerable<T>;
	function from<T>(obj: IEnumerable<T>): IEnumerable<T>;
	function from(obj: string): IEnumerable<string>;
	function from(obj: number): IEnumerable<number>;
	function from<T>(obj: T[] | ArrayLike<T>): IEnumerable<T>;
	function from<T>(obj: { [name: string]: T; }): IEnumerable<KeyValuePair<string, T>>;
	function from(obj: Object): IEnumerable<PropertyValue>;
	function from(obj: any): IEnumerable<any>;

	function make<T>(element: T): IEnumerable<T>;

	function matches(input: string, pattern: RegExp): IEnumerable<string>;
	function matches(input: string, pattern: string, flags?: string): IEnumerable<string>;

	function range(start: number, count: number, step?: number): IEnumerable<number>;
	function rangeDown(start: number, count: number, step?: number): IEnumerable<number>;
	function rangeTo(start: number, to: number, step?: number): IEnumerable<number>;
	function repeat<T>(element: T, count?: number): IEnumerable<T>;
	function repeatWithFinalize<T>(initializer: () => T, finalizer: Transform<T, void>): IEnumerable<T>;
	function generate<T>(func: () => T, count?: number): IEnumerable<T>;
	function toInfinity(start?: number, step?: number): IEnumerable<number>;
	function toNegativeInfinity(start?: number, step?: number): IEnumerable<number>;
	function unfold<T>(seed: T, func: (value: T) => T): IEnumerable<T>;
	function defer<T>(enumerableFactory: () => IEnumerable<T>): IEnumerable<T>;

	type NewableClass = { new (): NewableClass; }
	interface Transform<T, V> { (element: T): V; }
	interface TransformWithIndex<T, V> { (element: T, index?: number): V; }

	interface IEnumerable<T>
	{
		traverseBreadthFirst(func: Transform<any, IEnumerable<any>>, resultSelector?: (element: any, nestLevel: number) => any): IEnumerable<any>;
		traverseDepthFirst(func: Transform<any, IEnumerable<any>>, resultSelector?: (element: any, nestLevel: number) => any): IEnumerable<any>;
		flatten(): IEnumerable<any>;
		pairwise<V>(selector: (prev: T, current: T) => V): IEnumerable<V>;

		scan<V>(func: (prev: T, current: T) => V): IEnumerable<V>;
		scan<V>(seed: V, func: (prev: T, current: T) => V): IEnumerable<V>;

		select<V>(selector: TransformWithIndex<T, V>): IEnumerable<V>;

		selectMany(): IEnumerable<PropertyValue>;
		selectMany<V>(collectionSelector: TransformWithIndex<T, V[]>): IEnumerable<V>;
		selectMany<V>(collectionSelector: TransformWithIndex<T, ArrayLike<V>>): IEnumerable<V>;
		selectMany<V>(collectionSelector: TransformWithIndex<T, IEnumerable<V>>): IEnumerable<V>;
		selectMany(collectionSelector: TransformWithIndex<T, Object>): IEnumerable<PropertyValue>;
		selectMany<U, V>(collectionSelector: TransformWithIndex<T, U[]>, resultSelector: (outer: T, inner: U) => V): IEnumerable<V>;
		selectMany<U, V>(collectionSelector: TransformWithIndex<T, ArrayLike<U>>, resultSelector: (outer: T, inner: U) => V): IEnumerable<V>;
		selectMany<U, V>(collectionSelector: TransformWithIndex<T, IEnumerable<U>>, resultSelector: (outer: T, inner: U) => V): IEnumerable<V>;
		selectMany<V>(collectionSelector: TransformWithIndex<T, Object>, resultSelector: (outer: T, inner: Object) => V): IEnumerable<V>;

		where(predicate: TransformWithIndex<T, boolean>): IEnumerable<T>;
		choose<V>(selector: TransformWithIndex<T, V>): IEnumerable<V>;
		ofType<V extends NewableClass>(type: V): IEnumerable<V>;

		zip<U, V>(second: U[] | ArrayLike<U> | IEnumerable<U>, resultSelector: (first: T, second: U, index?: number) => V): IEnumerable<V>;
		zip<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index?: number) => V): IEnumerable<V>;
		zip(...params: any[]): IEnumerable<any>; // last one is selector

		merge<U, V>(second: U[] | ArrayLike<U> | IEnumerable<U>, resultSelector: (first: T, second: U, index?: number) => V): IEnumerable<V>;
		merge<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index?: number) => V): IEnumerable<V>;
		merge(...params: any[]): IEnumerable<any>; // last one is selector

		join<K, U, V>(inner: U[] | ArrayLike<U> | IEnumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<U, K>, resultSelector: (outer: T, inner: U) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;
		join<K, V>(inner: Object, outerKeySelector: Transform<T, K>, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;

		groupJoin<K, U, V>(inner: U[] | ArrayLike<U> | IEnumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<U, K>, resultSelector: (outer: T, inner: U) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;
		groupJoin<K, V>(inner: Object, outerKeySelector: Transform<T, K>, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;

		all(predicate: Transform<T, boolean>): boolean;
		any(predicate?: Transform<T, boolean>): boolean;
		isEmpty(): boolean;

		concat(...sequences: T[]): IEnumerable<T>;
		concat(sequences: T[] | ArrayLike<T> | IEnumerable<T>): IEnumerable<T>;

		insert(index: number, second: T[] | ArrayLike<T> | IEnumerable<T>): IEnumerable<T>;
		alternate(alternateValue: T | T[] | ArrayLike<T> | IEnumerable<T>): IEnumerable<T>;

		contains(value: T): boolean;
		contains<V>(value: V, compareSelector: Transform<T, V>): boolean;

		defaultIfEmpty(defaultValue?: T): IEnumerable<T>;
		distinct(compareSelector?: Transform<T, any>): IEnumerable<T>;
		distinctUntilChanged(compareSelector: Transform<T, any>): IEnumerable<T>;

		except(second: T[] | ArrayLike<T> | IEnumerable<T>, compareSelector?: Transform<T, any>): IEnumerable<T>;
		intersect(second: T[] | ArrayLike<T> | IEnumerable<T>, compareSelector?: Transform<T, any>): IEnumerable<T>;
		sequenceEqual(second: T[] | ArrayLike<T> | IEnumerable<T>, compareSelector?: Transform<T, any>): IEnumerable<T>;
		union(second: T[] | ArrayLike<T> | IEnumerable<T>, compareSelector?: Transform<T, any>): IEnumerable<T>;
		orderBy(keySelector: Transform<T, any>): IEnumerable<T>;
		orderByDescending(keySelector: Transform<T, any>): IEnumerable<T>;
		reverse(): IEnumerable<T>;
		shuffle(): IEnumerable<T>;
		weightedSample(weightSelector: Transform<T, number>): IEnumerable<T>;

		groupBy<K>(keySelector: Transform<T, K>): IEnumerable<IGrouping<K, T>>;
		groupBy<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): IEnumerable<IGrouping<K, V>>;
		groupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: (element: T) => U, resultSelector: (key: K, group: IGrouping<K, U>) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;

		partitionBy<K>(keySelector: Transform<T, K>): IEnumerable<IGrouping<K, T>>;
		partitionBy<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): IEnumerable<V>;
		partitionBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: (element: T) => U, resultSelector: (key: K, group: IEnumerable<U>) => V, compareSelector?: Transform<K, any>): IEnumerable<V>;

		buffer(count: number): IEnumerable<T[]>;

		aggregate<V>(func: (prev: V, current: T) => V): V;
		aggregate<U, V>(func: (prev: U, current: T) => U, resultSelector?: Transform<U, V>): V;
		aggregate<V>(seed: V, func: (prev: V, current: T) => V): V;
		aggregate<U, V>(seed: U, func: (prev: U, current: T) => U, resultSelector?: Transform<U, V>): V;

		average(selector?: Transform<T, number>): number;
		sum(selector?: Transform<T, number>): number;
		count(predicate?: TransformWithIndex<T, boolean>): number;

		max(selector?: Transform<T, number>): number;
		max(selector?: Transform<T, string>): string;

		min(selector?: Transform<T, number>): number;
		min(selector?: Transform<T, string>): string;

		maxBy(keySelector: Transform<T, number>): T;
		maxBy(keySelector: Transform<T, string>): T;

		minBy(keySelector: Transform<T, number>): T;
		minBy(keySelector: Transform<T, string>): T;

		elementAt(index: number): T;
		elementAtOrDefault(index: number, defaultValue?: T): T;
		first(predicate?: TransformWithIndex<T, boolean>): T;
		firstOrDefault(predicate?: TransformWithIndex<T, boolean>, defaultValue?: T): T;
		last(predicate?: TransformWithIndex<T, boolean>): T;
		lastOrDefault(predicate?: TransformWithIndex<T, boolean>, defaultValue?: T): T;
		single(predicate?: TransformWithIndex<T, boolean>): T;
		singleOrDefault(predicate?: TransformWithIndex<T, boolean>, defaultValue?: T): T;
		skip(count: number): IEnumerable<T>;
		skipWhile(predicate: TransformWithIndex<T, boolean>): IEnumerable<T>;
		take(count: number): IEnumerable<T>;
		takeWhile(predicate: TransformWithIndex<T, boolean>): IEnumerable<T>;
		takeExceptLast(count?: number): IEnumerable<T>;
		takeFromLast(count: number): IEnumerable<T>;
		indexOf(item: T): number;
		indexOf(predicate: TransformWithIndex<T, boolean>): number;
		lastIndexOf(item: T): number;
		lastIndexOf(predicate: TransformWithIndex<T, boolean>): number;
		asEnumerable(): IEnumerable<T>;
		cast<V>(): IEnumerable<V>;
		toArray(): T[];

		toLookup<K>(keySelector: Transform<T, K>): Lookup<K, T>;
		toLookup<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Lookup<K, V>;

		toObject(keySelector: Transform<T, string>): { [name: string]: T; };
		toObject<V>(keySelector: Transform<T, string>, elementSelector?: Transform<T, V>): { [name: string]: V; };

		toDictionary<K>(keySelector: Transform<T, K>): Dictionary<K, T>;
		toDictionary<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Dictionary<K, V>;

		toJSONString(replacer: string[] | TransformWithIndex<T, string>, space?: string | number): string;
		toJoinedString(separator?: string, selector?: TransformWithIndex<T, any>): string;

		doAction(action: TransformWithIndex<T, void>): IEnumerable<T>;
		doAction(action: TransformWithIndex<T, boolean>): IEnumerable<T>;

		forEach(action: TransformWithIndex<T, void>): void;
		forEach(action: TransformWithIndex<T, boolean>): void;

		write(separator?: string, selector?: Transform<T, any>): void;
		writeLine(selector?: Transform<T, any>): void;
		force(): void;
		letBind<V>(func: ((source: IEnumerable<T>) => V[]) | ((source: IEnumerable<T>) => ArrayLike<V>) | ((source: IEnumerable<T>) => IEnumerable<V>)): IEnumerable<V>;
		share(): IEnumerable<T>;
		memoize(): IEnumerable<T>;
		catchError(handler: (exception: any) => void): IEnumerable<T>;
		finallyAction(finallyAction: () => void): IEnumerable<T>;
		log(selector?: Transform<T, void>): IEnumerable<T>;
		trace(message?: string, selector?: Transform<T, void>): IEnumerable<T>;
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

	class Dictionary<K, T>
	{
		constructor(compareSelector?: Transform<K, any>);
		count(): number;
		add(key: K, value: T): void;
		remove(key: K): void;
		contains(key: K): boolean;
		clear(): void;
		get(key: K): T;
		set(key: K, value: T): boolean;
		toEnumerable(): IEnumerable<T>;
	}

	class Lookup<K, T>
	{
		constructor(dictionary: Dictionary<K, T[]>);
		count(): number;
		get(key: K): IEnumerable<T>;
		contains(key: K): boolean;
		toEnumerable(): IEnumerable<KeyValuePair<K, T>>;
	}

	interface IGrouping<K, T> extends IEnumerable<T>
	{
		key(): K;
	}
}