import React, { Component } from "react";
import AudioAnalyser from './Modules/AudioAnalyser.js';
import microphone from "./Assets/microphone-logo.svg";
import reset from "./Assets/reset.svg";
import "./App.css";

function TimerDisplay(props) {
	let ms = props.ms.toString();
	let sec = props.sec.toString();
	let min = props.min.toString();

	let msLen = ms.length;
	let secLen = sec.length;
	let minLen = min.length;

	while (msLen !== 4) {
		ms = 0 + ms;
		msLen = ms.length;
	}

	while (secLen !== 2) {
		sec = 0 + sec;
		secLen = sec.length;
	}

	while (minLen !== 2) {
		min = 0 + min;
		minLen = min.length;
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

function SubmitButton(props) {
	let sec = props.sec
	let min = props.min
	if (sec >= 15 || min >= 1) {
		return (
			<button className = "submit-button">
				{"Submit"}
			</button>
		)
	}
	else {
		return null
	}
}

class App extends Component {
	constructor() {
		super();
		this.stream = null;
		this.constraints = {audio: true, video: false};
		this.mediaRecorder = null;
		this.chunks = [];
		this.state = {
			timerDisplaying: false,
			timerActive: false,
			min: 0,
			sec: 0,
			ms: 0,
			start: 0,
		};
	}

	recorderStop = () => {
		this.mediaRecorder.stop();
		this.downloadLink.href = URL.createObjectURL(
			new Blob(this.state.recordedChunks)
		);
		this.downloadLink.download = "test.wav";
	};

	recorderReset = () => {
		this.mediaRecorder.stop();
		this.setState({ recordedChunks: [] });
	};

	startRecorder = () => {
		this.stream = navigator.mediaDevices.getUserMedia(this.constraints);
		if (this.stream) {
			console.log("Aquired Stream ");
		}	
		this.mediaRecorder = new window.MediaRecorder(this.stream)
	};

	stopMic() {
		if (this.state.audio) {
			this.state.audio.getTracks().forEach(track => track.stop());
			this.setState({ audio: null });
		}
	}

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
		this.setState({ ms: Date.now() - this.state.start, sec: sec, min: min });
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

	toggleMic() {
		if (this.state.audio) {
			this.stopMic();
		} else {
			this.getMic();
		}
	}

	handleRecord = () => {
		this.startRecorder();
	};

	handleSubmit = () => {
		this.recorderStop();
		this.stopMic();
	};

	handleReset = () => {
		this.resetTimer();
		this.stopMic();
		this.recorderReset();
	};

	render() {
		return (
			<div className="App">
				<h1>{"Record VoicePrint"}</h1>
				<button className="record-button" onClick={this.handleRecord}>
					<img className="microphone" src={microphone} alt="err"></img>
				</button>
				<button className="reset-button" onClick={this.handleReset}>
					<img className="reset" src={reset} alt="err"></img>
				</button>

				<TimerDisplay
					isDisplayed={this.state.timerDisplaying}
					ms={this.state.ms}
					sec={this.state.sec}
					min={this.state.min}
				/>

				<SubmitButton
					sec={this.state.sec}
					min={this.state.min}
					onClick={this.handleSubmit}
				/>

				{this.stream ? <AudioAnalyser audio={this.stream} /> : ""}
			</div>
		);
	}
}

export default App;
