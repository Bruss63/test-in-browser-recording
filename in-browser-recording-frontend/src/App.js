import React from "react";
import AudioRecorder from "./AudioRecorderSrc/AudioRecorder.js";
import "./App.css";
import { clientDownload, S3UploadSinglePart } from "./Modules/Networking";

function App() {
	//File Handling Settings
	const download = true; //Set true to download directly to local machine --Testing Only--
	const s3Upload = true; //Set true to upload to s3 bucket specified below
	const SIGNED_URL_ENDPOINT =
		"https://vf4q9rvdzb.execute-api.ap-southeast-2.amazonaws.com/dev/apps/signedURL";

	const handleFile = file => {
		if (download === true) {
			clientDownload(file, file.name);
		}
		if (s3Upload === true) {
			S3UploadSinglePart(file, SIGNED_URL_ENDPOINT);
		}
		console.log(file);
	};

	return (
		<div className="App">
			<h1>{"App"}</h1>
			<AudioRecorder fileType="wav" onFileReady={handleFile} />
		</div>
	);
}

export default App;
