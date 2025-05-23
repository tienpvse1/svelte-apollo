import type { FetchResult, MutationOptions } from "@apollo/client/core";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { DocumentNode } from "graphql";
import { getClient } from "./context";

export type MutateOptions<T = unknown, TVariables = unknown> = Omit<
	MutationOptions<T, TVariables>,
	"mutation"
>;

export type Mutate<T = unknown, TVariables = unknown> = (
	options: MutateOptions<T, TVariables>
) => Promise<FetchResult<T>>;

export function mutation<T = unknown, TVariables = unknown>(
	mutation: DocumentNode | TypedDocumentNode<T, TVariables>,
	initialOptions: MutateOptions<T, TVariables> = {}
): Mutate<T, TVariables> {
	const client = getClient();

	return (options: MutateOptions<T, TVariables>) =>
		client.mutate({ mutation, ...initialOptions, ...options });
}
