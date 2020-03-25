export const searchStrings = (mainString,compareString) => {
    let match = false
    console.log({main: mainString, compare: compareString});
    let segments = {
        start: mainString,
        middle: '',
        end: ''

    }
    if (mainString && compareString) {
        if (mainString.length === compareString.length) {
			if (mainString.toUpperCase() === compareString.toUpperCase()) {
				match = true;
				segments = {
					start: "",
                    middle: mainString,
                    end: ''
				};
			}
		} else {
			for (let i = 0; i < mainString.length - compareString.length; i++) {
				let segment = mainString.slice(i, i + compareString.length);
				if (segment.toUpperCase() === compareString.toUpperCase()) {
					match = true;
					segments = {
						start: mainString.slice(0, i),
						middle: mainString.slice(i, i + compareString.length),
						end: mainString.slice(
							i + compareString.length,
							mainString.length
						)
                    };
                    return { match, segments };
				}
			}
		}
    }
    
    return {match, segments}
}