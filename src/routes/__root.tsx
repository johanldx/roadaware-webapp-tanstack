import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { APP_NAME } from "#/config/app";
import { LandingFooter } from "#/components/landing/landing-footer";
import { SITE_BASE_LINKS } from "#/config/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanstackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{
				name: "theme-color",
				content: "#1a2e26",
			},
			{
				name: "application-name",
				content: APP_NAME,
			},
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME,
			},
			{
				name: "format-detection",
				content: "telephone=no",
			},
			{
				name: "referrer",
				content: "strict-origin-when-cross-origin",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			...SITE_BASE_LINKS,
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
});

function RootLayout() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const hideFooter =
		pathname.startsWith("/app") || pathname.startsWith("/share");

	return (
		<TanstackQueryProvider>
			<Outlet />
			{hideFooter ? null : <LandingFooter />}
		</TanstackQueryProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fr">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
