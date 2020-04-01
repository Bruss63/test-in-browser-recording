//Diff algorithm
export const searchStrings = (mainString,compareString,adjacency) => {
	console.log({mainString,compareString})
	//Break Strings into words
	let mainStringWords = getWords(mainString);
	let compareStringWords = getWords(compareString);
	console.log({mainString: mainStringWords, compareString:compareStringWords})
	//Find Matches
	let matches = [];
	for (let word = 0; word < compareStringWords.length; word++) {
		for (let offset = -adjacency; offset <= adjacency; offset ++) {
			let target = word + offset
			if (target >= 0 && target < mainStringWords.length) {
				if (
					compareStringWords[word].toUpperCase() ===
					mainStringWords[target].toUpperCase()
				) {
					if (Math.abs(offset) !== 0) {
						matches.push({
							word: mainStringWords[target],
							strength: 1 - Math.abs(offset) * (1 / (adjacency + 1)),
							index: target
						});
					} else {
						matches.push({
							word: mainStringWords[target],
							strength: 1,
							index: target
						});
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
				strings.push({string: bestMatches[i].word, match: true})
				matchStringActive = true;				
			}
		}
		else {
			if (matchStringActive) {
				matchStringActive = false
				stringCount++;
				strings.push({
					string: mainStringWords[i],
					match: false
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
						match: false
					});
					noMatchStringActive = true;
				}
				
			}
		}
	}
	return strings;
}

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