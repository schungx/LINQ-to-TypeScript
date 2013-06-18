declare module LINQ
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

	// Types

	export interface KeyValuePair<K, V>
	{
		Key: K;
		Value: V;
	}

	// Collection

	export class Collection<T>
	{
		Count(): number;
		Add(item: T): void;
		AddRange(items: T[]): void
		Remove(item: T): void;
		Contains(item: T): boolean;
		Clear(): void;
	}

	// Dictionary

	export class Dictionary<K, V>
	{
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

	export class Lookup<K, V>
	{
		Count(): number;
		Get(key: K): Enumerable<V>;
		Contains(key: K): boolean;
		ToEnumerable(): Enumerable<Grouping<K, V>>;
	}

	export function Choice<T>(v_args: T[]): Enumerable<T>;
	export function Choice<T>(...v_args: T[]): Enumerable<T>;

	export function Cycle<T>(v_args: T[]): Enumerable<T>;
	export function Cycle<T>(...v_args: T[]): Enumerable<T>;

	export function Empty<T>(): Enumerable<T>;

	/*
	export function FromNull<T>(): Enumerable<T>;
	export function FromEnumerable<T>(obj: Enumerable<T>): Enumerable<T>;
	export function FromNumber(obj: number): Enumerable<number>;
	export function FromBoolean(obj: boolean): Enumerable<boolean>;
	export function FromString(obj: string): Enumerable<string>;
	export function FromFunction(obj: Function): Enumerable<KeyValuePair<string, any>>;
	export function FromArray<T>(obj: T[]): Enumerable<T>;

	export function FromArrayOrEnumerable<T>(obj: T[]): Enumerable<T>;
	export function FromArrayOrEnumerable<T>(obj: Enumerable<T>): Enumerable<T>;

	export function FromObject<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	export function FromObject(obj: Object): Enumerable<KeyValuePair<string, any>>;
	*/

	export function From<T>(obj: Enumerable<T>): Enumerable<T>;
	export function From(obj: number): Enumerable<number>;
	export function From(obj: boolean): Enumerable<boolean>;
	export function From(obj: string): Enumerable<string>;
	export function From<T>(obj: T[]): Enumerable<T>;
	export function From(obj: Function): Enumerable<KeyValuePair<string, any>>;
	export function From<T>(obj: { [name: string]: T; }): Enumerable<KeyValuePair<string, T>>;
	export function From(obj: Object): Enumerable<KeyValuePair<string, any>>;

	export function Return<T>(element: T): Enumerable<T>;

	export function Matches(input: string, pattern?: RegExp, flags?: string): Enumerable<string>;
	export function Matches(input: string, pattern?: string, flags?: string): Enumerable<string>;

	export function Range(start: number, count: number, step?: number): Enumerable<number>;
	export function RangeDown(start: number, count: number, step?: number): Enumerable<number>;
	export function RangeTo(start: number, to: number, step?: number): Enumerable<number>;
	export function Repeat<T>(obj: T, num?: number): Enumerable<T>;
	export function RepeatWithFinalize<T>(initializer: Generator<T>, finalizer?: Action<T>): Enumerable<T>;
	export function Generate<T>(func: Generator<T>, count?: number): Enumerable<T>;
	export function ToInfinity(start?: number, step?: number): Enumerable<number>;
	export function ToNegativeInfinity(start?: number, step?: number): Enumerable<number>;
	export function Unfold<V>(seed: V, func?: Transform<V, V>): Enumerable<V>;

	export class Enumerable<T>
	{
		// Type Filtering Methods

		OfType<V extends Function>(type: V): Enumerable<T>;

		// Ordering Methods

		OrderBy(keySelector?: Transform<T, any>): Enumerable<T>;
		OrderByDescending(keySelector?: Transform<T, any>): Enumerable<T>;

		// Projection and Filtering Methods

		CascadeBreadthFirst(func: Transform<any, any>, resultSelector?: TransformX<any, any>): Enumerable<any>;
		CascadeDepthFirst(func: Transform<any, any>, resultSelector?: TransformX<any, any>): Enumerable<any>;
		Flatten(): Enumerable<any>;
		Pairwise<V>(selector: PreviousCurrentTransform<T, T, V>): Enumerable<V>;

		Scan<V>(func: PreviousCurrentTransform<T, T, V>): Enumerable<V>;
		Scan<U, V>(func: PreviousCurrentTransform<T, T, U>, resultSelector: TransformX<U, V>): Enumerable<V>;
		Scan<V>(seed: T, func: PreviousCurrentTransform<T, T, V>): Enumerable<V>;
		Scan<U, V>(seed: T, func: PreviousCurrentTransform<T, T, U>, resultSelector: TransformX<U, V>): Enumerable<V>;

		Select<V>(selector: TransformX<T, V>): Enumerable<V>;

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

		Where(predicate: PredicateX<T>): Enumerable<T>;

		Zip<U, V>(second: Enumerable<U>, selector: DualTransformX<T, U, V>): Enumerable<V>;
		Zip<U, V>(second: U[], selector: DualTransformX<T, U, V>): Enumerable<V>;

		// Join Methods

		Join<K, U, V>(inner: Enumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<U, K>, resultSelector: DualTransform<T, U, V>, compareSelector?: Transform<K, any>): Enumerable<V>;
		GroupJoin<K, U, V>(inner: Enumerable<U>, outerKeySelector: Transform<T, K>, innerKeySelector: Transform<T, K>, resultSelector: DualTransform<T, Enumerable<U>, V>, compareSelector?: Transform<K, any>): Enumerable<V>;
		All(predicate: Predicate<T>): boolean;
		Any(predicate?: Predicate<T>): boolean;

		Concat(second: Enumerable<T>): Enumerable<T>;
		Concat(second: T[]): Enumerable<T>;

		Insert(index: number, second: Enumerable<T>): Enumerable<T>;
		Insert(index: number, second: T[]): Enumerable<T>;

		Alternate(value: T): Enumerable<T>;
		Contains<V>(value: V, compareSelector: Transform<T, V>): boolean;
		DefaultIfEmpty(defaultValue: T): Enumerable<T>;
		Distinct(compareSelector?: Transform<T, any>): Enumerable<T>;

		Except(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Except(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;

		Intersect(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Intersect(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;

		SequenceEqual(second: Enumerable<T>, compareSelector?: Transform<T, any>): boolean;
		SequenceEqual(second: T[], compareSelector?: Transform<T, any>): boolean;

		Union(second: Enumerable<T>, compareSelector?: Transform<T, any>): Enumerable<T>;
		Union(second: T[], compareSelector?: Transform<T, any>): Enumerable<T>;

		Reverse(): Enumerable<T>;
		Shuffle(): Enumerable<T>;

		// Grouping Methods

		//BUG*************GroupBy<K>(keySelector: Transform<T, K>): Enumerable<Grouping<K, T>>;
		GroupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): Enumerable<Grouping<K, V>>;
		GroupBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, U>, resultSelector: (key: K, group: Grouping<K, U>) => V, compareSelector?: Transform<K, any>): Enumerable<V>;

		PartitionBy<K>(keySelector: Transform<T, K>): Enumerable<T>;
		PartitionBy<K, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, V>): Enumerable<V>;
		PartitionBy<K, U, V>(keySelector: Transform<T, K>, elementSelector: Transform<T, U>, resultSelector: (key: K, group: U[]) => V, compareSelector?: Transform<K, any>): Enumerable<V>;

	/**********
		BufferWithCount(count: number): Enumerable<T[]>;
	*********/
		// Aggregate Methods

		Aggregate<V>(func: PreviousCurrentTransform<V, T, V>): V;
		Aggregate<U, V>(func: PreviousCurrentTransform<U, T, U>, resultSelector: TransformX<U, V>): V;
		Aggregate<V>(seed: T, func: PreviousCurrentTransform<V, T, V>): V;
		Aggregate<U, V>(seed: T, func: PreviousCurrentTransform<U, T, U>, resultSelector: TransformX<U, V>): V;

		Average(selector?: NumericTransform<T>): number;
		Count(predicate?: PredicateX<T>): number;
		Max(selector?: NumericTransform<T>): number;
		Min(selector?: NumericTransform<T>): number;
		MaxBy(keySelector: NumericTransform<T>): number;
		MinBy(keySelector: NumericTransform<T>): number;
		Sum(selector?: NumericTransform<T>): number;

		// Paging Methods

		ElementAt(index: number): T;
		ElementAtOrDefault(index: number, defaultValue: T): T;
		First(predicate?: Predicate<T>): T;
		FirstOrDefault(defaultValue: T, predicate?: Predicate<T>): T;
		Last(predicate?: Predicate<T>): T;
		LastOrDefault(defaultValue: T, predicate?: Predicate<T>): T;
		Single(predicate?: Predicate<T>): T;
		SingleOrDefault(defaultValue: T, predicate?: Predicate<T>): T;
		Skip(count: number): Enumerable<T>;
		SkipWhile(predicate: PredicateX<T>): Enumerable<T>;
		Take(count: number): Enumerable<T>;
		TakeWhile(predicate: PredicateX<T>): Enumerable<T>;
		TakeExceptLast(count?: number): Enumerable<T>;
		TakeFromLast(count: number): Enumerable<T>;
		IndexOf(item: T): number;
		LastIndexOf(item: T): number;

		// Conversion Methods

		ToArray(): T[];


	//BUG**************	ToLookup<K, V>(keySelector: Transform<T, K>): Lookup<K, T>;
		ToLookup<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Lookup<K, V>;

		ToObject(keySelector: Transform<T, string>, elementSelector: Transform<T, any>): Object;

	//BUG*****************	ToDictionary<K>(keySelector: Transform<T, K>): Dictionary<K, T>;
		ToDictionary<K, V>(keySelector: Transform<T, K>, elementSelector?: Transform<T, V>, compareSelector?: Transform<K, any>): Dictionary<K, V>;

		ToJSON(replacer: (key: string, value: any) => string, space?: string): string;
		ToJSON(replacer: string[], space?: string): string;
		ToJSON(replacer: (key: string, value: any) => string, space?: number): string;
		ToJSON(replacer: string[], space?: number): string;

		ToString(separator?: string, selector?: Transform<T, any>): string;

		// Action Methods

		Do(action: ActionX<T>): Enumerable<T>;
		ForEach(action: (item: T, index: number) => any, context?: Object): void;
		Write(separator?: string, selector?: Transform<T, any>): void;
		WriteLine(selector?: Transform<T, any>): void;
		Force(): void;

		// Functional Methods

		Let<V>(func: (source: Enumerable<T>) => Enumerable<V>): Enumerable<V>;
		Share(): Enumerable<T>;
		MemoizeAll(): Enumerable<T>;

		// Error Handling Methods

		Catch(handler?: (error: any) => void ): Enumerable<T>;
		Finally(finallyAction?: SimpleAction): Enumerable<T>;

		// Debug Methods

		Trace(message?: string, selector?: Transform<T, any>): Enumerable<T>;
	}

	// Grouping

	export class Grouping<K, T> extends Enumerable<T> {}
}
