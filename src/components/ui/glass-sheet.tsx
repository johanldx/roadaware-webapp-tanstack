import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "#/lib/utils";

function GlassSheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
	return <SheetPrimitive.Root modal {...props} />;
}

function GlassSheetOverlay({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
	return (
		<SheetPrimitive.Overlay
			className={cn(
				"glass-sheet-overlay map-app__sheet-overlay fixed inset-0 z-[60]",
				"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
				"duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
				className,
			)}
			{...props}
		/>
	);
}

type SheetSide = "bottom" | "right";

function GlassSheetContent({
	className,
	children,
	side = "bottom",
	showClose = true,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
	side?: SheetSide;
	showClose?: boolean;
}) {
	return (
		<SheetPrimitive.Portal>
			<GlassSheetOverlay />
			<SheetPrimitive.Content
				aria-describedby={undefined}
				onOpenAutoFocus={(e) => e.preventDefault()}
				className={cn(
					"glass-sheet-panel map-app__sheet-panel fixed z-[61] flex flex-col outline-none",
					"data-[state=closed]:animate-out data-[state=open]:animate-in",
					"duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
					side === "bottom" && [
						"inset-x-0 bottom-0 max-h-[min(88dvh,720px)] pb-[env(safe-area-inset-bottom)]",
						"rounded-t-[22px]",
						"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
					],
					side === "right" && [
						"inset-y-0 right-0 h-full w-[min(100%,min(320px,100vw))]",
						"rounded-l-[22px] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
						"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
					],
					className,
				)}
				{...props}
			>
				{side === "bottom" && (
					<div className="flex shrink-0 justify-center pt-2 pb-0.5">
						<div className="h-1 w-10 rounded-full bg-border" aria-hidden />
					</div>
				)}
				{children}
				{showClose && (
					<SheetPrimitive.Close
						className={cn(
							"absolute z-10 flex h-11 w-11 items-center justify-center rounded-full sm:h-8 sm:w-8",
							"bg-secondary text-muted-foreground",
							"transition-colors hover:bg-accent hover:text-foreground active:scale-95",
							side === "bottom"
								? "top-[max(0.75rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]"
								: "top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]",
						)}
					>
						<XIcon className="size-4" />
						<span className="sr-only">Fermer</span>
					</SheetPrimitive.Close>
				)}
			</SheetPrimitive.Content>
		</SheetPrimitive.Portal>
	);
}

function GlassSheetHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("shrink-0 px-5 pt-2 pb-4", className)} {...props} />
	);
}

function GlassSheetTitle({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
	return (
		<SheetPrimitive.Title
			className={cn(
				"text-[22px] font-semibold leading-tight tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}

function GlassSheetDescription({
	className,
	...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
	return (
		<SheetPrimitive.Description
			className={cn(
				"mt-0.5 text-[15px] leading-snug text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function GlassSheetBody({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"apple-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
				className,
			)}
			{...props}
		/>
	);
}

export {
	GlassSheet,
	GlassSheetContent,
	GlassSheetHeader,
	GlassSheetTitle,
	GlassSheetDescription,
	GlassSheetBody,
};
