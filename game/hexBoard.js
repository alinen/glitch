class HexBoard
{
   constructor(hexSize, boardSize, margin)
   {
      this.b = hexSize; // see docs, length of hex size
      this.r = this.b / (2 * Math.tan(30 * DEG2RAD)); // see docs
      this.bRes = Math.sqrt(this.b * this.b - this.r * this.r); // see docs, extends b to edge of bounding square
      this.uvs = []; // dynamic
      this.vertices = [];  // static, kept for lookup
      this.colors = [];   // static, may become dynamic
      this.boardSize = boardSize;

      this.scale = 1.0-margin;
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

      console.log("Init board: " + this.numRows + " " + this.numCols + " " + this.r);
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
               vertexList.push(this.shape[p] * this.scale+x);
               vertexList.push(this.shape[p+1] * this.scale+y);
               vertexList.push(this.shape[p+2]);
   
               textureList.push((this.shape[p] * this.scale+x+10)/20.0);
               textureList.push((this.shape[p+1] * this.scale+y+10)/20.0);
               textureList.push(0.1); // 3rd component is alpha
   
               colorList.push(0.5);
               colorList.push(0.5);
               colorList.push(0.5);
            }
            this.numHex++;
            x += 3 * this.b;
         }
         y += this.r;
      }

      this.vertices = new Float32Array(vertexList);
      this.colors = new Float32Array(colorList);
      this.uvs = new Float32Array(textureList);
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

   /*

   function attemptMove(idxCurrent, dir)
   {
      if (dir[0] < 0 && dir[1] > 0) //q
      {
         return goNW(idxCurrent);
      }
      else if (dir[0] === 0 && dir[1] === 1) //w
      {
         return goN(idxCurrent);     
      }
      else if (dir[0] > 0 && dir[1] > 0) //e
      {
         return goNE(idxCurrent);
      }
      else if (dir[0] < 0 && dir[1] < 0) //a
      {
         return goSW(idxCurrent);      
      }
      else if (dir[0] === 0 && dir[1] === -1) //s
      {
         return goS(idxCurrent);     
      }
      else if (dir[0] > 0 && dir[1] < 0) //d
      {
         return goSE(idxCurrent);  
      }
   
      return {idx : -1, dir : [0,0]};
   }
   
   function goNW(idxCurrent)
   {
      var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]+1, cell[1]-1];
      if (isValid(nextCell))
      {
         return { idx: hexCellToId(nextCell), dir : [-0.866, 0.5]};
      }
      return {idx: -1, dir : [0,0]};
   }
   
   function goN(idxCurrent)
   {
      var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]+2, cell[1]];
      if (isValid(nextCell))
      {
         return { idx: hexCellToId(nextCell), dir : [0,1]};
      }   
      return {idx: -1, dir : [0,0]};
   }
   
   function goNE(idxCurrent)
   {
      var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]+1, cell[1]+1];
      if (isValid(nextCell))
      {
         return {idx : hexCellToId(nextCell), dir : [0.866, 0.5] };
      }   
      return {idx: -1, dir : [0,0]};
   }
   
   function goSW(idxCurrent)
      {
      var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]-1, cell[1]-1];
      if (isValid(nextCell))
      {
         return {idx : hexCellToId(nextCell), dir : [-0.866, -0.5] };
      }   
      return {idx: -1, dir : [0,0]};
   }
   
   function goS(idxCurrent)
   {
         var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]-2, cell[1]];
      if (isValid(nextCell))
      {
         return { idx: hexCellToId(nextCell), dir : [0, -1] };
      }   
      return {idx: -1, dir : [0,0]};
   }
   
   function goSE(idxCurrent)
   {
      var cell = hexIdToCell(idxCurr);
      var nextCell = [cell[0]-1, cell[1]+1];
      if (isValid(nextCell))
      {
         return {idx : hexCellToId(nextCell), dir : [0.866, -0.5] };
      }   
      return {idx: -1, dir : [0,0]};
   }
   
   
   
   function isValid(idx)
   {
      var cell = hexIdToCell(idx);
      return isValid(cell);
   }
   
   function isValid(cell)
   {
      // todo: check against generated graph
      console.log("IS VALID "+cell+ " " + numRows + " " + numCols);
      if (cell[0] < 0) return false;
      if (cell[1] < 0) return false;
   
      if (cell[0] >= numRows) return false;
      if (cell[1] >= numCols*2) return false;
   
      if (cell[0] % 2 === 0 && cell[1] % 2 === 0) return false;
      if (cell[0] % 2 === 1 && cell[1] % 2 === 1) return false;
   
      return true;
   }
   
   
   function hexPointToId(p)
   {   
      var xoffset = -sqrSize + this.bRes * 0.5;
      var yoffset = -sqrSize + hexR * 0.5;
      var x = p[0] - xoffset;
      var y = p[1] - yoffset;
      var row = Math.floor(y / hexR);
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
      
      var idx = i * numCols + j;
      return idx;
   }
   
   function hexPointToCell(p)
   {
      var idx = pointToHexId(p);
      return hexIdToCell(idx);
   }
   
   function hexIdToCell(idx)
   {
      var row = Math.floor(idx/numCols);
      var tmp = idx - row * numCols;
      
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
   
      return [i,j];
   }
   
   function hexCellToId(cell)
   {
      var idx = 0;
      if (cell[0] % 2 == 0)
      {
         idx = cell[0] * numCols + (cell[1]-1)/2;
      }
      else
      {
         idx = cell[0] * numCols + cell[1]/2;
      }
      return idx;
   }
   

   

   */
}

