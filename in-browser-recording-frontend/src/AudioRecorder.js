import React, { useState, useEffect } from "react";
import "./AudioRecorder.css";

function AudioRecorder({ style = "small", onFileReady }) {
	//Constants
	const slice = 60000;
	//Settings
	const constraints = { audio: true, video: false };
	//States
	const [recordedChunks, setRecordedChunks] = useState([])
	const [mediaRecorder, setMediaRecorder] = useState(undefined);
	const [stream, setStream] = useState(undefined);
	const [file, setFile] = useState(undefined);
	//Callbacks

	//Setup
	const getStream = async() => {
		//Ask for mic in browser
		console.log({ message:"Attempting to Get Stream" })
		let tempStream = await navigator.mediaDevices.getUserMedia(constraints)
		.then(setStream(tempStream))
		if (stream !== undefined) {
			console.log({message: "Stream Aquired!"})
		}
	};

	const startRecorder = () => {
		console.log({ message: "Attempting Creation of Recorder", stream });
		setMediaRecorder(new window.MediaRecorder(stream));	
	}
	//use another use effect for timing???
	useEffect(() => {
		//Run on open
		async function effect() {
			await getStream();
			startRecorder();
		}
		effect()
	}, []);

	const handleChangeMode = event => {
		console.log("Clicked Change Mode");
		console.log(stream)
	};

	const handlePausePlay = event => {
		console.log("Clicked Pause/Play");
	}

	const handleStopStart = event => {
		console.log("Clicked Stop/Start");
	}

	if ((style = "small")) {
		return (
			<div className={"container"}>
				<button className={"change-mode"} onClick={handleChangeMode}>
					{"Change Mode"}
				</button>
				<button className={"play"} onClick={handlePausePlay}>{"Play"}</button>
				<button className={"stop"} onClick={handleStopStart}>{"Stop"}</button>
			</div>
		);
	} else {
		return <h1 className={"render-error"}>{"Error when rendering"}</h1>;
	}
}

export default AudioRecorder;
