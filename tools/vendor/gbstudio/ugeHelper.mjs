// GB Studio v4.2.0, MIT; conversão técnica de TypeScript para ES modules.
import { PatternCell } from "./PatternCell.mjs";
import { Song } from "./Song.mjs";
import { SubPatternCell } from "./SubPatternCell.mjs";
import { noteGBDKDefines } from "./music-constants.mjs";
export const loadUGESong = (data)=>{
    const uint8data = new Uint8Array(data);
    const readUint32 = ()=>{
        return new Uint32Array(data.slice(offset, offset += 4))[0];
    };
    const readUint8 = ()=>{
        return uint8data[offset++];
    };
    const td = new TextDecoder();
    const readText = ()=>{
        const len = uint8data[offset];
        let text = "";
        if (len > 0) {
            text = td.decode(data.slice(offset + 1, offset + 1 + len));
        }
        offset += 256;
        return text;
    };
    const song = new Song();
    let offset = 0;
    const version = readUint32();
    if (version < 0 || version > 6) {
        throw new Error(`UGE version ${version} is not supported by GB Studio`);
    }
    song.name = readText();
    song.artist = readText();
    song.comment = readText();
    const instrument_count = version < 3 ? 15 : 45;
    const instrumentData = [];
    for(let n = 0; n < instrument_count; n++){
        const type = readUint32();
        const name = readText();
        const length = readUint32();
        const length_enabled = readUint8();
        let initial_volume = readUint8();
        if (initial_volume > 15) {
            initial_volume = 15;
        }
        const volume_direction = readUint32();
        let volume_sweep_amount = readUint8();
        if (volume_sweep_amount !== 0) {
            volume_sweep_amount = 8 - volume_sweep_amount;
        }
        if (volume_direction) {
            volume_sweep_amount = -volume_sweep_amount;
        }
        const freq_sweep_time = readUint32();
        const freq_sweep_direction = readUint32();
        let freq_sweep_shift = readUint32();
        if (freq_sweep_direction) {
            freq_sweep_shift = -freq_sweep_shift;
        }
        const duty = readUint8();
        const wave_output_level = readUint32();
        const wave_waveform_index = readUint32();
        let subpattern_enabled = 0;
        let noise_counter_step = 0;
        const subpattern = [];
        if (version >= 6) {
            noise_counter_step = readUint32();
            subpattern_enabled = readUint8();
            for(let m = 0; m < 64; m++){
                const note = readUint32();
                offset += 4;
                const jump = readUint32();
                const effectcode = readUint32();
                const effectparam = readUint8();
                subpattern.push({
                    note: note === 90 ? null : note,
                    jump,
                    effectcode: effectcode === 0 && effectparam === 0 ? null : effectcode,
                    effectparam: effectcode === 0 && effectparam === 0 ? null : effectparam
                });
            }
        }
        const noise_macro = [];
        if (version < 6) {
            offset += 4;
            noise_counter_step = readUint32();
            offset += 4;
            if (version >= 4) {
                for(let n = 0; n < 6; n++){
                    const uint8ref = readUint8();
                    const int8ref = uint8ref > 0x7f ? uint8ref - 0x100 : uint8ref;
                    noise_macro.push(int8ref);
                }
            }
        }
        instrumentData.push({
            idx: n,
            type,
            name,
            length,
            length_enabled,
            initial_volume,
            volume_sweep_amount,
            freq_sweep_time,
            freq_sweep_shift,
            duty,
            wave_output_level,
            wave_waveform_index,
            subpattern_enabled,
            subpattern,
            noise_counter_step,
            noise_macro
        });
    }
    for(let n = 0; n < 16; n++){
        song.waves.push(Uint8Array.from(uint8data.slice(offset, offset + 32)));
        offset += 32;
        if (version < 3) offset += 1;
    }
    song.ticks_per_row = readUint32();
    if (version >= 6) {
        song.timer_enabled = readUint8() !== 0;
        song.timer_divider = readUint32();
    }
    const pattern_count = new Uint32Array(data.slice(offset, offset + 4))[0];
    if (offset + pattern_count * 13 * 64 > data.byteLength) {
        throw new Error(`Song has too many patterns (${pattern_count})`);
    }
    offset += 4;
    const patterns = [];
    for(let n = 0; n < pattern_count; n++){
        let patternId = 0;
        const pattern = [];
        if (version >= 5) {
            patternId = readUint32();
        } else {
            patternId = n;
        }
        for(let m = 0; m < 64; m++){
            if (version < 6) {
                const [note, instrument, effectcode] = new Int32Array(data.slice(offset, offset + 3 * 4));
                offset += 3 * 4;
                const effectparam = readUint8();
                pattern.push([
                    note,
                    instrument,
                    effectcode,
                    effectparam
                ]);
            } else if (version >= 6) {
                const [note, instrument, _unused, effectcode] = new Int32Array(data.slice(offset, offset + 4 * 4));
                offset += 4 * 4;
                const effectparam = readUint8();
                pattern.push([
                    note,
                    instrument,
                    effectcode,
                    effectparam
                ]);
            }
        }
        if (version === 5 && patterns[patternId]) {
            patterns[n] = pattern;
        } else {
            patterns[patternId] = pattern;
        }
    }
    const orders = [];
    for(let n = 0; n < 4; n++){
        const order_count = readUint32();
        orders.push(new Uint32Array(data.slice(offset, offset + 4 * (order_count - 1))));
        offset += 4 * order_count;
    }
    const duty_instrument_mapping = {};
    const wave_instrument_mapping = {};
    const noise_instrument_mapping = {};
    instrumentData.forEach((instrument)=>{
        const { idx, type, name, length, length_enabled, initial_volume, volume_sweep_amount, freq_sweep_time, freq_sweep_shift, duty, wave_output_level, wave_waveform_index, subpattern_enabled, subpattern, noise_counter_step, noise_macro } = instrument;
        if (type === 0) {
            const instr = {};
            if (length_enabled) {
                instr.length = 64 - length;
            } else {
                instr.length = null;
            }
            instr.name = name;
            instr.duty_cycle = duty;
            instr.initial_volume = initial_volume;
            instr.volume_sweep_change = volume_sweep_amount;
            instr.frequency_sweep_time = freq_sweep_time;
            instr.frequency_sweep_shift = freq_sweep_shift;
            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                instr.subpattern_enabled = false;
                instr.subpattern = [
                    ...Array(64)
                ].map(()=>new SubPatternCell());
            }
            duty_instrument_mapping[idx % 15 + 1] = song.duty_instruments.length;
            song.addDutyInstrument(instr);
        } else if (type === 1) {
            const instr = {};
            if (length_enabled) {
                instr.length = 256 - length;
            } else {
                instr.length = null;
            }
            instr.name = name;
            instr.volume = wave_output_level;
            instr.wave_index = wave_waveform_index;
            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                instr.subpattern_enabled = false;
                instr.subpattern = [
                    ...Array(64)
                ].map(()=>new SubPatternCell());
            }
            wave_instrument_mapping[idx % 15 + 1] = song.wave_instruments.length;
            song.addWaveInstrument(instr);
        } else if (type === 2) {
            const instr = {};
            if (length_enabled) {
                instr.length = 64 - length;
            } else {
                instr.length = null;
            }
            instr.name = name;
            instr.initial_volume = initial_volume;
            instr.volume_sweep_change = volume_sweep_amount;
            instr.bit_count = noise_counter_step ? 7 : 15;
            if (version < 6) {
                if (version >= 4) {
                    instr.noise_macro = noise_macro;
                } else {
                    instr.noise_macro = [
                        0,
                        0,
                        0,
                        0,
                        0,
                        0
                    ];
                }
            }
            if (version >= 6) {
                instr.subpattern_enabled = subpattern_enabled !== 0;
                instr.subpattern = subpattern;
            } else {
                if (noise_macro.length === 0) {
                    instr.subpattern_enabled = false;
                    instr.subpattern = [
                        ...Array(64)
                    ].map(()=>new SubPatternCell());
                } else {
                    instr.subpattern_enabled = true;
                    instr.subpattern = subpatternFromNoiseMacro(instr.noise_macro ?? [], song.ticks_per_row);
                }
            }
            noise_instrument_mapping[idx % 15 + 1] = song.noise_instruments.length;
            song.addNoiseInstrument(instr);
        } else {
            throw Error(`Invalid instrument type ${type} [${idx}, "${name}"]`);
        }
    });
    for(let n = 0; n < orders[0].length; n++){
        const pattern = [];
        for(let m = 0; m < 64; m++){
            const row = [];
            for(let track = 0; track < 4; track++){
                const cellData = patterns[orders[track][n]][m];
                const [note, instrument, effectcode, effectparam] = cellData;
                const cell = new PatternCell();
                if (note !== 90) cell.note = note;
                if (instrument !== 0) {
                    let mapping = {};
                    if (track < 2) mapping = duty_instrument_mapping;
                    if (track === 2) mapping = wave_instrument_mapping;
                    if (track === 3) mapping = noise_instrument_mapping;
                    if (instrument in mapping) cell.instrument = mapping[instrument];
                }
                if (effectcode !== 0 || effectparam !== 0) {
                    cell.effectcode = effectcode;
                    cell.effectparam = effectparam;
                }
                row.push(cell);
            }
            pattern.push(row);
        }
        song.patterns.push(pattern);
        let added = false;
        for(let idx = 0; idx < song.patterns.length - 1; idx++){
            if (comparePatterns(song.patterns[idx], song.patterns[song.patterns.length - 1])) {
                song.sequence.push(idx);
                song.patterns.pop();
                added = true;
            }
        }
        if (!added) song.sequence.push(song.patterns.length - 1);
    }
    return song;
};
export const saveUGESong = (song)=>{
    const buffer = new ArrayBuffer(1024 * 1024);
    const view = new DataView(buffer);
    let idx = 0;
    function addUint8(value) {
        view.setUint8(idx, value);
        idx += 1;
    }
    function addUint32(value) {
        view.setUint32(idx, value, true);
        idx += 4;
    }
    function addInt8(value) {
        view.setInt8(idx, value);
        idx += 1;
    }
    function addShortString(s) {
        view.setUint8(idx, s.length);
        idx += 1;
        const te = new TextEncoder();
        te.encodeInto(s, new Uint8Array(buffer, idx, idx + 255));
        idx += 255;
    }
    function addSubpattern(i) {
        addInt8(i.subpattern_enabled ? 1 : 0);
        for(let n = 0; n < 64; n++){
            const subpattern = i.subpattern[n];
            addUint32(subpattern.note ?? 90);
            addUint32(0);
            addUint32(subpattern.jump ?? 0);
            addUint32(subpattern.effectcode ?? 0);
            addUint8(subpattern.effectparam ?? 0);
        }
    }
    function addDutyInstrument(type, i) {
        addUint32(type);
        addShortString(i.name || "");
        addUint32(i.length !== null ? 64 - i.length : 0);
        addUint8(i.length === null ? 0 : 1);
        addUint8(i.initial_volume);
        addUint32(i.volume_sweep_change < 0 ? 1 : 0);
        addUint8(i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0);
        addUint32(i.frequency_sweep_time);
        addUint32(i.frequency_sweep_shift < 0 ? 1 : 0);
        addUint32(Math.abs(i.frequency_sweep_shift));
        addUint8(i.duty_cycle);
        addUint32(0);
        addUint32(0);
        addUint32(0);
        addSubpattern(i);
    }
    function addWaveInstrument(type, i) {
        addUint32(type);
        addShortString(i.name || "");
        addUint32(i.length !== null ? 256 - i.length : 0);
        addUint8(i.length === null ? 0 : 1);
        addUint8(0);
        addUint32(0);
        addUint8(0);
        addUint32(0);
        addUint32(0);
        addUint32(0);
        addUint8(0);
        addUint32(i.volume);
        addUint32(i.wave_index);
        addUint32(0);
        addSubpattern(i);
    }
    function addNoiseInstrument(type, i) {
        addUint32(type);
        addShortString(i.name || "");
        addUint32(i.length !== null ? 64 - i.length : 0);
        addUint8(i.length === null ? 0 : 1);
        addUint8(i.initial_volume);
        addUint32(i.volume_sweep_change < 0 ? 1 : 0);
        addUint8(i.volume_sweep_change !== 0 ? 8 - Math.abs(i.volume_sweep_change) : 0);
        addUint32(0);
        addUint32(0);
        addUint32(0);
        addUint8(0);
        addUint32(0);
        addUint32(0);
        addUint32(i.bit_count === 7 ? 1 : 0);
        addSubpattern(i);
    }
    addUint32(6);
    addShortString(song.name);
    addShortString(song.artist);
    addShortString(song.comment);
    for(let n = 0; n < 15; n++){
        addDutyInstrument(0, song.duty_instruments[n] || {});
    }
    for(let n = 0; n < 15; n++){
        addWaveInstrument(1, song.wave_instruments[n] || {});
    }
    for(let n = 0; n < 15; n++){
        addNoiseInstrument(2, song.noise_instruments[n] || {});
    }
    for(let n = 0; n < 16; n++){
        for(let m = 0; m < 32; m++){
            addUint8(song.waves[n] ? song.waves[n][m] : 0);
        }
    }
    addUint32(song.ticks_per_row);
    addInt8(song.timer_enabled ? 1 : 0);
    addUint32(song.timer_divider);
    addUint32(song.patterns.length * 4);
    let patternKey = 0;
    for (const pattern of song.patterns){
        for(let track = 0; track < 4; track++){
            addUint32(patternKey++);
            for(let m = 0; m < 64; m++){
                const t = pattern[m][track];
                addUint32(t.note === null ? 90 : t.note);
                addUint32(t.instrument === null ? 0 : t.instrument + 1);
                addUint32(0);
                addUint32(t.effectcode === null ? 0 : t.effectcode);
                addUint8(t.effectparam === null ? 0 : t.effectparam);
            }
        }
    }
    for(let track = 0; track < 4; track++){
        addUint32(song.sequence.length + 1);
        for (const i of song.sequence){
            addUint32(i * 4 + track);
        }
        addUint32(0);
    }
    for(let n = 0; n < 16; n++){
        addUint32(0);
    }
    return buffer.slice(0, idx);
};
const comparePatterns = function(a, b) {
    if (a.length !== b.length) return false;
    for(let idx = 0; idx < a.length; idx++){
        if (!patternEqual(a[idx], b[idx])) return false;
    }
    return true;
};
const patternEqual = function(a, b) {
    if (a.length !== b.length) return false;
    for(let idx = 0; idx < a.length; idx++){
        if (a[idx].note !== b[idx].note) return false;
        if (a[idx].instrument !== b[idx].instrument) return false;
        if (a[idx].effectcode !== b[idx].effectcode) return false;
        if (a[idx].effectparam !== b[idx].effectparam) return false;
    }
    return true;
};
export const exportToC = (song, trackName)=>{
    const decHex = (n, maxLength = 2)=>{
        return "0x" + n.toString(16).toUpperCase().padStart(maxLength, "0");
    };
    const findPattern = function(pattern) {
        for(let idx = 0; idx < patterns.length; idx++){
            if (patternEqual(pattern, patterns[idx])) return idx;
        }
        return null;
    };
    const getSequenceMappingFor = function(track) {
        return song.sequence.map((n)=>`song_pattern_${pattern_map[`${n}, ${track}`]}`).join(", ");
    };
    const formatPatternCell = function(cell) {
        const note = cell.note !== null ? noteGBDKDefines[cell.note] : "___";
        let instrument = 0;
        let effect_code = 0;
        let effect_param = 0;
        if (cell.instrument !== null) instrument = cell.instrument + 1;
        if (cell.effectcode !== null) {
            effect_code = cell.effectcode;
            effect_param = cell.effectparam || 0;
        }
        return `DN(${note}, ${instrument}, ${decHex(effect_code << 8 | effect_param, 3)})`;
    };
    const formatSubpattern = function(instr, type) {
        if (instr.subpattern_enabled) {
            data += `static const unsigned char ${type}_${instr.index}_subpattern[] = {\n`;
            for(let idx = 0; idx < 32; idx++){
                const cell = instr.subpattern[idx];
                data += `    ${formatSubPatternCell(cell, idx === 32 - 1)},\n`;
            }
            data += "};\n";
        }
    };
    const formatSubPatternCell = function(cell, isLast) {
        const note = cell.note ?? "___";
        const jump = cell.jump !== null && isLast ? 1 : cell.jump ?? 0;
        let effect_code = 0;
        let effect_param = 0;
        if (cell.effectcode !== null) {
            effect_code = cell.effectcode;
            effect_param = cell.effectparam || 0;
        }
        return `DN(${note}, ${jump}, ${decHex(effect_code << 8 | effect_param, 3)})`;
    };
    const formatDutyInstrument = function(instr) {
        const sweep = instr.frequency_sweep_time << 4 | (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) | Math.abs(instr.frequency_sweep_shift);
        const len_duty = instr.duty_cycle << 6 | (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
        let envelope = instr.initial_volume << 4 | (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
        if (instr.volume_sweep_change !== 0) {
            envelope |= 8 - Math.abs(instr.volume_sweep_change);
        }
        let subpatternRef = 0;
        if (instr.subpattern_enabled) {
            subpatternRef = `duty_${instr.index}_subpattern`;
        }
        const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);
        return `{ ${decHex(sweep)}, ${decHex(len_duty)}, ${decHex(envelope)}, ${subpatternRef}, ${decHex(highmask)} }`;
    };
    const formatWaveInstrument = function(instr) {
        const length = (instr.length !== null ? 256 - instr.length : 0) & 0xff;
        const volume = instr.volume << 5;
        const waveform = instr.wave_index;
        let subpatternRef = 0;
        if (instr.subpattern_enabled) {
            subpatternRef = `wave_${instr.index}_subpattern`;
        }
        const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);
        return `{ ${decHex(length)}, ${decHex(volume)}, ${decHex(waveform)}, ${subpatternRef}, ${decHex(highmask)} }`;
    };
    const formatNoiseInstrument = function(instr) {
        let envelope = instr.initial_volume << 4 | (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
        if (instr.volume_sweep_change !== 0) envelope |= 8 - Math.abs(instr.volume_sweep_change);
        let subpatternRef = 0;
        if (instr.subpattern_enabled) {
            subpatternRef = `noise_${instr.index}_subpattern`;
        }
        let highmask = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
        if (instr.length !== null) highmask |= 0x40;
        if (instr.bit_count === 7) highmask |= 0x80;
        return `{ ${decHex(envelope)}, ${subpatternRef}, ${decHex(highmask)}, 0, 0 }`;
    };
    const formatWave = function(wave) {
        return Array.from(Array(16).keys(), (n)=>decHex(wave[n * 2] << 4 | wave[n * 2 + 1])).join(", ");
    };
    const patterns = [];
    const pattern_map = {};
    for(let n = 0; n < song.patterns.length; n++){
        const source_pattern = song.patterns[n];
        for(let track = 0; track < 4; track++){
            const target_pattern = [];
            for(let m = 0; m < source_pattern.length; m++){
                target_pattern.push(source_pattern[m][track]);
            }
            const idx = findPattern(target_pattern);
            if (idx !== null) {
                pattern_map[`${n}, ${track}`] = idx;
            } else {
                pattern_map[`${n}, ${track}`] = patterns.length;
                patterns.push(target_pattern);
            }
        }
    }
    let data = `#pragma bank 255

#include "hUGEDriver.h"
#include <stddef.h>
#include "hUGEDriverRoutines.h"

static const unsigned char order_cnt = ${song.sequence.length * 2};
`;
    for(let idx = 0; idx < patterns.length; idx++){
        data += `static const unsigned char song_pattern_${idx}[] = {\n`;
        for (const cell of patterns[idx]){
            data += `    ${formatPatternCell(cell)},\n`;
        }
        data += "};\n";
    }
    for (const instr of song.duty_instruments){
        formatSubpattern(instr, "duty");
    }
    for (const instr of song.wave_instruments){
        formatSubpattern(instr, "wave");
    }
    for (const instr of song.noise_instruments){
        formatSubpattern(instr, "noise");
    }
    for(let track = 0; track < 4; track++)data += `static const unsigned char* const order${track + 1}[] = {${getSequenceMappingFor(track)}};\n`;
    data += "static const hUGEDutyInstr_t duty_instruments[] = {\n";
    for (const instr of song.duty_instruments){
        data += `    ${formatDutyInstrument(instr)},\n`;
    }
    data += "};\n";
    data += "static const hUGEWaveInstr_t wave_instruments[] = {\n";
    for (const instr of song.wave_instruments){
        data += `    ${formatWaveInstrument(instr)},\n`;
    }
    data += "};\n";
    data += "static const hUGENoiseInstr_t noise_instruments[] = {\n";
    for (const instr of song.noise_instruments){
        data += `    ${formatNoiseInstrument(instr)},\n`;
    }
    data += "};\n";
    data += "static const unsigned char waves[] = {\n";
    for (const wave of song.waves){
        data += `    ${formatWave(wave)},\n`;
    }
    data += "};\n";
    data += `
const void __at(255) __bank_${trackName}_Data;
const hUGESong_t ${trackName}_Data = {
    ${song.ticks_per_row},
    &order_cnt,
    order1, order2, order3, order4,
    duty_instruments, wave_instruments, noise_instruments,
    routines,
    waves
};
`;
    return data;
};
const subpatternFromNoiseMacro = function(noise_macro, ticks_per_row) {
    const subpattern = [
        ...Array(64)
    ].map(()=>new SubPatternCell());
    for(let n = 0; n < 6; n++){
        subpattern[n + 1].note = noise_macro[n] + 36;
    }
    const wrapPoint = Math.min(ticks_per_row, 7);
    subpattern[wrapPoint - 1].jump = wrapPoint;
    return subpattern;
};
