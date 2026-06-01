import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

let queryClient: QueryClient | undefined;

export function getContext() {
	if (!queryClient) {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: 1,
					refetchOnWindowFocus: false,
				},
			},
		});
	}

	return { queryClient };
}

export default function TanstackQueryProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { queryClient: client } = getContext();
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
