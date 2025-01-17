"use strict";

var IW_ABILITY_FLAG_ONLY_CAST_OUTSIDE   = 1;
var IW_ABILITY_FLAG_ONLY_CAST_INSIDE    = 2;
var IW_ABILITY_FLAG_ONLY_CAST_AT_DAY    = 4;
var IW_ABILITY_FLAG_ONLY_CAST_AT_NIGHT  = 8;
var IW_ABILITY_FLAG_CAN_TARGET_CORPSES  = 16;
var IW_ABILITY_FLAG_ONLY_TARGET_CORPSES = 32;
var IW_ABILITY_FLAG_CAN_TARGET_OBJECTS  = 64;
var IW_ABILITY_FLAG_ONLY_TARGET_OBJECTS = 128;
var IW_ABILITY_FLAG_ONLY_CAST_IN_COMBAT = 256;
var IW_ABILITY_FLAG_ONLY_CAST_NO_COMBAT = 512;
var IW_ABILITY_FLAG_DOES_NOT_REQ_VISION = 1024;
var IW_ABILITY_FLAG_IGNORE_LOS_BLOCKERS = 2048;
var IW_ABILITY_FLAG_CAN_CAST_IN_TOWN    = 4096;
var IW_ABILITY_FLAG_USES_ATTACK_RANGE   = 8192;
var IW_ABILITY_FLAG_AUTOCAST_ATTACK     = 16384;
var IW_ABILITY_FLAG_TOGGLE_OFF_ON_DEATH = 32768;
var IW_ABILITY_FLAG_KEYWORD_SPELL       = 65536;
var IW_ABILITY_FLAG_KEYWORD_ATTACK      = 131072;
var IW_ABILITY_FLAG_KEYWORD_SINGLE      = 262144;
var IW_ABILITY_FLAG_KEYWORD_AOE         = 524288;
var IW_ABILITY_FLAG_KEYWORD_WEATHER     = 1048576;
var IW_ABILITY_FLAG_KEYWORD_AURA        = 2097152;