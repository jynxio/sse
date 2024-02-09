import axios from 'axios';
import fs from 'fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

/** 20240208 -> 2024-02-08  */
const formatStockDate = dateStr => `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
function normalizeStockData(stockData) {
	return stockData.map(item => ({
		date: formatStockDate(item.tradeDate),
		start: item.open,
		end: item.close,
		low: item.low,
	}));
}

/** e.g: 20240208  */
const formatRequestDate = time => {
	const date = new Date(time);
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, 0);
	const day = `${date.getDate()}`.padStart(2, 0);
	return parseInt(`${year}${month}${day}`);
};

async function getStockData() {
	return axios
		.get('https://www.csindex.com.cn/csindex-home/perf/index-perf', {
			params: {
				// 上沪指数
				indexCode: '000001',
				startDate: 20230803,
				endDate: formatRequestDate(Date.now()),
			},
		})
		.then(res => res.data.data);
}
async function main() {
	const stockData = await getStockData();
	const normalizedData = normalizeStockData(stockData);

	fs.writeFileSync(resolve(__dirname, '../src/assets/crawl-line-data.json'), JSON.stringify(normalizedData), 'utf-8');
}

main();
