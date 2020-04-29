import React, { useEffect, useRef, useState } from "react";
import AudioRecorder from "./AudioRecorderSrc/AudioRecorder.js";
import "./App.css";
import { clientDownload, S3UploadSinglePart } from "./Modules/Networking";
import { searchStrings, createSegments } from "./Modules/SearchStrings";
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
	const bestReadTo = useRef(0);
	const margin = useRef(3);
	//States
	const [segments, setSegments] = useState({
		confirmedSegment: "",
		unconfirmedSegment: "",
		unspokenSegment: script.current,
	});
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
		let data = JSON.parse(message.data);
		if (data.alternatives[0].transcript) {
			let readTo = searchStrings(
				script.current,
				data.alternatives[0].transcript,
				margin.current
			);
			if (
				bestReadTo.current < readTo &&
				readTo < bestReadTo.current + Math.ceil(margin.current / 2)
			) {
				bestReadTo.current = readTo;
				let segments = createSegments(script.current, readTo);
				console.log(segments);
				handleSegmentsUpdate(segments);
				margin.current = 3;
			} else {
				margin.current = margin.current + 1;
			}
		}
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

	return (
		<div className='App'>
			<div className={"ScriptContainer"}>
				<p className={"SpanStyle"}>
					<span className={"OtherWords"}>
						{segments.confirmedSegment}
					</span>
					<span className={"OtherWords"}>
						{segments.unconfirmedSegment ? "\u00A0" : null}
					</span>
					<span className={"ExpectedWords"}>
						{segments.unconfirmedSegment}
					</span>
					<span className={"OtherWords"}>
						{segments.unconfirmedSegment ? "\u00A0" : null}
					</span>
					<span className={"OtherWords"}>
						{segments.unspokenSegment}
					</span>
				</p>
			</div>
			<AudioRecorder
				channelNumber={1}
				stream={true}
				onFileReady={handleFile}
			/>
		</div>
	);
}

export default App;
