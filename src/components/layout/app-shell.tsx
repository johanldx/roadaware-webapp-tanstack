import type { ReactNode } from "react";

interface AppShellProps {
	children: ReactNode;
	overlay?: ReactNode;
}

export function AppShell({ children, overlay }: AppShellProps) {
	return (
		<div className="map-app relative h-dvh w-full overflow-hidden">
			<div className="map-app__vignette" aria-hidden />
			{children}
			{overlay}
		</div>
	);
}
