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
				className="landing__about-photo landing__about-photo--fallback"
				aria-hidden
			>
				{initials}
			</div>
		);
	}

	return (
		<img
			className="landing__about-photo"
			src={src}
			alt={name}
			width={80}
			height={80}
			onError={() => setFailed(true)}
		/>
	);
}
