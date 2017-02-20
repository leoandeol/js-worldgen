//GLOBALS
var world;
const WORLD_WIDTH = 513;
const COEFF_SCALE = 1.5;

const TileType = {
    WATER : 0,
    GRASS : 1,
    SAND : 2
};

//Random function between two ints
function rand(low,high){
    return Math.floor((Math.random() * high) + low); 
}

//INIT
function init(){
    gen();
}

//WORLDGEN
function gen(){
    //Fillin
    world = diamondsquare(WORLD_WIDTH);
}

function diamondsquare(SIZE){
    var size = SIZE-1;
    var extent = size;
    var half = size / 2;
    var scale = half * COEFF_SCALE;

    var points = new Array(SIZE);
    for(var i = 0; i < SIZE; i++){
	points[i] = new Array(SIZE);
    }

    points[0][0]=0;
    points[0][size]=0;
    points[size][0]=0;
    points[size][size]=0;

    while(size > 1){
	// SQUARE
	for(var x = 0; x < extent; x+= size)
	{
	    for(var y = 0; y < extent; y+=size)
	    {
		var sq_avg = (points[x][y].elevation + points[x+size][y].elevation + points[x][y+size].elevation + points[x+size][y+size].elevation)/4;
		points[x+half][y+half].elevation = sq_avg + rand(-scale,scale*2);
	    }
	}
	//DIAMOND
	for(var x = 0; x < extent; x+= size)
	{
	    for(var y = 0; y < extent; y+=size)
	    {
		var avg;
		if(y > 0){
		    avg = (points[x][y].elevation + points[x+size][y].elevation + points[x+half][y+half].elevation + points[x+half][y-half].elevation) / 4;
		}else{
		    avg = (points[x][y].elevation + points[x+size][y].elevation + points[x+half][y+half].elevation) / 3;
		}
		points[x+half][y].elevation = avg + rand(-scale, scale*2);
		
		if(y < extent - size){
		    avg = (points[x+size][y+size].elevation + points[x+half][y+half].elevation + points[x+size][y+size].elevation + points[x+half][y+size+half].elevation) / 4;
		}else{
		    avg = (points[x+size][y+size].elevation + points[x+half][y+half].elevation + points[x+size][y+size].elevation) / 3;
		}
		points[x+half][y+size].elevation = avg + rand(-scale, scale*2);
		
		if(x > 0){
		    avg = (points[x][y].elevation + points[x+half][y+half].elevation + points[x][y+size].elevation + points[x-half][y+half].elevation) / 4;
		}else{
		    avg = (points[x][y].elevation + points[x+half][y+half].elevation + points[x][y+size].elevation) / 3;
		}
		points[x][y+half].elevation = avg + rand(-scale, scale*2);
		
		if(x < extent - size){
		    avg = (points[x+size][y+size].elevation + points[x+half][y+half].elevation + points[x+size][y+size].elevation + points[x+size+half][y+half].elevation) / 4;
		}else{
		    avg = (points[x+size][y+size].elevation + points[x+half][y+half].elevation + points[x+size][y+size].elevation) / 3;
		}
		points[x+size][y+half].elevation = avg + rand(-scale, scale*2);
	    }
	}
	size /= 2;
	half /= 2;
	scale = half * COEFF_SCALE;
    }
}
