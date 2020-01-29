import React, { Component } from "react";

class AudioRecorder extends Component {
	constructor(props) {
		super(props);
		this.state.recordedChunks = [];

	}

	componentDidMount() {
		const options = {mimeType: 'audio/webm'}
		this.mediaRecorder = new MediaRecorder(this.props.audio, options)
		this.mediaRecorder.addEventListener('dataavailible', function(e) {
			if (e.data.size > 0) {
				console.log("Recorded Something!")
				this.state.recordedChunks.push(e.data);
			}
		})	
	}


	recorderStop = () => {
		this.mediaRecorder.stop();
		this.downloadLink.href = URL.createObjectURL(new Blob(this.state.recordedChunks))
		this.downloadLink.download = 'test.wav'
	}

	recorderReset = () => {
		this.mediaRecorder.stop();
		this.setState({recordedChunks: []});
	}

	recorderToggle = () => {
		if (this.mediaRecorder.state == "paused") {
			this.mediaRecorder.pause();
		} else if (this.mediaRecorder.state == "recording") {
			this.mediaRecorder.resume();
		} else if (this.mediaRecorder.state == "inactive") {
			this.mediaRecorder.start();
		}
		
	}

}

export default AudioRecorder;
