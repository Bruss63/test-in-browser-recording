import React, { Component } from "react";
import AudioAnalyser from './Modules/AudioAnalyser.js';
import microphone from "./Assets/microphone-logo.svg";
import reset from "./Assets/reset.svg";
import play from "./Assets/play.svg";
import pause from "./Assets/pause.svg";
import "./App.css";

function TimerDisplay(props) {
	let ms = props.ms.toString();
	let sec = props.sec.toString();
	let min = props.min.toString();

	while (ms.length !== 4) {
		ms = 0 + ms;
	}

	while (sec.length !== 2) {
		sec = 0 + sec;
	}

	while (min.length !== 2) {
		min = 0 + min;
	}

	if (props.isDisplayed) {
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
}

class App extends Component {
	constructor() {
		super();
		this.stream = null;
		this.constraints = { audio: true, video: false };
		this.mediaRecorder = null;
		this.recordedFile = null;
		this.recordedChunks = [];
		this.state = {
			isPaused: true,
			isRecordingPane: false,
			timerDisplaying: false,
			timerActive: false,
			min: 0,
			sec: 0,
			ms: 0,
			start: 0
		};
	}

	SubmitButton = () => {
		let { sec,min } = this.state
	if (sec >= 15 || min >= 1) {
		return (
			<button className='submit-button' onClick={this.handleSubmit}>
				{"Submit"}
			</button>
		);
	}
	else {
		return null
	}
}

	MainButtonCluster = () => {
		let { isPaused, isRecordingPane } = this.state;

		if (!isRecordingPane) {
			return (
				<button
					className='record-button'
					onClick={this.handleBeginRecord}>
					<img
						className='microphone'
						src={microphone}
						alt='err'></img>
				</button>
			);
		} else if (isRecordingPane) {
			return (
				<div>
					<button
						className='pause-play-button'
						onClick={this.handlePausePlay}>
						<img
							className={isPaused ? "play" : "pause"}
							src={isPaused ? play : pause}
						/>
					</button>

					<button className='reset-button' onClick={this.handleReset}>
						<img className='reset' src={reset} alt='err' />
					</button>
				</div>
			);
		}
	};

	handleBeginRecord = async () => {
		await this.startRecorder();
		this.setState({ isRecordingPane: true, isPaused:false });
		this.startTimer();
	};

	startRecorder = async () => {
		this.stream = await this.getMic();
		if (this.stream) {
			console.log("Aquired Stream ");
		}
		this.mediaRecorder = new window.MediaRecorder(this.stream);
		this.mediaRecorder.start();
		this.mediaRecorder.ondataavailable = function(e) {
			this.recordedChunks.push(e.data);
		};
	};

	handlePausePlay = () => {
		let { isPaused } = this.state;
		if (isPaused) {
			this.setState({ isPaused: false });
		} else if (!isPaused) {
			this.setState({ isPaused: true });
		}
		console.log(this.state.isPaused)
		this.toggleTimer();

	};

	getMic = async () => {
		console.log("attempting mic aquisition");
		let stream = await navigator.mediaDevices.getUserMedia(
			this.constraints
		);
		return stream
	};

	stopMic = () =>  {
		if (this.stream) {
			this.stream.getTracks().forEach(track => track.stop());
			this.setState({ stream: null });
		}
	}

	recorderStop = () => {
		this.mediaRecorder.stop();
		this.recordedFile = new Blob(this.recordedChunks);
		let url = window.URL.createObjectURL(
			this.recordedFile
		);
		let a = document.createElement('a');
		a.href = url
		a.download = 'test.wav';
		a.click();
	};

	recorderReset = () => {
		this.mediaRecorder.stop();
		this.setState({ recordedChunks: [] });
	};

	startTimer = () => {
		this.setState({
			timerActive: true,
			timerDisplaying: true,
			time: this.state.time,
			start: Date.now() - this.state.ms
		});
		this.timer = setInterval(this.updateTimer, 1);
	};

	updateTimer = () => {
		let ms = Date.now() - this.state.start;
		let sec = this.state.sec;
		let min = this.state.min;
		if (ms >= 1000) {
			this.setState({ start: Date.now() });
			sec += 1;
		}
		if (sec >= 60) {
			sec = 0;
			min += 1;
		}
		this.setState({
			ms: Date.now() - this.state.start,
			sec: sec,
			min: min
		});
	};

	stopTimer = () => {
		this.setState({ timerActive: false });
		clearInterval(this.timer);
	};

	resetTimer = () => {
		this.setState({
			timerActive: false,
			min: 0,
			sec: 0,
			ms: 0,
			timerDisplaying: false
		});
		clearInterval(this.timer);
	};

	toggleTimer = () => {
		if (this.state.timerActive) {
			this.stopTimer();
		} else if (!this.state.timerActive) {
			this.startTimer();
		}
	};

	handleSubmit = () => {
		console.log("submit attempted")
		this.recorderStop();
		this.stopMic();
	};

	handleReset = () => {
		this.resetTimer();
		this.recorderReset();
	};

	render() {
		return (
			<div className='App'>
				<h1>{"Record VoicePrint"}</h1>

				<this.MainButtonCluster
					isRecordingPane={this.state.isRecordingPane}
				/>

				<TimerDisplay
					isDisplayed={this.state.timerDisplaying}
					ms={this.state.ms}
					sec={this.state.sec}
					min={this.state.min}
				/>

				<this.SubmitButton
					sec={this.state.sec}
					min={this.state.min}
				/>

				{(!this.state.isPaused) ? <AudioAnalyser audio={this.stream} /> : ""}
			</div>
		);
	}
}

export default App;
