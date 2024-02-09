export type IsoDate = string; // YYYY-MM-DD
export type TradeDate = string; // YYYYMMDD
export type StatsData = { date: IsoDate; low: number; news?: string | string[] }[];
export type StockData = {
	tradeDate: TradeDate;
	indexCode: string;
	indexNameCnAll: string;
	indexnameCn: string;
	indexnameEnAll: string;
	indexNameEn: string;
	open: number;
	high: number;
	low: number;
	close: number;
	change: number;
	changePct: number;
	tradingVol: number;
	tradingValue: number;
	consNumber: number;
	peg: number;
}[];
