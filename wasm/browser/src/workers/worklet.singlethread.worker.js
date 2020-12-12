/*
    worklet.singlethread.worker.js

    Copyright (C) 2018 Steven Yi, Victor Lazzarini

    This file is part of Csound.

    The Csound Library is free software; you can redistribute it
    and/or modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    Csound is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with Csound; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
    02110-1301 USA
*/

import * as Comlink from "comlink";
import { writeToFs, lsFs, llFs, readFromFs, rmrfFs } from "@root/filesystem";
import libcsoundFactory from "@root/libcsound";
import loadWasm from "@root/module";
import { assoc, pipe } from "ramda";
import { logWorklet } from "@root/logger";

// const workerMessagePort = {
//   ready: false,
//   post: () => {},
//   broadcastPlayState: () => {},
// };

// let wasm;
// let libraryCsound;
// let combined;

// const callUncloned = async (k, arguments_) => {
//   const caller = combined.get(k);
//   const ret = caller && caller.apply({}, arguments_ || []);
//   return ret;
// };

// const initialize = async (wasmDataURI) => {
//     logWorklet(`initializing wasm and exposing csoundAPI functions from worker to main`);
//     wasm = wasm || (await loadWasm(wasmDataURI));
//     libraryCsound = libraryCsound || libcsoundFactory(wasm);
//     // const startHandler = handleCsoundStart(
//     //     workerMessagePort,
//     //     libraryCsound,
//     //     createRealtimeAudioThread,
//     // );
//     const allAPI = pipe(
//         assoc("writeToFs", writeToFs),
//         assoc("readFromFs", readFromFs),
//         assoc("lsFs", lsFs),
//         assoc("llFs", llFs),
//         assoc("rmrfFs", rmrfFs),
//         assoc("csoundStart", startHandler),
//         assoc("wasm", wasm),
//     )(libraryCsound);
//     combined = new Map(Object.entries(allAPI));
// };

// const CSMOD = {}
//
// let printCallbacks = [];
// let printMessages = (t) => {
//   for(let i = 0; i < printCallbacks.length; i++) {
//     printCallbacks[i](t);
//   }
// };
//
// CSMOD["ENVIRONMENT"] = "WEB";
// CSMOD["print"] = printMessages;
// CSMOD["printErr"] = printMessages;

// INITIALIAZE WASM
// libcsound(CSMOD);

// SETUP FS

// const FS = CSMOD["FS"];
// const MEMFS = CSMOD["FS"].filesystems.MEMFS;
// const pointerStringify = CSMOD["Pointer_stringify"];
//
// // FS Helpers
// const pathToArr = path => {
//     if (!path) return [];
//     const minusPrefix = path.replace(/^\//i, "");
//     const minusPostfix = minusPrefix.replace(/\/$/i, "");
//     return minusPostfix.split("/");
// };
// const ensureRootPrefix = path => (/^\//i.test(path) ? path : `/${path}`);
// const lsRoot = () => Object.values(FS.nameTable.map(t => t.name));
//
// const dirExists = path => {
//     const pathArr = pathToArr(path);
//     const result = pathArr.reduce(
//         ([currMount, bool], item, index) => {
//             const curPath = ensureRootPrefix(
//                 pathArr.slice(0, index + 1).join("/")
//             );
//             if (!bool) return [null, false];
//             if (currMount.some(m => m.mountpoint === curPath)) {
//                 return [
//                     currMount.find(m => m.mountpoint === curPath).mounts,
//                     true
//                 ];
//             } else {
//                 return [null, false];
//             }
//         },
//         [FS.root.mount.mounts, true]
//     );
//     return result[1];
// };
const callUncloned = async (k, arguments_) => {
  const caller = combined.get(k);
  const ret = caller && caller.apply({}, arguments_ || []);
  return ret;
};

class WorkletSinglethreadWorker extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  constructor(options) {
    super(options);
    this.initialize = this.initialize.bind(this);
    Comlink.expose(this.initialize, this.port);
    this.callUncloned = callUncloned;

