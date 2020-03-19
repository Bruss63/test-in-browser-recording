import React, { useState, useEffect, useRef } from "react";
import "./AudioRecorder.css";
//Icons
import Pause from "./Icons/PauseIcon";
import Play from "./Icons/PlayIcon";
import Stop from "./Icons/StopIcon";
import Playback from "./Icons/PlaybackIcon";
import Mic from "./Icons/MicIcon";
import Reset from "./Icons/UndoIcon";
import Loading from "./Icons/LoadingIcon";
//Modules
import AudioAnalyser from "./Modules/AudioAnalyser";
import recorderWorker from "./recorderWorker.js"
//ogg_opus or flac

function AudioRecorder({
	onFileReady /*File Callback to Parent*/,
	type = "compact" /*Changes Type of Recorder*/,
	shape = "circular" /*Changes Shape of Edges*/,
	backgroundColor = "rgb(65, 64, 77)" /*Colour of Background*/,
	btnColor = "rgb(114, 121, 133)" /*Colour of Interface Buttons*/,
	display = "inline-block" /*Change Display of Container*/, 
	playback = false /*Enables and Disables Playback Function !!!Not Finished!!!*/,
	chunkSize = 10000 /*Size of recorded Blobs*/,
	fileType = "webm" /*Specify File Type*/
}) {
	//Settings
	const constraints = { audio: true, video: false };
	//States
	const [recordedChunks, setRecordedChunks] = useState([]);
	const [mediaRecorder, setMediaRecorder] = useState(undefined);
	const [audioCtx, setAudioCtx] = useState(undefined);
	const [worker, setWorker] = useState(undefined);
	const [mediaRecorderState, setMediaRecorderState] = useState("inactive");
	const [audioPlayerState, setAudioPlayerState] = useState("paused");
	const [source, setSource] = useState(undefined);
	const [setupDone, setSetupDone] = useState(false);
	const [file, setFile] = useState(undefined);
	const [mode, setMode] = useState("recording");
	const [style, setStyle] = useState({});
	const [windowWidth, setWindowWidth] = useState(
		window.innerWidth * 0.2
	);
	//Refs
	const audioPlayerRef = useRef(null);
	//Setup
	const beginSetup = () => {
		setAudioCtx(
			new AudioContext({
				sampleRate: 16000
			})
		);
		const worker = new Worker('./recorderWorker.js');
		worker.onmessage = message => {
			console.log({ workerResponse: "Worker Message", message });
		}
		worker.onerror = error => {
			console.log({ workerResponse: "Worker Error", error });
		}
		setWorker(worker)
	}

	const getStream = () => {
		//Ask for mic in browser
		if (audioCtx !== undefined) {
			console.log(worker)
			worker.postMessage({
				command: 'config',
				config: {
					sampleRate: audioCtx.sampleRate
				}
			});
			console.log(audioCtx)
			console.log({ message: "Attempting to Get Stream" });
			navigator.mediaDevices.getUserMedia(constraints).then(stream => {
				let source = audioCtx.createMediaStreamSource(stream);
				setSource(source);
			});
		}		
	};

	const createProcessor = () => {
		if (source !== undefined) {
			console.log(source);
			source.context.resume();
			let node = source.context.createScriptProcessor(1024);
			node.connect(source.context.destination);
			node.onaudioprocess = event => {
				// console.log(event);
			};
			setSetupDone(true);
			console.log(node);
		}
		
	}
	
	//Recorder Data Handling Functions
	const storeNewRecordedChunk = data => {
		if (data && data.size > 0) {
			console.log({ message: "Data Valid Attempting Storage" });
			data.arrayBuffer().then(buffer => {				
				if (fileType === "wav") {
					let maxLen = Math.floor(buffer.byteLength / 4) * 4;
					const sliceBuffer = buffer.slice(0, maxLen);
					const buffer32 = new Float32Array(sliceBuffer);
					let downsampledBuffer = downsampleBuffer(buffer32, 16000);
					console.log(downsampledBuffer);
					let encodedWav = encodeWav(downsampledBuffer)
					const wavBlob = new Blob([encodedWav], {type: `audio/${fileType}`});
					console.log(wavBlob)
					let prevChunks = recordedChunks
					prevChunks.push(wavBlob);
					setRecordedChunks(prevChunks);			
				}
							
			})		
			if (fileType !== "wav") {
				let prevChunks = recordedChunks;
				prevChunks.push(data);
				setRecordedChunks(prevChunks);	
			}	
			
			console.log({recordedChunks});
		} else {
			console.log({ message: "Error with Data!!!" });
		}
	};

	const downsampleBuffer = (buffer, desiredSampleRate) => {
		if (desiredSampleRate === audioCtx.current.sampleRate) {
			return buffer
		}
		let sampleRatio = audioCtx.current.sampleRate / desiredSampleRate;
		let len = Math.round(buffer.length / sampleRatio)
		let downsampledBuffer = new Float32Array(len)
		let offsetResult = 0;
		let offsetBuffer = 0;
		while (offsetResult < downsampledBuffer.length) {
			let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRatio);
			let accum = 0,
				count = 0;
			for (
				let i = offsetBuffer;
				i < nextOffsetBuffer && i < buffer.length;
				i++
			) {
				accum += buffer[i];
				count++;
			}
			downsampledBuffer[offsetResult] = accum / count;
			offsetResult++;
			offsetBuffer = nextOffsetBuffer;
		}
		return downsampledBuffer;
	}

	const floatTo16BitPCM = (output, offset, input) => {
		for (var i = 0; i < input.length; i++, offset += 2) {
			var s = Math.max(-1, Math.min(1, input[i]));
			output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
	}

	const writeString = (view, offset, string) => {
		for (var i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	
	const encodeWav = (samples) => {
		let buffer = new ArrayBuffer(44 + samples.length * 2)
		let view = new DataView(buffer)

		writeString(view, 0, 'RIFF');
		view.setUint32(4, 32 + samples.length)
		view.setUint32(4, 32 + samples.length * 2, true);
		writeString(view, 8, "WAVE");
		writeString(view, 12, "fmt ");
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, audioCtx.current.sampleRate, true);
		view.setUint32(28, audioCtx.current.sampleRate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		writeString(view, 36, "data");
		view.setUint32(40, samples.length * 2, true);
		floatTo16BitPCM(view, 44, samples);

		return view
	}

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
		setRecordedChunks([]);
		setMediaRecorderState("inactive");
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

	useEffect(() => {
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	});

	useEffect(() => {
		//Run on open
		beginSetup();
		configureUI();
		//Run on close
		return () => {
			audioCtx.close();
		}
	}, []);

	useEffect(() => {
		getStream();
	}, [audioCtx])
	
	useEffect(() => {
		//Run when source is ready
		createProcessor();
	}, [source])

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
		if (setupDone === false) {
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
							{source ? <AudioAnalyser width = {windowWidth} audio={source} /> : null}
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
		if (setupDone === false) {
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
		if (setupDone === false) {
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
		if (setupDone === false) {
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
