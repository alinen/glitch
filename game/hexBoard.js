var CAVE = 
{
   EMPTY: 0,
   BLOOD: 1,
   BEAST: 2
}

class MazeNode
{
   constructor()
   {
      this.neighbors = [];
      this.visited = false;
      this.type = CAVE.EMPTY;
   }
}

var NEIGHBOR = 
{
   NE : {value:0, dir:{x: 0.866, y: 0.500}, offset:{i: 1, j: 1} },
   N  : {value:1, dir:{x: 0.000, y: 1.000}, offset:{i: 2, j: 0} },
   NW : {value:2, dir:{x:-0.866, y: 0.500}, offset:{i: 1, j:-1} },
   SW : {value:3, dir:{x:-0.866, y:-0.500}, offset:{i:-1, j:-1} },
   S  : {value:4, dir:{x: 0.000, y:-1.000}, offset:{i:-2, j: 0} },
   SE : {value:5, dir:{x: 0.866, y:-0.500}, offset:{i:-1, j: 1} }
};
var NEIGHBORS = 
   [NEIGHBOR.NE, 
    NEIGHBOR.N, 
    NEIGHBOR.NW, 
    NEIGHBOR.SW, 
    NEIGHBOR.S, 
    NEIGHBOR.SE];

class HexBoard
{
   constructor(hexSize, boardSize, margin)
   {
      this.b = hexSize; // see docs, length of hex size
      this.r = this.b / (2 * Math.tan(30 * DEG2RAD)); // see docs
      this.bRes = Math.sqrt(this.b * this.b - this.r * this.r); // see docs, extends b to edge of bounding square
      this.uvs = []; // static
      this.vertices = [];  // static, kept for lookup, may become dynamic
      this.colors = [];   // dynamic, should change when maze changes
      this.lines = []; // mostly static, changes when maze changes
      this.lineColors = []; // mostly static, changes when maze changes
      this.boardSize = boardSize;

      this.gridPos = {x:0,y:0,z:-8};
      this.linePos = {x:0,y:0,z:-7};
      this.margin = 1.0-margin;
      this.numHex = 0;
      this.numRows = 2*(Math.floor(boardSize/this.r));
      this.numCols = Math.floor((2*(boardSize - this.b)/(this.b*3))+0.5);
      this.hexWidth = 3 * this.b * this.numCols;

      this.shape = [];
      var angle = 60.0 * DEG2RAD;
      for (var i = 0; i < 6; i ++)
      {
         this.shape.push(0.0);
         this.shape.push(0.0);
         this.shape.push(0.0);
   
         this.shape.push(this.b * Math.cos(angle * i));
         this.shape.push(this.b * Math.sin(angle * i));
         this.shape.push(0.0);
   
         this.shape.push(this.b * Math.cos(angle * (i+1)));
         this.shape.push(this.b * Math.sin(angle * (i+1)));
         this.shape.push(0.0);       
      }      
      this.numHexPts = this.shape.length;          
   }

