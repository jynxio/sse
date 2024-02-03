import style from './App.module.css';
import lineData from '@/assets/line-data.json';
import scatterData from '@/assets/scatter-data.json';
import jokerImgUrl from '@/assets/joker.gif?url';
import * as echarts from 'echarts';
import { useEffect, useRef, useState } from 'react';
import { Toaster } from '@/components';
import { toast } from 'sonner';
import { createStars, createFireworks, createCustomShapes } from './utils';

function App() {
	const dom = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => createChart(dom.current!, setVisible), []);
	useEffect(() => {
		if (!visible) return;

		setTimeout(() => setVisible(false), 8300);
	}, [visible]);

	return (
		<div className={style.wrapper}>
			<section className={style.echarts} ref={dom} />
			<section className={style.toaster}>
				<Toaster />
			</section>
			<section className={[style.joker, visible ? style.visible : style.invisible].join(' ')}>
				<img src={jokerImgUrl} />
			</section>
		</div>
	);
}

function createChart(dom: HTMLElement, setVisible: React.Dispatch<React.SetStateAction<boolean>>) {
	const color = {
		black: '#09090b',
		green: '#bef853',
		white: '#fefefe',
		gray: '#27272a',
		red: '#eb483e',
	};
	const fontFamily = 'monospace';
	const animationDuration = 20000;
	const [min, max] = [2600, 3300];
	const chart = echarts.init(dom, undefined, { devicePixelRatio });
	const option = {
		backgroundColor: color.black,
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: lineData.map(item => item.date),
			axisLine: { lineStyle: { color: color.gray } },
			axisLabel: { show: false },
			axisTick: { show: false },
			splitLine: { show: false },
			axisPointer: { snap: false },
		},
		yAxis: {
			type: 'value',
			min,
			max,
			inverse: true,
			axisLine: {
				show: true,
				lineStyle: { color: color.gray },
			},
			axisLabel: { textStyle: { color: color.white, fontFamily } },
			axisPointer: { snap: false },
			splitLine: { show: false },
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross',
				label: {
					borderRadius: 3,
					backgroundColor: color.green,
					color: color.black,
					fontFamily,
				},
				lineStyle: { width: 1, type: 'dashed', color: color.gray },
				crossStyle: { width: 1, type: 'dashed', color: color.gray },
			},
			backgroundColor: color.black,
			borderRadius: 4,
			borderColor: color.gray,
			textStyle: { color: color.white },
			formatter: (param: { dataIndex: number; seriesType: 'line' | 'scatter' }[]) => {
				const data = param[1] ?? param[0];
				const { dataIndex: index, seriesType: type } = data;

				if (type === 'line') return '';

				const msg = scatterData[index].msg;

				return Array.isArray(msg) ? msg.join('<br />') : msg;
			},
		},
		series: [
			{
				type: 'line',
				symbol: 'none',
				data: lineData.map(item => item.low),
				animationDuration,
				animationEasing: 'linear',
				lineStyle: { width: 1, color: color.red },
				areaStyle: {
					origin: 'end',
					// FIXME:
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: '#eb483e' },
						{ offset: 0.75, color: '#eb483e00' },
						{ offset: 1, color: '#eb483e00' },
					]),
				},
			},
			{
				z: 100,
				type: 'scatter',
				symbolSize: 8,
				itemStyle: { color: color.red, shadowColor: color.black, shadowBlur: 4 },
				data: scatterData.map(item => [item.date, item.low]),
				animationDuration: 1,
				animationDelay: (index: number) => {
					const item = scatterData[index];
					const date = item.date;
					const count = lineData.findIndex(item => item.date === date);
					const delay = (count * animationDuration) / (lineData.length - 1);
					const msg = Array.isArray(item.msg) ? item.msg.join('\n') : item.msg;

					setTimeout(() => toast(msg), delay);

					return delay;
				},
			},
		],
	};

	chart.setOption(option);
	setTimeout(() => {
		setVisible(true);
		createStars();
		createCustomShapes();
		createFireworks();
		createFireworks();
		createFireworks();
	}, animationDuration + 100);
}

export default App;
