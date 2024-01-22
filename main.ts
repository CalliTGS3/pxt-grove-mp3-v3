/**
 * Grove MP3 V3 extension for calliope.
 * Serial interface.
 *
 * Most of the functions copied from:
 * https://github.com/imake-it/pxt-grove_mp3_v3
 *
 * SPEC: https://cdn.sparkfun.com/assets/7/c/0/c/6/WT2003S-16S_Chip_V1.03.pdf
 *
 * @author Raik Andritschke
 *
 * Be careful with the power supply via the calliope
 * 
 */

//% color=#000080 icon="\uf001" block="GroveMP3V3"
namespace grove_mp3_v3 {

    const WT2003S_START_CODE = 0x7E
    const WT2003S_END_CODE = 0xEF
    const WT2003S_SET_PLAYMODE_SINGLE_NO_LOOP = 0x00
    const WT2003S_SET_PLAYMODE_SINGLE_LOOP = 0x01
    const WT2003S_SET_PLAYMODE_ALL_LOOP = 0x02
    const WT2003S_SET_PLAYMODE_RANDOM = 0x03

    let TX = SerialPin.C17;
    let RX = SerialPin.C16;
    let BAUD = BaudRate.BaudRate9600;

    //% blockId="initMP3" block="Initialisiere Serielle Schnittstelle mit TX Pin %tx | RX Pin %rx | Baudrate %baud"
    //% rx.fieldEditor="gridpicker" rx.fieldOptions.columns=3
    //% rx.fieldOptions.tooltips="false"
    //% tx.fieldEditor="gridpicker" tx.fieldOptions.columns=3
    //% tx.fieldOptions.tooltips="false"
    //% weight=50
    //% tx.defl=SerialPin.C17
    //% rx.defl=SerialPin.C16
    //% baud.defl=BaudRate.BaudRate9600
    export function initMP3(tx: SerialPin, rx: SerialPin, baud: BaudRate) {
        // initialize serial port
        TX = tx;
        RX = rx;
        BAUD = baud;
        serial.redirect(TX, RX, BAUD);
    }

    function zeroAdding(trackNumber: number): string {
        let s = trackNumber + "";
        while (s.length < 4) {
            s = "0" + s;
        }
        return s;
    }

    //% blockId="playTrackByName" block="Spiele Track %trackNumber über Name (0001.mp3, 0002.mp3 ..) im Wurzelverzeichnis"
    //Plays 0001.mp3, 0002.mp3 and so on in root
    export function playTrackByName(trackNumber: number) {
        let padString = zeroAdding(trackNumber);
        //serial.writeLine(padString)

        // Convert digits to string to write them into the array
        let sDigit00 = padString.charCodeAt(0).toString();
        let sDigit01 = padString.charCodeAt(1).toString();
        let sDigit02 = padString.charCodeAt(2).toString();
        let sDigit03 = padString.charCodeAt(3).toString();

        let hexArray: string[] = ["0x07", "0xA3", sDigit00, sDigit01, sDigit02, sDigit03];
        writeBuffer(hexArray);

    }

    //% blockId="playTrack" block="Spiele Track %trackNumber im Wurzelverzeichnis"
    //Plays mp3 files in root by index
    export function playTrack(trackNumber: number) {

        let digit00 = (trackNumber >> 8) & 0xFF;
        let digit01 = 0xFF & trackNumber;

        // Convert digits to string to write them into the array
        let sDigit00 = digit00.toString();
        let sDigit01 = digit01.toString();

        let hexArray: string[] = ["0x05", "0xA2", sDigit00, sDigit01];
        writeBuffer(hexArray);

    }

    //% blockId="stopPlay" block="Stop"
    export function stopSong() {
        let hexArray: string[] = ["0x03", "0xAB"];
        writeBuffer(hexArray);
    }

    //% blockId="nextTrack" block="Nächster Track"
    export function nextTrack() {
        let hexArray: string[] = ["0x03", "0xAC"];
        writeBuffer(hexArray);
    }

    //% blockId="prevTrack" block="Vorhergehender Track"
    export function prevTrack() {
        let hexArray: string[] = ["0x03", "0xAD"];
        writeBuffer(hexArray);
    }

    //% blockId="playMode" block="Setze Abspielmodus auf %mode"
    export function playMode(mode: number) {
        if (mode > 3 || mode < 0) {
            mode = 0;
        }

        let sMode = mode.toString();

        let hexArray: string[] = ["0x04", "0xAF", sMode];
        writeBuffer(hexArray);
    }

    //% blockId="setVolume" block="Setze Lautstärke auf %volume"
    //% volume.min=0 volume.max=30 volume.defl=30
    //Can take more than 150ms to complete
    export function setVolume(volume: number) {
        let clippedVolume = Math.min(Math.max(volume, 0), 30);
        let stringVol: string = clippedVolume.toString();
        let hexArray: string[] = ["0x04", "0xAE", stringVol];
        writeBuffer(hexArray);
    }

    function writeBuffer(hexArray: string[]) {
        let bufferLength: number = hexArray.length + 3 // 3 (Start Code, Check Code, End Code)
        let bufr = pins.createBuffer(bufferLength);

        let checkCode: number = 0; // Is calculated in the for loop (Length + Command + Data)

        for (let i = 0; i < hexArray.length; i++) {
            let hexNumber = parseInt(hexArray[i]);
            bufr.setNumber(NumberFormat.Int8LE, i + 1, hexNumber);
            checkCode += hexNumber;
        }

        bufr.setNumber(NumberFormat.Int8LE, 0, WT2003S_START_CODE); //Start Code
        bufr.setNumber(NumberFormat.Int8LE, bufferLength - 2, checkCode);
        bufr.setNumber(NumberFormat.Int8LE, bufferLength - 1, WT2003S_END_CODE); //End Code
        serial.writeBuffer(bufr);
        control.waitMicros(200000);
    }

    //% blockId="queryNumberOfTracks" block="Ermittle Anzahl Tracks"
    export function queryNumberOfTracks(): number {
        let hexArray: string[] = ["0x03", "0xC5"];
        writeBuffer(hexArray);
        let bufr = serial.readBuffer(3);
        let num = bufr.getNumber(NumberFormat.UInt16BE, 1)
        return num;
    }

}