   initBoard()
   {
      var vertexList = [];
      var textureList = [];
      var colorList = [];

      var lVertexList = [];
      var lTextureList = [];
      var lColorList = [];      

      var startx = -this.boardSize;
      var y = -this.boardSize + this.r;
      for (var i = 0; i < this.numRows; i++)
      {
         var x = startx + 2*this.b + this.bRes;
         if (i % 2 == 1)
         {
            x = startx + this.b;
         }
   
         for (var j = 0; j < this.numCols; j++)
         {         
            for (var p = 0; p < this.shape.length; p+=3)
            {
               vertexList.push(this.shape[p] * this.margin+x);
               vertexList.push(this.shape[p+1] * this.margin+y);
               vertexList.push(this.shape[p+2]);
   
               textureList.push((this.shape[p] * this.margin+x+this.boardSize)/(2*this.boardSize));
               textureList.push((this.shape[p+1] * this.margin+y+this.boardSize)/(2*this.boardSize));
   
               colorList.push(0.1);
               colorList.push(0.1);
               colorList.push(0.1);
               colorList.push(0.5);
            }

            for (var p = 0; p < this.shape.length; p+=3)
            {
               if (p % 9 == 0) continue; // skip middle point

               lVertexList.push(this.shape[p] * 0.95 + x);
               lVertexList.push(this.shape[p+1] * 0.95 + y);
               lVertexList.push(this.shape[p+2]);
  
               lColorList.push(1.0);
               lColorList.push(1.0);
               lColorList.push(1.0);
               lColorList.push(0);

               lTextureList.push(0);
               lTextureList.push(0); 
            }            
            this.numHex++;
            x += 3 * this.b;
         }
         y += this.r;
      }

      this.vertices = new Float32Array(vertexList);
      this.colors = new Float32Array(colorList);
      this.uvs = new Float32Array(textureList);

      this.lines = new Float32Array(lVertexList);
      this.lineColors = new Float32Array(lColorList);
      this.lineTexs = new Float32Array(lTextureList);            

      console.log("Init board: " + this.numRows + " " + this.numCols + " " + this.numHex);
/*
      for (var idx = 0; idx < this.numHex; idx++)
      {
         // draw lines between each node and it's neighbors
         var p = this.getHexCenterById(idx);         
         for (var n = 0; n < NEIGHBORS.length; n++)
         {
            var x = p.x + NEIGHBORS[n].dir.x * this.r * 2;
            var y = p.y + NEIGHBORS[n].dir.y * this.r * 2;

            //
            vertexList.push(p.x);
            vertexList.push(p.y);
            vertexList.push(0.0);
  
            vertexList.push(x);
            vertexList.push(y);
            vertexList.push(0.0);

            colorList.push(1);
            colorList.push(1);
            colorList.push(1);
            colorList.push(0);

            colorList.push(1);
            colorList.push(1); 
            colorList.push(1); 
            colorList.push(0);

            textureList.push(0);
            textureList.push(0); 

            textureList.push(0);
            textureList.push(0); 
         }
      }     
*/
   }   

   computeMaze()
   {
      this.maze = []; // ASN: What is the javascript way to init an array of type A and size N?
      for (var i = 0; i < this.numHex; i++)
      {
         this.maze.push(new MazeNode());
         this.maze[i].visited = false;
         this.maze[i].neighbors = [];
         this.maze[i].type = CAVE.EMPTY;
      }

      // select random start node and push to a stack
      // do bfs search
      var startIdx = Math.floor(Math.random() * this.numHex);

      var Q = [];
      Q.push(startIdx);
      while (Q.length > 0)
      {
         var nextIdx = Q.pop();
         this.maze[nextIdx].visited = true;

         var allNeighbors = this.getNeighbors(nextIdx);
         this.shuffle(allNeighbors);

         for (var n = 0; n < allNeighbors.length; n++)
         {
            var neighbor = allNeighbors[n];
            if (!this.maze[neighbor].visited)
            {
               this.maze[neighbor].visited = true;
               this.maze[nextIdx].neighbors.push(neighbor);
               this.maze[neighbor].neighbors.push(nextIdx);
               Q.push(neighbor);
            }
         }
      }

   }

   shuffle(array) // Fisher–Yates_shuffle
   {
      for (var i = array.length-1; i > 0; i--)
      {
         var roll = Math.floor(Math.random() * i);
         var tmp = array[i];
         array[i] = array[roll];
         array[roll] = tmp;
      }
   }

   isNeighbor(idx, neighborIdx, neighbors)
   {
      for (var i = 0; i < neighbors.length; i++)
      {
         if (neighbors[i] === neighborIdx) return true;
      }
      return false;
   }

   getHexSidesById(idx)
   {
      var sides = [];
      var offset = idx * this.numHexPts;
      for (var i = 0; i < 6; i++)
      {
         var tri = i*3*3; // 3 vertices per tri, 3 components oer vertex
         var p2 = 1*3; // want 2nd side, so points 2 and 3
         var p3 = 2*3;

         var x =  this.vertices[offset+tri+p2+0]; 
         var y =  this.vertices[offset+tri+p2+1]; 
         sides.push({x:x,y:y});

         x =  this.vertices[offset+tri+p3+0]; 
         y =  this.vertices[offset+tri+p3+1]; 
         sides.push({x:x,y:y});
      }
      return sides;
   }

   getNeighborId(idx, side)
   {
      var cell = this.idToCell(idx);
      var i = cell.i + side.offset.i; 
      var j = cell.j + side.offset.j; 
      if (this.isValidHex({i:i, j:j}))
      {
         return this.cellToId({i:i, j:j});
      }
      return -1;
   }

