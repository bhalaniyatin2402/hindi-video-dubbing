# Hindi Video Dubbing Script

This script automates the process of creating a Hindi-dubbed version of an English video by extracting the audio, transcribing it, translating the text to Hindi, generating Hindi audio, and merging it back with the video.

## Features

- Extracts audio from a video file.
- Transcribes the audio using the Whisper CLI.
- Translates the transcription to Hindi using Google Translate API.
- Converts the Hindi text into audio using Google TTS.
- Merges the Hindi audio back into the video.

## Prerequisites

1. **Node.js**
1. **Python**
1. **Whisper CLI**: Steps To install whisper.
     - python is required to install whisper. you can check python is installed or not by running this command.
        ```
          python --version
          pip --version
        ```

   - if installed. then run the following command to install whisper into your system.
      ```
        pip install openai-whisper
        whisper --help
      ```

1. **FFmpeg**: Ensure you have FFmpeg installed on your system:
   - For Linux:
     ```
       sudo apt update
       sudo apt install ffmpeg
     ```
   - For macOS (using Homebrew):
     ```
       brew install ffmpeg
     ```
   - For Windows:
     - you need to set your `CMD` or `POWERSHALL` to `Run as administrator` to execute this command
     ```
       choco install ffmpeg
     ```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bhalaniyatin2402/hindi-video-dubbing.git
   cd hindi-video-dubbing
   ```

2. Install the dependencies:

   ```
     npm install
   ```

3. Paste video you want to dub into root of this project and change value of the varibale called `videoFile` to your video file name with extension and then run script file.

    ```
      node script.js
    ```
