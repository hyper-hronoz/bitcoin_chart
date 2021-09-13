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


class ConnectionChart {
	static FETCH_URL = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h";

	async makeRequest() {
		console.log("Запрос полетел на получение графика");
		const response = await fetch(ConnectionChart.FETCH_URL);
		const data = await response.json();
		return data;
	}

	static changeTimeStamp(time) {
		console.log(time);
		ConnectionChart.FETCH_URL = ConnectionChart.FETCH_URL.replace(/interval=[A-Za-z0-9]+/, "interval=" + time)
		console.log(ConnectionChart.FETCH_URL);
	}

	static changeSymbol(symbol) {
		console.log(symbol);
		ConnectionChart.FETCH_URL = ConnectionChart.FETCH_URL.replace(/symbol=[A-Z]+/, "symbol=" + symbol)
		document.querySelector(".coin-info_pair").innerText = symbol
		console.log(ConnectionChart.FETCH_URL);
	}
}

class ConnectionSymbol extends ConnectionChart {
	// BASE URL IS NOT SUPPORTED HERE
	static FETCH_URL = "https://api.binance.com/api/v3/exchangeInfo";

	async makeRequest() {
		console.log("Запрос полетел на получение символов");
		const response = await fetch(ConnectionSymbol.FETCH_URL);
		const data = await response.json();
		return data;
	}
}

class GridDrawer {
	static LineWidth = 6;
	static CandleWidth = 8;

	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		let width = this.canvas.scrollWidth;
		let height = this.canvas.scrollHeight;

		this.canvas.height = height;
		this.canvas.width = width;

		this.height = height;
		this.width = width;

		this.gridHeight = 40
		this.gridAmount = Math.floor(this.height / this.gridHeight);

		this.verticeWidth = GridDrawer.LineWidth;
	}

	calculateVerticalPosition(price) {
		if (!this.maxValue) {
			console.log("Не задана максимальная цена графика на промежутке");
			return;
		}
		if (!this.maxMinDifference) {
			console.log("Не задана разница цен max и min");
			return;
		}
		let paddingVertical = this.height / 8;
		return this.height - paddingVertical - (this.maxMinDifference - (this.maxValue - price)) / this.maxMinDifference * (this.height - 2 * paddingVertical);
	}

	draw(data) {
		const number = parseFloat(data[0][4])
		const numberToString = number + ""

		let numberBeforeDot = numberToString.replace(/\.[0-9]+/g, "") * 1;
		let numberAfterDot = numberToString.replace(/[0-9]+\./g, "") * 1;

		let numberBeforeDotDown = numberBeforeDot;

		let divideNumber = "1"

		for (let i = 0; i < (numberBeforeDot + "").length - 2; i++) {
			divideNumber += "0"
		}

		divideNumber = divideNumber * 1

		let gridPrices = []

		console.log("Количество рядов сетки", this.gridAmount);

		let calculateGridPrices = (divideNumber) => {
			let numberUp = numberBeforeDot;
			let numberDown = numberBeforeDot;
			let linesAmount = this.gridAmount;

			while (linesAmount > 0) {
				if (numberUp % divideNumber == 0) {
					gridPrices.push(numberUp)
					linesAmount -= 1
				}
				numberUp += 1
			}

			linesAmount = this.gridAmount;
			while (linesAmount > 0) {
				numberDown -= 1
				if (numberDown % divideNumber == 0) {
					gridPrices.push(numberDown)
					linesAmount -= 1
				}
			}

			if ((this.calculateVerticalPosition(gridPrices[0]) - this.calculateVerticalPosition(gridPrices[1])) < this.gridHeight) {
				gridPrices = []
				// calculateGridPrices(divideNumber)
			}
		}

		calculateGridPrices(divideNumber);

		const chartVerticeFactory = new ChartVerticeFactory();

		let vertices = chartVerticeFactory.create(data);

		this.getMaxMinValue(vertices)

		for (let i of gridPrices) {
			this.ctx.beginPath();
			this.ctx.strokeStyle = "rgba(255,255,255, .1)"
			this.ctx.lineWidth = 1
			this.ctx.moveTo(0, this.calculateVerticalPosition(i))
			this.ctx.lineTo(this.canvas.width, this.calculateVerticalPosition(i))
			this.ctx.stroke()


			let text = i + "";
			let textSize = 14
			this.ctx.beginPath();
			this.ctx.font = textSize + "px" + " sans-serif";
			this.ctx.fillStyle = "#fff";
			this.ctx.fillText(
				text,
				this.width - this.ctx.measureText(text).width - 10,
				this.calculateVerticalPosition(i) - textSize
			);
		}
	}

	getMaxMinValue(vertices, key = "openPrice") {
		let minValue = Math.pow(1024, 10);
		let maxValue = Math.pow(-1024, 11);

		this.verticesAmount = (Math.floor(this.width / this.verticeWidth) + 1) <= vertices.length ? (Math.floor(this.width / this.verticeWidth) + 1) : vertices.length;

		for (let i = 0; i < this.verticesAmount; i++) {
			if (minValue > vertices[i][key]) {
				minValue = vertices[i][key]
			}
			if (maxValue < vertices[i][key]) {
				maxValue = vertices[i][key]
			}
			if (minValue > vertices[i][key]) {
				minValue = vertices[i][key]
			}
			if (maxValue < vertices[i][key]) {
				maxValue = vertices[i][key]
			}
		}

		this.minValue = minValue;
		this.maxValue = maxValue;
		this.maxMinDifference = maxValue - minValue;
	}

	clear() {
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
}


