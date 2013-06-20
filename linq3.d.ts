declare module linqjs
{
	interface IEnumerable<T>
	{
		traverseBreadthFirst(func: (element: any) => IEnumerable < any>, resultSelector?: (element: any, nestLevel: number) => any): IEnumerable < any>;
		traverseDepthFirst(func: (element: any) => IEnumerable < any>, resultSelector?: (element: any, nestLevel: number) => any): IEnumerable < any>;
		flatten(): IEnumerable < any>;
		pairwise<V>(selector: (prev: T, current: T) => V): IEnumerable < V>;

		scan<V>(func: (prev: T, current: T) => V): IEnumerable < V>;
		scan<V>(seed: V, func: (prev: T, current: T) => V): IEnumerable < V>;

		select<V>(selector: (element: T, index: number) => V): IEnumerable < V>;

		selectMany(): IEnumerable < PropertyValue>;
		selectMany<V>(collectionSelector: (element: T, index: number) => V[]): IEnumerable < V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => ArrayLike < V>): IEnumerable < V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => IEnumerable < V>): IEnumerable < V>;
		selectMany(collectionSelector: (element: T, index: number) => Object): IEnumerable < PropertyValue>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => U[], resultSelector: (outer: T, inner: U) => V): IEnumerable < V>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => ArrayLike < U>, resultSelector: (outer: T, inner: U) => V): IEnumerable < V>;
		selectMany<U, V>(collectionSelector: (element: T, index: number) => IEnumerable < U>, resultSelector: (outer: T, inner: U) => V): IEnumerable < V>;
		selectMany<V>(collectionSelector: (element: T, index: number) => Object, resultSelector: (outer: T, inner: Object) => V): IEnumerable < V>;

		where(predicate: (element: T, index: number) => boolean): IEnumerable < T>;
		choose<V>(selector: (element: T, index: number) => V): IEnumerable < V>;
		ofType<V extends Function>(type: V): IEnumerable < V>;

		zip<U, V>(second: U[], resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		zip<U, V>(second: ArrayLike < U>, resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		zip<U, V>(second: IEnumerable < U>, resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		zip<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index: number) => V): IEnumerable < V>;
		zip(...params: any[]): IEnumerable < any>; // last one is selector
	
		merge<U, V>(second: U[], resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		merge<U, V>(second: IEnumerable < U>, resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		merge<U, V>(second: ArrayLike < U>, resultSelector: (first: T, second: U, index: number) => V): IEnumerable < V>;
		merge<V>(second: Object, resultSelector: (first: T, second: PropertyValue, index: number) => V): IEnumerable < V>;
		merge(...params: any[]): IEnumerable < any>; // last one is selector

		join<K, U, V>(inner: U[], outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		join<K, U, V>(inner: ArrayLike < U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		join<K, U, V>(inner: IEnumerable < U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		join<K, V>(inner: Object, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;

		groupJoin<K, U, V>(inner: U[], outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		groupJoin<K, U, V>(inner: ArrayLike < U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		groupJoin<K, U, V>(inner: IEnumerable < U>, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: U) => K, resultSelector: (outer: T, inner: U) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
		groupJoin<K, V>(inner: Object, outerKeySelector: (outer: T) => K, innerKeySelector: (inner: PropertyValue) => K, resultSelector: (outer: T, inner: PropertyValue) => V, compareSelector?: (obj: K) => any): IEnumerable < V>;
	
		all(predicate: (element: T) => boolean): boolean;
		any(predicate?: (element: T) => boolean): boolean;
		isEmpty(): boolean;

		concat(...sequences: T[]): IEnumerable < T>;
		concat(sequences: T[]): IEnumerable < T>;
		concat(sequences: ArrayLike < T>): IEnumerable < T>;
		concat(sequences: IEnumerable < T>): IEnumerable < T>;

		insert(index: number, second: T[]): IEnumerable < T>;
		insert(index: number, second: ArrayLike < T>): IEnumerable < T>;
		insert(index: number, second: IEnumerable < T>): IEnumerable < T>;

		alternate(alternateValue: T): IEnumerable < T>;
		alternate(alternateSequence: T[]): IEnumerable < T>;
		alternate(alternateSequence: ArrayLike < T>): IEnumerable < T>;
		alternate(alternateSequence: IEnumerable < T>): IEnumerable < T>;

		contains(value: T): boolean;
		contains<V>(value: V, compareSelector: (element: T) => V): boolean;

		defaultIfEmpty(defaultValue?: T): IEnumerable < T>;
		distinct(compareSelector?: (element: T) => any): IEnumerable < T>;
		distinctUntilChanged(compareSelector: (element: T) => any): IEnumerable < T>;

		except(second: T[], compareSelector?: (element: T) => any): IEnumerable < T>;
		except(second: ArrayLike < T>, compareSelector?: (element: T) => any): IEnumerable < T>;
		except(second: IEnumerable < T>, compareSelector?: (element: T) => any): IEnumerable < T>;

		intersect(second: T[], compareSelector?: (element: T) => any): IEnumerable < T>;
		intersect(second: ArrayLike < T>, compareSelector?: (element: T) => any): IEnumerable < T>;
		intersect(second: IEnumerable < T>, compareSelector?: (element: T) => any): IEnumerable < T>;

		sequenceEqual(second: T[], compareSelector?: (element: T) => any): IEnumerable < T>;
		sequenceEqual(second: ArrayLike < T>, compareSelector?: (element: T) => any): IEnumerable < T>;
		sequenceEqual(second: IEnumerable < T>, compareSelector?: (element: T) => any): IEnumerable < T>;

		union(second: T[], compareSelector?: (element: T) => any): IEnumerable < T>;
		union(second: ArrayLike < T>, compareSelector?: (element: T) => any): IEnumerable < T>;
		union(second: IEnumerable < T>, compareSelector?: (element: T) => any): IEnumerable < T>;

		orderBy(keySelector: (element: T) => any): IEnumerable < T>;
		orderByDescending(keySelector: (element: T) => any): IEnumerable < T>;
		reverse(): IEnumerable < T>;
		shuffle(): IEnumerable < T>;
		weightedSample(weightSelector: (element: T) => number): IEnumerable < T>;

		//***** BUG IN TypeScript ******groupBy<K>(keySelector: (element: T) => K): IEnumerable<IGrouping<K, T>>;
		groupBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V): IEnumerable < IGrouping < K, V>>;
		groupBy<K, U, V>(keySelector: (element: T) => K, elementSelector: (element: T) => U, resultSelector: (key: K, group: IGrouping<K, U>) => V, compareSelector?: (element: K) => any): IEnumerable < V>;

		//***** BUG IN TypeScript ******partitionBy<K>(keySelector: (element: T) => K): IEnumerable<IGrouping<K, T>>;
		partitionBy<K, V>(keySelector: (element: T) => K, elementSelector: (element: T) => V): IEnumerable < V>;
		partitionBy<K, U, V>(keySelector: (element: T) => K, elementSelector: (element: T) => U, resultSelector: (key: K, group: IEnumerable<U>) => V, compareSelector?: (element: K) => any): IEnumerable < V>;

		//***** BUG IN TypeScript ******buffer(count: number): IEnumerable<T[]>;

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
		skip(count: number): IEnumerable < T>;
		skipWhile(predicate: (element: T, index: number) => boolean): IEnumerable < T>;
		take(count: number): IEnumerable < T>;
		takeWhile(predicate: (element: T, index: number) => boolean): IEnumerable < T>;
		takeExceptLast(count?: number): IEnumerable < T>;
		takeFromLast(count: number): IEnumerable < T>;
		indexOf(item: T): number;
		indexOf(predicate: (element: T, index: number) => boolean): number;
		lastIndexOf(item: T): number;
		lastIndexOf(predicate: (element: T, index: number) => boolean): number;
		asEnumerable(): IEnumerable < T>;
		toArray(): T[];

		//***** BUG IN TypeScript ******toLookup<K>(keySelector: (element: T) => K): Lookup<K, T>;
		toLookup<K, V>(keySelector: (element: T) => K, elementSelector?: (element: T) => V, compareSelector?: (element: K) => any): Lookup < K, V>;

		toObject(keySelector: (element: T) => string, elementSelector?: (element: T) => V): Object;

		//***** BUG IN TypeScript ******toDictionary<K>(keySelector: (element: T) => K): Dictionary<K, T>;
		toDictionary<K, V>(keySelector: (element: T) => K, elementSelector?: (element: T) => V, compareSelector?: (element: K) => any): Dictionary < K, V>;

		toJSONString(replacer: (key: string, value: any) => string, space?: string): string;
		toJSONString(replacer: string[], space?: string): string;
		toJSONString(replacer: (key: string, value: any) => string, space?: number): string;
		toJSONString(replacer: string[], space?: number): string;

		toJoinedString(separator?: string, selector?: (element: T, index: number) => any): string;

		doAction(action: (element: T, index: number) => void ): IEnumerable < T>;
		doAction(action: (element: T, index: number) => boolean): IEnumerable < T>;

		forEach(action: (element: T, index: number) => void ): void;
		forEach(action: (element: T, index: number) => boolean): void;

		write(separator?: string, selector?: (element: T) => any): void;
		writeLine(selector?: (element: T) => any): void;
		force(): void;

		letBind<V>(func: (source: IEnumerable<T>) => V[]): IEnumerable < V>;
		letBind<V>(func: (source: IEnumerable<T>) => ArrayLike < V>): IEnumerable < V>;
		letBind<V>(func: (source: IEnumerable<T>) => IEnumerable < V>): IEnumerable < V>;

		share(): IEnumerable < T>;
		memoize(): IEnumerable < T>;
		catchError(handler: (exception: any) => void ): IEnumerable < T>;
		finallyAction(finallyAction: () => void ): IEnumerable < T>;
		log(selector?: (element: T) => void ): IEnumerable < T>;
		trace(message?: string, selector?: (element: T) => void ): IEnumerable < T>;
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
		toEnumerable(): IEnumerable<T>;
	}

	interface Lookup<K, T>
	{
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

declare var Enumerable:
{
	choice<T>(...params: T[]): linqjs.IEnumerable<T>;
	choice<T>(params: T[]): linqjs.IEnumerable<T>;
	choice<T>(params: linqjs.ArrayLike<T>): linqjs.IEnumerable<T>;

	cycle<T>(...params: T[]): linqjs.IEnumerable<T>;
	cycle<T>(params: T[]): linqjs.IEnumerable<T>;
	cycle<T>(params: linqjs.ArrayLike<T>): linqjs.IEnumerable<T>;

	empty<T>(): linqjs.IEnumerable<T>;

	from<T>(): linqjs.IEnumerable<T>;
	from<T>(obj: linqjs.IEnumerable<T>): linqjs.IEnumerable<T>;
	from(obj: string): linqjs.IEnumerable<string>;
	from(obj: number): linqjs.IEnumerable<number>;
	from<T>(obj: linqjs.ArrayLike<T>): linqjs.IEnumerable<T>;
	from<T>(obj: { [name: string]: T; }): linqjs.IEnumerable<linqjs.KeyValuePair<string, T>>;
	from(obj: Object): linqjs.IEnumerable<linqjs.PropertyValue>;
	from(obj: any): linqjs.IEnumerable<any>;

	make<T>(element: T): linqjs.IEnumerable<T>;

	matches(input: string, pattern: RegExp): linqjs.IEnumerable<string>;
	matches(input: string, pattern: string, flags?: string): linqjs.IEnumerable<string>;

	range(start: number, count: number, step?: number): linqjs.IEnumerable<number>;
	rangeDown(start: number, count: number, step?: number): linqjs.IEnumerable<number>;
	rangeTo(start: number, to: number, step?: number): linqjs.IEnumerable<number>;
	repeat<T>(element: T, count?: number): linqjs.IEnumerable<T>;
	repeatWithFinalize<T>(initializer: () => T, finalizer: (element: T) => void ): linqjs.IEnumerable<T>;
	generate<T>(func: () => T, count?: number): linqjs.IEnumerable<T>;
	toInfinity(start?: number, step?: number): linqjs.IEnumerable<number>;
	toNegativeInfinity(start?: number, step?: number): linqjs.IEnumerable<number>;
	unfold<T>(seed: T, func: (value: T) => T): linqjs.IEnumerable<T>;
	defer<T>(enumerableFactory: () => IEnumerable<T>): linqjs.IEnumerable<T>;
}
