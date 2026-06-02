"use client";

import { useState } from "react";

interface CreatorPhotoProps {
	src: string;
	name: string;
	initials: string;
}

export function CreatorPhoto({ src, name, initials }: CreatorPhotoProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div
				className="landing-about-card__photo landing-about-card__photo--fallback"
				aria-hidden
			>
				{initials}
			</div>
		);
	}

	return (
		<img
			className="landing-about-card__photo"
			src={src}
			alt={name}
			width={80}
			height={80}
			onError={() => setFailed(true)}
		/>
	);
}
