import React, { useState } from "react";
//Custom Scripts
import AudioAnalyser from './Modules/AudioAnalyser.js';
//Images and Formatting
import microphone from "./Assets/microphone-logo.svg";
import reset from "./Assets/reset.svg";
import stop from "./Assets/stop.svg";
import play from "./Assets/play.svg";
import "./App.css";
//Uploading Modules
import axios from "axios";

//TODO 
/*
	s3 stream?? - minimum chunk size 5MB, not viable?
*/



function App () {
	//constants
	const readingScript = "Example Script Here";
	const minimumRecordTime = 1;
	const constraints = { audio: true, video: false };
	const timeSlice = 60000;
	const SIGNED_URL_ENDPOINT =
		"https://vf4q9rvdzb.execute-api.ap-southeast-2.amazonaws.com/dev/apps/signedURL";
	
	//settings
	const saveDataOptions = {
		clientDownload: false,
		S3Upload: {
			singlePart: true,
			multiPart: false
		}
	}
	const showScriptReigon = false;
	//Audio
	let [stream,setStream] = useState(null);
	let [mediaRecorder,setMediaRecorder] = useState(null);
	let mediaRecorderType = null;
	let recordedChunks = [];
	//Networking
	// let multipartUpload = null;
	//timer
	let min = 0
	let sec = 0
	let ms = 0
	let timer = null;
	let formattedMs = 0;
	let formattedSec = 0;
	let formattedMin = 0;
	let start = 0
	//states	
	let [isUploading,setUploading] = useState(false);
	let [isUploaded,setUploaded] = useState(false);
	let [isSubmitted,setSubmitted] = useState(false);
	let [isRestarting,setRestarting] = useState(false);
	let [isRecordingPane,setRecordingPane] = useState(false);
	let [timerDisplaying,setTimerDisplaying] = useState(false);
	let [timerActive,setTimerActive] = useState(false);
	let [isStopped,setStopped] = useState(true);
	

	//Custom Buttons
	function TimerDisplay() {
		formattedMs = ms.toString();
		formattedSec = sec.toString();
		formattedMin = min.toString();

		while (formattedMs.length !== 4) {
			formattedMs = 0 + formattedMs;
		}

		while (formattedSec.length !== 2) {
			formattedSec = 0 + formattedSec;
		}

		while (formattedMin.length !== 2) {
			formattedMin = 0 + formattedMin;
		}

		if (timerDisplaying) {
			return (
				<div>
					<h1 className="clock-face">
						{min}
						{":"}
						{sec}
						{":"}
						{ms}
					</h1>
				</div>
			);
		} else {
			return null;
		}
	};

	function ScriptReigon() {
		if (showScriptReigon) {
			return <h1 className="script-reigon">{readingScript}</h1>;

		}
		else {
			return null
		}	
	}

	function SubmitButton()  {
		if ((sec >= minimumRecordTime || min >= 1) && isStopped) {
			return (
				<button className="submit-button" onClick={handleSubmit}>
					{isUploading ? "Uploading..." : isUploaded ? "Uploaded!!!" : "Submit"}
				</button>
			);
		} else if ((sec < minimumRecordTime && min < 1) && !isStopped) {
			return <h1 className="error-message">{"Recording Too Short!!!"}</h1>;
		} else {
			return null;
		}
	};

	function MainButtonCluster() {
		if (!isRecordingPane) {
			return (
				<button className="record-button" onClick={handleStartRecorder}>
					<img className="microphone" src={microphone} alt="err"></img>
				</button>
			);
		} else if (isRecordingPane) {
			return (
				<div className="main-button-wrapper">
					<button
						className="stop-button"
						onClick={
							isRestarting
								? handleStartRecorderFromReset
								: handleStopRecorder
						}
					>
						<img
							className="stop-icon"
							src={isRestarting ? play : stop}
							alt="err"
						/>
					</button>

					{!isSubmitted ? (
						<button className="reset-button" onClick={handleReset}>
							<img className="reset" src={reset} alt="err" />
						</button>
					) : (
						""
					)}
				</div>
			);
		}
	};
	//Handlers
	function handleSubmit() {
		console.log("Submit Attempted");
		stopMic();
		stopTimer();
		saveData();
		setSubmitted(true)
	};

	function handleStartRecorderFromReset() {
		mediaRecorder.start(timeSlice);
		startTimer();
		setStopped(false) 
		setRestarting(false)
	};

	async function handleStartRecorder() {
		await startRecorder();
		setRecordingPane(true)
		setStopped(false)
		startTimer();
	};

	function handleStopRecorder() {
		setStopped(true)
		stopTimer();
		stopRecorder();
	};

	function handleReset() {
		resetTimer();
		resetRecorder();
		setRestarting(true)
		setStopped(true)
	};

	async function startRecorder() {
		stream = await getMic();
		if (stream) {
			console.log("Aquired Stream ");
		}
		mediaRecorder = new window.MediaRecorder(stream);
		mediaRecorderType = mediaRecorder.mimeType;
		recordedChunks = [];
		mediaRecorder.start(timeSlice);
		mediaRecorder.ondataavailable = event => {
			if (event.data && event.data.size > 0) {
				console.log("Data Valid Attempting Storage");
				recordedChunks.push(event.data);
			} else {
				console.log("Data Empty or Corrupt");
			}
		};
	};
	//Recorder Functions
	function stopRecorder() {
		if (mediaRecorder.state !== "inactive") {
			mediaRecorder.stop();
		}
	};

	async function resetRecorder() {
		setStopped(true)
		if (mediaRecorder.state !== "inactive") {
			mediaRecorder.stop();
		}
		recordedChunks = [];
		console.log(recordedChunks);
	};
	//Data Functions
	async function saveData() {
		console.log("Beginning Data Save, Blobs:")
		console.log(recordedChunks)
		let file = new File(recordedChunks, "VoicePrint.webm",{type: mediaRecorderType});
		if (file.size > 0) {
			console.log("Data Successfully Saved, File:");
			console.log(file)
		} else {
			console.log("Save Failed");
		}

		//File Handling Excecution
		let { clientDownload,S3Upload } = saveDataOptions
		if (clientDownload) {
			clientDownload(file);
		}
		if (S3Upload.singlePart) {
			setUploading(true);
			S3UploadSinglePart(file);
			setUploading(false);
			setUploaded(true)
		}
		if (!clientDownload && !S3Upload.singlePart && !S3Upload.multiPart) {
			console.log("No file Handling Selected!!!")
		}
	};

	function clientDownload(fileData) {
		console.log("Client Download Initiated")
		const url = window.URL.createObjectURL(fileData);
		const a = document.createElement("a");
		a.href = url;
		a.download = "VoicePrint.webm";
		a.click();
		console.log("Client Download Successful");
	}

	function S3UploadSinglePart (fileData) {
		console.log("Beginning Single Upload, Generating URL")
		axios.get(SIGNED_URL_ENDPOINT)
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

				axios.put(url, fileData, params)
				.then(response => {
					console.log("Done")
				})
			})
			.catch(error => {
				alert(JSON.stringify(error));
			});
	};

	//Mic Functions
	async function getMic() {
		console.log("Attempting to Aquire Stream");
		let stream = await navigator.mediaDevices.getUserMedia(constraints);
		return stream;
	};

	function stopMic() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
	};
	//Timer Functions
	function startTimer() {
		setTimerActive(true)
		setTimerDisplaying(true)
		start = Date.now() - ms
		timer = setInterval(updateTimer, 1);
	};

	function updateTimer() {
		ms = Date.now() - start;
		if (ms >= 1000) {
			start = Date.now();
			ms = Date.now() - start
			sec += 1;
		}
		if (sec >= 60) {
			sec = 0;
			min += 1;
		}
	};

	function stopTimer() {
		setTimerActive(false)
		clearInterval(timer);
	};

	function resetTimer() {
		setTimerActive(false)
		min = 0
		sec = 0
		ms = 0
		setTimerDisplaying(false)
		clearInterval(timer);
	};

	return (
		<div className="App">
			<h1>{"Record VoicePrint"}</h1>
			<ScriptReigon/>
			<MainButtonCluster/>
			<TimerDisplay />
			<SubmitButton />
			{!isStopped ? <AudioAnalyser audio={stream} /> : ""}
		</div>
	);
}


export default App;
