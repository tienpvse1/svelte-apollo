import type { WatchQueryOptions } from "@apollo/client/core";
import type { DocumentNode } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { ReadableQuery } from "./observable";

import { getClient } from "./context";
import { DataState, observableQueryToReadable } from "./observable";
import { restoring } from "./restore";

export function query<TData = unknown, TVariables = unknown>(
	query: DocumentNode | TypedDocumentNode<TData, TVariables>,
	options: Omit<WatchQueryOptions<TVariables, TData>, "query"> = {}
): ReadableQuery<TData, TVariables> {
	const client = getClient();
	const queryOptions = { ...options, query } as WatchQueryOptions<
		TVariables,
		TData
	>;

	// If client is restoring (e.g. from SSR), attempt synchronous readQuery first
	let initialValue: TData | undefined;
	if (restoring.has(client)) {
		try {
			// undefined = skip initial value (not in cache)
			initialValue = (client.readQuery(queryOptions) as TData) || undefined;
		} catch (err) {
			// Ignore preload errors
		}
	}

	const observable = client.watchQuery<TData, TVariables>(queryOptions);
	const store = observableQueryToReadable(
		observable,
		initialValue !== undefined
			? ({
					data: initialValue,
			  } as DataState<TData>)
			: undefined
	);

	return store;
}
