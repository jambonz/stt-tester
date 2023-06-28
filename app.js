const speech = require('@google-cloud/speech');
const fs = require('fs');
const wav = require('wav');
const minimist = require('minimist');

async function transcribeAudio(language, model, audioFile) {
    const client = new speech.SpeechClient();
    const reader = new wav.Reader();
    const stream = fs.createReadStream(audioFile).pipe(reader);
    let audioBytes;

    reader.on('format', function (format) {
        stream.once('data', function (chunk) {
            audioBytes = chunk.slice(44); // Ignore the wav header (first 44 bytes)
        });
    });

    stream.on('end', async function () {
        const audio = {
            content: audioBytes,
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 8000,
            languageCode: language,
            model: model,
        };
        const request = {
            audio: audio,
            config: config,
        };

        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => {
              return {
                transcript: result.alternatives[0].transcript,
                confidence: result.alternatives[0].confidence
              }
            });
        console.log(`with model ${model}
        Transcription: ${transcription[0].transcript}
        Confidence level: ${transcription[0].confidence}`);
    });
}

const args = minimist(process.argv.slice(2), {
    default: {
        language: 'en-US'
    },
    alias: {
        language: 'l',
        model: 'm'
    }
});

if (!args.language || !args.model || args._.length !== 1) {
    console.error('Usage: node app.js --language [language] --model [model] [audio file]');
    process.exit(1);
}

transcribeAudio(args.language, args.model, args._[0]).catch(console.error);
