/** Parse un CSV BAAC / data.gouv (séparateur ;, champs entre guillemets). */
export function parseCsvSemicolon(text) {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length === 0) return [];

	const headers = splitCsvLine(lines[0]).map((h) => h.trim());
	const rows = [];
	for (let i = 1; i < lines.length; i++) {
		const values = splitCsvLine(lines[i]);
		rows.push(
			Object.fromEntries(headers.map((h, j) => [h, (values[j] ?? "").trim()])),
		);
	}
	return rows;
}

function splitCsvLine(line) {
	const values = [];
	let cur = "";
	let inQuotes = false;
	for (const ch of line) {
		if (ch === '"') inQuotes = !inQuotes;
		else if (ch === ";" && !inQuotes) {
			values.push(cur.replace(/^"|"$/g, ""));
			cur = "";
		} else cur += ch;
	}
	values.push(cur.replace(/^"|"$/g, ""));
	return values;
}
