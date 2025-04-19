import type { SubscriptionOptions } from "@apollo/client/core";
import type { DocumentNode } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { getClient } from "./context";
import { observableToReadable } from "./observable";
import type { ReadableResult } from "./observable";

export function subscribe<TData = unknown, TVariables = unknown>(
	query: DocumentNode | TypedDocumentNode<TData, TVariables>,
	options: Omit<SubscriptionOptions<TVariables>, "query"> = {}
): ReadableResult<TData> {
	const client = getClient();
	const observable = client.subscribe<TData, TVariables>({ query, ...options });

	return observableToReadable<TData>(observable);
}
