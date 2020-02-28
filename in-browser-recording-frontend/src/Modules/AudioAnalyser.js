import React, { Component } from 'react';
import AudioVisualiser from './AudioVisualiser.js';

class AudioAnalyser extends Component {

	constructor(props) {
		super(props);
		this.state = {
			audioData: new Uint8Array(0)
		}
	}

	componentDidMount() {
		this.audioContext = new window.AudioContext();
		this.analyser  = this.audioContext.createAnalyser();
		this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
		this.source = this.audioContext.createMediaStreamSource(this.props.audio)
		this.source.connect(this.analyser);
		this.rafId = requestAnimationFrame(this.tick)
	}

	tick = () => {
		this.analyser.getByteTimeDomainData(this.dataArray);
		this.setState({ audioData: this.dataArray });
		this.rafId = requestAnimationFrame(this.tick);
	}
	
	componentWillUnmount() {
		cancelAnimationFrame(this.rafId);
		this.analyser.disconnect();
		this.source.disconnect();
	}

	render() {
		return <AudioVisualiser width={this.props.width} audioData = {this.state.audioData} />
	}

}

export default AudioAnalyser;