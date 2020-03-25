import React, { useEffect, useRef, useState } from "react";
import AudioRecorder from "./AudioRecorderSrc/AudioRecorder.js";
import "./App.css";
import { clientDownload, S3UploadSinglePart } from "./Modules/Networking";
import {searchStrings} from './Modules/SearchStrings'

function App() {
	//File Handling Settings
	const download = false; //Set true to download directly to local machine --Testing Only--
	const s3Upload = false; //Set true to upload to s3 bucket specified below
	const websocket = true;
	//URL's for file handling
	const SIGNED_URL_ENDPOINT =
		"https://vf4q9rvdzb.execute-api.ap-southeast-2.amazonaws.com/dev/apps/signedURL";
	const WEBSOCKET_URL =
		"ws://ec2-54-245-174-184.us-west-2.compute.amazonaws.com:9000/ws";
	//Constants
	const script = 'My Voice Print recognizes me.'
	//vars
	const socket = useRef(undefined);
	const transcriptRef = useRef(undefined);
	const [bestTranscript,setBestTranscript] = useState({
		transcript:'',
		time: 0,
		stability:0
	});
	const [segments, setSegments] = useState({ start: script, middle: '', end: '' });
	useEffect(() => {
		socket.current = new WebSocket(WEBSOCKET_URL);
		socket.current.onmessage = e => {
			let data = JSON.parse(e.data);
			let transcript, timeObj, stability;
			if (data.is_final === true) {
				transcript = data.alternatives[0].transcript;
				timeObj = data.result_end_time;
				stability = 1;
			} else {
				transcript = data.alternatives[0].transcript;
				timeObj = data.result_end_time;
				stability = data.stability;
			}

			if (transcript) {
				let nanos = timeObj.nanos / 1000000000;
				let seconds = timeObj.seconds || 0;
				let time = seconds + nanos;

				if (transcriptRef.current.time < time) {
					if (transcriptRef.current.stability <= stability) {
						if (
							transcriptRef.current.transcript.length <
							transcript.length
						) {
							setBestTranscript({
								transcript,
								time,
								stability
							});
						}
					}
				}
			}
		};
		socket.current.onopen = e => {
			console.log({ message: "Connection Established", e });
		};
		socket.current.onerror = e => {
			console.log({ message: "Error", e });
		};
		console.log(socket.current);
		return () => {
			socket.current.close();
		};
	},[]);

	useEffect(() => {
		let match = searchStrings(script,bestTranscript.transcript)
		console.log(match)
		setSegments(match.segments)
		transcriptRef.current = bestTranscript
	}, [bestTranscript]);

	const handleFile = file => {
		if (download === true) {
			clientDownload(file);
		}
		if (s3Upload === true) {
			S3UploadSinglePart(file, SIGNED_URL_ENDPOINT);
		}
		if (websocket === true) {	
			if (socket.current.readyState) {
				socket.current.send(file);
			}
			else {
				console.log('Error With Connection')
			}
		}
	};

	return (
		<div className='App'>
			<h1>{"App"}</h1>
			<div className={"ScriptContainer"}>
				<p className={"UnmachedText"}>{segments.start || null}</p>
				{segments.start ? "\u00A0" : null}
				<p className={"MatchText"}>{segments.middle || null}</p>
				{segments.middle ? "\u00A0" : null}
				<p className={"UnmatchedText"}>{segments.end || null}</p>
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
