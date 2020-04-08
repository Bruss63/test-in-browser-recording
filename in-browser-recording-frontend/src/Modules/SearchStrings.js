//Diff algorithm
export const searchStrings = (mainString, compareString, searchWindowIndex, adjacency) => {
	console.log({mainString,compareString})
	//Break Strings into words
	let mainStringWords = getWords(mainString);
	let compareStringWords = getWords(compareString);
	console.log({mainString: mainStringWords, compareString:compareStringWords})
	//Allign Strings
	alignStrings(mainStringWords,compareStringWords)
	//Find Matches
	let matches = [];
	console.log(searchWindowIndex)
	let confirmedIndex = searchWindowIndex - (adjacency * 2);
	confirmedIndex = Math.max(confirmedIndex, 0)
	console.log(confirmedIndex)
	let indexOffset = 0;
	if (confirmedIndex > compareStringWords.length) {
		indexOffset = confirmedIndex
	}
	for (let word = 0; word < compareStringWords.length; word++) {
		if (word <= confirmedIndex) {
			console.log(`previously confirmed '${mainStringWords[word]}'`);
			matches.push({
				word: mainStringWords[word],
				strength: 1,
				index: word,
			});
		}
		else {
			console.log('not confirmed')
			for (let searchOffset = -adjacency; searchOffset <= adjacency; searchOffset++) {
				let target = word + searchOffset + indexOffset;
				if (target >= 0 && target < mainStringWords.length) {
					if (
						checkWords(
							mainStringWords[target],
							compareStringWords[word]
						)
					) {
						if (Math.abs(searchOffset) !== 0) {
							matches.push({
								word: mainStringWords[target],
								strength:
									1 -
									Math.abs(searchOffset) * (1 / (adjacency + 1)),
								index: target,
							});
						} else {
							matches.push({
								word: mainStringWords[target],
								strength: 1,
								index: target,
							});
						}
					}
				}
			}
		}		
	}
	//Filter Matches
	let bestMatches = []
	for (let i = 0; i < mainStringWords.length; i++) {
		bestMatches.push({strength:0})
	}
	for (let i = 0; i < mainStringWords.length; i++) {
		for (let j = 0; j < matches.length; j++) {
			if (matches[j].index === i) {
				if (bestMatches[i].strength < matches[j].strength) {
					bestMatches[i] = matches[j];
				}
			}
		}
	}
	console.log(bestMatches)
	//Build String
	let strings = []
	let stringCount = 0;
	let matchStringActive = false;
	let noMatchStringActive = false;
	for (let i = 0; i < bestMatches.length; i++) {
		if(bestMatches[i].word) {
			if (matchStringActive) {
				strings[stringCount].string = strings[
					stringCount
				].string.concat(" ", bestMatches[i].word);
			}
			else {
				if (noMatchStringActive) {
					stringCount++;
					noMatchStringActive = false;
				}
				strings.push({
					string: bestMatches[i].word, 
					match: true, 
					index: i
				})
				matchStringActive = true;				
			}
		}
		else {
			if (matchStringActive) {
				matchStringActive = false
				stringCount++;
				strings.push({
					string: mainStringWords[i],
					match: false,
					index: i
				});
				noMatchStringActive = true
			}
			else {
				if (noMatchStringActive) {
					strings[stringCount].string = strings[
						stringCount
					].string.concat(" ", mainStringWords[i]);
				}
				else {
					strings.push({
						string: mainStringWords[i],
						match: false,
						index: i
					});
					noMatchStringActive = true;
				}
				
			}
		}
	}
	return strings;
}

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
}

//Allign words
const alignStrings = (mainStringWords, compareStringWords) => {
	if (compareStringWords < 3) {
		
	}
	else {
		let compareStringStart = compareStringWords[0]
		compareStringStart = compareStringStart.concat(
			" ",
			compareStringWords[1],
			" ",
			compareStringWords[2]
		);
		let besDist = Infinity
		let index, bestPiece
		for(let i = 0; i < mainStringWords.length-2; i++) {
			let mainStringPiece = mainStringWords[i];
			mainStringPiece = mainStringPiece.concat(
				" ",
				mainStringWords[i + 1],
				" ",
				mainStringWords[i + 2]
			);
			let dist = levenshtienDistance(compareStringStart, mainStringPiece)
			if (dist < besDist) {
				besDist = dist
				bestPiece = mainStringPiece
				index = i
			}
		}
		console.log(bestPiece, index);
	}
}

//Compare words
const checkWords = (mainWord, compareWord) => {
	mainWord = mainWord.toUpperCase();
	compareWord = compareWord.toUpperCase();
	let levDist = levenshtienDistance(mainWord,compareWord)
	console.log({mainWord, compareWord, Distance: levDist})
	if (levDist < 3) {
		return true;
	} else {
		return false;
	}

}

//levenstien Distance algorithm
const levenshtienDistance = (a, b) => {
	const levArray = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

	for (let i = 0; i <= a.length; i++) {
		levArray[0][i] = i;
	}
	for (let j = 0; j <= b.length; j++) {
		levArray[0][j] = j;
	}

	for (let j = 1; j <= b.length; j++) {
		for (let i = 1; i <= a.length; i++) {
			const indicator = a[i - 1] === b[i - 1] ? 0 : 1;
			levArray[j][i] = Math.min(
				levArray[j][i - 1] + 1,
				levArray[j - 1][i] + 1,
				levArray[j - 1][i - 1] + indicator
			);
		}
	}

	return levArray[b.length][a.length]
}