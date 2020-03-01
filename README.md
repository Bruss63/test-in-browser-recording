# in-brower-recording
A simple and easy to use in browser audio recorder. The recorder is built to be a drop-in file for your react frontend.
## Getting Started
Import the script into your project and simply use the audio recorder as a normal html element and add an onFileReady property to it alongside a handler to route the file once recording is completed.
## Properties
Properties involved in the elements aesthetics
```
type, 
Change complexity modes of the recorder.
compact: The simplest version of the recorder,  
has one button input to begin a recording,  
stop a recording and reset a recording.
small: The smallest version that includes all features,  it includes both pause and play buttons,  
stop and reset and a mode switching button to move between recording and playback modes  
(**Once Playback is Implemented**) The Default mode is compact.
```
```
shape,
Change the shape of the recorders container:
circular: Edges are rounded down to the shape of a circle.
rounded: Edges are rounded to 15px.
square: eges are squared.
```
```
backgroundColor: The background colour of the container.
```
```
btnColor: The colour of the buttons.
```
```
display: the display settings of the recorders container.
```