//GLOBALS
var world;
const WORLD_WIDTH = 512;

//INIT
function init(){

}

//WORLDGEN
function gen(){
    world = new Array(WORLD_WIDTH);
    for(int i = 0; i < WORLD_WIDTH; i++){
	world[i] = new Array(WORLD_WIDTH);
	for(int j = 0; j < WORLD_WIDTH; j++){
	    world[i][j] = 0;
	}
    }
}
