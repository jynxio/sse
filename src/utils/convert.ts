export default function (raw: string) {
	return raw
		.trim()
		.split(String.fromCodePoint(10))
		.slice(1)
		.map(item => item.trim())
		.map(line => {
			const items = line.split(',');

			const date = items[0];
			const end = Number(items[1]);
			const start = Number(items[2]);
			const high = Number(items[3]);
			const low = Number(items[4]);

			return { date, start, end, high, low };
		})
		.reverse();
}
