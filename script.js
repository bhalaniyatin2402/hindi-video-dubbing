const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const axios = require("axios");
const { exec } = require("child_process");
const { translate } = require("@vitalets/google-translate-api");

const videoFile = "video_dub.mp4"; // Input video file
const outputFile = "output.mp4"; // Final Hindi-dubbed video file
const audioFile = "audio.mp3"; // Extracted audio
const noAudioVideo = "video_no_audio.mp4"; // Video without audio
const hindiAudio = "hindi_audio.mp3"; // Generated Hindi audio
const transcriptionJson = "audio.json"; // Transcription JSON

// Step 1: Extract audio from video
function extractAudio(callback) {
  console.log("Extracting audio...");
  ffmpeg(videoFile)
    .output(audioFile)
    .on("end", () => {
      console.log("Audio extracted.");
      callback(null);
    })
    .on("error", (err) => callback(err))
    .run();
}

// Step 2: Transcribe audio using Whisper CLI
function transcribeAudio(callback) {
  console.log("Transcribing audio...");
  const whisperCommand = `whisper ${audioFile} --model small --language en --output_format json --output_dir .`;
  exec(whisperCommand, (err, stdout, stderr) => {
    if (err) return callback(err);
    console.log("Audio transcribed.");
    callback(null);
  });
}

// Step 3: Read transcription from JSON
function readTranscription(callback) {
  console.log("Reading transcription...");
  fs.readFile(transcriptionJson, "utf8", (err, data) => {
    if (err) return callback(err);
    try {
      const jsonData = JSON.parse(data);
      const transcription = jsonData.text; // Assuming `text` contains the transcription
      callback(null, transcription);
    } catch (parseErr) {
      callback(parseErr);
    }
  });
}

// Step 4: Translate transcription to Hindi
function translateText(text, callback) {
  console.log("Translating text to Hindi...");
  translate(text, { from: "en", to: "hi" })
    .then((res) => {
      console.log("Text translated to Hindi.");
      callback(null, res.text);
    })
    .catch((err) => callback(err));
}

// Step 5: Convert Hindi text to speech
function textToSpeechHindi(text, callback) {
  console.log("Generating Hindi audio...");
  const chunkSize = 200;
  const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, "g"));

  let tempFiles = [];
  let chunkCounter = 0;

  function processChunk() {
    if (chunkCounter >= chunks.length) {
      // Combine all temporary files
      const concatFile = "concat.txt";
      fs.writeFileSync(
        concatFile,
        tempFiles.map((file) => `file '${file}'`).join("\n")
      );

      const command = `ffmpeg -f concat -safe 0 -i ${concatFile} -c copy ${hindiAudio}`;
      exec(command, (err) => {
        if (err) return callback(err);
        console.log("Hindi audio generated.");
        tempFiles.forEach((file) => fs.unlinkSync(file));
        fs.unlinkSync(concatFile);
        callback(null);
      });
      return;
    }

    const chunk = chunks[chunkCounter];
    const tempFile = `hindi_audio_${chunkCounter}.mp3`;
    tempFiles.push(tempFile);

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      chunk
    )}&tl=hi&client=tw-ob`;
    axios({ url, responseType: "stream" })
      .then((response) => {
        const writer = fs.createWriteStream(tempFile);
        response.data.pipe(writer);
        writer.on("finish", () => {
          console.log(`Processed chunk ${chunkCounter + 1}/${chunks.length}`);
          chunkCounter++;
          processChunk();
        });
        writer.on("error", callback);
      })
      .catch(callback);
  }

  processChunk();
}

// Step 6: Remove original audio from video
function removeOriginalAudio(callback) {
  console.log("Removing original audio from video...");

  exec(`ffmpeg -i ${videoFile} -c:v copy -an ${noAudioVideo}`, (err) => {
    if (err) return callback(err);
    console.log("Audio Removed from original video.");
    callback(null)
  });
}

// Step 7: Merge Hindi audio with video
function mergeAudioWithVideo(callback) {
  console.log("Merging Hindi audio with video...");

  exec(
    `ffmpeg -i ${noAudioVideo} -i ${hindiAudio} -c:v copy -c:a aac -shortest ${outputFile}`,
    (err) => {
      if (err) return callback(err);
      callback(null)
    }
  );
}

// Main Workflow
extractAudio((err) => {
  if (err) return console.error("Error extracting audio:", err);

  transcribeAudio((err) => {
    if (err) return console.error("Error transcribing audio:", err);

    readTranscription((err, transcription) => {
      if (err) return console.error("Error reading transcription:", err);

      translateText(transcription, (err, hindiText) => {
        if (err) return console.error("Error translating text:", err);

        textToSpeechHindi(hindiText, (err) => {
          if (err) return console.error("Error generating Hindi audio:", err);

          removeOriginalAudio((err) => {
            if (err)
              return console.error("Error removing original audio:", err);

            mergeAudioWithVideo((err) => {
              if (err)
                return console.error("Error merging audio with video:", err);

              console.log("Process complete. Output file:", outputFile);
            });
          });
        });
      });
    });
  });
});