   getNeighbors(idx)
   {
      var cell = this.idToCell(idx); 
      var potentials = [
         {i: cell.i+1, j: cell.j-1},
         {i: cell.i+2, j: cell.j},
         {i: cell.i+1, j: cell.j+1},
         {i: cell.i-1, j: cell.j-1},
         {i: cell.i-2, j: cell.j},
         {i: cell.i-1, j: cell.j+1}
      ];

      var neighbors = [];
      for (var i = 0; i < potentials.length; i++)
      {
         if (this.isValidHex(potentials[i]))
         {
            neighbors.push(this.cellToId(potentials[i]));
         }
      }

      return neighbors;
   }

   findClosest(idx)
   {
      return idx; // let items overlap for now:w
   }

   getMoves(idx)
   {
      var moves = [];
      for (var i = 0; i < NEIGHBORS.length; i++)
      {
         if (this.isValidMove(idx,NEIGHBORS[i]))
         {
            moves.push(NEIGHBORS[i]);
         }
      }
      return moves;
   }

   showHexById(idx, alpha)
   {
      var offset = idx * 18 * 4;
      for (var i = 0; i < 18; i++)
      {
         this.colors[offset+i*4+3] = alpha;
      } 

      var node = this.maze[idx];
      for (var s = 0; s < NEIGHBORS.length; s++)        
      {
         var neighborIdx = this.getNeighborId(idx, NEIGHBORS[s]);
         var sideOffset = (idx * 6 + s) * 2 * 4;
         //var pathOffset = ((this.numHex + idx) * 6 + s) * 2 * 4;
//       console.log( NEIGHBORS[s].dir.x+" "+ NEIGHBORS[s].dir.y+" "+neighborIdx+" "+sideOffset+" "+pathOffset+" "+node.neighbors);

         if (neighborIdx === -1 || this.isNeighbor(idx, neighborIdx, node.neighbors))
         {
            this.lineColors[sideOffset+0+3] = 0;
            this.lineColors[sideOffset+4+3] = 0;
         }
         else
         {
            this.lineColors[sideOffset+0+3] = 1;
            this.lineColors[sideOffset+4+3] = 1;
         }
      }      
   }

   getHexCenterById(idx)
   {
      var offset = idx * this.numHexPts;
      var x =  this.vertices[offset+0+0]; // => 0 is first vertex, 0 is x'th element
      var y =  this.vertices[offset+0+1]; // => 0 is first vertex, 1 is y'th element
      return {x:x, y:y};
   }   

   isValidMove(idx, dir)
   {
      var node = this.maze[idx];
      var neighborIdx = this.getNeighborId(idx, dir);
      for (var i = 0; neighborIdx !== -1 && i < node.neighbors.length; i++)
      {
         if (neighborIdx === node.neighbors[i]) return neighborIdx;
      }
      return -1;
   }
 
   isValidHex(cell)
   {
      if (cell.i < 0) return false;
      if (cell.j < 0) return false;
   
      if (cell.i >= this.numRows) return false;
      if (cell.j >= this.numCols*2) return false;
   
      if (cell.i % 2 === 0 && cell.j % 2 === 0) return false;
      if (cell.i % 2 === 1 && cell.j % 2 === 1) return false;
   
      return true;
   }
   
   pointToId(p)
   {   
      var xoffset = -sqrSize + this.bRes * 0.5;
      var yoffset = -sqrSize + this.r * 0.5;
      var x = p[0] - xoffset;
      var y = p[1] - yoffset;
      var row = Math.floor(y / this.hexR);
      var col = Math.floor(x / (2 * (this.b - 0.5*this.bRes)));
   
      var i = row;
      var j = 0;
      if (i % 2 == 0)
      {
         j = (j-1)/2.0;
      }
      else
      {
         j = j/2.0;
      }
   
      var idx = i * this.numCols + j;
      return idx;
   }
   
   pointToCell(p)
   {
      var idx = this.pointToHexId(p);
      return this.hexIdToCell(idx);
   }
   
   idToCell(idx)
   {
      var row = Math.floor(idx/this.numCols);
      var tmp = idx - row * this.numCols;
      
      var i = 0;
      var j = 0;
      if (row % 2 == 0)
      {
         i = row;
         j = tmp*2+1;
      }
      else
      {
         i = row;
         j = tmp*2;
      }
   
      return {i:i,j:j};
   }
   
   cellToId(cell)
   {
      var idx = 0;
      if (cell.i % 2 == 0)
      {
         idx = cell.i * this.numCols + (cell.j-1)/2;
      }
      else
      {
         idx = cell.i * this.numCols + cell.j/2;
      }
      return idx;
   }

}

