import type { DetailedHTMLProps, HTMLAttributes } from "react";

type RootageBase = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

interface RootageStackProps extends RootageBase {
	label?: string;
	theme?: string;
	shape?: string;
	stack?: string;
}

interface RootageBadgeProps extends RootageBase {
	label?: string;
	theme?: string;
	shape?: string;
	href?: string;
}

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"rootage-stack": RootageStackProps;
			"rootage-badge": RootageBadgeProps;
		}
	}
}
