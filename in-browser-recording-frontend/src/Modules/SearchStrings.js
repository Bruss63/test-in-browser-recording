export const searchStrings = (mainString, compareString, compliance) => {
	//Break up words
	let mainStringWords = getWords(mainString);
	let compareStringWords = getWords(compareString);
	compareStringWords = filterWords(compareStringWords);
	//Truncate compare array
	if (compareStringWords.length > 5) {
		compareStringWords = compareStringWords.slice(
			compareStringWords.length - 5,
			compareStringWords.length
		);
	}
	//Initialise Variables
	let bestMatch = {
		segment: "",
		distance: Infinity,
		index: 0,
	};
	//Build Compare Segment
	let compareSegment = reconstructSentence(compareStringWords);
	//Compare the words
	for (
		let i = mainStringWords.length - compareStringWords.length;
		i >= 0;
		i--
	) {
		let mainStringWordsChunk = mainStringWords.slice(
			i,
			i + compareStringWords.length
		);
		let mainSegment = reconstructSentence(mainStringWordsChunk);
		let { match, levDist } = checkWords(
			mainSegment,
			compareSegment,
			10 + compliance
		);
		if (match && levDist <= bestMatch.distance) {
			bestMatch = {
				segment: mainSegment,
				distance: levDist,
				index: i,
			};
		}
	}
	//Find the current line
	let readTo = bestMatch.index + compareStringWords.length;
	return readTo;
};

export const createSegments = (script, readTo, pWidth) => {
	let lineLength = Math.floor(pWidth / 13);
	console.log(lineLength)
	currentLine = 0;
	let words = getWords(script);	
	let confirmedArray = words.slice(0, readTo);
	let unconfirmedArray = words.slice(readTo, readTo + 5);
	let unspokenArray = words.slice(readTo + 5, words.length);
	let confirmedSegment = reconstructSentence(
		confirmedArray,
		lineLength
	);
	let unconfirmedSegment = reconstructSentence(
		unconfirmedArray,
		lineLength
	);
	let unspokenSegment = reconstructSentence(
		unspokenArray,
		lineLength
	);
	return {
		confirmedSegment,
		unconfirmedSegment,
		unspokenSegment,
	};
};

//Breaks up string into individual words
const getWords = (string) => {
	let lastChar = "";
	let lastWord = 0;
	let stringWords = [];
	for (let i = 0; i <= string.length; i++) {
		if (
			lastChar !== " " &&
			(string.charAt(i) === " " || i === string.length)
		) {
			let word = string.slice(lastWord, i);
			stringWords.push(word);
		} else if (lastChar === " " && string.charAt(i) !== " ") {
			lastWord = i;
		}
		lastChar = string.charAt(i);
	}
	return stringWords;
};

// Create String from array of words
let currentLine = 0;
const reconstructSentence = (wordArray, lineLength) => {
	let wordString = "";
	for (let i = 0; i < wordArray.length; i++) {
		if (currentLine >= lineLength) {
			wordString = wordString.concat(` ${wordArray[i]}\n`);
			currentLine = 0;
		} else {
			wordString = wordString.concat(` ${wordArray[i]}`);
			currentLine = currentLine + wordArray[i].length;
		}
	}
	return wordString;
};

const filterWords = (wordArray) => {
	for (let i = 0; i < wordArray.length; i++) {
		if (wordArray[i] === "") {
			wordArray.splice(i, 1);
		}
	}
	return wordArray;
};

//Compare words
const checkWords = (mainWord, compareWord, threshold) => {
	mainWord = mainWord.toUpperCase();
	compareWord = compareWord.toUpperCase();
	let levDist = levenshtienDistance(mainWord, compareWord);
	if (levDist < threshold) {
		return { match: true, levDist };
	} else {
		return { match: false, levDist };
	}
};

//levenstien Distance algorithm
const levenshtienDistance = (a, b) => {
	const levArray = Array(b.length + 1)
		.fill(null)
		.map(() => Array(a.length + 1).fill(null));

	for (let i = 0; i <= a.length; i++) {
		levArray[0][i] = i;
	}
	for (let j = 0; j <= b.length; j++) {
		levArray[j][0] = j;
	}
	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const indicator = a[i - 1] === b[i - 1] ? 0 : 1;
			levArray[j][i] = Math.min(
				levArray[j][i - 1] + 2,
				levArray[j - 1][i] + 2,
				levArray[j - 1][i - 1] + indicator
			);
		}
	}
	return levArray[b.length][a.length];
};
