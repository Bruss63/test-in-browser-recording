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
		process.env.REACT_APP_SIGNED_URL;
	const WEBSOCKET_URL =
		process.env.REACT_APP_WEBSOCKET_URL;
	//Constants
	const script =
		"The Master of Business Administration degree originated in the United States in the early 20th century when the country industrialized and companies sought scientific approaches to management. The core courses in an MBA program cover various areas of business such as accounting, applied statistics, business communication, business ethics, business law, finance, managerial economics, management, entrepreneurship, marketing and operations in a manner most relevant to management analysis and strategy. Most programs also include elective courses and concentrations for further study in a particular area, for example accounting, finance, and marketing. MBA programs in the United States typically require completing about sixty credits, nearly twice the number of credits typically required for degrees that cover some of the same material such as the Master of Economics, Master of Finance, Master of Accountancy, Master of Science in Marketing and Master of Science in Management, The MBA is a terminal degree and a professional degree. Accreditation bodies specifically for MBA programs ensure consistency and quality of education. Business schools in many countries offer programs tailored to full-time, part-time, executive and distance learning students, many with specialized concentrations.";
	//vars
	const socket = useRef(undefined);
	const transcriptRef = useRef({
		transcript:'',
		time: 0,
		stability:0
	});
	const confirmedSegment = useRef({
		string: '',
		index: 0
	})
	const [segments, setSegments] = useState([{string:script, match:false}]);
	
	useEffect(() => {
		if (websocket) {
			socket.current = new WebSocket(WEBSOCKET_URL);
			socket.current.onmessage = e => {
				handleMessage(e)
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
		}
	},[]);

	const handleMessage = message => {
		console.time("checkTime");
		let data = JSON.parse(message.data)
		let timeObj = data.result_end_time
		let nanos = timeObj.nanos / 1000000000;
		let seconds = timeObj.seconds || 0;
		let time = seconds + nanos;
		let {valid, transcriptObj} = checkTranscriptValidity(transcriptRef.current, data, time);	
		if (valid) {
			transcriptRef.current = transcriptObj;
			let currentSegments = searchStrings(script, data.alternatives[0].transcript, confirmedSegment.current.index, 2);
			for (let i = 0; i < currentSegments.length; i++) {
				if ((currentSegments[i].string.length > confirmedSegment.current.string.length) && (currentSegments[i].index > confirmedSegment.current.index) && currentSegments[i].match) {
					confirmedSegment.current = {
						string: currentSegments[i].string,
						index: currentSegments[i + 1].index,
					};
				}				
			}
			console.log(confirmedSegment.current)
			console.log({
				currentSegments,
			});
			setSegments(currentSegments);
		}
		console.timeEnd("checkTime");
	} 
	
	const checkTranscriptValidity = (currentBest, data, time) => {
		let valid = false;
		let transcriptObj = {
			transcript: '',
			time: 0,
			stability: 0
		}
		console.log(data)
		if (data) {
			let transcript,stability
			if (data.is_final === true) {
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
			if (currentBest.transcript.length < transcript.length) {
				valid = true;
			}
		}
		return {valid, transcriptObj}
	}

	const handleFile = file => {
		if (download) {
			clientDownload(file);
		}
		if (s3Upload) {
			S3UploadSinglePart(file, SIGNED_URL_ENDPOINT);
		}
		if (websocket) {	
			if (socket.current.readyState) {
				socket.current.send(file);
			}
			else {
				console.log('Error With Connection')
			}
		}
	};
	const displayScript = segments.map((item,index) =>{
		let isLast = false;
		if (index === segments.length-1) isLast = true;
		return (
			<span className={item.match ? "MatchText" : "UnmatchedText"}>
				{item.string}{isLast ? null : "\u00A0"}
			</span>
		); 
	})
	return (
		<div className='App'>
			<div className={"ScriptContainer"}>
				<p>{displayScript}</p>
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
