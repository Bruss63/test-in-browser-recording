'use strict';

module.exports.signedURL = async event => {
	

	return {
		statusCode: 200,
		body: JSON.stringify(
			{
				message:
					"Online",
				input: event
			},
			null,
			2
		)
	};
}
