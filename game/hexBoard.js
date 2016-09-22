var CAVE = 
{
   EMPTY: 0,
   BLOOD: 1,
   BEAST: 2,
   STAR: 3,
   ORB: 4,
   HEART: 5,
   SPAWN: 6,
   PLAYER: 7,
   TEETH: 8
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
      this.bridgeGeometry = [];

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

   addVertex(px, py, pz, vertexList, textureList, colorList)
   {
      vertexList.push(px);
      vertexList.push(py);
      vertexList.push(pz);
   
      textureList.push((px+this.boardSize)/(2*this.boardSize));
      textureList.push((py+this.boardSize)/(2*this.boardSize));
   
      colorList.push(1.0);
      colorList.push(1.0);
      colorList.push(1.0);
      colorList.push(0.0);      
   }

   initBoard()
   {
      var vertexList = [];
      var textureList = [];
      var colorList = [];

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
               this.addVertex(this.shape[p] * this.margin + x, this.shape[p+1] * this.margin + y, 0, 
                     vertexList, textureList, colorList);
            }

            this.numHex++;
            x += 3 * this.b;
         }
         y += this.r;
      }
      this.vertices = new Float32Array(vertexList);

      this.bridgeGeometry = []; // map between idx and starting geometry ID of bridges in each direction
      for (var idx = 0; idx < this.numHex; idx++)
      {
         // draw lines between each node and it's neighbors
         this.bridgeGeometry[idx] = [-1,-1,-1,-1,-1,-1];
         var sides = this.getHexSidesById(idx)
         for (var n = 0; n < NEIGHBORS.length; n++)
         {
            var neighborIdx = this.getNeighborId(idx, NEIGHBORS[n]);
            if (neighborIdx < idx) // we already created the geometry for it, or -1
            {
               if (neighborIdx !== -1)
               {
                  var neighborSideId = (n+3) % 6; // get corresponding side from neighbor
                  var bridgeId = this.bridgeGeometry[neighborIdx][neighborSideId];
                  this.bridgeGeometry[idx][n] = bridgeId;
               }
               continue;
            }

            // create bridge
            this.bridgeGeometry[idx][n] = vertexList.length / 3;  // store triangle index so we can show it later

            var neighborSides = this.getHexSidesById(neighborIdx);
            var neighborSideId = (n+3) % 6; // get corresponding side from neighbor
            var neighborSideP1 = neighborSides[neighborSideId*2+0];
            var neighborSideP2 = neighborSides[neighborSideId*2+1];

            var p1 = sides[n*2+0];
            var p2 = sides[n*2+1];
            //console.log(neighborIdx, neighborSides[0], neighborSideP1.x, neighborSideP2.x, p1.x, p2.x);

            this.addVertex(p2.x, p2.y, 0, vertexList, textureList, colorList);            
            this.addVertex(p1.x, p1.y, 0, vertexList, textureList, colorList);
            this.addVertex(neighborSideP2.x, neighborSideP2.y, 0, vertexList, textureList, colorList);

            this.addVertex(neighborSideP2.x, neighborSideP2.y, 0, vertexList, textureList, colorList);
            this.addVertex(neighborSideP1.x, neighborSideP1.y, 0, vertexList, textureList, colorList);
            this.addVertex(p2.x, p2.y, 0, vertexList, textureList, colorList);                        
         }
         //console.log(this.bridgeGeometry[0]);
      }          

      this.vertices = new Float32Array(vertexList); // reset with new vertices
      this.colors = new Float32Array(colorList);
      this.uvs = new Float32Array(textureList);

      console.log("Init board: " + this.numRows + " " + this.numCols + " " + this.numHex + " "+ this.vertices.length/3);
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

   getPath(startIdx, targetIdx)
   {
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

   isNeighbor(idx, neighborIdx)
   {
      if (idx === -1 || neighborIdx === -1) return false;

      var neighbors = this.maze[idx].neighbors;
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

   getHexType(idx)
   {
      return this.maze[idx].type;
   }
   
   setHexType(idx, type)
   {
      this.maze[idx].type = type;
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

   getMoves(idx)
   {
      var moves = [];
      for (var i = 0; i < NEIGHBORS.length; i++)
      {
         if (this.isValidMove(idx,NEIGHBORS[i]) !== -1)
         {
            moves.push(NEIGHBORS[i]);
         }
      }
      return moves;
   }

   showHexById(idx, alpha)
   {
      var showBlood = (this.maze[idx].type === CAVE.BEAST || this.maze[idx].type === CAVE.BLOOD);
      var offset = idx * 18 * 4; // idx * #hexvertices * numcolorchannels
      for (var i = 0; i < 18; i++)
      {
         if (showBlood)
         {
            this.colors[offset+i*4+0] = 1.0;
            this.colors[offset+i*4+1] = 0.2;
            this.colors[offset+i*4+2] = 0.2;
         }
         this.colors[offset+i*4+3] = alpha;
      } 

      var node = this.maze[idx];
      for (var s = 0; s < NEIGHBORS.length; s++) 
      {
         var neighborIdx = this.getNeighborId(idx,NEIGHBORS[s]);
         var showNeighborBlood = (this.maze[idx].type === CAVE.BEAST || this.maze[idx].type === CAVE.BLOOD);
         if (neighborIdx !== -1 && this.isNeighbor(idx, neighborIdx))
         {
            var neighborGeomIdx = this.bridgeGeometry[idx][s] * 4;
            if (neighborGeomIdx === -1) continue
            for (var i = 0; i < 6; i++)
            {
               if (showBlood && showNeighborBlood)
               {
                  this.colors[neighborGeomIdx+i*4+0] = 1.0;
                  this.colors[neighborGeomIdx+i*4+1] = 0.2;
                  this.colors[neighborGeomIdx+i*4+2] = 0.2;                  
               }
               this.colors[neighborGeomIdx+i*4+3] = alpha;
            }
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

   findEmpty()
   {
      var idx = Math.floor(Math.random() * this.numHex);
      while (this.getHexType(idx) !== CAVE.EMPTY) idx = (idx + 1) % this.numHex;
      return idx;
   }
   
   pointInRhombus(x, y)
   {
      var shearx = (x - 0.577 * y);
      var sqr = Math.floor(shearx / this.b);

      var n = {x: 0.707, y: 0.707};
      var a = {x: sqr*this.b, y: this.b};
      var dot = (x - a.x)*n.x + (y - a.y)*n.y;
      var tri = sqr * 2;
      if (dot > 0) tri = tri + 1;

      var hexcol = Math.floor(tri / 3);
      return hexcol
   }
   
   pointToId(p)
   {   
      var x = p.x + worldSize;
      var y = p.y + worldSize;

      var half_row = Math.floor(y/this.r);
      y = y - half_row*this.r;

      var hexcol = -1;
      var row = -1;
      if (half_row % 2 == 0) // what's this doing? see docs
      {
         hexcol = this.pointInRhombus(x,y);
         row = Math.floor(half_row * 0.5);
      }
      else
      {
         var width = this.numCols * this.b * 3 + this.bRes; // cols are reversed here
         x = width - x;
         var hexcolrev = this.pointInRhombus(x,y);
         hexcol = this.numCols*2 - hexcolrev - 1;
         row = Math.floor((half_row-1) * 0.5);
      }

      var cell = {};
      if (hexcol % 2 === 0)
      {
         cell.j = Math.floor(hexcol);
         if (half_row % 2 ===0)
         {
            cell.i =  Math.floor(half_row-1);
         }
         else
         {
            cell.i =  Math.floor(half_row);
         }
      }
      else
      {
         cell.j = Math.floor(hexcol);
         if (half_row % 2 ===0)
         {
            cell.i =  Math.floor(half_row);
         }
         else
         {
            cell.i =  Math.floor(half_row-1);
         }         
      }
      var idx = -1;      
      if (this.isValidHex(cell))
      {
         idx = this.cellToId(cell);
      } 

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

