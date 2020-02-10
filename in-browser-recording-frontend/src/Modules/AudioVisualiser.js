import React, { Component } from 'react';

class AudioVisualiser extends Component {
	constructor() {
		super()
		this.canvas = React.createRef();
	}

	componentDidUpdate() {
		this.draw();
	}

	draw() {
		const { audioData } = this.props;
		const canvas = this.canvas.current;
		const height = canvas.height;
		const width = canvas.width;
		const ctx = canvas.getContext('2d');
		let x = 0
		const sliceWidth = (width * 1.0) / audioData.length;
		
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.clearRect(0,0,width,height);

		ctx.beginPath();
		ctx.moveTo(0,height/2);
		
		for (const item of audioData) {
			const y = (item/255) * height;
			ctx.lineTo(x,y);
			x += sliceWidth;
		}

		ctx.lineTo(x,height/2);
		ctx.stroke();
	}

	render() {
		return (
			<canvas width = "600" height = "300" ref = {this.canvas}/>
		)
	}
}

export default AudioVisualiser;