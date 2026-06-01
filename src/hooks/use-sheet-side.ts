import { useEffect, useState } from "react";

const DESKTOP_MQ = "(min-width: 768px)";

/** Panneaux latéraux sur desktop, bottom sheet sur mobile. */
export function useSheetSide(): "bottom" | "right" {
	const [side, setSide] = useState<"bottom" | "right">(() =>
		typeof window !== "undefined" && window.matchMedia(DESKTOP_MQ).matches
			? "right"
			: "bottom",
	);

	useEffect(() => {
		const mq = window.matchMedia(DESKTOP_MQ);
		const update = () => setSide(mq.matches ? "right" : "bottom");
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	return side;
}
