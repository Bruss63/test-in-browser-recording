const dep_searchStrings = (mainString, compareString, searchStart, adjacency) => {
	console.log(`Beginning Check`,{mainString,compareString})
	//Break Strings into words
	let mainStringWords = getWords(mainString);
	let compareStringWords = getWords(compareString);
	console.log(`Words: `,{mainString: mainStringWords, compareString:compareStringWords})
	//Allign Strings	
	let alignIndex = alignStrings(mainStringWords,compareStringWords,searchStart)
	console.log(`Aligning Strings`, { alignIndex });
	//Find Matches
	let matches = [];
	for (let word = 0; word < compareStringWords.length; word++) {
		if (word < alignIndex) {
			console.log(`previously confirmed '${mainStringWords[word]}'`);
			matches.push({
				word: mainStringWords[word],
				strength: 1,
				index: word,
			});
		} else {
			console.log(`not confirmed '${compareStringWords[word]}'`);
			for (
				let searchOffset = -adjacency;
				searchOffset <= adjacency;
				searchOffset++
			) {
				let target = word + searchOffset;
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
									Math.abs(searchOffset) *
										(1 / (adjacency + 1)),
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

export const searchStrings = (mainString,compareString) => {
	//Break up words
	let mainStringWords = getWords(mainString);
	let compareStringWords = getWords(compareString);
	console.log({mainStringWords, compareStringWords})
	for (let i = 0; i < mainStringWords.length - compareStringWords.length; i++) {
		let mainStringSegment = mainStringWords[i];
		for (let j = i + 1; j < i + 1 + compareStringWords.length; j++) {
			console.log(j)
			mainStringSegment = mainStringSegment.concat(mainStringSegment, ` ${mainStringWords[j]}`)
		}
		console.log(mainStringSegment);
	}
	
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
const alignStrings = (mainStringWords, compareStringWords, lastAlignedIndex) => {
	let index, bestPiece;
	let compareStringStart = compareStringWords[0];
	if (compareStringWords.length < 3) {		
		for (let i = 1; i < compareStringWords.length; i++) {
			compareStringStart = compareStringStart.concat(
				' ',
				compareStringWords[i]
			)
		}
	}
	else {
		compareStringStart = compareStringStart.concat(
			" ",
			compareStringWords[1],
			" ",
			compareStringWords[2]
		);
	}
	let bestDist = Infinity;
	for (let i = lastAlignedIndex; i < lastAlignedIndex + 5; i++) {
		let mainStringPiece = mainStringWords[i];
		mainStringPiece = mainStringPiece.concat(
			" ",
			mainStringWords[i + 1],
			" ",
			mainStringWords[i + 2]
		);
		console.log({ mainStringPiece, compareStringStart });
		let dist = levenshtienDistance(compareStringStart, mainStringPiece);
		if (dist < bestDist) {
			bestDist = dist;
			bestPiece = mainStringPiece;
			index = i;
		}
	}
	console.log(bestPiece, index);
	return index
}

//Compare words
const checkWords = (mainWord, compareWord, threshold) => {
	mainWord = mainWord.toUpperCase();
	compareWord = compareWord.toUpperCase();
	let levDist = levenshtienDistance(mainWord,compareWord)
	if (levDist < threshold) {
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
	// console.log(levArray)
	return levArray[b.length][a.length]
}