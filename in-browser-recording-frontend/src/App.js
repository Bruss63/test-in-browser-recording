import React, { useEffect, useRef, useState } from "react";
import AudioRecorder from "./AudioRecorderSrc/AudioRecorder.js";
import "./App.css";
import { clientDownload, S3UploadSinglePart } from "./Modules/Networking";
import { searchStrings } from "./Modules/SearchStrings";
import scriptObj from "./script.json";

function App() {
	//File Handling Settings
	const download = false; //Set true to download directly to local machine --Testing Only--
	const s3Upload = false; //Set true to upload to s3 bucket specified below
	const websocket = true;
	//URL's for file handling
	const SIGNED_URL_ENDPOINT = process.env.REACT_APP_SIGNED_URL;
	const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;
	//Refs
	const socket = useRef(undefined);
	const script = useRef(
		JSON.stringify(scriptObj.script).replace(/['"]+/g, "")
	);
	const transcriptRef = useRef({
		transcript: "",
		time: 0,
		stability: 0,
	});
	const previousTranscriptRef = useRef({
		transcript: "",
		time: 0,
		stability: 0,
	});
	const confirmedSegment = useRef({
		string: "",
		index: 0,
	});
	const isLastRef = useRef(false);
	//States
	const [segments, setSegments] = useState([
		{ string: script.current, match: false },
	]);
	const handleSegmentsUpdate = (e) => {
		setSegments(e);
	};

	useEffect(() => {
		if (websocket) {
			socket.current = new WebSocket(WEBSOCKET_URL);
			socket.current.onmessage = (e) => {
				handleMessage(e);
			};
			socket.current.onopen = (e) => {
				console.log({ message: "Connection Established", e });
			};
			socket.current.onerror = (e) => {
				console.log({ message: "Error", e });
			};
			socket.current.onclose = (e) => {
				console.log({ message: "Connection Closing", e });
			};
			console.log(socket.current);
			return () => {
				socket.current.close();
			};
		}
	}, []);

	const handleMessage = (message) => {
		console.log(`Message Recieved`, { message });
		console.time("checkTime");
		let data = JSON.parse(message.data);
		let timeObj = data.result_end_time;
		let nanos = timeObj.nanos / 1000000000;
		let seconds = timeObj.seconds || 0;
		let time = seconds + nanos;
		let { valid, transcriptObj } = checkTranscriptValidity(
			transcriptRef.current,
			data,
			time
		);
		if (valid) {
			transcriptObj.transcript =
				`${previousTranscriptRef.current.transcript} ${transcriptObj.transcript}`;
			transcriptRef.current = transcriptObj;
			if (isLastRef.current)
				previousTranscriptRef.current = transcriptRef.current;
			let currentSegments = searchStrings(
				script.current,
				transcriptRef.current.transcript
			);
			console.log(confirmedSegment.current);
			console.log({
				currentSegments,
			});
			handleSegmentsUpdate(currentSegments);
		}
		console.timeEnd("checkTime");
	};

	const checkTranscriptValidity = (currentBest, data, time) => {
		let valid = false;
		isLastRef.current = false;
		let transcriptObj;
		if (data) {
			let transcript, stability;
			if (data.is_final === true) {
				console.log("Is Final");
				isLastRef.current = true;
				transcript = data.alternatives[0].transcript;
				stability = 1;
			} else {
				transcript = data.alternatives[0].transcript;
				stability = data.stability;
			}
			transcriptObj = {
				transcript,
				time,
				stability,
			};
			if (currentBest.time < time) {
				valid = true;
			}
			if (currentBest.stability <= stability) {
				valid = true;
			}
			if (transcript) {
				if (currentBest.transcript.length < transcript.length) {
					valid = true;
				}
			} else valid = false;
		}
		return { valid, transcriptObj };
	};

	const handleFile = (file) => {
		if (download) {
			clientDownload(file);
		}
		if (s3Upload) {
			S3UploadSinglePart(file, SIGNED_URL_ENDPOINT);
		}
		if (websocket) {
			if (socket.current.readyState) {
				socket.current.send(file);
			} else {
				console.log("Error With Connection");
			}
		}
	};

	// const displayScript = segments.map((item, index) => {
	// 	let isLast = false;
	// 	if (index === segments.length - 1) isLast = true;
	// 	return (
	// 		<span
	// 			key={index}
	// 			className={item.match ? "MatchText" : "UnmatchedText"}>
	// 			{item.string}
	// 			{isLast ? null : "\u00A0"}
	// 		</span>
	// 	);
	// });

	const handleClick = (e) => {
		console.log({
			segments,
			transcriptRef,
			isLast: isLastRef.current,
			socket: socket.current,
		});
	};

	return (
		<div className='App'>
			<div className={"ScriptContainer"}>
				{/* <p className={"SpanStyle"}>{displayScript}</p> */}
			</div>
			<AudioRecorder
				channelNumber={1}
				stream={true}
				onFileReady={handleFile}
			/>
			<button onClick={handleClick}>check</button>
		</div>
	);
}

export default App;
