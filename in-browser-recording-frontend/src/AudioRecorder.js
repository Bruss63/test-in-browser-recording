import React, { useState, useEffect, useRef } from "react";
import "./AudioRecorder.css";
import Pause from "./Icons/PauseIcon";
import Play from "./Icons/PlayIcon";
import Stop from "./Icons/StopIcon";
import Playback from "./Icons/PlaybackIcon";
import Mic from "./Icons/MicIcon";
import Reset from "./Icons/UndoIcon";

function AudioRecorder({
	type = "small" /*Changes Style, No Current Use*/,
	btnColour = "rgb(114, 121, 133)" /*Colour of Interface Buttons*/,
	playback = false /*Enables and Disables Playback Function*/,
	chunkSize = 60000 /*Size of recorded Blobs*/,
	fileType = "webm" /*Specify File Type*/,
	onFileReady /*File Callback to Parent*/
}) {
	//Settings
	const constraints = { audio: true, video: false };
	//States
	const [recordedChunks, setRecordedChunks] = useState([]);
	const [mediaRecorder, setMediaRecorder] = useState(undefined);
	const [mediaRecorderState, setMediaRecorderState] = useState("inactive");
	const [audioPlayerState, setAudioPlayerState] = useState("paused");
	const [stream, setStream] = useState(undefined);
	const [file, setFile] = useState(undefined);
	const [mode, setMode] = useState("recording");
	//Refs
	const audioPlayerRef = useRef(null);
	//Setup
	const getStream = async () => {
		//Ask for mic in browser
		console.log({ message: "Attempting to Get Stream" });
		setStream(await navigator.mediaDevices.getUserMedia(constraints));
	};

	const createRecorder = () => {
		//Create Recorder
		console.log({ message: "Attempting Creation of Recorder" });
		//Check if stream is avalible yet
		if (stream !== undefined) {
			setMediaRecorder(
				new window.MediaRecorder(stream, {
					mimeType: `audio/${fileType}`
				})
			);
			console.log({ message: "Found Stream!!!" });
		} else {
			console.log({ message: "Could Not Evaluate Stream" });
		}
	};
	//Setup Recorder
	const setupRecorder = () => {
		console.log({ message: "Attempting Recorder Setup" });
		if (mediaRecorder !== undefined) {
			//Add listeners to recorder events
			console.log({ message: "Found Recorder!!!" });
			mediaRecorder.ondataavailable = event => {
				storeNewRecordedChunk(event.data);
			};
			mediaRecorder.onstop = () => {
				saveData();
			};
		} else {
			console.log({ message: "Could Not Find Recorder" });
		}
	};
	//Recorder Data Handling Functions
	const storeNewRecordedChunk = data => {
		if (data && data.size > 0) {
			console.log({ message: "Data Valid Attempting Storage" });
			let array = recordedChunks;
			array.push(data);
			setRecordedChunks(array);
			console.log(recordedChunks);
		} else {
			console.log({ message: "Error with Data!!!" });
		}
	};

	const saveData = () => {
		console.log({ message: "Data Save Attempted" });
		if (
			mediaRecorderState === "inactive" &&
			mediaRecorder !== undefined &&
			recordedChunks.length > 0
		) {
			console.log({ message: "Data Valid" });
			setFile(
				new File(recordedChunks, `RecordededFile.${fileType}`, {
					type: `audio/${fileType}`
				})
			);
		} else {
			console.log({ message: "Error Storing Data" });
		}
	};

	//Recording Functions
	const beginRecording = () => {
		console.log({ message: "Beginning Recording" });
		mediaRecorder.start(chunkSize);
		setMediaRecorderState("recording");
	};

	const stopRecording = () => {
		console.log({ message: "Stopping Recording" });
		mediaRecorder.stop();
		setMediaRecorderState("inactive");
	};

	const pauseRecording = () => {
		console.log({ message: "Pausing Recording" });
		mediaRecorder.pause();
		setMediaRecorderState("paused");
	};

	const startRecording = () => {
		console.log({ message: "Starting Recording" });
		mediaRecorder.resume();
		setMediaRecorderState("recording");
	};

	const resetRecording = () => {
		console.log({ message: "Reseting Recording" });
		setMediaRecorderState("inactive");
		setRecordedChunks([]);
	};
	//Playback Functions
	const startPlayback = () => {
		audioPlayerRef.current.play();
		setAudioPlayerState("playing");
	};

	const stopPlayback = () => {
		audioPlayerRef.current.pause();
		setAudioPlayerState("paused");
	};
	//Effects for timing
	useEffect(() => {
		//Run on open
		getStream();
	}, []);

	useEffect(() => {
		//Run on stream update
		createRecorder();
	}, [stream]);

	useEffect(() => {
		//Run on creation of media recorder
		setupRecorder();
	}, [mediaRecorder]);

	useEffect(() => {
		//Run when file is ready
		if (file !== undefined) {
			console.log({ message: "Transfer to Parent Attempted" });
			onFileReady(file);
		}
	}, [file, onFileReady]);

	//Button handlers
	const handleChangeMode = () => {
		if (mediaRecorderState === "recording") {
			alert("please finish recording before changing modes");
		} else {
			if (mode === "playback") {
				setMode("recording");
			} else {
				setMode("playback");
			}
		}
	};

	const handlePausePlay = () => {
		if (mode === "recording") {
			if (mediaRecorderState === "inactive") {
				beginRecording();
			} else if (mediaRecorderState === "recording") {
				pauseRecording();
			} else if (mediaRecorderState === "paused") {
				startRecording();
			}
		} else {
			if (audioPlayerState === "paused") {
				startPlayback();
			} else {
				stopPlayback();
			}
		}
	};

	const handleStopStart = () => {
		if (mediaRecorderState !== "inactive") {
			stopRecording();
		} else {
			resetRecording();
		}
	};

	//Combining icons with state conditions
	const Mode = ({ fill }) => {
		if (mode === "recording") {
			return <Playback fill={fill} />;
		} else if (mode === "playback") {
			return <Mic fill={fill} />;
		}
		if (file !== undefined) {
			audioPlayerRef.current.src = file;
		}
	};

	const PausePlay = ({ fill }) => {
		if (mode === "recording") {
			if (mediaRecorderState === "recording") {
				return <Pause fill={fill} />;
			} else {
				return <Play fill={fill} />;
			}
		} else {
			if (audioPlayerState === "playing") {
				return <Pause fill={fill} />;
			} else {
				return <Play fill={fill} />;
			}
		}
	};

	const StopReset = ({ fill }) => {
		if (mediaRecorderState === "inactive") {
			return <Reset fill={fill} />;
		} else {
			return <Stop fill={fill} />;
		}
	};

	//Rendering
	if (mode === "recording") {
		if (mediaRecorder !== undefined) {
			if (type === "small") {
				return (
					<div className={"container"}>
						{playback ? (
							<button
								className={"change-mode"}
								onClick={handleChangeMode}
							>
								<Mode fill={btnColour} />
							</button>
						) : null}
						<button className={"play"} onClick={handlePausePlay}>
							<PausePlay fill={btnColour} />
						</button>
						<button className={"stop"} onClick={handleStopStart}>
							<StopReset fill={btnColour} />
						</button>
					</div>
				);
			} else {
				return (
					<div className={"container"}>
						<h1 className={"error"}>{"Error when rendering"}</h1>
					</div>
				);
			}
		} else {
			return (
				<div className={"container"}>
					<h1 className={"error"}>{"Loading..."}</h1>
				</div>
			);
		}
	} else {
		if (file === undefined) {
			return (
				<div className={"container"}>
					<button
						className={"change-mode"}
						onClick={handleChangeMode}
					>
						<Mode fill={btnColour}></Mode>
					</button>
					<h1 className={"error"}>
						{`No Audio`} <br /> {`Recorded`}
					</h1>
				</div>
			);
		} else {
			return (
				<div className={"container"}>
					<button
						className={"change-mode"}
						onClick={handleChangeMode}
					>
						<Mode fill={btnColour}></Mode>
					</button>
					<button className={"play"} onClick={handlePausePlay}>
						<PausePlay fill={btnColour} />
					</button>
					<audio ref={audioPlayerRef} src={file}></audio>
				</div>
			);
		}
	}
}

export default AudioRecorder;
