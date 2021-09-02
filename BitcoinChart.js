// class Theme {
// 	static THEME_NIGHT = "NIGHT"
// 	static THEME_LIGHT = "LIGHT"

// 	constructor(theme) {
// 		this.theme = theme;
// 	}

// 	getTheme() {
// 		return this.theme;	
// 	}
// }

// class ThemeCommand {

// 	static CurrentTheme = null;

// 	constructor() {
// 		this.THEMES = {
// 			THEME_NIGHT: {
// 				BACKGOUND_COLOR: "#111E2E",
// 				PRIMARY_COLOR: "#00D3FF",
// 				ON_BACKGROUND_COLOR: "#FFFFFF",
// 			},
// 			THEME_LIGHT: {
// 				BACKGOUND_COLOR: "#FFFFFF",
// 				PRIMARY_COLOR: "#000000",
// 				ON_BACKGROUND_COLOR: "#000000",
// 			}
// 		}
// 	}

// 	getTheme() {
// 		if (!ThemeCommand.CurrentTheme) {
// 			ThemeCommand.CurrentTheme = new Theme(this.THEMES.THEME_NIGHT);
// 		}
// 		return ThemeCommand.CurrentTheme.getTheme();
// 	}

// 	changeTheme(themeName) {
// 		if (!ThemeCommand.CurrentTheme) {
// 			ThemeCommand.CurrentTheme = new Theme(this.THEMES.THEME_NIGHT);
// 		}
// 		switch (themeName) {
// 			case Theme.THEME_LIGHT:
// 				ThemeCommand.CurrentTheme = new Theme(this.THEMES.THEME_LIGHT);
// 				break;
// 			case Theme.THEME_NIGHT:
// 				ThemeCommand.CurrentTheme = new Theme(this.THEMES.THEME_NIGHT);
// 				break;
// 			default:
// 				ThemeCommand.CurrentTheme = new Theme(this.THEMES.THEME_NIGHT);
// 				break;
// 		}
// 	}
// }

class ChartVertice {
	static TYPE_LINE = "LINE";
	static TYPE_CANDLE = "CANDLE";

	constructor(data) {
		this.openPrice = data[1];
		this.closePrice = data[4];
	}
}


class ChartCandle extends ChartVertice {

	constructor(data) {
		super(data);
		this.highPrice = data[2];
		this.lowPrice = data[3];
	}
}


class ChartVerticeFactory {

	constructor() {
		this.chartVerticeTypes = {}
		this.vertices = [];

		this.chartVerticeTypes[ChartVertice.TYPE_LINE] = ChartVertice;
		this.chartVerticeTypes[ChartVertice.TYPE_CANDLE] = ChartCandle;
	}

	create(data, type = ChartVertice.TYPE_LINE) {
		const VerticeType = this.chartVerticeTypes[type];
		for (let item of data) {
			const vertice = new VerticeType(item);
			this.vertices.push(vertice);
		}
		return this.vertices;
	}
}



class ConnectionConfig {
	static BASE_URL = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h";
}

class Connection {

	async makeRequest() {
		console.log("Запрос полетел");
		const response = await fetch(ConnectionConfig.BASE_URL);
		const data = await response.json();
		return data;
	}
}

class Drawer {
	static verticeWidth = 6;

	constructor(canvas) {
		this.canvas = canvas;
	}

	draw(data) {
		console.log("Начало отрисовки графика");
		console.log(data);

		const chartVerticeFactory = new ChartVerticeFactory();
		let vertices = chartVerticeFactory.create(data);

		let minValue = Math.pow(1024, 10);
		let maxValue = Math.pow(-1024, 11)

		let verticesAmount = Math.floor(this.canvas.scrollWidth / Drawer.verticeWidth) + 1;

		vertices = vertices.reverse();

		for (let i = 0; i < verticesAmount; i++) {
			if (minValue > vertices[i].openPrice) {
				minValue = vertices[i].openPrice
			}
			if (maxValue < vertices[i].openPrice) {
				maxValue = vertices[i].openPrice
			}
			if (minValue > vertices[i].closePrice) {
				minValue = vertices[i].closePrice
			}
			if (maxValue < vertices[i].closePrice) {
				maxValue = vertices[i].closePrice
			}
		}

		console.log("Минимальная и максимальная цена", minValue, maxValue);


		// да вот это называется пиздец
		let width = this.canvas.scrollWidth;
		let height = this.canvas.scrollHeight;

		this.canvas.height = height;
		this.canvas.width = width;

		console.log("Высота и длина канваса", width, height);

		const ctx = this.canvas.getContext("2d")


		const maxMinDifference = maxValue - minValue;

		// const stretchCoefficient = height / maxValue;
		// const stretchCoefficient = minValue / maxValue;
		// const stretchCoefficient = minValue / maxValue;

		// console.log("Проклятый коэфицент", stretchCoefficient);

		console.log("Max - min", maxMinDifference);
		for (let i = 0; i < verticesAmount - 1; i++) {

			console.log(`(maxMinDifference - (maxValue - vertices[i].openPrice)) => (${maxMinDifference} - (${maxValue} - ${vertices[i].openPrice}) => ${(maxMinDifference - (maxValue - vertices[i].openPrice))}`);
			const coordinates = [
				width - (i) * Drawer.verticeWidth,
				(maxMinDifference - (maxValue - vertices[i].openPrice)) / maxMinDifference * height,
				width - (i + 1) * Drawer.verticeWidth,
				(maxMinDifference - (maxValue - vertices[i + 1].openPrice)) / maxMinDifference * height,
			]
			// console.log(coordinates[1]);
			ctx.strokeStyle = "rgb(0,211,255)";
			ctx.translate(0, 0);
			ctx.lineCap = "round";
			ctx.moveTo(coordinates[0], coordinates[1]);
			ctx.lineTo(coordinates[2], coordinates[3]);
			ctx.stroke();

		}


		console.log("Количество свечей", verticesAmount);
		// console.log("Минимальная и максимальная цена", minValue, maxValue);


	}

	clear() {
		this.context.clearRect(0, 0, canvas.width, canvas.height);
	}
}

class Chart {
	constructor(canvas) {
		this.states = [
			new Connection(),
			new Drawer(canvas),
		]
		this.current = this.states[0]
	}

	async change() {
		console.log("Меняем график");
		let data = null;
		for (let item of this.states) {
			if (typeof item.makeRequest !== "undefined") {
				data = await item.makeRequest();
				console.log("Отработало получение данных");
				continue;
			}
			if (typeof item.draw !== "undefined") {
				if (!data) {
					console.log("При отрисовке не оказалось данных");
					return;
				}
				item.draw(data);
				console.log("Отработала отрисовка");
				continue;
			}
		}
	}

	getCurrentState() {
		return this.current;
	}
}

const canvas = document.getElementById("canvas");
const chart = new Chart(canvas);
chart.change()