class LineDrawer extends GridDrawer {

	constructor(canvas) {
		super(canvas)

		this.ctx = canvas.getContext("2d")

		this.paddingHorizontal = this.width / 12;

	}

	drawLine(vertice, textColor = "#00ff00") {
		let textSize = 14;
		let text = vertice.closePrice;


		this.ctx.beginPath();
		this.ctx.font = textSize + "px" + " sans-serif";
		this.ctx.fillStyle = textColor;
		this.ctx.fillText(
			text,
			this.width - this.ctx.measureText(text).width - 10,
			this.calculateVerticalPosition(vertice.closePrice) - textSize
		);

		this.ctx.shadowColor = "";
		this.ctx.setLineDash([1, 5]);
		this.ctx.lineWidth = 1
		this.ctx.moveTo(0, this.calculateVerticalPosition(vertice.closePrice));
		this.ctx.lineTo(this.width, this.calculateVerticalPosition(vertice.closePrice));
		this.ctx.closePath();
		this.ctx.stroke();
	}

	draw(data) {

		const chartVerticeFactory = new ChartVerticeFactory();
		let vertices = chartVerticeFactory.create(data);

		this.getMaxMinValue(vertices);


		for (let i = 0; i < this.verticesAmount; i++) {

			let coordinates = [];

			if (i == 0) {
				coordinates = [
					this.width - this.paddingHorizontal - (i) * this.verticeWidth,
					this.calculateVerticalPosition(vertices[i].openPrice),
					this.width - this.paddingHorizontal - (i - 1) * this.verticeWidth,
					this.calculateVerticalPosition(vertices[i].closePrice)
				]
				this.drawLine(vertices[0])
			} else {
				coordinates = [
					this.width - this.paddingHorizontal - (i) * this.verticeWidth,
					this.calculateVerticalPosition(vertices[i].openPrice),
					this.width - this.paddingHorizontal - (i - 1) * this.verticeWidth,
					this.calculateVerticalPosition(vertices[i - 1].openPrice)
				]
			}

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
}


class CandleDrawer extends LineDrawer {
	constructor(canvas) {
		super(canvas)
		this.verticeWidth = GridDrawer.CandleWidth; 
		this.ctx = canvas.getContext("2d")
	}
	draw(data) {

		const chartVerticeFactory = new ChartVerticeFactory();
		let vertices = chartVerticeFactory.create(data, ChartVertice.TYPE_CANDLE);

		this.getMaxMinValue(vertices)

		for (let i = 0; i < this.verticesAmount; i++) {


			let coordinates = [
				this.width - this.paddingHorizontal - (i) * this.verticeWidth, // отступ свечи по горизонтале
				this.calculateVerticalPosition(vertices[i].openPrice),
				this.calculateVerticalPosition(vertices[i].closePrice),
				this.calculateVerticalPosition(vertices[i].lowPrice),
				this.calculateVerticalPosition(vertices[i].highPrice),
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
				this.drawLine(vertices[0])
			}
		}
	}
}

class Symbols {
	update(symbols) {

		if (this.symbols) {
			return
		}

		this.symbolsContainer = document.querySelector(".currencies_container");

		this.symbolsContainer.innerHTML = ""

		for (let i = 0; i < 40; i++) {
			this.symbolsContainer.innerHTML += `
				<div class="currency">${symbols[i].symbol}</div>	
			`
		}

		this.symbols = symbols
	}

	search(symbol) {
		if (!this.symbols) {
			console.log("Не обнаружено символов для поиска");
			return;
		}

		let foundSymbols = "";
		let elementsMax = 100;

		for (let i of this.symbols) {
			if (i.symbol.startsWith(symbol)) {
				if (elementsMax <= 0) {
					break;
				}
				foundSymbols += `<div class="currency">${i.symbol}</div>`
				elementsMax -= 1
			}
		}

		if (foundSymbols) {
			this.symbolsContainer.innerHTML = foundSymbols
		}
	}
}

class Loader {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");

		let height = canvas.scrollHeight;
		let width = canvas.scrollWidth;

		this.canvas.height = height;
		this.canvas.width = width;

		this.num = 5
		this.posX = []
		this.posY = []
	}

	start() {
		var pi = Math.PI,
			xCenter = canvas.width / 2,
			yCenter = canvas.height / 2,
			radius = canvas.width / 45,
			startSize = radius / 3,
			angle, size, i;

		this.num++;
		this.ctx.clearRect(0, 0, xCenter * 2, yCenter * 2);
		for (i = 0; i < 9; i++) {
			this.ctx.beginPath();
			this.ctx.fillStyle = 'rgba(69,99,255,' + .1 * i + ')';
			if (this.posX.length == i) {
				angle = pi * i * .25;
				this.posX[i] = xCenter + radius * Math.cos(angle);
				this.posY[i] = yCenter + radius * Math.sin(angle);
			}
			this.ctx.arc(
				this.posX[(i + this.num) % 8],
				this.posY[(i + this.num) % 8],
				startSize / 9 * i,
				0, pi * 2, 1);
			this.ctx.fill();
		}
	}
}



class Chart {
	constructor(states) {
		this.states = states
		this.isLoader = false;
	}

