import axios from "axios";

export function clientDownload(fileData, fileName) {
	console.log("Client Download Initiated");
	const url = window.URL.createObjectURL(fileData);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	console.log("Client Download Successful");
}

export function S3UploadSinglePart(fileData, endpointURL) {
	console.log("Beginning Single Upload, Generating URL");
	axios
		.get(endpointURL)
		.then(response => {
			console.log(`URL Generated: ${response.data.url}`);
			let url = response.data.url;

			let params = {
				url: url,
				method: "put",
				headers: {
					"Content-Type": "audio/*"
				},
				onUploadProgress: progressEvent => {
					let progress = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					console.log(`Progress: ${progress}%`);
				}
			};

			axios.put(url, fileData, params).then(response => {
				console.log("Done");
			});
		})
		.catch(error => {
			alert(JSON.stringify(error));
		});
}
