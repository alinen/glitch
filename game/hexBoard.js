class MazeNode
{
   constructor()
   {
      this.neighbors = [];
      this.visited = false;
   }
}

var NEIGHBOR = {
   NE : {value:0, dir:{x: 0.866, y: 0.500}, offset:{i: 1, j: 1} },
   N  : {value:1, dir:{x: 0.000, y: 1.000}, offset:{i: 2, j: 0} },
   NW : {value:2, dir:{x:-0.866, y: 0.500}, offset:{i: 1, j:-1} },
   SW : {value:3, dir:{x:-0.866, y:-0.500}, offset:{i:-1, j: 1} },
   S  : {value:4, dir:{x: 0.000, y:-1.000}, offset:{i:-2, j: 0} },
   SE : {value:5, dir:{x: 0.866, y:-0.500}, offset:{i:-1, j:-1} }
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

      this.gridPos = {x:0,y:0,z:-8.5};
      this.linePos = {x:0,y:0,z:-8.0};
      this.margin = 1.0-margin;
      this.numHex = 0;
      this.numRows = 2*(Math.floor(boardSize/this.r));
      this.numCols = Math.floor((2*(boardSize - this.b)/(this.b*3))+0.5);

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
   
               textureList.push((this.shape[p] * this.margin+x+10)/20.0);
               textureList.push((this.shape[p+1] * this.margin+y+10)/20.0);
   
               colorList.push(0.5);
               colorList.push(0.5);
               colorList.push(0.5);
               colorList.push(0.0);
            }
            this.numHex++;
            x += 3 * this.b;
         }
         y += this.r;
      }

      this.vertices = new Float32Array(vertexList);
      this.colors = new Float32Array(colorList);
      this.uvs = new Float32Array(textureList);

      console.log("Init board: " + this.numRows + " " + this.numCols + " " + this.numHex);

   }   

   computeMaze()
   {
      this.maze = []; // ASN: What is the javascript way to init an array of type A and size N?
      for (var i = 0; i < this.numHex; i++)
      {
         this.maze.push(new MazeNode());
         this.maze[i].visited = false;
         this.maze[i].neighbors = [];
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

      var vertexList = [];
      var colorList = [];
      var texList = [];
      for (var idx = 0; idx < this.maze.length; idx++)
      {
         // draw lines between each node and it's neighbors
         var node = this.maze[idx];
         var sides = this.getHexSidesById(idx);

         for (var s = 0; s < sides.length; s += 2)
         {
            if (this.isNeighborSide(idx, s/2.0, node.neighbors))
            {
               continue;
            }

            var p1 = sides[s];
            var p2 = sides[s+1];

            vertexList.push(p1.x);
            vertexList.push(p1.y);
            vertexList.push(0.0);
  
            vertexList.push(p2.x);
            vertexList.push(p2.y);
            vertexList.push(0.0);

            colorList.push(1);
            colorList.push(1);
            colorList.push(1);
            colorList.push(1);

            colorList.push(1);
            colorList.push(1); 
            colorList.push(1); 
            colorList.push(1); 

            texList.push(0);
            texList.push(0); 

            texList.push(0);
            texList.push(0); 
         }
      }

      for (var i = 0; i < this.maze.length; i++)
      {
         // draw lines between each node and it's neighbors
         var node = this.maze[i];
         var p1 = this.getHexCenterById(i);

         //console.log(node.neighbors);
         for (var n = 0; n < node.neighbors.length; n++)
         {
            var neighbor = node.neighbors[n];
            var p2 = this.getHexCenterById(neighbor);
            //console.log(neighbor + " "+p1.x+" "+p1.y+" "+p2.x+" "+p2.y);
            vertexList.push(p1.x);
            vertexList.push(p1.y);
            vertexList.push(0.0);
  
            vertexList.push(p2.x);
            vertexList.push(p2.y);
            vertexList.push(0.0);

            colorList.push(1);
            colorList.push(0);
            colorList.push(0);
            colorList.push(1);

            colorList.push(0);
            colorList.push(0); 
            colorList.push(0); 
            colorList.push(1); 

            texList.push(0);
            texList.push(0); 

            texList.push(0);
            texList.push(0); 
         }
      }     

      this.lines = new Float32Array(vertexList);
      this.lineColors = new Float32Array(colorList);
      this.lineTexs = new Float32Array(texList);
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

   isNeighborSide(idx, sideIdx, neighbors)
   {
      var neighborIdx = this.getNeighborId(idx, sideIdx);
      if (!this.isValidHex(neighborIdx)) return false;

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
      if (side === NEIGHBOR.NE.value) return this.cellToId({i: cell.i+1, j: cell.j+1});
      else if (side === NEIGHBOR.N.value) return this.cellToId({i: cell.i+2, j: cell.j});
      else if (side === NEIGHBOR.NW.value) return this.cellToId({i: cell.i+1, j: cell.j-1});
      else if (side === NEIGHBOR.SW.value) return this.cellToId({i: cell.i-1, j: cell.j-1});
      else if (side === NEIGHBOR.S.value) return this.cellToId({i: cell.i-2, j: cell.j});
      else if (side === NEIGHBOR.SE.value) return this.cellToId({i: cell.i-1, j: cell.j+1});
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

   setHexAlphaById(idx, alpha)
   {
      var offset = idx * this.numHexPts;
      for (var i = 0; i < this.numHexPts; i += 3)
      {
         this.uvs[offset+i+2] = alpha;
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
      console.log("isValidMove "+idx + " "+dir);
      var node = this.maze[idx];
      var neighborIdx = this.getNeighborId(idx, dir.value);
      for (var i = 0; i < node.neighbors.length; i++)
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
   
      console.log("pointToHexId: "+xoffset+" "+yoffset+" "+x+" "+y+" "+row+" "+col+" "+i+" "+j);
      
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

