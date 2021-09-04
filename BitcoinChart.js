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
		this.openPrice = parseFloat(data[1]);
		this.closePrice = parseFloat(data[4]);
	}
}


class ChartCandle extends ChartVertice {

	constructor(data) {
		super(data);
		this.highPrice = parseFloat(data[2]);
		this.lowPrice = parseFloat(data[3]);
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


class Connection {
	static BASE_URL = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=";
	static FETCH_URL = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h";

	async makeRequest() {
		console.log("Запрос полетел");
		const response = await fetch(Connection.FETCH_URL);
		const data = await response.json();
		return data;
	}
}


class LineDrawer {
	static verticeWidth = 6;

	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		let width = this.canvas.scrollWidth;
		let height = this.canvas.scrollHeight;

		this.canvas.height = height;
		this.canvas.width = width;

		this.height = height;
		this.width = width;

		this.paddingHorizontal = this.width / 12;
	}

	calculateVerticalPosition(price, chartData) {
		if (!chartData.maxValue) {
			console.log("Не задана максимальная цена графика на промежутке");
			return;
		}
		if (!chartData.maxMinDifference) {
			console.log("Не задана разница цен max и min");
			return;
		}
		let paddingVertical = this.height / 8;
		return this.height - paddingVertical - (chartData.maxMinDifference - (chartData.maxValue - price)) / chartData.maxMinDifference * (this.height - 2 * paddingVertical);
	}

	drawLine(vertice, chartData, textColor = "#00ff00") {
		let textSize = 14;
		let text = vertice.closePrice;


		this.ctx.beginPath();
		this.ctx.font = textSize + "px" + " sans-serif";
		this.ctx.fillStyle = textColor;
		this.ctx.fillText(
			text,
			this.width - this.ctx.measureText(text).width - 10,
			this.calculateVerticalPosition(vertice.closePrice, chartData) - textSize
		);

		this.ctx.shadowColor = "";
		this.ctx.setLineDash([1, 5]);
		this.ctx.lineWidth = 1 
		this.ctx.moveTo(0, this.calculateVerticalPosition(vertice.closePrice, chartData));
		this.ctx.lineTo(this.width, this.calculateVerticalPosition(vertice.closePrice, chartData));
		this.ctx.closePath();
		this.ctx.stroke();
	}

	draw(data) {
		console.log("Начало отрисовки графика");

		const chartVerticeFactory = new ChartVerticeFactory();
		let vertices = chartVerticeFactory.create(data);

		let minValue = Math.pow(1024, 10);
		let maxValue = Math.pow(-1024, 11)

		let verticesAmount = (Math.floor(this.canvas.scrollWidth / LineDrawer.verticeWidth) + 1) <= vertices.length ? (Math.floor(this.canvas.scrollWidth / LineDrawer.verticeWidth) + 1) : vertices.length;

		console.log("Вершины", vertices);
		console.log("Количество свечей", verticesAmount);

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

		console.log("Высота и длина канваса", this.width, this.height);

		let maxMinDifference = maxValue - minValue;

		const chartData = {
			maxMinDifference: maxMinDifference,
			maxValue: maxValue,
		}


		for (let i = 0; i < verticesAmount; i++) {


			let coordinates = [];

			if (i == 0) {
				coordinates = [
					this.width - this.paddingHorizontal - (i) * LineDrawer.verticeWidth,
					this.calculateVerticalPosition(vertices[i].openPrice, chartData),
					this.width - this.paddingHorizontal - (i - 1) * LineDrawer.verticeWidth,
					this.calculateVerticalPosition(vertices[i].closePrice, chartData)
				]
				this.drawLine(vertices[0], chartData)
			} else {
				coordinates = [
					this.width - this.paddingHorizontal - (i) * LineDrawer.verticeWidth,
					this.calculateVerticalPosition(vertices[i].openPrice, chartData),
					this.width - this.paddingHorizontal - (i - 1) * LineDrawer.verticeWidth,
					this.calculateVerticalPosition(vertices[i - 1].openPrice, chartData)
				]
			}

			console.log(coordinates);
			this.ctx.beginPath();
			this.ctx.shadowColor = "rgba(0, 211, 255, .8)";
			this.ctx.shadowBlur = 10;
			this.ctx.shadowOffsetX = 0;
			this.ctx.shadowOffsetY = 0;
			this.ctx.lineCap = 'round';
			this.ctx.setLineDash([]);
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = "rgb(0,211,255)";
			this.ctx.moveTo(coordinates[0], coordinates[1]);
			this.ctx.lineTo(coordinates[2], coordinates[3]);
			this.ctx.closePath();
			this.ctx.stroke();
		}
	}

	clear() {
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
}

class CandleDrawer extends LineDrawer {
	constructor(canvas) {
		super(canvas)
	}
	draw(data) {
		LineDrawer.verticeWidth = 8 

		const chartVerticeFactory = new ChartVerticeFactory();
		let vertices = chartVerticeFactory.create(data, ChartVertice.TYPE_CANDLE);

		let minValue = Math.pow(1024, 10);
		let maxValue = Math.pow(-1024, 11)

		console.log("Прилетевшее количество свечей", vertices.length);

		let verticesAmount = (Math.floor(this.canvas.scrollWidth / LineDrawer.verticeWidth) + 1) <= vertices.length ? (Math.floor(this.canvas.scrollWidth / LineDrawer.verticeWidth) + 1) : vertices.length;

		console.log("Вершины", vertices);
		console.log("Количество свечей", verticesAmount);

		for (let i = 0; i < verticesAmount; i++) {
			if (minValue > vertices[i].highPrice) {
				minValue = vertices[i].highPrice
			}
			if (maxValue < vertices[i].highPrice) {
				maxValue = vertices[i].highPrice
			}
			if (minValue > vertices[i].lowPrice) {
				minValue = vertices[i].lowPrice
			}
			if (maxValue < vertices[i].lowPrice) {
				maxValue = vertices[i].lowPrice
			}
		}

		console.log("Минимальная и максимальная цена", minValue, maxValue);

		console.log("Высота и длина канваса", this.width, this.height);

		let maxMinDifference = maxValue - minValue;

		const chartData = {
			maxMinDifference: maxMinDifference,
			maxValue: parseFloat(maxValue),
		}

		for (let i = 0; i < verticesAmount; i++) {


			let coordinates = [
				this.width - this.paddingHorizontal - (i) * LineDrawer.verticeWidth, // отступ свечи по горизонтале
				this.calculateVerticalPosition(vertices[i].openPrice, chartData),
				this.calculateVerticalPosition(vertices[i].closePrice, chartData),
				this.calculateVerticalPosition(vertices[i].lowPrice, chartData),
				this.calculateVerticalPosition(vertices[i].highPrice, chartData),
			]

			// candle stick 
			this.ctx.beginPath();
			this.ctx.setLineDash([]);
			this.ctx.lineCap = 'square';
			this.ctx.lineWidth = 1;
			this.ctx.strokeStyle = "#26a69a";
			if (vertices[i].openPrice > vertices[i].closePrice) {
				this.ctx.strokeStyle = "#ef5350";
			}
			this.ctx.moveTo(coordinates[0], coordinates[3]);
			this.ctx.lineTo(coordinates[0], coordinates[4]);
			this.ctx.closePath();
			this.ctx.stroke();

			// candle body
			this.ctx.beginPath();
			this.ctx.setLineDash([]);
			this.ctx.lineCap = 'square';
			this.ctx.lineWidth = 5;
			this.ctx.moveTo(coordinates[0], coordinates[1]);
			this.ctx.lineTo(coordinates[0], coordinates[2]);
			this.ctx.closePath();
			this.ctx.stroke();

			if (i == 0) {
				this.drawLine(vertices[0], chartData)
			}
		}

	}
}



class Chart {
	constructor(canvas) {
		this.states = [
			new Connection(),
			new CandleDrawer(canvas),
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
				data = data.reverse();
				console.log(data);
				item.clear();
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


document.addEventListener("click", (event) => {
	
	let target = event.path[0].classList.value;


	if (target.includes("timestamp")) {
		console.log(target.split(" ")[target.split(" ").length - 1]);
		Connection.FETCH_URL = Connection.BASE_URL + target.split(" ")[target.split(" ").length - 1]
		chart.change();
	}
})


chart.change()
setInterval(() => {
	chart.change()
}, 500)