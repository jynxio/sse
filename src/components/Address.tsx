import style from './Address.module.css';

export default function Address() {
	return (
		<address className={style.wrapper}>
			<a href="https://github.com/jynxio/sse" target="_blank" rel="noreferrer">
				Source Code
			</a>
			<i>|</i>
			<a href="https://github.com/jynxio/sse/issues/new/choose" target="_blank" rel="noreferrer">
				Add more news
			</a>
		</address>
	);
}
