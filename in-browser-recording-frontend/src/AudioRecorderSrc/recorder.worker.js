import { exposeWorker } from 'react-hooks-worker';

const worker = e => {
    let recordingLength = 0;
    let recordingBuffer = [];
    let sampleRate = 16000;

    switch (e.data.command) {
        case 'config':
            config(e.data.config)
    }    
};

exposeWorker(worker);

const config = config => {
    console.log("triggered")
    sampleRate = config.sampleRate
}