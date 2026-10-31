// GB Studio v4.2.0, MIT; conversão técnica de TypeScript para ES modules.
import { PatternCell } from "./PatternCell.mjs";
const LAST_VERSION = 6;
export class Song {
    version;
    name;
    artist;
    comment;
    filename;
    duty_instruments;
    wave_instruments;
    noise_instruments;
    waves;
    ticks_per_row;
    timer_enabled;
    timer_divider;
    patterns;
    sequence;
    constructor(){
        this.version = LAST_VERSION;
        this.name = "";
        this.artist = "";
        this.comment = "";
        this.filename = "song";
        this.duty_instruments = [];
        this.wave_instruments = [];
        this.noise_instruments = [];
        this.waves = [];
        this.ticks_per_row = 6;
        this.timer_enabled = false;
        this.timer_divider = 0;
        this.patterns = [];
        this.sequence = [];
    }
    addDutyInstrument(instrument) {
        const list = this.duty_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }
    addWaveInstrument(instrument) {
        const list = this.wave_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }
    addNoiseInstrument(instrument) {
        const list = this.noise_instruments;
        instrument.index = list.length;
        list.push(instrument);
    }
    usesInstrument(type, index) {
        let cols = [];
        if (type === "duty") {
            cols = [
                0,
                1
            ];
        }
        if (type === "wave") {
            cols = [
                2
            ];
        }
        if (type === "noise") {
            cols = [
                3
            ];
        }
        for (const pattern of this.patterns){
            for (const row of pattern){
                for (const col of cols){
                    if (row[col].instrument === index) return true;
                }
            }
        }
        return false;
    }
    removeInstrument(type, index) {
        let list = [];
        let cols = [];
        if (type === "duty") {
            list = this.duty_instruments;
            cols = [
                0,
                1
            ];
        }
        if (type === "wave") {
            list = this.wave_instruments;
            cols = [
                2
            ];
        }
        if (type === "noise") {
            list = this.noise_instruments;
            cols = [
                3
            ];
        }
        for (const pattern of this.patterns){
            for (const row of pattern){
                for (const col of cols){
                    const instrumentIndex = row[col].instrument;
                    if (instrumentIndex) {
                        if (instrumentIndex === index) {
                            row[col].instrument = null;
                        }
                        if (instrumentIndex > index) {
                            row[col].instrument = instrumentIndex - 1;
                        }
                    }
                }
            }
        }
        list.splice(index, 1);
        for(let idx = 0; idx < list.length; idx++){
            list[idx].index = idx;
        }
    }
}
