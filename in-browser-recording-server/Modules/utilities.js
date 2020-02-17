module.exports = {
	buildReturn: function(code, params = null, url = null) {
		return {
			statusCode: code,
			headers: {
				"Access-Control-Allow-Origin": "http://localhost:3000"
			},
			body: JSON.stringify(
				{
					message: "Online",
					url: url,
					params: params,
				},
				null,
				2
			)
		};
  },

  params:	function(bucket, fileName, expires, contentType) {
    return {
		Bucket: bucket,
		Key: fileName,
		Expires: expires,
		ContentType: contentType
	};
  },
  
	defaultFile: { fileName: "VoicePrint.webm", fileType: "audio/*" }
};



