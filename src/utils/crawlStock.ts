import axios from 'axios';
import newsData from '@/assets/news.json';
import { DateTime } from 'luxon';
import { IsoDate, TradeDate, StatsData, StockData } from '@/type';

const [startDate, endDate] = await Promise.all([
	getPrevValidDate(newsData.at(0)!.date),
	getNextValidDate(newsData.at(-1)!.date),
]);

const rawStockData = await getStockData(startDate, endDate);
const normalizedStockData = normalizeStockData(rawStockData);

const outputPath = Bun.file(new URL('../assets/stats-data.json', import.meta.url));
const outputContent = JSON.stringify(normalizedStockData);

Bun.write(outputPath, outputContent);

function normalizeStockData(stockData: StockData): StatsData {
	const filteredStockData = stockData.map(item => ({
		date: convertToIsoDate(item.tradeDate),
		low: item.low,
	}));
	const filteredStockDataMap = new Map<IsoDate, { low: number }>(
		filteredStockData.map(item => [item.date, { low: item.low }]),
	);
	const statsDataMap = structuredClone(filteredStockDataMap) as Map<
		IsoDate,
		{ low: number; news?: string | string[] }
	>;

	for (const item of newsData) {
		//
		if (filteredStockDataMap.has(item.date)) continue;

		//
		if (isDateEarlier(filteredStockData.at(-1)!.date, item.date)) {
			statsDataMap.set(item.date, { low: filteredStockData.at(-1)!.low });
			continue;
		}

		let prevDate: IsoDate;
		let nextDate: IsoDate;
		let prevLow: number;
		let nextLow: number;

		for (let i = 1; i < filteredStockData.length; i++) {
			if (isDateEarlier(filteredStockData[i].date, item.date)) continue;

			nextDate = filteredStockData[i].date;
			prevDate = filteredStockData[i - 1].date;

			nextLow = filteredStockData[i].low;
			prevLow = filteredStockData[i - 1].low;

			break;
		}

		const diffBetweenPrevAndNext = calculateDayDiff(prevDate!, nextDate!);
		const diffBetweenPrevAndCurrent = calculateDayDiff(prevDate!, item.date);
		const currentLow = ((nextLow! - prevLow!) / diffBetweenPrevAndNext) * diffBetweenPrevAndCurrent + prevLow!;

		statsDataMap.set(item.date, { low: currentLow });
	}

	for (const item of newsData) statsDataMap.has(item.date) && (statsDataMap.get(item.date)!.news = item.news);

	const statsData: StatsData = [];

	for (const [k, v] of statsDataMap.entries())
		statsData.push(v.news ? { date: k, low: v.low, news: v.news } : { date: k, low: v.low });

	statsData.sort((a, b) => {
		if (isDateEqual(a.date, b.date)) return 0;
		if (isDateEarlier(a.date, b.date)) return -1;

		return 1;
	});

	return statsData;
	/**
	 * 判断第一个日期是否比第二个日期更早
	 * @example
	 * f('2023-08-25', '2023-08-26'); // return true
	 * f('2023-08-25', '2023-08-25'); // return false
	 */
	function isDateEarlier(a: IsoDate, b: IsoDate) {
		const dateA = DateTime.fromISO(a, { zone: 'Asia/Shanghai' });
		const dateB = DateTime.fromISO(b, { zone: 'Asia/Shanghai' });

		return dateA < dateB;
	}

	/**
	 * 判断两个日期是否相等
	 */
	function isDateEqual(a: IsoDate, b: IsoDate) {
		const dateA = DateTime.fromISO(a, { zone: 'Asia/Shanghai' });
		const dateB = DateTime.fromISO(b, { zone: 'Asia/Shanghai' });

		if (dateA.year !== dateB.year) return false;
		if (dateA.month !== dateB.month) return false;
		if (dateA.day !== dateB.day) return false;

		return true;
	}

	/**
	 * 计算两个日期之间的间隔
	 * @example
	 * f('2023-08-25', '2023-08-30'); // return 5
	 * f('2023-08-30', '2023-08-25'); // return 5
	 */
	function calculateDayDiff(a: IsoDate, b: IsoDate) {
		const dateA = DateTime.fromISO(a, { zone: 'Asia/Shanghai' });
		const dateB = DateTime.fromISO(b, { zone: 'Asia/Shanghai' });

		return Math.abs(dateA.diff(dateB, 'days').as('days'));
	}

	return statsData;
}

function convertToTradeDate(date: IsoDate): TradeDate {
	const [yyyy, mm, dd] = date.split('-');

	return yyyy + mm + dd;
}

function convertToIsoDate(date: TradeDate): IsoDate {
	const yyyy = date.slice(0, 4);
	const mm = date.slice(4, 6);
	const dd = date.slice(6, 8);

	return `${yyyy}-${mm}-${dd}`;
}

/**
 * 向前获取开市日期
 */
async function getPrevValidDate(originDate: IsoDate): Promise<IsoDate> {
	let targetDate = DateTime.fromISO(originDate, { zone: 'Asia/Shanghai' });

	for (;;) {
		const isoDate = targetDate.toISODate()!;
		const stockData = await getStockData(isoDate, isoDate);

		if (stockData.length !== 0) return isoDate;

		targetDate = targetDate.minus({ days: 1 });

		continue;
	}
}

/**
 * 向后获取开市日期
 */
async function getNextValidDate(originDate: IsoDate): Promise<IsoDate> {
	let targetDate = DateTime.fromISO(originDate, { zone: 'Asia/Shanghai' });
	const todyDate = DateTime.fromMillis(Date.now(), { zone: 'Asia/Shanghai' });

	for (;;) {
		const isoDate = targetDate.toISODate()!;
		const stockData = await getStockData(isoDate, isoDate);

		if (stockData.length !== 0) return isoDate;
		if (targetDate.hasSame(todyDate, 'day')) return originDate;

		targetDate = targetDate.plus({ days: 1 });

		continue;
	}
}

/**
 * 获取股价数据
 */
async function getStockData(startDate: IsoDate, endDate: IsoDate): Promise<StockData> {
	return axios
		.get('https://www.csindex.com.cn/csindex-home/perf/index-perf', {
			params: {
				// 上沪指数
				indexCode: '000001',
				startDate: convertToTradeDate(startDate),
				endDate: convertToTradeDate(endDate),
			},
		})
		.then(res => res.data.data);
}