    // Comlink.expose(this, this.port);
    // let p = this.port;
    // printCallbacks.push((t) => {
    //     p.postMessage(["log", t]);
    // });
    // let csObj = Csound.new();
    // this.csObj = csObj;
    // // engine status
    // this.result = 0;
    // this.running = false;
    // this.started = false;
    // this.sampleRate = sampleRate;
    //
    // Csound.setMidiCallbacks(csObj);
    // Csound.setOption(csObj, "-odac");
    // Csound.setOption(csObj, "-iadc");
    // Csound.setOption(csObj, "-M0");
    // Csound.setOption(csObj, "-+rtaudio=null");
    // Csound.setOption(csObj, "-+rtmidi=null");
    // Csound.setOption(csObj, "--sample-rate="+sampleRate);
    // Csound.prepareRT(csObj);
    // this.nchnls = options.outputChannelCount[0];
    // this.nchnls_i = options.numberOfInputs;
    // Csound.setOption(csObj, "--nchnls=" + this.nchnls);
    // Csound.setOption(csObj, "--nchnls_i=" + this.nchnls_i);
    //
    // this.port.onmessage = this.handleMessage.bind(this);
    // this.port.start();
  }

  async initialize(wasmDataURI) {
    wasm = await loadWasm(wasmDataURI);
    libraryCsound = libcsoundFactory(wasm);
    const startHandler = handleCsoundStart(
      workerMessagePort,
      libraryCsound,
      sabCreateRealtimeAudioThread,
    );
    const allAPI = pipe(
      assoc("writeToFs", writeToFs),
      assoc("readFromFs", readFromFs),
      assoc("lsFs", lsFs),
      assoc("llFs", llFs),
      assoc("rmrfFs", rmrfFs),
      assoc("csoundStart", startHandler),
      assoc("wasm", wasm),
    )(libraryCsound);
    combined = new Map(Object.entries(allAPI));

    // this.wasm = await loadWasm(wasmDataURI);
    // this.libcsound = libcsoundFactory(wasm);
    // return this.libcsound;
  }

  process(inputs, outputs, parameters) {
    if (this.csoundOutputBuffer == null || this.running == false) {
      let output = outputs[0];
      let bufferLen = output[0].length;
      for (let i = 0; i < bufferLen; i++) {
        for (let channel = 0; channel < output.numberOfChannels; channel++) {
          let outputChannel = output[channel];
          outputChannel[i] = 0;
        }
      }
      return true;
    }

    let input = inputs[0];
    let output = outputs[0];

    let bufferLen = output[0].length;

    let csOut = this.csoundOutputBuffer;
    let csIn = this.csoundInputBuffer;
    let ksmps = this.ksmps;
    let zerodBFS = this.zerodBFS;

    let cnt = this.cnt;
    let nchnls = this.nchnls;
    let nchnls_i = this.nchnls_i;
    let result = this.result;

    for (let i = 0; i < bufferLen; i++, cnt++) {
      if (cnt == ksmps && result == 0) {
        // if we need more samples from Csound
        result = Csound.performKsmps(this.csObj);
        cnt = 0;

        if (result != 0) {
          this.running = false;
          this.started = false;
          Csound.cleanup(this.csObj);
          this.firePlayStateChange();
        }
      }

      for (let channel = 0; channel < input.length; channel++) {
        let inputChannel = input[channel];
        csIn[cnt * nchnls_i + channel] = inputChannel[i] * zerodBFS;
      }
      for (let channel = 0; channel < output.length; channel++) {
        let outputChannel = output[channel];
        if (result == 0) outputChannel[i] = csOut[cnt * nchnls + channel] / zerodBFS;
        else outputChannel[i] = 0;
      }
    }

    this.cnt = cnt;
    this.result = result;

    return true;
  }

  start() {
    if (this.started == false) {
      let csObj = this.csObj;
      let ksmps = Csound.getKsmps(csObj);
      this.ksmps = ksmps;
      this.cnt = ksmps;

      let outputPointer = Csound.getOutputBuffer(csObj);
      this.csoundOutputBuffer = new Float32Array(
        CSMOD.HEAP8.buffer,
        outputPointer,
        ksmps * this.nchnls,
      );
      let inputPointer = Csound.getInputBuffer(csObj);
      this.csoundInputBuffer = new Float32Array(
        CSMOD.HEAP8.buffer,
        inputPointer,
        ksmps * this.nchnls_i,
      );
      this.zerodBFS = Csound.getZerodBFS(csObj);
      this.started = true;
    }
    this.running = true;
    this.firePlayStateChange();
  }

  // compileOrc(orcString) {
  //     Csound.compileOrc(this.csObj, orcString);
  // }
  //
  // getPlayState() {
  //     if(this.running) {
  //         return "playing";
  //     } else if(this.started) {
  //         return "paused"
  //     }
  //     return "stopped";
  // }

  // firePlayStateChange() {
  //     this.port.postMessage(["playState", this.getPlayState()]);
  // }
  //
  //
  // handleMessage(event) {
  //     let data = event.data;
  //     let p = this.port;
  //
  //     switch (data[0]) {
  //     case "compileCSD":
  //         this.result = Csound.compileCSD(this.csObj, data[1]);
  //         break;
  //     case "compileCSDPromise":
  //         p.postMessage([
  //             "compileCSDPromise",
  //             data[1],
  //             Csound.compileCSD(this.csObj, data[2])
  //         ]);
  //         break;
  //     case "compileOrc":
  //         Csound.compileOrc(this.csObj, data[1]);
  //         break;
  //     case "evalCode":
  //         Csound.evaluateCode(this.csObj, data[1]);
  //         break;
  //     case "evalCodePromise":
  //         p.postMessage([
  //             "evalCodePromise",
  //             data[1],
  //             Csound.evaluateCode(this.csObj, data[2])
  //         ]);
  //         break;
  //     case "readScore":
  //         Csound.readScore(this.csObj, data[1]);
  //         break;
  //     case "setControlChannel":
  //         Csound.setControlChannel(this.csObj,
  //                                  data[1], data[2]);
  //         break;
  //     case "setStringChannel":
  //         Csound.setStringChannel(this.csObj,
  //                                 data[1], data[2]);
  //         break;
  //     case "start":
  //         this.start();
  //         break;
  //     case "stop":
  //         this.running = false;
  //         this.started = false;
  //         this.firePlayStateChange();
  //         break;
  //     case "play":
  //         this.start();
  //         break;
  //     case "pause":
  //         this.running = false;
  //         this.started = true;
  //         this.firePlayStateChange();
  //         break;
  //     case "resume":
  //         this.running = true;
  //         this.started = true;
  //         this.firePlayStateChange();
  //         break;
  //     case "setOption":
  //         Csound.setOption(this.csObj, data[1]);
  //         break;
  //     case "reset":
  //         let csObj = this.csObj;
  //         this.started = false;
  //         this.running = false;
  //         Csound.reset(csObj);
  //         Csound.setMidiCallbacks(csObj);
  //         Csound.setOption(csObj, "-odac");
  //         Csound.setOption(csObj, "-iadc");
  //         Csound.setOption(csObj, "-M0");
  //         Csound.setOption(csObj, "-+rtaudio=null");
  //         Csound.setOption(csObj, "-+rtmidi=null");
  //         Csound.setOption(csObj, "--sample-rate="+this.sampleRate);
  //         Csound.prepareRT(csObj);
  //         //this.nchnls = options.numberOfOutputs;
  //         //this.nchnls_i = options.numberOfInputs;
  //         Csound.setOption(csObj, "--nchnls=" + this.nchnls);
  //         Csound.setOption(csObj, "--nchnls_i=" + this.nchnls_i);
  //         this.csoundOutputBuffer = null;
  //         this.ksmps = null;
  //         this.zerodBFS = null;
  //         this.firePlayStateChange();
  //         break;
  //     case "cleanup":
  //         Csound.cleanup(this.csObj);
  //         break;
  //     case "setCurrentDirFS":
  //         let dirPath = data[2];
  //         if (!dirExists(dirPath)) {
  //             mkdirRecursive(dirPath);
  //         }
  //         FS.chdir(ensureRootPrefix(dirPath));
  //         p.postMessage(["setCurrentDirFSDone", data[1]]);
  //         break;
  //     case "writeToFS":
  //         let name = data[1];
  //         let blobData = data[2];
  //         let buf = new Uint8Array(blobData)
  //         let stream = FS.open(name, 'w+');
  //         FS.write(stream, buf, 0, buf.length, 0);
  //         FS.close(stream);
  //
  //         break;
  //     case "unlinkFromFS":
  //         let filePath = data[1];
  //         FS.unlink(filePath);
  //         break;
  //     case "midiMessage":
  //         let byte1 = data[1];
  //         let byte2 = data[2];
  //         let byte3 = data[3];
  //         Csound.pushMidiMessage(this.csObj, byte1, byte2, byte3);
  //         break;
  //     case "getControlChannel":
  //         let channel = data[1];
  //         let value = Csound.getControlChannel(this.csObj, channel);
  //         p.postMessage(["control", channel, value]);
  //         break;
  //     case "getStringChannel":
  //         let schannel = data[1];
  //         let svalue = Csound.getStringChannel(this.csObj, schannel);
  //         svalue = pointerStringify(svalue);
  //         p.postMessage(["stringChannel", schannel, svalue]);
  //         break;
  //     case "getTable":
  //         let buffer = Csound.getTable(this.csObj, data[1]);
  //         let len = Csound.getTableLength(this.csObj, data[1]);
  //         let src = new Float32Array(CSMOD.HEAP8.buffer, buffer, len);
  //         let table = new Float32Array(src);
  //         p.postMessage(["table", data[1], table]);
  //         break;
  //     case "setTableAtIndex":
  //         Csound.setTable(this.csObj, data[1], data[2], data[3]);
  //         break;
  //     case "setTable":
  //         let cstable = new Float32Array(data[2]);
  //         for(let i = 0; i < cstable.length; i++)
  //             Csound.setTable(this.csObj, data[1], i, cstable[i]);
  //         break;
  //     default:
  //         console.log('[CsoundAudioProcessor] Invalid Message: "' + event.data);
  //     }
  // }
}
registerProcessor("csound-singlethread-worklet-processor", WorkletSinglethreadWorker);