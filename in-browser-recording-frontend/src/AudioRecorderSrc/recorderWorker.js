export default () => {
    //Data
    let sampleRate = undefined;
    let exportSampleRate = undefined;
    let numChannels = undefined;
    let recordedBuffers = [];
    let recordedLength = 0;

    let logging = true;
    

    onmessage = e => {
        let data = e.data
        switch(data.command) {
            case 'config':
                configure(data.config);
                break;
            case 'probe':
                probe(data);
                break;
            case 'record':
                record(data.buffers);
                break;
            case 'export':
                exportAudio(data.type);
                break;
            case 'getRawData':
                getBuffers();
                break;
            case 'clear':
                clear();
                break;
        }        
    };  

    const configure = config => {
        sampleRate = config.sampleRate;
        exportSampleRate = config.exportSampleRate;
        numChannels = config.numChannels;
        recordedBuffers[0] = [];
        if (numChannels === 2) {
            recordedBuffers[1] = [];
        }
        
        if (config.logging === true || config.logging === false) {
			logging = config.logging;
		}
		postMessage({
			message: `configured, Sample Rate: ${exportSampleRate}, Number of Channels: ${numChannels},  Logging: ${logging}`
		});
    };
    
    const probe = data => {
        postMessage({ message: `Sample Rate: ${sampleRate}` });
    }

    const record = inputBuffers => {
        let leftBuffer = inputBuffers.left;
        let rightBuffer = inputBuffers.right;
        
        recordedBuffers[0].push(leftBuffer);
        if (numChannels === 2) {
            recordedBuffers[1].push(rightBuffer);
        }
        recordedLength += leftBuffer.length;
        if (logging === true) {
            console.log({ recordedBuffers, recordedLength });
		}
        
        postMessage({ message: 'recording' });
    }

    const exportAudio = type => {
        let mergedBuffers = [];
        for (let channel = 0; channel < numChannels; channel++) {
            mergedBuffers.push(
                mergeBuffers(recordedBuffers[channel], recordedLength)
            );
        }
        let downsampledBuffers = [];
        for (let channel = 0; channel < numChannels; channel++) {
			downsampledBuffers.push(
				downsampleBuffer(mergedBuffers[channel], exportSampleRate)
			);
		}
        let interleavedBuffer;
        if (numChannels === 2) {
            interleavedBuffer = interleave(
                mergedBuffers[0], mergedBuffers[1]
                );
        } else {
            interleavedBuffer = mergedBuffers[0];
        }

        let view = encodeWav(interleavedBuffer)

        let blob = new Blob([view], {type:type})
        
        postMessage({
			message: "Wav file exported",
			payload: {
				data: blob,
				type: "wavExport"
			}
		});
    }

    const downsampleBuffer = (buffer, desiredSampleRate) => {
		if (desiredSampleRate === sampleRate) {
			return buffer;
		}
		let sampleRatio = sampleRate / desiredSampleRate;
		let len = Math.round(buffer.length / sampleRatio);
		let downsampledBuffer = new Float32Array(len);
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
    };
    
    const mergeBuffers = (recordedBuffers, recordedLength) => {
        let mergedBuffers = new Float32Array(recordedLength);
        let offset = 0;
        for (let i = 0; i < recordedBuffers.length; i++) {
            mergedBuffers.set(recordedBuffers[i], offset);
            offset += recordedBuffers[i].length;
        }
        return mergedBuffers;
    }

    const interleave = (left, right) => {
        let length = left.length + right.length;
        let interleavedBuffer = new Float32Array(length);
        let index = 0;
        let inputIndex = 0;
        while (index < length) {
            interleavedBuffer[index++] = left[inputIndex];
            interleavedBuffer[index++] = right[inputIndex];
            inputIndex++;
        }
        return interleavedBuffer;
    }

	const floatTo16BitPCM = (output, offset, input) => {
		for (var i = 0; i < input.length; i++, offset += 2) {
			var s = Math.max(-1, Math.min(1, input[i]));
			output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
	};

	const writeString = (view, offset, string) => {
		for (var i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	};

	const encodeWav = samples => {
		let buffer = new ArrayBuffer(44 + samples.length * 2);
		let view = new DataView(buffer);

		writeString(view, 0, "RIFF");
		view.setUint32(4, 36 + samples.length * 2, true);
		writeString(view, 8, "WAVE");
		writeString(view, 12, "fmt ");
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, numChannels, true);
		view.setUint32(24, exportSampleRate, true);
		view.setUint32(28, exportSampleRate * numChannels * 2, true);
		view.setUint16(32, numChannels * 2, true);
		view.setUint16(34, 16, true);
		writeString(view, 36, "data");
		view.setUint32(40, samples.length * 2, true);
		floatTo16BitPCM(view, 44, samples);

		return view;
	};

    const getBuffers = () => {
        let buffers = [];

        for (let channel = 0; channel < numChannels; channel++) {
            buffers.push(mergeBuffers(recordedBuffers[channel], recordedLength));
        }
        postMessage({message: 'Raw buffers exported', 
        payload: {
            data: buffers,
            type: 'rawData'
        }})
    }

    const clear = () => {
        recordedLength = 0;
		recordedBuffers = [];
		recordedBuffers[0] = [];
		if (numChannels === 2) {
			recordedBuffers[1] = [];
		}
    } 
}