	async change() {
		console.log("Меняем график");
		let data = null;
		let symbols = null;

		const delay = ms => new Promise(res => setTimeout(res, ms));

		for (let i of Object.keys(this.states)) {
			let state = this.states[i]
			switch (i) {
				case "Loader":
					if (!this.isLoader) {
						state.start();
					}
					break;

				case "ConnectionChart":
					data = await state.makeRequest();
					data = data.reverse()
					break;

				case "GridDrawer":
					state.clear();
					state.draw(data);
					this.isLoader = true
					break;

				case "ChartDrawer":
					if (!data) {
						console.log("Данных по графику не получено");
						break;
					}
					state.draw(data);
					break;


				case "ConnectionSymbol":
					symbols = await state.makeRequest();
					break;

				case "Symbols":
					if (!symbols) {
						console.log("Валютные пары не получены");
						break;
					}
					state.update(symbols.symbols)
					break;
				default:
					break;
			}
		}
	}
}

const breakConnection = () => {
	try {
		window.stop();
	} catch (e) {
		document.execCommand('Stop');
	}
}


const canvas = document.getElementById("canvas");
let states = {
	Loader: new Loader(canvas),
	ConnectionChart: new ConnectionChart(),
	GridDrawer: new GridDrawer(canvas),
	ChartDrawer: new CandleDrawer(canvas),
	ConnectionSymbol: new ConnectionSymbol(),
	Symbols: new Symbols(),
}
const chart = new Chart(states);

// const timesStamps = document.querySelectorAll(".timestamp");
// timesStamps.forEach(item => {
// 	item.addEventListener("click", () => {

// 	})
// })


document.addEventListener("click", (event) => {

	let target = event.path[0].classList.value;

	if (target.includes("timestamp") && !target.includes("focus")) {
		let target_id = target.split(" ")[target.split(" ").length - 1]
		let elements = document.querySelectorAll(".timestamp");
		elements.forEach(element => {
			element.classList.remove("focus")
			if (element.classList.contains(target_id)) {
				element.classList.add("focus")
			}
		});

		chart.isLoader = false
		ConnectionChart.changeTimeStamp(target_id);
		breakConnection();
	}

	if (target.includes("currency")) {
		chart.isLoader = false
		ConnectionChart.changeSymbol(event.path[0].innerText)
		breakConnection();
	}

})

console.log("pizdec");
const coinInfo = document.querySelector(".coin-info");
coinInfo.addEventListener("click", () => {
	const element = document.querySelector(".currencies")
	if (element.classList.contains("active")) {
		element.classList.remove("active")
	} else {
		element.classList.add("active")
	}
})

const chartTypeCandle = document.querySelector(".chart-type_candle")
const chartTypeLine = document.querySelector(".chart-type_line")

chartTypeCandle.addEventListener("click", () => {
	chart.states.ChartDrawer = new CandleDrawer(canvas)
})

chartTypeLine.addEventListener("click", () => {
	chart.states.ChartDrawer = new LineDrawer(canvas)
})

const currenciesSearch = document.querySelector(".currencies_search");

currenciesSearch.addEventListener("change", (e) => {
	chart.states.Symbols.search(e.target.value)
})

chart.change()
setInterval(() => {
	chart.change()
}, 2000)

KioskBoard.Init({

	/*!
	 * Required
	 * Have to define an Array of Objects for the custom keys. Hint: Each object creates a row element (HTML) on the keyboard.
	 * e.g. [{"key":"value"}, {"key":"value"}] => [{"0":"A","1":"B","2":"C"}, {"0":"D","1":"E","2":"F"}]
	 */
	keysArrayOfObjects: [{
			"0": "Q",
			"1": "W",
			"2": "E",
			"3": "R",
			"4": "T",
			"5": "Y",
			"6": "U",
			"7": "I",
			"8": "O",
			"9": "P"
		},
		{
			"0": "A",
			"1": "S",
			"2": "D",
			"3": "F",
			"4": "G",
			"5": "H",
			"6": "J",
			"7": "K",
			"8": "L"
		},
		{
			"0": "Z",
			"1": "X",
			"2": "C",
			"3": "V",
			"4": "B",
			"5": "N",
			"6": "M"
		}
	],

	/*!
	 * Required only if "keysArrayOfObjects" is "null".
	 * The path of the "kioskboard-keys-${langugage}.json" file must be set to the "keysJsonUrl" option. (XMLHttpRequest to getting the keys from JSON file.)
	 * e.g. '/Content/Plugins/KioskBoard/dist/kioskboard-keys-english.json'
	 */
	keysJsonUrl: null,

	/*
	 * Optional: (Special Characters Object)* Can override default special characters object with the new/custom one.
	 * e.g. {"key":"value", "key":"value", ...} => {"0":"#", "1":"$", "2":"%", "3":"+", "4":"-", "5":"*"}
	 */
	specialCharactersObject: null,

	// Optional: (Other Options)

	// Language Code (ISO 639-1) for custom keys (for language support) => e.g. "de" || "en" || "fr" || "hu" || "tr" etc...
	language: 'en',

	// The theme of keyboard => "light" || "dark" || "flat" || "material" || "oldschool"
	theme: 'dark',

	// Uppercase or lowercase to start. Uppercase when "true"
	capsLockActive: true,

	/*
	 * Allow or prevent real/physical keyboard usage. Prevented when "false"
	 * In addition, the "allowMobileKeyboard" option must be "true" as well, if the real/physical keyboard has wanted to be used.
	 */
	allowRealKeyboard: false,

	// Allow or prevent mobile keyboard usage. Prevented when "false"
	allowMobileKeyboard: false,

	// CSS animations for opening or closing the keyboard
	cssAnimations: true,

	// CSS animations duration as millisecond
	cssAnimationsDuration: 360,

	// CSS animations style for opening or closing the keyboard => "slide" || "fade"
	cssAnimationsStyle: 'slide',

	// Allow or deny Spacebar on the keyboard. The keyboard is denied when "false"
	keysAllowSpacebar: true,

	// Text of the space key (spacebar). Without text => " "
	keysSpacebarText: 'Space',

	// Font family of the keys
	keysFontFamily: 'sans-serif',

	// Font size of the keys
	keysFontSize: '22px',

	// Font weight of the keys
	keysFontWeight: 'normal',

	// Size of the icon keys
	keysIconSize: '25px',

	// Scrolls the document to the top of the input/textarea element. The default value is "true" as before. Prevented when "false"
	autoScroll: true,
});

KioskBoard.Run('.js-virtual-keyboard');