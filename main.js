const [, , firstArg] = process.argv;

const fs = require("fs");

require('dotenv').config();

const metadataUpdate = require('./src/lib/metadataUpdate');
const metadataCreate = require('./src/lib/metadataCreate');
const { initializeExecutionData } = require('./src/lib/makeLog');

(async () => {
  try {
    if(!fs.existsSync('src/executionData.json')){
        initializeExecutionData();
    }
    if (firstArg == 'update') {
      await metadataUpdate.update();
    // } else if (firstArg == '') {
    //   metadataCreate.getTokenData();
    } else if(firstArg == 'create' || !firstArg){
      console.log("\n" +
".......~.~~..~.~~....~.........~.~.....~....~~.~_~.~.~~.._~......~....~~...\n" +
".....~.~........_~~..(gg,-.......~.......~~..._~_(MMb...~..~.~~...~..~..~~~\n" +
"..~............~....(MMKWMNJ~~..~.~..-.....~.__(M#ZZM;.~..~~...~~........~.\n" +
"......~_~~..~..~~.~.J#(NZZZMN,-((J+gggNNNgggJJ#!dWZZdb~..~._..~............\n" +
"__.~~__~~....~...~~.J#(MXZZZMMMMMMMMMMMM@    '` MKZZX#..~...~....~...~..~~.\n" +
"~~_~~~~.....~.~.~...JN,MHZZZZXMMMMMMMM@`        -NXZXN-~......~...~........\n" +
"~_~~....~~.~~.~..~..(MHHWZZZZXMMMMMMMM`          ,HNmXN,.~...~........~....\n" +
"~__~.~~...~.~......(MZZZZZZZZZMMMMMMMF              .TMN-.~.....~~.~~..~...\n" +
"~~~..~.~~~.~....~.(MZZZZZZZZZZZWMMMH#`...,      ..,    (b.._~.~....~.~.....\n" +
".......~....~...~(#ZZZZZZZZZyXQQgHY= .t  .h    J`  W.   M/.....~....~......\n" +
"~..~.~~.~..~...~.J#'''MmgM''7!`      #.....;  .h..-J]   d]..~.~.~.~........\n" +
".~_...~.~.~......M!                  N  vwd\  .b 1WHF   ,@.................\n" +
"...~.~.~.....~...M_                  ,h .dF    ?e.u#`   .#.......~~~.~....~\n" +
"~.....~..........d|                    ?'!    .  qkYY9X+.F...........~.~...\n" +
".~~..........~...(b                .J,       ,Mh9_...__ ?N,.....~~..~......\n" +
"..~~.~~_.~~~....~.M,                T3       (dF........_.#....~.~......~..\n" +
"...._~__~_~~_.....(N.                        .9b......._`.#...~.~..~...~...\n" +
"_~~~_...._~~~~....~/N,    ..+g-,               ?N,_..._(.B~..~...~..._~....\n" +
"..~..~.~..~~~..._~.._Wa .JMMMMMMN,               (TWMMMH<.....~~..........~\n" +
"..~.~.~...~~~..~_...(gMMMMMMMMMMMM,         ....JMMMHggM#~..~......~......~\n" +
".~..~...~...~_......dNmmmgggggHMMMMHQMMMMMMMMMggggggggmHN....~..~....~~....\n" +
"~.~..~..........~...(MHggHgggggggggggggggggggggggHNNNmgMb...~.~.~~.......~.\n" +
"...~..~~.~.~._~_.~.(MMggggMMMMNNNNNHMMgggggmgggHggggmgggMb..~..~...~~......\n" +
"........~...~...~.(MMgggggggggggggggggggggggmggggggmgggggM[......~~........\n" +
"~..~.~~.......~..~(NgggmgggggggggggggggmgmggHgmggmgggmggmHN-..~.~.....~..~.\n" +
".~.........~.~..~-MMggmgmgmggggggggggmggmggMMNHgggmgggmgggMb~....~..~.~....\n" +
"..~......~....~._(MggmgggggmggggggggggmggHMHWXMNgggmggggggHM-~....~~.......\n" +
".................dNggggmggggmgmgmgmggggggMHMMHMMHgggmggmgggM].~~..~..~....~\n" +
"......~.....~...~MMgmgggmgmggggmgggmgmgggMMNHNNMgmgggmggmggM#...~.~.~~_~~..\n" +
".~.~....~.~...~.(MgggmgggggggmggggggggmgggMNMMMMggmggggggmgHM_...~..~..~_..\n" +
"......._........(MggggmggmgMggggmgmggggmgggMNNMggggmgmggggggM{.~.~~.~~.....\n" +
"...~........~...(MggmggmgggMggmggmggmgggmggggMgggmggggmgmgggM}.~.~....~~~._\n" 
      );

      await metadataCreate.createMetadata();
      console.clear();
    } else {
      throw new Error('コマンドが違います')
    }
  } catch (error) {
    console.error(error.message);
  }
})();






