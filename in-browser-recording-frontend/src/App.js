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
		"ws://ec2-54-149-65-170.us-west-2.compute.amazonaws.com:9000/ws";
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
	const [segments, setSegments] = useState([{string:script, match:false}]);
	
	useEffect(() => {
		if (websocket) {
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
								transcriptRef.current = {
									transcript,
									time,
									stability
								};
								let segments = searchStrings(
									script,
									transcript,
									6
								);
								console.log({
									segments
								});
								setSegments(segments);
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
		}
	},[]);

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
			<h1>{"App"}</h1>
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
