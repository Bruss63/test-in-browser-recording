export default () => {
    let sampleRate = undefined;
    onmessage = e => {
        let data = e.data
        switch(data.command) {
            case 'config':
                sampleRate = data.config.sampleRate
                postMessage({message: 'configured'});
                break;
            case 'probe':
                postMessage({message: `Sample Rate: ${sampleRate}`})
        }
        
    };
    
}

