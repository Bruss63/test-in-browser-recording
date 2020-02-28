import React, { useState, useEffect, useRef } from "react";
import "./AudioRecorder.css";
import Pause from "./Icons/PauseIcon";
import Play from "./Icons/PlayIcon";
import Stop from "./Icons/StopIcon";
import Playback from "./Icons/PlaybackIcon";
import Mic from "./Icons/MicIcon";
import Reset from "./Icons/UndoIcon";
import Loading from "./Icons/LoadingIcon";
import AudioAnalyser from "./Modules/AudioAnalyser";

function AudioRecorder({
	onFileReady /*File Callback to Parent*/,
	type = "compact" /*Changes Type of Recorder*/,
	shape = "circular" /*Changes Shape of Edges, No Current Use*/,
	backgroundColor = "rgb(65, 64, 77)" /*Colour of Background*/,
	btnColor = "rgb(114, 121, 133)" /*Colour of Interface Buttons*/,
	display = "inline-block" /*Change Display of Container*/, 
	playback = false /*Enables and Disables Playback Function !!!Not Finished!!!*/,
	chunkSize = 60000 /*Size of recorded Blobs*/,
	fileType = "webm" /*Specify File Type*/
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
	const [style, setStyle] = useState({});
	const [windowWidth, setWindowWidth] = useState(
		window.innerWidth * 0.2
	);
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

	const configureUI = () => {
		let borderRadius = "0px";
		let width = "70px";
		let height = "70px";
		let position = "relative"
		let bottom = null;
		let left = null;
		if (shape === "circular") {
			borderRadius = "35px";
		} else if (shape === "rounded") {
			borderRadius = "15px";
		}

		if (type === "docked") {
			width = "100%"
			height = "70px"
			position = "absolute"
			bottom = "0"
			left = "0"
			borderRadius = "0px"


		} else if (type === "large") {
			width = "210px";
			height = "140px";
		} else if (type === "small") {
			if (playback) {
				width = "210px";
			} else {
				width = "140px";
			}
		}

		setStyle({
			backgroundColor,
			borderRadius,
			width,
			height,
			display,
			position,
			bottom,
			left
		});
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
		setFile(undefined);
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

	const updateWidth = () => {
		setWindowWidth(window.innerWidth * 0.2)
	}

	React.useEffect(() => {
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	});

	useEffect(() => {
		//Run on open
		getStream();
		configureUI();
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

	const handleCompactButton = () => {
		if (mediaRecorderState === "inactive" && file === undefined) {
			beginRecording();
		} else if (mediaRecorderState === "recording") {
			stopRecording();
		} else {
			resetRecording();
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

	const CompactButton = ({ fill }) => {
		if (mediaRecorderState === "inactive" && file === undefined) {
			return <Play fill={fill} />;
		} else if (mediaRecorderState === "recording") {
			return <Stop fill={fill} />;
		} else {
			return <Reset fill={fill} />;
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
	if (type === "docked") {
		if (mediaRecorder === undefined) {
			return (
				<div style={style} className={"container"}>
					<h1 className={"icon"}>
						<Loading fill={btnColor} />
					</h1>
				</div>
			);
		} else {
			if (mode === "recording") {
				return (
					<div style={style} className={"container"}>
						{playback ? (
							<button
								className={"icon"}
								onClick={handleChangeMode}
							>
								<Mode fill={btnColor} />
							</button>
						) : null}
						<button className={"icon"} onClick={handlePausePlay}>
							<PausePlay fill={btnColor} />
						</button>
							{stream ? <AudioAnalyser width = {windowWidth} audio={stream} /> : null}
						<button className={"icon"} onClick={handleStopStart}>
							<StopReset fill={btnColor} />
						</button>
					</div>
				);
			} else {
				return (
					<div style={style} className={"container"}>
						{playback ? (
							<button
								className={"icon"}
								onClick={handleChangeMode}
							>
								<Mode fill={btnColor} />
							</button>
						) : null}
						<button className={"icon"} onClick={handlePausePlay}>
							<PausePlay fill={btnColor} />
						</button>
						<button className={"icon"} onClick={handleStopStart}>
							<StopReset fill={btnColor} />
						</button>
					</div>
				);
			}
		}
	} else if (type === "large") {
		if (mediaRecorder === undefined) {
			return (
				<div style={style} className={"container"}>
					<h1 className={"icon"}>
						<Loading fill={btnColor} />
					</h1>
				</div>
			);
		} else {
			if (mode === "recording") {
				return (
					<div style={style} className={"container"}>
						<h1 style={{ color:btnColor }} className={"error"}>{"WIP"}</h1>
					</div>
				);
			} else {
				return (
					<div style={style} className={"container"}>
						<h1 style={{ color:btnColor }} className={"error"}>{"WIP"}</h1>
					</div>
				);
			}
		}
	} else if (type === "small") {
		if (mediaRecorder === undefined) {
			return (
				<div style={style} className={"container"}>
					<h1 className={"icon"}>
						<Loading fill={btnColor} />
					</h1>
				</div>
			);
		} else {
			if (mode === "recording") {
				return (
					<div style={style} className={"container"}>
						{playback ? (
							<button
								className={"icon"}
								onClick={handleChangeMode}
							>
								<Mode fill={btnColor} />
							</button>
						) : null}
						<button className={"icon"} onClick={handlePausePlay}>
							<PausePlay fill={btnColor} />
						</button>
						<button className={"icon"} onClick={handleStopStart}>
							<StopReset fill={btnColor} />
						</button>
					</div>
				);
			} else {
				return (
					<div style={style} className={"container"}>
						{playback ? (
							<button
								className={"icon"}
								onClick={handleChangeMode}
							>
								<Mode fill={btnColor} />
							</button>
						) : null}
						<h1
							style={{ color: btnColor }}
							className={"audio-error"}
						>
							{"No Audio"}
							<br />
							{"Recored"}
						</h1>
					</div>
				);
			}
		}
	} else if (type === "compact") {
		if (mediaRecorder === undefined) {
			return (
				<div style={style} className={"container"}>
					<h1 className={"icon"}>
						<Loading fill={btnColor} />
					</h1>
				</div>
			);
		} else {
			return (
				<div style={style} className={"container"}>
					<button className={"icon"} onClick={handleCompactButton}>
						<CompactButton fill={btnColor} />
					</button>
				</div>
			);
		}
	} else {
		return null;
	}
}

export default AudioRecorder;
