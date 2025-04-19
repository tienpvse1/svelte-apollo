import { ApolloError } from "@apollo/client/core";
import type {
	FetchResult,
	Observable,
	ObservableQuery,
} from "@apollo/client/core";
import { readable } from "svelte/store";
import type { Readable } from "svelte/store";

// Match Apollo's hook approach, by returning a result with three states:
// loading, error, or data (where data could be null / undefined)

export interface LoadingState {
	loading: true;
	data?: undefined;
	error?: undefined;
}
export interface ErrorState {
	loading: false;
	data?: undefined;
	error: ApolloError | Error;
}
export interface DataState<TData = unknown> {
	loading: false;
	data: TData | null | undefined;
	error?: undefined;
}

export type Result<TData = unknown> =
	| LoadingState
	| ErrorState
	| DataState<TData>;

// Some methods, e.g. subscription, use Observable<FetchResult>,
// convert this more raw value to a readable

export type ReadableResult<TData = unknown> = Readable<Result<TData>>;

export function observableToReadable<TData = unknown>(
	observable: Observable<FetchResult<TData>>,
	initialValue: Result<TData> = {
		loading: true,
		data: undefined,
		error: undefined,
	}
): ReadableResult<TData> {
	const store = readable<Result<TData>>(initialValue, (set) => {
		const skipDuplicate = initialValue?.data !== undefined;
		let skipped = false;

		const subscription = observable.subscribe(
			(result: FetchResult<TData>) => {
				if (skipDuplicate && !skipped) {
					skipped = true;
					return;
				}

				if (result.errors) {
					const error = new ApolloError({ graphQLErrors: result.errors });
					set({ loading: false, data: undefined, error });
				} else {
					set({ loading: false, data: result.data, error: undefined });
				}
			},
			(error: any) =>
				set({
					loading: false,
					data: undefined,
					error: error && "message" in error ? error : new Error(error),
				})
		);

		return () => subscription.unsubscribe();
	});

	return store;
}

// For live queries, ObservableQuery is used, adding methods like refetch
// extend readable with these methods

export interface ObservableQueryExtensions<TData = unknown, TVariables = unknown> {
	fetchMore: ObservableQuery<TData, TVariables>["fetchMore"];
	getCurrentResult: ObservableQuery<TData, TVariables>["getCurrentResult"];
	getLastError: ObservableQuery<TData, TVariables>["getLastError"];
	getLastResult: ObservableQuery<TData, TVariables>["getLastResult"];
	isDifferentFromLastResult: ObservableQuery<TData, TVariables>["isDifferentFromLastResult"];
	refetch: ObservableQuery<TData, TVariables>["refetch"];
	resetLastResults: ObservableQuery<TData, TVariables>["resetLastResults"];
	resetQueryStoreErrors: ObservableQuery<TData, TVariables>["resetQueryStoreErrors"];
	result: ObservableQuery<TData, TVariables>["result"];
	setOptions: ObservableQuery<TData, TVariables>["setOptions"];
	setVariables: ObservableQuery<TData, TVariables>["setVariables"];
	startPolling: ObservableQuery<TData, TVariables>["startPolling"];
	stopPolling: ObservableQuery<TData, TVariables>["stopPolling"];
	subscribeToMore: ObservableQuery<TData, TVariables>["subscribeToMore"];
	updateQuery: ObservableQuery<TData, TVariables>["updateQuery"];
}

export const extensions: Array<keyof ObservableQueryExtensions> = [
	"fetchMore",
	"getCurrentResult",
	"getLastError",
	"getLastResult",
	"isDifferentFromLastResult",
	"refetch",
	"resetLastResults",
	"resetQueryStoreErrors",
	"result",
	"setOptions",
	"setVariables",
	"startPolling",
	"stopPolling",
	"subscribeToMore",
	"updateQuery",
];

export type ReadableQuery<TData, TVariables> = ReadableResult<TData> &
	ObservableQueryExtensions<TData, TVariables>;

export function observableQueryToReadable<
	TData = unknown,
	TVariables = unknown
>(
	query: ObservableQuery<TData, TVariables>,
	initialValue?: Result<TData>
): ReadableQuery<TData, TVariables> {
	const store = observableToReadable(
		query,
		initialValue
	) as ReadableQuery<TData, TVariables>;

	for (const extension of extensions) {
		store[extension] = query[extension].bind(query) as any;
	}

	return store;
}
