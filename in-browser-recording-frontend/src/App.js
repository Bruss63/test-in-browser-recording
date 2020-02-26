import React from "react";
import AudioRecorder from "./AudioRecorder.js";
import "./App.css";
import { clientDownload, S3UploadSinglePart } from "./Modules/Networking";

function App() {
	//File Handling Settings
	const download = true; //Set true to download directly to local machine --Testing Only--
	const s3Upload = true; //Set true to upload to s3 bucket specified below
	const SIGNED_URL_ENDPOINT =
		"https://vf4q9rvdzb.execute-api.ap-southeast-2.amazonaws.com/dev/apps/signedURL";

	const handleFile = event => {
		if (download === true) {
			clientDownload(event, event.name);
		}
		if (s3Upload === true) {
			S3UploadSinglePart(event, SIGNED_URL_ENDPOINT);
		}
		console.log(event);
	};

	return (
		<div className="App">
			<h1>{"App"}</h1>
			<AudioRecorder playback={false} onFileReady={handleFile} />
		</div>
	);
}

export default App;
