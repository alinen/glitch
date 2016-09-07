
class Player
{
   constructor() 
   {
      this.speed = 0.005;
      this.rot = 0;
      this.pos = {x:0, y:0};
      this.dir = {x:0, y:0};
      this.nextDir = {x:0, y:0};
      this.currentHex = 0;
      this.targetHex = -1;
   }

   placeInHex(hexIdx)
   {
      this.pos = hexBoard.getHexCenterById(hexIdx);
      hexBoard.setHexAlphaById(hexIdx, 0.95);
      console.log("place player: " + this.pos.x + " " + this.pos.y + " id: " + hexIdx);
   
      this.dir = {x:0,y:0};
      this.nextDir = {x:0,y:0};

      this.currentHex = hexIdx;
      this.targetHex = -1;
   }   

   /*
   function update(dt)
   {
      this.pos.x += dt * this.dir.x * this.speed;
      this.pos.y += dt * this.dir.x * this.speed;

      if (this.targetHex > -1)
      {
         var target = hexCenterById(this.targetHex);
         if (distanceSqr(target[0], target[1], xPos, yPos) < 0.01)
         {
            setHexAlphaById(this.targetHex, 1.0);
   
            xDir = xNextDir;
            yDir = yNextDir;
            idxCurr = this.targetHex;
            xPos = target[0];
            yPos = target[1];
   
            var nextMove = attemptMove(idxCurr, [xDir, yDir]);
            this.targetHex = nextMove.idx;
            if (this.targetHex !== -1)
            {
               queueDir(nextMove.dir);
            }
            else
            {
               clearDir();
            }
         }
      }
   
      if (Math.abs(yDir) > 0.0 || Math.abs(xDir) > 0.0)
      {
         zRot = Math.atan2(-xDir, yDir) / Deg2Rad;
      }
   }

   function handleKeyUp(event) 
   {
      var result = null;
      if (event.keyCode === 81) //q
      {
         result = goNW(idxCurr);
      }
      if (event.keyCode === 87) //w
      {
         result = goN(idxCurr);    
      }
      if (event.keyCode === 69) //e
      {
         result = goNE(idxCurr);     
      }
      if (event.keyCode === 65) //a
      {
         result = goSW(idxCurr);     
      }
      if (event.keyCode === 83) //s
      {
         result = goS(idxCurr);  
      }
      if (event.keyCode === 68) //d
      {
         result = goSE(idxCurr);    
      }
   
      if (result)
      {
         this.targetHex = result.idx;
         if (this.targetHex !== -1)
         {
            queueDir(result.dir);
         }
         else
         {
            clearDir();
         }        
      }
   }
      

   
   function queueDir(dir)
   {
      if (xDir === 0 && yDir === 0)
      {
         xDir = dir[0];
         yDir = dir[1];
         xNextDir = 0;
         yNextDir = 0;      
      }
      else
      {
         xNextDir = dir[0];
         yNextDir = dir[1];
      }
   }
   
   function clearDir()
   {
   xDir = 0;
   yDir = 0;
   xNextDir = 0;
   yNextDir = 0;      
   }
   */

}
   
