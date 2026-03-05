// test-stt.ts
import { speech_to_text_tools } from "@/tools/speech_to_text_tools";

const fs = require('fs');

// Create a minimal valid MP3 file (just headers, no audio data)
const mp3Header = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x26]); // ID3v2.3 header
fs.writeFileSync('/tmp/test_audio.mp3', mp3Header);

console.log('Test audio file created at /tmp/test_audio.mp3');
console.log('File size:', fs.statSync('/tmp/test_audio.mp3').size, 'bytes');

// Test the tool
async function testSTT() {
  console.log('\nTesting speech_to_text_tools...');
  
  try {
    const result = await speech_to_text_tools.execute({
      audio_path: '/tmp/test_audio.mp3',
      model_size: 'tiny'
    });
    
    console.log('\nResult:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\nError:', error);
  }
}

testSTT();
